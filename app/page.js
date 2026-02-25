"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { MARKETS, CATEGORIES, getDateLabel, getFormattedDate } from "../lib/markets";

/* ═══════════════════════════════════════════════════════════
   TEMA
   ═══════════════════════════════════════════════════════════ */
const C = {
  bg: "#060b14", bg2: "#0d1420", card: "#111b2c", input: "#162036",
  ac: "#00e87b", acd: "rgba(0,232,123,0.12)", acg: "rgba(0,232,123,0.25)",
  gold: "#ffd700", goldd: "rgba(255,215,0,0.12)",
  or: "#ff8c42", ord: "rgba(255,140,66,0.12)",
  red: "#ff4d6a", redd: "rgba(255,77,106,0.1)",
  bl: "#4d9fff", bld: "rgba(77,159,255,0.12)",
  pu: "#a855f7", tx: "#eef2f7", txd: "#6b7f99",
  bd: "#1a2740", bdl: "#243350",
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTES PEQUENOS
   ═══════════════════════════════════════════════════════════ */
function Badge({ val, sm }) {
  const col = val >= 82 ? C.ac : val >= 70 ? C.or : C.bl;
  const bg = val >= 82 ? C.acd : val >= 70 ? C.ord : C.bld;
  const ic = val >= 82 ? "🔥" : val >= 70 ? "✅" : "📊";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: sm ? "4px 8px" : "6px 14px", borderRadius: 20,
      background: bg, color: col, fontSize: sm ? 12 : 15, fontWeight: 700,
    }}>{ic} {val}%</span>
  );
}

function PBar({ val, col }) {
  return (
    <div style={{ width: "100%", height: 5, background: C.bd, borderRadius: 3, overflow: "hidden" }}>
      <div style={{
        width: `${val}%`, height: "100%", borderRadius: 3,
        background: `linear-gradient(90deg, ${col}, ${col}99)`,
        transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
      }} />
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const col = type === "error" ? C.red : C.ac;
  const ic = type === "error" ? "❌" : "✅";

  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, padding: "12px 24px", borderRadius: 14,
      background: C.card, border: `1px solid ${col}44`,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", gap: 10, maxWidth: "90%",
      animation: "slideDown 0.3s ease-out",
    }}>
      <span>{ic}</span>
      <span style={{ color: col, fontSize: 13, fontWeight: 600 }}>{msg}</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   TELA DE LOGIN
   ═══════════════════════════════════════════════════════════ */
