export async function POST(request) {
  try {
    const { marketId, marketLabel, marketDesc, date } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY não configurada" }, { status: 500 });
    }

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

    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=" + apiKey;

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        tools: [
          {
            googleSearch: {},
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(function () { return {}; });
      console.error("Gemini API error:", res.status, errData);
      return Response.json(
        { error: "Erro na API Gemini: " + res.status + " - " + (errData?.error?.message || "Erro desconhecido") },
        { status: 500 }
      );
    }

    const data = await res.json();

    let text = "";
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      for (const part of data.candidates[0].content.parts) {
        if (part.text) {
          text += part.text;
        }
      }
    }

    if (!text) {
      return Response.json({ error: "A IA não retornou dados" }, { status: 500 });
    }

    text = text.trim();
    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let predictions;
    try {
      predictions = JSON.parse(text);
    } catch (e) {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        predictions = JSON.parse(match[0]);
      } else {
        console.error("Failed to parse:", text.substring(0, 500));
        return Response.json(
          { error: "Erro ao processar resposta da IA" },
          { status: 500 }
        );
      }
    }

    if (!Array.isArray(predictions)) {
      predictions = [];
    }

    predictions = predictions
      .filter(function (p) { return p.home && p.away && p.chance; })
      .map(function (p, i) {
        var chance = Math.min(95, Math.max(55, Number(p.chance) || 65));
        return {
          id: marketId + "-" + i,
          home: p.home || "Time A",
          away: p.away || "Time B",
          league: p.league || "Liga",
          flag: p.flag || "⚽",
          time: p.time || "00:00",
          chance: chance,
          conf: chance >= 82 ? "alta" : chance >= 70 ? "media" : "normal",
          analysis: Array.isArray(p.analysis) ? p.analysis.slice(0, 4) : [
            "Análise baseada em dados estatísticos",
            "Histórico de confrontos diretos",
            "Forma recente dos times",
            "Desempenho como mandante/visitante",
          ],
        };
      })
      .sort(function (a, b) { return b.chance - a.chance; });

    return Response.json({ predictions });
  } catch (error) {
    console.error("Prediction error:", error);
    return Response.json(
      { error: error.message || "Erro ao gerar previsões" },
      { status: 500 }
    );
  }
}
