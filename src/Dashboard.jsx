import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const BACKEND_URL = "https://saint-leo-server.onrender.com";
const POLL_INTERVAL = 4000; // refresh every 4 seconds

const C = {
  bg: "#07100a",
  surface: "#0d1f12",
  card: "#112217",
  border: "#1e3d28",
  green1: "#2d6a4f",
  green2: "#52b788",
  green3: "#95d5b2",
  gold: "#e8a000",
  red: "#e05c5c",
  text: "#d8f3dc",
  muted: "#6b9e7e",
  white: "#f0faf3",
};

// ── tiny animated number ──────────────────────────────────────────────────────
function AnimNum({ value }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const delta = target - prev.current;
    if (delta === 0) return;
    const steps = 20;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplay(Math.round(prev.current + (delta * i) / steps));
      if (i >= steps) {
        clearInterval(t);
        prev.current = target;
      }
    }, 18);
    return () => clearInterval(t);
  }, [value]);
  return <>{display}</>;
}

// ── pulse dot ─────────────────────────────────────────────────────────────────
function LiveDot() {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: C.green2,
          boxShadow: `0 0 0 0 ${C.green2}`,
          animation: "pulse 1.6s infinite",
        }}
      />
      <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(82,183,136,.6)}70%{box-shadow:0 0 0 8px rgba(82,183,136,0)}100%{box-shadow:0 0 0 0 rgba(82,183,136,0)}}`}</style>
      <span
        style={{
          fontSize: 11,
          color: C.green2,
          fontFamily: "monospace",
          letterSpacing: "0.06em",
        }}
      >
        LIVE
      </span>
    </span>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon, pct }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "20px 22px",
        borderTop: `3px solid ${accent || C.green1}`,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flex: 1,
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: accent || C.green2,
          fontFamily: "'Georgia', serif",
          lineHeight: 1,
        }}
      >
        <AnimNum value={value} />
      </div>
      <div
        style={{
          fontSize: 12,
          color: C.white,
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontFamily: "monospace",
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>
          {sub}
        </div>
      )}
      {pct !== undefined && (
        <div style={{ marginTop: 6 }}>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: C.border,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(pct, 100)}%`,
                background: `linear-gradient(90deg, ${accent || C.green1}, ${C.green2})`,
                borderRadius: 2,
                transition: "width 0.6s ease",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 10,
              color: C.muted,
              marginTop: 3,
              fontFamily: "monospace",
            }}
          >
            {pct.toFixed(1)}% conversion
          </div>
        </div>
      )}
    </div>
  );
}

// ── custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "10px 14px",
      }}
    >
      <p
        style={{
          margin: 0,
          color: C.green3,
          fontSize: 12,
          fontFamily: "monospace",
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            margin: "4px 0 0",
            color: p.color,
            fontSize: 13,
            fontFamily: "monospace",
          }}
        >
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState(null);
  const tickRef = useRef(0);

  async function fetchData() {
    try {
      const res = await fetch(`${BACKEND_URL}/results`);
      if (!res.ok) throw new Error("Server error");
      const json = await res.json();
      setData(json);
      setError(null);
      setLastUpdate(new Date());
      tickRef.current += 1;
      setHistory((prev) => {
        const point = {
          t: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          scans: json.summary.totalScans,
          emails: json.summary.emailsSubmitted,
          pwds: json.summary.passwordsAttempted,
        };
        return [...prev.slice(-19), point];
      });
    } catch (e) {
      setError(
        "Cannot reach server — make sure server.js is running on port 3001",
      );
    }
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // ── derived data ────────────────────────────────────────────────────────────
  const s = data?.summary || {
    totalScans: 0,
    emailsSubmitted: 0,
    passwordsAttempted: 0,
    surveyResponses: 0,
  };
  const rates = data?.conversionRates || {};
  const emails = data?.emails || [];
  const surveys = data?.surveys || [];

  const funnelData = [
    { name: "QR Scans", value: s.totalScans, fill: C.green1 },
    { name: "Emails Entered", value: s.emailsSubmitted, fill: C.green2 },
    { name: "Password Click", value: s.passwordsAttempted, fill: C.gold },
    { name: "Survey Done", value: s.surveyResponses, fill: C.muted },
  ];

  // tally survey answers per question
  const q1Tally = {},
    q2Tally = {},
    q3Tally = {};
  surveys.forEach((sv) => {
    if (!sv.answers) return;
    if (sv.answers.q1)
      q1Tally[sv.answers.q1] = (q1Tally[sv.answers.q1] || 0) + 1;
    if (sv.answers.q2)
      q2Tally[sv.answers.q2] = (q2Tally[sv.answers.q2] || 0) + 1;
    if (sv.answers.q3)
      q3Tally[sv.answers.q3] = (q3Tally[sv.answers.q3] || 0) + 1;
  });
  const toChartData = (tally) =>
    Object.entries(tally).map(([name, value]) => ({ name, value }));

  const PIE_COLORS = [C.green2, C.green1, C.gold, C.muted, "#74b49b"];

  const riskPct = s.totalScans
    ? (s.passwordsAttempted / s.totalScans) * 100
    : 0;
  const emailPct = s.totalScans ? (s.emailsSubmitted / s.totalScans) * 100 : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* ── header ── */}
      <div
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${C.green1}, ${C.green2})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🔐
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: C.white,
                letterSpacing: "0.02em",
              }}
            >
              Saint Leo — Security Awareness Study
            </div>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                fontFamily: "monospace",
                marginTop: 1,
              }}
            >
              Real-Time Research Dashboard · Spring 2026
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <LiveDot />
          {lastUpdate && (
            <span
              style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}
            >
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* ── error banner ── */}
      {error && (
        <div
          style={{
            background: "#3a0f0f",
            border: `1px solid #7a2222`,
            padding: "10px 28px",
            fontSize: 13,
            color: "#f5a0a0",
            fontFamily: "monospace",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>
        {/* ── stat cards ── */}
        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <StatCard
            icon="📡"
            label="Total Scans"
            value={s.totalScans}
            accent={C.green2}
            sub="QR code visits"
          />
          <StatCard
            icon="📧"
            label="Emails Submitted"
            value={s.emailsSubmitted}
            accent={C.green3}
            sub="Entered email"
            pct={emailPct}
          />
          <StatCard
            icon="🔑"
            label="Password Clicks"
            value={s.passwordsAttempted}
            accent={C.gold}
            sub="High-risk action"
            pct={riskPct}
          />
          <StatCard
            icon="📋"
            label="Survey Responses"
            value={s.surveyResponses}
            accent={C.muted}
            sub="Debrief answers"
          />
        </div>

        {/* ── conversion banner ── */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "16px 22px",
            marginBottom: 24,
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: C.muted,
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Conversion Rates
          </div>
          {[
            { label: "Scan → Email", val: rates.scanToEmail, color: C.green2 },
            {
              label: "Email → Password",
              val: rates.emailToPassword,
              color: C.gold,
            },
            { label: "Overall Risk", val: rates.overallRisk, color: C.red },
          ].map((r) => (
            <div
              key={r.label}
              style={{ display: "flex", alignItems: "baseline", gap: 8 }}
            >
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: r.color,
                  fontFamily: "monospace",
                }}
              >
                {r.val || "0%"}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: C.muted,
                  fontFamily: "monospace",
                }}
              >
                {r.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── tabs ── */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: 0,
          }}
        >
          {["overview", "funnel", "survey", "emails", "timeline"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 18px",
                border: "none",
                cursor: "pointer",
                background: tab === t ? C.green1 : "transparent",
                color: tab === t ? C.white : C.muted,
                borderRadius: "8px 8px 0 0",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                transition: "all 0.15s",
                borderBottom:
                  tab === t ? `2px solid ${C.green2}` : "2px solid transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            {/* Funnel bar */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: "20px 20px 10px",
              }}
            >
              <div style={styles.chartTitle}>Attack Funnel</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelData} barSize={40}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={C.border}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: C.muted,
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: C.muted,
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk donut */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: "20px 20px 10px",
              }}
            >
              <div style={styles.chartTitle}>Risk Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "High Risk (pwd click)",
                        value: s.passwordsAttempted,
                      },
                      {
                        name: "Med Risk (email only)",
                        value: Math.max(
                          0,
                          s.emailsSubmitted - s.passwordsAttempted,
                        ),
                      },
                      {
                        name: "Low Risk (scan only)",
                        value: Math.max(0, s.totalScans - s.emailsSubmitted),
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill={C.red} />
                    <Cell fill={C.gold} />
                    <Cell fill={C.green1} />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 16,
                  flexWrap: "wrap",
                  marginTop: 4,
                }}
              >
                {[
                  ["High Risk", C.red],
                  ["Med Risk", C.gold],
                  ["Low Risk", C.green1],
                ].map(([l, c]) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      color: C.muted,
                      fontFamily: "monospace",
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: c,
                        display: "inline-block",
                      }}
                    />
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FUNNEL TAB ── */}
        {tab === "funnel" && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: "24px",
            }}
          >
            <div style={styles.chartTitle}>Step-by-Step Funnel Analysis</div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginTop: 16,
              }}
            >
              {[
                {
                  step: "1",
                  label: "Scanned QR Code",
                  count: s.totalScans,
                  color: C.green2,
                  pct: 100,
                },
                {
                  step: "2",
                  label: "Visited Landing Page",
                  count: s.totalScans,
                  color: C.green3,
                  pct: 100,
                },
                {
                  step: "3",
                  label: "Submitted Email",
                  count: s.emailsSubmitted,
                  color: C.gold,
                  pct: emailPct,
                },
                {
                  step: "4",
                  label: "Clicked Password Field",
                  count: s.passwordsAttempted,
                  color: C.red,
                  pct: riskPct,
                },
                {
                  step: "5",
                  label: "Completed Survey",
                  count: s.surveyResponses,
                  color: C.muted,
                  pct: s.totalScans
                    ? (s.surveyResponses / s.totalScans) * 100
                    : 0,
                },
              ].map((row) => (
                <div
                  key={row.step}
                  style={{ display: "flex", alignItems: "center", gap: 14 }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: row.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 900,
                      color: C.bg,
                      flexShrink: 0,
                    }}
                  >
                    {row.step}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: C.white,
                          fontFamily: "monospace",
                        }}
                      >
                        {row.label}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: row.color,
                          fontFamily: "monospace",
                        }}
                      >
                        {row.count} &nbsp;·&nbsp; {row.pct.toFixed(1)}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 4,
                        background: C.border,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(row.pct, 100)}%`,
                          background: row.color,
                          borderRadius: 4,
                          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                          boxShadow: `0 0 8px ${row.color}60`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SURVEY TAB ── */}
        {tab === "survey" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              {
                title: "Why did you trust this page?",
                data: toChartData(q1Tally),
              },
              {
                title: "Did you notice any red flags?",
                data: toChartData(q2Tally),
              },
              {
                title: "How often do you scan QR codes?",
                data: toChartData(q3Tally),
              },
            ].map((q, qi) => (
              <div
                key={qi}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "20px",
                }}
              >
                <div style={styles.chartTitle}>{q.title}</div>
                {q.data.length === 0 ? (
                  <p
                    style={{
                      color: C.muted,
                      fontFamily: "monospace",
                      fontSize: 13,
                      marginTop: 12,
                    }}
                  >
                    No responses yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={q.data}
                      layout="vertical"
                      barSize={18}
                      margin={{ left: 10 }}
                    >
                      <XAxis
                        type="number"
                        tick={{
                          fill: C.muted,
                          fontSize: 11,
                          fontFamily: "monospace",
                        }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={220}
                        tick={{
                          fill: C.text,
                          fontSize: 11,
                          fontFamily: "monospace",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {q.data.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── EMAILS TAB ── */}
        {tab === "emails" && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={styles.chartTitle}>
                Collected Emails ({emails.length})
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: C.muted,
                  fontFamily: "monospace",
                }}
              >
                ⚠️ Anonymize before publishing
              </span>
            </div>
            {emails.length === 0 ? (
              <p
                style={{
                  color: C.muted,
                  fontFamily: "monospace",
                  fontSize: 13,
                  padding: 20,
                }}
              >
                No emails submitted yet.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.surface }}>
                    {["#", "Email", "Timestamp", "Device"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontSize: 10,
                          color: C.muted,
                          fontFamily: "monospace",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontWeight: 700,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emails.map((e, i) => (
                    <tr
                      key={i}
                      style={{
                        borderTop: `1px solid ${C.border}`,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(el) =>
                        (el.currentTarget.style.background = C.surface)
                      }
                      onMouseLeave={(el) =>
                        (el.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={styles.td}>{i + 1}</td>
                      <td
                        style={{
                          ...styles.td,
                          color: C.green3,
                          fontWeight: 700,
                        }}
                      >
                        {e.email}
                      </td>
                      <td style={{ ...styles.td, color: C.muted }}>
                        {new Date(e.timestamp).toLocaleString()}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          color: C.muted,
                          fontSize: 10,
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {e.userAgent?.split(" ")[0] || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── TIMELINE TAB ── */}
        {tab === "timeline" && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: "20px 20px 10px",
            }}
          >
            <div style={styles.chartTitle}>Live Activity Timeline</div>
            <p
              style={{
                fontSize: 12,
                color: C.muted,
                fontFamily: "monospace",
                margin: "4px 0 16px",
              }}
            >
              Polling every {POLL_INTERVAL / 1000}s — last {history.length}{" "}
              snapshots
            </p>
            {history.length < 2 ? (
              <p
                style={{
                  color: C.muted,
                  fontFamily: "monospace",
                  fontSize: 13,
                }}
              >
                Collecting data points… check back in a moment.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={history} margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis
                    dataKey="t"
                    tick={{
                      fill: C.muted,
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{
                      fill: C.muted,
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="scans"
                    name="Scans"
                    stroke={C.green2}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="emails"
                    name="Emails"
                    stroke={C.gold}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="pwds"
                    name="Pwd Clicks"
                    stroke={C.red}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
              {[
                ["Scans", C.green2],
                ["Emails", C.gold],
                ["Pwd Clicks", C.red],
              ].map(([l, c]) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: C.muted,
                    fontFamily: "monospace",
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 3,
                      background: c,
                      display: "inline-block",
                      borderRadius: 2,
                    }}
                  />
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── footer ── */}
        <div
          style={{
            marginTop: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span
            style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}
          >
            Saint Leo University · Cybersecurity Research · IRB Approved ·
            Spring 2026
          </span>
          <span
            style={{ fontSize: 11, color: C.border, fontFamily: "monospace" }}
          >
            Auto-refreshing every {POLL_INTERVAL / 1000}s
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  chartTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: C.white,
    fontFamily: "monospace",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  td: {
    padding: "10px 16px",
    fontSize: 13,
    fontFamily: "monospace",
    color: C.text,
  },
};