function LoginScreen({ onGoogleLogin, loading }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse at 50% 20%, ${C.acg} 0%, ${C.bg} 50%)`,
      padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 400, background: C.card, borderRadius: 24,
        padding: "48px 32px 40px", border: `1px solid ${C.bd}`,
        boxShadow: `0 0 120px ${C.acd}, 0 20px 60px rgba(0,0,0,0.4)`,
      }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{
            width: 80, height: 80, margin: "0 auto 20px", borderRadius: 22,
            background: `linear-gradient(135deg, ${C.acd}, ${C.acg})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, border: `1px solid ${C.ac}33`,
            boxShadow: `0 0 50px ${C.acd}`,
          }}>⚽</div>
          <h1 style={{ color: C.ac, fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
            BetGenius AI
          </h1>
          <p style={{ color: C.txd, fontSize: 14, marginTop: 10, lineHeight: 1.5 }}>
            Previsões esportivas com Inteligência Artificial
          </p>
        </div>

        <button
          onClick={onGoogleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "16px 24px", border: "none", borderRadius: 14,
            background: "#ffffff", color: "#333", fontSize: 15, fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            transition: "all 0.2s",
            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          }}
        >
          {loading ? (
            <div style={{
              width: 20, height: 20, border: "2px solid #ccc",
              borderTopColor: "#333", borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }} />
          ) : (
            <GoogleIcon />
          )}
          {loading ? "Conectando..." : "Entrar com Google"}
        </button>

        <div style={{
          marginTop: 32, padding: "16px 18px", background: C.bg2,
          borderRadius: 12, border: `1px solid ${C.bd}`,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: C.txd, lineHeight: 1.7, textAlign: "center" }}>
            🔒 Login seguro via Google • Seus dados são protegidos
            <br />🤖 Análises em tempo real com IA Claude
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GAME CARD
   ═══════════════════════════════════════════════════════════ */
function GameCard({ game, open, onTap }) {
  const col = game.chance >= 82 ? C.ac : game.chance >= 70 ? C.or : C.bl;
  return (
    <div onClick={onTap} style={{
      background: C.card, borderRadius: 16,
      border: `1px solid ${open ? col + "55" : C.bd}`,
      padding: "16px 18px", cursor: "pointer", transition: "all 0.3s",
      boxShadow: open ? `0 0 30px ${col}15` : "none",
      animation: "fadeIn 0.3s ease-out",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14 }}>{game.flag}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.txd }}>{game.league}</span>
            <span style={{ color: C.bd }}>•</span>
            <span style={{ fontSize: 11, color: C.txd }}>{game.time}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.tx }}>
            {game.home}
            <span style={{ color: C.txd, fontWeight: 400, margin: "0 8px", fontSize: 12 }}>vs</span>
            {game.away}
          </div>
          <div style={{ marginTop: 10 }}><PBar val={game.chance} col={col} /></div>
        </div>
        <div style={{ marginLeft: 14, textAlign: "right", flexShrink: 0 }}>
          <Badge val={game.chance} />
          <div style={{
            marginTop: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 0.5,
            color: game.conf === "alta" ? C.ac : game.conf === "media" ? C.or : C.bl,
          }}>
            {game.conf === "alta" ? "🟢 Alta" : game.conf === "media" ? "🟡 Média" : "🔵 Normal"}
          </div>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.bd}` }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: col,
            textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10,
          }}>🤖 Análise da IA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {game.analysis.map((a, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: C.bg2, borderRadius: 10, padding: "10px 12px",
              }}>
                <span style={{ color: col, fontSize: 12, marginTop: 1 }}>▸</span>
                <span style={{ fontSize: 12, color: C.tx, lineHeight: 1.5 }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BEST MARKETS
   ═══════════════════════════════════════════════════════════ */
function BestMarketsTab({ predictions, dateOff, onPick, loading }) {
  // Calculate best markets from cached predictions
  const marketStats = MARKETS.map((m) => {
    const preds = predictions[m.id] || [];
    const avg = preds.length > 0
      ? Math.round(preds.reduce((s, p) => s + p.chance, 0) / preds.length)
      : 0;
    const top = preds.length > 0 ? Math.max(...preds.map(p => p.chance)) : 0;
    return { ...m, avg, num: preds.length, top };
  }).filter(m => m.num > 0).sort((a, b) => b.avg - a.avg);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.goldd}, ${C.acd})`,
        borderRadius: 16, padding: "18px 22px", border: `1px solid ${C.gold}22`,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.gold, marginBottom: 4 }}>
          🏆 Ranking de Mercados — {getDateLabel(dateOff)}
        </div>
        <div style={{ fontSize: 12, color: C.txd, lineHeight: 1.5 }}>
          {marketStats.length > 0
            ? "Mercados ordenados por probabilidade média. Toque para ver os jogos."
            : "Selecione mercados na aba Mercados para popular o ranking."}
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" }}>
          <div style={{
            width: 36, height: 36, border: `3px solid ${C.bd}`,
            borderTopColor: C.ac, borderRadius: "50%", animation: "spin 0.7s linear infinite",
          }} />
          <p style={{ color: C.txd, fontSize: 12, marginTop: 14 }}>🤖 Carregando rankings...</p>
        </div>
      )}

      {!loading && marketStats.map((m, i) => {
        const t3 = i < 3;
        const col = t3 ? C.gold : i < 6 ? C.ac : C.txd;
        return (
          <div key={m.id} onClick={() => onPick(m.id)} style={{
            background: C.card, borderRadius: 14,
            border: `1px solid ${t3 ? C.gold + "33" : C.bd}`,
            padding: "16px 18px", cursor: "pointer", transition: "all 0.2s",
            boxShadow: t3 ? `0 0 20px ${C.goldd}` : "none",
            animation: "fadeIn 0.3s ease-out",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: t3 ? C.goldd : C.bg2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: col,
                  border: `1px solid ${t3 ? C.gold + "33" : C.bd}`,
                }}>{i + 1}º</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 18 }}>{m.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.tx }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.txd, marginTop: 2 }}>
                    {m.num} jogos • Top: {m.top}%
                  </div>
                </div>
              </div>
              <Badge val={m.avg} sm />
            </div>
            <div style={{ marginTop: 10 }}><PBar val={m.avg} col={t3 ? C.gold : C.ac} /></div>
          </div>
        );
      })}

      {!loading && marketStats.length === 0 && (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          color: C.txd, fontSize: 13, lineHeight: 1.6,
        }}>
          <p>📊 Selecione mercados na aba &quot;Mercados&quot; para ver o ranking aqui.</p>
          <p style={{ marginTop: 8 }}>Cada mercado que você consultar será adicionado ao ranking automaticamente.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════ */
