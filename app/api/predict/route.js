import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ═══════════════════════════════════════════════════════
// HORÁRIO DE BRASÍLIA
// ═══════════════════════════════════════════════════════
function getBrasiliaTime() {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  return new Date(now.getTime() + (now.getTimezoneOffset() + brasiliaOffset) * 60000);
}

// ═══════════════════════════════════════════════════════
// CACHE NO SUPABASE — válido até o fim do dia
// ═══════════════════════════════════════════════════════
async function getFromCache(marketId, date) {
  try {
    const cacheId = `${marketId}::${date}`;
    const { data, error } = await supabase
      .from("predictions_cache")
      .select("predictions, created_at")
      .eq("id", cacheId)
      .single();

    if (error || !data) return null;

    // Verificar se o cache é do mesmo dia (horário de Brasília)
    const brasilia = getBrasiliaTime();
    const todayStr = brasilia.toISOString().split("T")[0];
    const cacheCreated = new Date(data.created_at);
    const cacheBrasilia = new Date(cacheCreated.getTime() + (cacheCreated.getTimezoneOffset() + (-3 * 60)) * 60000);
    const cacheDayStr = cacheBrasilia.toISOString().split("T")[0];

    if (cacheDayStr !== todayStr) {
      // Cache de outro dia → deletar
      await supabase.from("predictions_cache").delete().eq("id", cacheId);
      return null;
    }

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

async function cleanOldCache() {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("predictions_cache").delete().lt("created_at", yesterday);
  } catch {}
}

// ═══════════════════════════════════════════════════════
// FILTRAR JOGOS PASSADOS — só mostra jogos futuros
// ═══════════════════════════════════════════════════════
function filterFutureGames(predictions, date) {
  const brasilia = getBrasiliaTime();
  const todayStr = brasilia.toISOString().split("T")[0];

  // Se a data NÃO é hoje, retorna todos (amanhã, depois, etc.)
  if (date !== todayStr) return predictions;

  // Se é hoje, filtra só jogos que ainda não começaram
  const currentHour = brasilia.getHours();
  const currentMin = brasilia.getMinutes();

  return predictions.filter(game => {
    if (!game.time || !game.time.includes(":")) return true;
    const [h, m] = game.time.split(":").map(Number);
    // Margem de 15 min (jogo que começou há pouco ainda aparece)
    return (h > currentHour) || (h === currentHour && m >= currentMin - 15);
  });
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
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

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
    const model = MODELS[Math.floor(attempt / keys.length) % MODELS.length];
    const apiKey = keys[attempt % keys.length];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`[TENTATIVA ${attempt + 1}/${maxAttempts}] ${model} | chave ${(attempt % keys.length) + 1}`);

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
        console.error(`[ERRO] ${model} key${Math.floor(attempt / MODELS.length)}: ${res.status} - ${err?.error?.message || "?"}`);
        const wait = res.status === 429 ? 3000 : 1000;
        await new Promise(r => setTimeout(r, wait));
        continue;
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

    // 1. CACHE DO SUPABASE (válido até fim do dia)
    const cached = await getFromCache(marketId, date);
    if (cached) {
      console.log(`[CACHE HIT] ${marketId}::${date}`);
      const filtered = filterFutureGames(cached, date);
      return Response.json({ predictions: filtered, fromCache: true });
    }

    // 2. RATE LIMIT
    if (!canMakeRequest()) {
      return Response.json(
        { error: "⏳ Aguarde 30 segundos antes de consultar outro mercado." },
        { status: 429 }
      );
    }
    requestTimes.push(Date.now());

    console.log(`[CACHE MISS] ${marketId}::${date} — chamando API... (${getApiKeys().length} chaves, ${MODELS.length} modelos)`);

    // 3. PROMPT — pede apenas jogos futuros
    const brasilia = getBrasiliaTime();
    const currentHour = String(brasilia.getHours()).padStart(2, "0");
    const currentMin = String(brasilia.getMinutes()).padStart(2, "0");

    const prompt = `Você é um analista especialista em apostas esportivas de futebol. Sua tarefa é analisar os jogos de futebol reais que acontecem na data ${date} e avaliar quais têm a maior probabilidade para o mercado "${marketLabel}" (${marketDesc}).

INSTRUÇÕES:
1. Pesquise os jogos de futebol confirmados para ${date} nas principais ligas (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Brasileirão, Champions League, Eredivisie, Liga Portugal, Copa do Brasil, Libertadores, MLS, etc.)
2. IMPORTANTE: Inclua APENAS jogos que ainda NÃO começaram. O horário atual em Brasília é ${currentHour}:${currentMin}. NÃO inclua jogos com horário anterior a este.
3. Para cada jogo, analise: histórico recente dos times, gols marcados/sofridos, confrontos diretos, forma como mandante/visitante, desfalques
4. Selecione os 5 a 10 jogos com MAIOR probabilidade para o mercado "${marketLabel}"
5. Para cada jogo, estime uma porcentagem de chance realista (entre 55% e 95%)
6. Os horários devem estar no fuso de Brasília (GMT-3)

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
- APENAS jogos reais confirmados para ${date} que AINDA NÃO COMEÇARAM
- Se não houver jogos futuros nesta data, retorne []
- Ordene do maior para menor chance
- Cada item de analysis deve conter dados/estatísticas reais
- Retorne SOMENTE o JSON`;

    // 4. CHAMAR API
    const text = await callGemini(prompt);

    // 5. PARSEAR (robusto — lida com JSON malformado)
    let clean = text.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    // Remover caracteres de controle
    clean = clean.replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\r' || ch === '\t' ? ' ' : '');
    
    let predictions;

    // Tentar extrair o array JSON de várias formas
    function tryParse(str) {
      try { return JSON.parse(str); } catch { return null; }
    }

    // Tentativa 1: parse direto
    predictions = tryParse(clean);

    // Tentativa 2: extrair array do texto
    if (!predictions) {
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) predictions = tryParse(match[0]);
    }

    // Tentativa 3: corrigir aspas simples para duplas
    if (!predictions) {
      const fixed = clean.replace(/'/g, '"');
      const match2 = fixed.match(/\[[\s\S]*\]/);
      if (match2) predictions = tryParse(match2[0]);
    }

    // Tentativa 4: corrigir trailing commas
    if (!predictions) {
      const noTrailing = clean.replace(/,\s*([}\]])/g, '$1');
      const match3 = noTrailing.match(/\[[\s\S]*\]/);
      if (match3) predictions = tryParse(match3[0]);
    }

    // Tentativa 5: forçar limpeza pesada
    if (!predictions) {
      let heavy = clean;
      // Extrair só o array
      const start = heavy.indexOf('[');
      const end = heavy.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        heavy = heavy.substring(start, end + 1);
        // Corrigir problemas comuns
        heavy = heavy.replace(/,\s*([}\]])/g, '$1');
        heavy = heavy.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
        predictions = tryParse(heavy);
      }
    }

    // Tentativa 6: JSON truncado — cortar no último objeto completo
    if (!predictions) {
      const start = clean.indexOf('[');
      if (start !== -1) {
        let truncated = clean.substring(start);
        // Encontrar o último "}" completo
        const lastBrace = truncated.lastIndexOf('}');
        if (lastBrace !== -1) {
          truncated = truncated.substring(0, lastBrace + 1) + ']';
          truncated = truncated.replace(/,\s*\]$/g, ']');
          predictions = tryParse(truncated);
        }
      }
    }

    if (!predictions) {
      console.error("Parse failed after all attempts:", clean.substring(0, 500));
      return Response.json({ error: "Resposta da IA veio incompleta. Clique em Tentar novamente." }, { status: 500 });
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

    // 6. SALVAR NO CACHE (todos os jogos, filtro aplica na leitura)
    await setCache(marketId, date, predictions);
    console.log(`[CACHE SET] ${marketId}::${date} — ${predictions.length} jogos`);

    // 7. LIMPAR CACHE VELHO
    if (Math.random() < 0.1) cleanOldCache();

    // 8. RETORNAR SÓ JOGOS FUTUROS
    const filtered = filterFutureGames(predictions, date);
    return Response.json({ predictions: filtered });
  } catch (error) {
    console.error("Prediction error:", error);
    return Response.json(
      { error: error.message || "Erro ao gerar previsões" },
      { status: 500 }
    );
  }
}
