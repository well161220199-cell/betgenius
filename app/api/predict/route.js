import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ═══════════════════════════════════════════════════════
// CACHE NO SUPABASE — compartilhado entre dispositivos
// ═══════════════════════════════════════════════════════
const CACHE_TTL_HOURS = 3;

async function getFromCache(marketId, date) {
  try {
    const cacheId = `${marketId}::${date}`;
    const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("predictions_cache")
      .select("predictions")
      .eq("id", cacheId)
      .gt("created_at", cutoff)
      .single();

    if (error || !data) return null;
    return data.predictions;
  } catch {
    return null;
  }
}

async function setCache(marketId, date, predictions) {
  try {
    const cacheId = `${marketId}::${date}`;
    await supabase
      .from("predictions_cache")
      .upsert({
        id: cacheId,
        market_id: marketId,
        date: date,
        predictions: predictions,
        created_at: new Date().toISOString(),
      });
  } catch (err) {
    console.error("[CACHE WRITE ERROR]", err.message);
  }
}

// Limpar cache velho (roda de vez em quando)
async function cleanOldCache() {
  try {
    const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
    await supabase
      .from("predictions_cache")
      .delete()
      .lt("created_at", cutoff);
  } catch {}
}

// ═══════════════════════════════════════════════════════
// RATE LIMITER — máximo 8 req/min
// ═══════════════════════════════════════════════════════
const requestTimes = [];

function canMakeRequest() {
  const now = Date.now();
  while (requestTimes.length > 0 && now - requestTimes[0] > 60000) {
    requestTimes.shift();
  }
  return requestTimes.length < 8;
}

// ═══════════════════════════════════════════════════════
// MODELOS + ROTAÇÃO DE CHAVES
// ═══════════════════════════════════════════════════════
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
];

let keyIndex = 0;

function getApiKeys() {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean);
}

// ═══════════════════════════════════════════════════════
// CHAMAR GEMINI COM RETRY
// ═══════════════════════════════════════════════════════
async function callGemini(prompt) {
  const keys = getApiKeys();
  const maxAttempts = MODELS.length * keys.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const model = MODELS[attempt % MODELS.length];
    const apiKey = keys[Math.floor(attempt / MODELS.length) % keys.length] || keys[0];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`[TENTATIVA ${attempt + 1}/${maxAttempts}] ${model}`);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(`[ERRO] ${model}: ${res.status} - ${err?.error?.message || "?"}`);
        if (res.status === 429 || res.status === 503) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw new Error(`Erro ${res.status}: ${err?.error?.message || "Erro desconhecido"}`);
      }

      const data = await res.json();
      let text = "";
      if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.text) text += part.text;
        }
      }
      if (!text) continue;

      console.log(`[OK] ${model} — ${text.length} chars`);
      return text;
    } catch (error) {
      if (error.message.startsWith("Erro ")) throw error;
      console.error(`[REDE] ${model}:`, error.message);
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }
  }

  throw new Error("Todos os modelos estão indisponíveis. Tente em alguns minutos.");
}

// ═══════════════════════════════════════════════════════
// ENDPOINT PRINCIPAL
// ═══════════════════════════════════════════════════════
export async function POST(request) {
  try {
    const { marketId, marketLabel, marketDesc, date } = await request.json();

    // 1. CACHE DO SUPABASE
    const cached = await getFromCache(marketId, date);
    if (cached) {
      console.log(`[CACHE HIT] ${marketId}::${date}`);
      return Response.json({ predictions: cached, fromCache: true });
    }

    // 2. RATE LIMIT
    if (!canMakeRequest()) {
      return Response.json(
        { error: "⏳ Aguarde 30 segundos antes de consultar outro mercado." },
        { status: 429 }
      );
    }
    requestTimes.push(Date.now());

    console.log(`[CACHE MISS] ${marketId}::${date} — chamando API...`);

    // 3. PROMPT
    const prompt = `Você é um analista especialista em apostas esportivas de futebol. Sua tarefa é analisar os jogos de futebol reais que acontecem na data ${date} e avaliar quais têm a maior probabilidade para o mercado "${marketLabel}" (${marketDesc}).

INSTRUÇÕES:
1. Pesquise os jogos de futebol confirmados para ${date} nas principais ligas (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Brasileirão, Champions League, Eredivisie, Liga Portugal, Copa do Brasil, Libertadores, MLS, etc.)
2. Para cada jogo, analise: histórico recente dos times, gols marcados/sofridos, confrontos diretos, forma como mandante/visitante, desfalques
3. Selecione os 5 a 10 jogos com MAIOR probabilidade para o mercado "${marketLabel}"
4. Para cada jogo, estime uma porcentagem de chance realista (entre 55% e 95%)
5. Os horários devem estar no fuso de Brasília (GMT-3)

IMPORTANTE: Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, sem markdown. O formato deve ser exatamente:
[
  {
    "home": "Time da Casa",
    "away": "Time Visitante",
    "league": "Nome da Liga",
    "flag": "emoji da bandeira do país da liga",
    "time": "HH:MM",
    "chance": 82,
    "analysis": [
      "Estatística real relevante 1",
      "Estatística real relevante 2",
      "Estatística real relevante 3",
      "Estatística real relevante 4"
    ]
  }
]

Regras:
- APENAS jogos reais confirmados para ${date}
- Se não houver jogos nesta data, retorne []
- Ordene do maior para menor chance
- Cada item de analysis deve conter dados/estatísticas reais
- Retorne SOMENTE o JSON`;

    // 4. CHAMAR API
    const text = await callGemini(prompt);

    // 5. PARSEAR
    let clean = text.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let predictions;

    try {
      predictions = JSON.parse(clean);
    } catch (e) {
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        predictions = JSON.parse(match[0]);
      } else {
        console.error("Parse failed:", clean.substring(0, 300));
        return Response.json({ error: "Erro ao processar resposta da IA" }, { status: 500 });
      }
    }

    if (!Array.isArray(predictions)) predictions = [];

    predictions = predictions
      .filter(p => p.home && p.away && p.chance)
      .map((p, i) => {
        const chance = Math.min(95, Math.max(55, Number(p.chance) || 65));
        return {
          id: marketId + "-" + i,
          home: p.home || "Time A",
          away: p.away || "Time B",
          league: p.league || "Liga",
          flag: p.flag || "⚽",
          time: p.time || "00:00",
          chance,
          conf: chance >= 82 ? "alta" : chance >= 70 ? "media" : "normal",
          analysis: Array.isArray(p.analysis) ? p.analysis.slice(0, 4) : [
            "Análise baseada em dados estatísticos",
            "Histórico de confrontos diretos",
            "Forma recente dos times",
            "Desempenho como mandante/visitante",
          ],
        };
      })
      .sort((a, b) => b.chance - a.chance);

    // 6. SALVAR NO SUPABASE
    await setCache(marketId, date, predictions);
    console.log(`[CACHE SET] ${marketId}::${date} — ${predictions.length} jogos`);

    // 7. LIMPAR CACHE VELHO (1 em cada 10 requests)
    if (Math.random() < 0.1) cleanOldCache();

    return Response.json({ predictions });
  } catch (error) {
    console.error("Prediction error:", error);
    return Response.json(
      { error: error.message || "Erro ao gerar previsões" },
      { status: 500 }
    );
  }
}
