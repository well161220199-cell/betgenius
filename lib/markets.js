export const MARKETS = [
  // ═══ GOLS ═══
  { id: "over15", label: "Over 1,5", icon: "⚽", desc: "Mais de 1 gol no jogo", cat: "gols" },
  { id: "over25", label: "Over 2,5", icon: "🔥", desc: "Mais de 2 gols no jogo", cat: "gols" },
  { id: "over35", label: "Over 3,5", icon: "💥", desc: "Mais de 3 gols no jogo", cat: "gols" },
  { id: "under25", label: "Under 2,5", icon: "🛡️", desc: "Menos de 3 gols no jogo", cat: "gols" },
  { id: "under35", label: "Under 3,5", icon: "🔒", desc: "Menos de 4 gols no jogo", cat: "gols" },
  { id: "btts", label: "Ambas Marcam", icon: "🎯", desc: "Os dois times marcam gol", cat: "gols" },
  { id: "btts_no", label: "Ambas Não Marcam", icon: "🚫", desc: "Pelo menos um não marca", cat: "gols" },

  // ═══ RESULTADO ═══
  { id: "casa_vence", label: "Vitória Casa", icon: "🏠", desc: "Time da casa vence a partida", cat: "resultado" },
  { id: "fora_vence", label: "Vitória Fora", icon: "✈️", desc: "Time visitante vence a partida", cat: "resultado" },
  { id: "empate", label: "Empate", icon: "🤝", desc: "Jogo termina empatado", cat: "resultado" },
  { id: "dupla_1x", label: "Dupla 1X", icon: "🏡", desc: "Casa vence ou empata", cat: "resultado" },
  { id: "dupla_12", label: "Dupla 12", icon: "⚔️", desc: "Casa ou fora vence (sem empate)", cat: "resultado" },
  { id: "dupla_x2", label: "Dupla X2", icon: "🛫", desc: "Fora vence ou empata", cat: "resultado" },

  // ═══ INTERVALO ═══
  { id: "over05_1t", label: "Gol no 1ºT", icon: "⏱️", desc: "Pelo menos 1 gol no primeiro tempo", cat: "intervalo" },
  { id: "over15_1t", label: "Over 1,5 1ºT", icon: "⏰", desc: "Mais de 1 gol no primeiro tempo", cat: "intervalo" },
  { id: "casa_1t", label: "Casa Vence 1ºT", icon: "🏠", desc: "Casa vencendo no intervalo", cat: "intervalo" },
  { id: "empate_1t", label: "Empate no 1ºT", icon: "🤝", desc: "Empate no intervalo", cat: "intervalo" },

  // ═══ HANDICAP ═══
  { id: "handicap_casa1", label: "Handicap -1 Casa", icon: "➖", desc: "Casa vence por 2 ou mais gols", cat: "handicap" },
  { id: "handicap_fora1", label: "Handicap -1 Fora", icon: "➕", desc: "Fora vence por 2 ou mais gols", cat: "handicap" },
  { id: "empate_anula", label: "Empate Anula", icon: "🔄", desc: "Sem empate — aposta devolvida se empatar", cat: "handicap" },

  // ═══ ESCANTEIOS ═══
  { id: "over85_corners", label: "Over 8,5 Escanteios", icon: "📐", desc: "Mais de 8 escanteios no jogo", cat: "escanteios" },
  { id: "over105_corners", label: "Over 10,5 Escanteios", icon: "🚩", desc: "Mais de 10 escanteios no jogo", cat: "escanteios" },
  { id: "under95_corners", label: "Under 9,5 Escanteios", icon: "📏", desc: "Menos de 10 escanteios no jogo", cat: "escanteios" },

  // ═══ CARTÕES ═══
  { id: "over35_cards", label: "Over 3,5 Cartões", icon: "🟨", desc: "Mais de 3 cartões no jogo", cat: "cartoes" },
  { id: "over45_cards", label: "Over 4,5 Cartões", icon: "🟧", desc: "Mais de 4 cartões no jogo", cat: "cartoes" },
  { id: "cartao_vermelho", label: "Cartão Vermelho", icon: "🟥", desc: "Pelo menos 1 cartão vermelho no jogo", cat: "cartoes" },

  // ═══ ESTATÍSTICAS ═══
  { id: "over95_chutes", label: "Over 9,5 Chutes Gol", icon: "🎯", desc: "Mais de 9 chutes no gol no jogo", cat: "estatisticas" },
  { id: "over235_chutes_total", label: "Over 23,5 Chutes", icon: "👟", desc: "Mais de 23 chutes totais no jogo", cat: "estatisticas" },
  { id: "over25_faltas", label: "Over 25,5 Faltas", icon: "⚠️", desc: "Mais de 25 faltas no jogo", cat: "estatisticas" },
  { id: "over35_impedimentos", label: "Over 3,5 Impedimentos", icon: "🚧", desc: "Mais de 3 impedimentos no jogo", cat: "estatisticas" },

  // ═══ COMBOS ═══
  { id: "btts_over25", label: "Ambas + Over 2,5", icon: "🔥", desc: "Ambas marcam e mais de 2 gols", cat: "combos" },
  { id: "casa_over15", label: "Casa + Over 1,5", icon: "🏠", desc: "Casa vence e mais de 1 gol", cat: "combos" },
  { id: "casa_btts", label: "Casa + Ambas", icon: "🏡", desc: "Casa vence e ambas marcam", cat: "combos" },
];

export const CATEGORIES = [
  { id: "todos", label: "📋 Todos" },
  { id: "gols", label: "⚽ Gols" },
  { id: "resultado", label: "🏆 Resultado" },
  { id: "intervalo", label: "⏱️ Intervalo" },
  { id: "handicap", label: "🎰 Handicap" },
  { id: "escanteios", label: "📐 Escanteios" },
  { id: "cartoes", label: "🟨 Cartões" },
  { id: "estatisticas", label: "📊 Estatísticas" },
  { id: "combos", label: "⭐ Combos" },
];

export function getDateLabel(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  if (offset === 0) return "Hoje";
  if (offset === 1) return "Amanhã";
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export function getFormattedDate(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}