function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState("mercados");
  const [market, setMarket] = useState("over15");
  const [category, setCategory] = useState("todos");
  const [dateOff, setDateOff] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preds, setPreds] = useState([]);
  const [allPreds, setAllPreds] = useState({}); // cache: "marketId-dateOff" -> predictions
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchPredictions = useCallback(async (mktId, dayOff) => {
    const cacheKey = mktId + "-" + dayOff;

    // Check cache first - avoid repeated API calls!
    if (allPreds[cacheKey] && allPreds[cacheKey].length > 0) {
      setPreds(allPreds[cacheKey]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setExpanded(null);
    setError(null);

    const mkt = MARKETS.find(m => m.id === mktId);
    const date = getFormattedDate(dayOff);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: mktId,
          marketLabel: mkt?.label || mktId,
          marketDesc: mkt?.desc || "",
          date,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setPreds([]);
      } else {
        setPreds(data.predictions || []);
        // Cache predictions by market+date
        setAllPreds(prev => ({
          ...prev,
          [cacheKey]: data.predictions || [],
          [mktId]: data.predictions || [],
        }));
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
      setPreds([]);
    }

    setLoading(false);
  }, [allPreds]);

  useEffect(() => {
    fetchPredictions(market, dateOff);
  }, [market, dateOff, fetchPredictions]);

  const filtered = category === "todos"
    ? MARKETS
    : MARKETS.filter(m => m.cat === category);
  const cur = MARKETS.find(m => m.id === market);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const userAvatar = user?.user_metadata?.avatar_url;

  async function handleLogout() {
    await supabase.auth.signOut();
    onLogout();
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER */}
      <div style={{
        background: `${C.card}ee`, borderBottom: `1px solid ${C.bd}`,
        padding: "14px 16px", position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 540, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>⚽</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.ac }}>BetGenius AI</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.tx }}>{userName}</div>
              <div style={{ fontSize: 10, color: C.ac }}>● Online</div>
            </div>
            {userAvatar ? (
              <img src={userAvatar} alt="" style={{
                width: 32, height: 32, borderRadius: "50%",
                border: `2px solid ${C.ac}44`,
              }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.ac}, ${C.pu})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: C.bg,
              }}>{userName[0]?.toUpperCase()}</div>
            )}
            <button onClick={handleLogout} style={{
              background: C.redd, border: `1px solid ${C.red}33`, color: C.red,
              fontSize: 11, fontWeight: 600, cursor: "pointer", padding: "6px 12px", borderRadius: 8,
            }}>Sair</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "16px 14px 100px" }}>

        {/* TABS */}
        <div style={{
          display: "flex", gap: 3, background: C.card, borderRadius: 14,
          padding: 3, marginBottom: 16, border: `1px solid ${C.bd}`,
        }}>
          {[
            { id: "mercados", l: "📊 Mercados" },
            { id: "melhores", l: "🏆 Melhores" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "11px 14px", borderRadius: 11, border: "none", cursor: "pointer",
              background: tab === t.id ? `linear-gradient(135deg, ${C.ac}, #00c966)` : "transparent",
              color: tab === t.id ? C.bg : C.txd, fontWeight: 700, fontSize: 13,
              transition: "all 0.25s",
            }}>{t.l}</button>
          ))}
        </div>

        {/* DATAS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {[0, 1, 2].map(off => {
            const d = new Date();
            d.setDate(d.getDate() + off);
            const active = dateOff === off;
            return (
              <button key={off} onClick={() => setDateOff(off)} style={{
                flex: 1, padding: "12px 6px", borderRadius: 14,
                border: `1.5px solid ${active ? C.ac + "66" : C.bd}`,
                background: active ? C.acd : C.card,
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                transition: "all 0.25s",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: active ? C.ac : C.txd }}>
                  {getDateLabel(off)}
                </span>
                <span style={{ fontSize: 22, fontWeight: 800, color: active ? C.ac : C.tx }}>{d.getDate()}</span>
                <span style={{ fontSize: 10, color: active ? C.ac : C.txd }}>
                  {d.toLocaleDateString("pt-BR", { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>

        {/* MELHORES */}
        {tab === "melhores" && (
          <BestMarketsTab
            predictions={allPreds}
            dateOff={dateOff}
            loading={false}
            onPick={(id) => { setMarket(id); setTab("mercados"); }}
          />
        )}

        {/* MERCADOS */}
        {tab === "mercados" && (
          <div>
            {/* Categorias */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} style={{
                  padding: "7px 14px", borderRadius: 20,
                  border: `1px solid ${category === c.id ? C.ac + "55" : C.bd}`,
                  background: category === c.id ? C.acd : "transparent",
                  color: category === c.id ? C.ac : C.txd,
                  fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}>{c.label}</button>
              ))}
            </div>

            {/* Grid mercados */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, marginBottom: 22 }}>
              {filtered.map(m => {
                const active = market === m.id;
                return (
                  <button key={m.id} onClick={() => setMarket(m.id)} style={{
                    padding: "12px 6px", borderRadius: 12,
                    border: `1.5px solid ${active ? C.ac + "66" : C.bd}`,
                    background: active ? C.acd : C.card,
                    cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    boxShadow: active ? `0 0 16px ${C.acd}` : "none",
                    transition: "all 0.25s",
                  }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textAlign: "center", lineHeight: 1.2,
                      color: active ? C.ac : C.tx,
                    }}>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.tx }}>
                  {cur?.icon} {cur?.label}
                </h2>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: C.txd }}>
                  {cur?.desc} • {getDateLabel(dateOff)}
                </p>
              </div>
              {!loading && (
                <span style={{
                  padding: "5px 10px", borderRadius: 16, background: C.card,
                  border: `1px solid ${C.bd}`, fontSize: 11, fontWeight: 700, color: C.txd,
                }}>{preds.length} jogos</span>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "50px 0" }}>
                <div style={{
                  width: 40, height: 40, border: `3px solid ${C.bd}`,
                  borderTopColor: C.ac, borderRadius: "50%", animation: "spin 0.7s linear infinite",
                }} />
                <p style={{ color: C.txd, fontSize: 13, marginTop: 16 }}>
                  🤖 IA buscando jogos reais e analisando...
                </p>
                <p style={{ color: C.txd, fontSize: 11, marginTop: 4 }}>
                  Pode levar alguns segundos
                </p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div style={{
                padding: "20px", borderRadius: 14, background: C.redd,
                border: `1px solid ${C.red}33`, textAlign: "center",
              }}>
                <p style={{ color: C.red, fontSize: 13, margin: 0, fontWeight: 600 }}>❌ {error}</p>
                <button onClick={() => fetchPredictions(market, dateOff)} style={{
                  marginTop: 12, padding: "8px 20px", borderRadius: 8,
                  background: C.red, border: "none", color: "#fff",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>Tentar novamente</button>
              </div>
            )}

            {/* Games */}
            {!loading && !error && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {preds.map(g => (
                  <GameCard
                    key={g.id}
                    game={g}
                    open={expanded === g.id}
                    onTap={() => setExpanded(expanded === g.id ? null : g.id)}
                  />
                ))}
                {preds.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: C.txd, fontSize: 13 }}>
                    <p>Nenhum jogo encontrado para esta data e mercado.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div style={{
          marginTop: 28, padding: "14px 18px", background: C.redd,
          borderRadius: 12, border: `1px solid ${C.red}22`,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: C.red, lineHeight: 1.6, textAlign: "center" }}>
            ⚠️ App informativo. Previsões por IA sem garantia de resultados. Aposte com responsabilidade.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APP PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleGoogleLogin() {
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Login error:", error);
      setLoginLoading(false);
    }
  }

  // Loading screen
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: C.bg,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ac, marginBottom: 14 }}>BetGenius AI</div>
        <div style={{
          width: 36, height: 36, border: `3px solid ${C.bd}`,
          borderTopColor: C.ac, borderRadius: "50%", animation: "spin 0.7s linear infinite",
        }} />
        <p style={{ color: C.txd, fontSize: 12, marginTop: 14 }}>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onGoogleLogin={handleGoogleLogin} loading={loginLoading} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
