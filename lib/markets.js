export const MARKETS = [
  { id: "over05", label: "Over 0,5", icon: "⚽", desc: "Pelo menos 1 gol no jogo", cat: "gols" },
  { id: "over15", label: "Over 1,5", icon: "⚽", desc: "Mais de 1 gol no jogo", cat: "gols" },
  { id: "over25", label: "Over 2,5", icon: "🔥", desc: "Mais de 2 gols no jogo", cat: "gols" },
  { id: "over35", label: "Over 3,5", icon: "💥", desc: "Mais de 3 gols no jogo", cat: "gols" },
  { id: "over45", label: "Over 4,5", icon: "🚀", desc: "Mais de 4 gols no jogo", cat: "gols" },
  { id: "under15", label: "Under 1,5", icon: "🛡️", desc: "Menos de 2 gols", cat: "gols" },
  { id: "under25", label: "Under 2,5", icon: "🔒", desc: "Menos de 3 gols", cat: "gols" },
  { id: "btts", label: "Ambas Marcam", icon: "🎯", desc: "Os dois times marcam", cat: "gols" },
  { id: "btts_no", label: "Ambas Não Marcam", icon: "🚫", desc: "Pelo menos 1 não marca", cat: "gols" },
  { id: "gol1t", label: "Gol 1º Tempo", icon: "⏱️", desc: "Gol no primeiro tempo", cat: "tempo" },
  { id: "gol2t", label: "Gol 2º Tempo", icon: "⏰", desc: "Gol no segundo tempo", cat: "tempo" },
  { id: "over05_1t", label: "Over 0,5 1ºT", icon: "🕐", desc: "Mais de 0 gols no 1ºT", cat: "tempo" },
  { id: "over15_1t", label: "Over 1,5 1ºT", icon: "🕑", desc: "Mais de 1 gol no 1ºT", cat: "tempo" },
  { id: "over05_2t", label: "Over 0,5 2ºT", icon: "🕒", desc: "Mais de 0 gols no 2ºT", cat: "tempo" },
  { id: "casa_vence", label: "Vitória Casa", icon: "🏠", desc: "Time da casa vence", cat: "resultado" },
  { id: "fora_vence", label: "Vitória Fora", icon: "✈️", desc: "Visitante vence", cat: "resultado" },
  { id: "empate", label: "Empate", icon: "🤝", desc: "Jogo termina empatado", cat: "resultado" },
  { id: "dupla_casa", label: "1X Casa/Empate", icon: "🏡", desc: "Casa vence ou empata", cat: "resultado" },
  { id: "dupla_fora", label: "X2 Fora/Empate", icon: "🛫", desc: "Fora vence ou empata", cat: "resultado" },
  { id: "over_corners", label: "Over 8,5 Escanteios", icon: "📐", desc: "Mais de 8 escanteios", cat: "outros" },
  { id: "over_cards", label: "Over 3,5 Cartões", icon: "🟨", desc: "Mais de 3 cartões", cat: "outros" },
  { id: "handicap_casa", label: "Handicap -1 Casa", icon: "➖", desc: "Casa vence por 2+", cat: "outros" },
];

export const CATEGORIES = [
  { id: "todos", label: "📋 Todos" },
  { id: "gols", label: "⚽ Gols" },
  { id: "tempo", label: "⏱️ Tempo" },
  { id: "resultado", label: "🏆 Resultado" },
  { id: "outros", label: "📊 Outros" },
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
