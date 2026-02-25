// ═══════════════════════════════════════════════════════
// CACHE — salva resultados por 3 horas
// ═══════════════════════════════════════════════════════
const cache = new Map();
const CACHE_TTL = 3 * 60 * 60 * 1000;

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  if (cache.size > 200) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

// ═══════════════════════════════════════════════════════
// RATE LIMITER — máximo 8 req/min (limite free = 15)
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
// MODELOS — tenta na ordem, se um falhar vai pro próximo
// ═══════════════════════════════════════════════════════
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
];

// ═══════════════════════════════════════════════════════
// ROTAÇÃO DE CHAVES (opcional — adicione GEMINI_API_KEY_2 e _3 no Vercel)
// ═══════════════════════════════════════════════════════
let keyIndex = 0;

function getNextApiKey() {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean);
  if (keys.length === 0) return null;
  const key = keys[keyIndex % keys.length];
  keyIndex++;
  return key;
}

// ═══════════════════════════════════════════════════════
// CHAMAR GEMINI COM RETRY AUTOMÁTICO
// ═══════════════════════════════════════════════════════
async function callGemini(prompt) {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean);

  const maxAttempts = MODELS.length * keys.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const model = MODELS[attempt % MODELS.length];
    const apiKey = keys[Math.floor(attempt / MODELS.length) % keys.length] || keys[0];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`[TENTATIVA ${attempt + 1}/${maxAttempts}] Modelo: ${model}`);

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
          continue; // tenta próximo modelo/chave
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

      if (!text) { continue; }

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

    // 1. CACHE — retorna instantâneo se já tem
    const cacheKey = `${marketId}::${date}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return Response.json({ predictions: cached, fromCache: true });
    }

    // 2. RATE LIMIT — protege contra excesso
    if (!canMakeRequest()) {
      return Response.json(
        { error: "⏳ Aguarde 30 segundos antes de consultar outro mercado." },
        { status: 429 }
      );
    }
    requestTimes.push(Date.now());

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

    // 4. CHAMAR API (com retry automático)
    const text = await callGemini(prompt);

    // 5. PARSEAR RESPOSTA
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

    // 6. SALVAR NO CACHE
    setCache(cacheKey, predictions);
    console.log(`[CACHE SET] ${cacheKey} — ${predictions.length} jogos (expira em 3h)`);

    return Response.json({ predictions });
  } catch (error) {
    console.error("Prediction error:", error);
    return Response.json(
      { error: error.message || "Erro ao gerar previsões" },
      { status: 500 }
    );
  }
}
