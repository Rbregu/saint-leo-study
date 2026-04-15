import React, { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

const BACKEND_URL = "https://saint-leo-server.onrender.com";
const POLL_INTERVAL = 4000;

const C = {
  bg:       "#07100a",
  surface:  "#0d1f12",
  card:     "#112217",
  border:   "#1e3d28",
  green1:   "#2d6a4f",
  green2:   "#52b788",
  green3:   "#95d5b2",
  gold:     "#e8a000",
  red:      "#e05c5c",
  critical: "#ff3b3b",
  text:     "#d8f3dc",
  muted:    "#6b9e7e",
  white:    "#f0faf3",
  blue:     "#5ba3c9",
  purple:   "#b07fe8",
};

// ── Risk engine ───────────────────────────────────────────────────────────────
// Survey answers are data collection only — NOT a risk factor
// Password click = maximum risk (entered sensitive data)
function calcRisk(e) {
  if (e.passwordClicked)  return { score: 100, label: "CRITICAL",  color: C.critical, icon: "🔴" };
  if (e.downloadedFile)   return { score: 70,  label: "HIGH",      color: C.red,      icon: "🟠" };
  if (e.emailSubmitted)   return { score: 40,  label: "MEDIUM",    color: C.gold,     icon: "🟡" };
  return                         { score: 10,  label: "LOW",       color: C.green2,   icon: "🟢" };
}

function RiskBadge({ risk, showScore = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{
        background: risk.color + "22", color: risk.color,
        border: `1px solid ${risk.color}66`,
        borderRadius: 6, padding: "2px 8px",
        fontSize: 10, fontWeight: 800, fontFamily: "monospace",
        letterSpacing: "0.06em",
      }}>
        {risk.icon} {risk.label}
      </span>
      {showScore && (
        <span style={{ fontSize: 11, color: risk.color, fontFamily: "monospace", fontWeight: 700 }}>
          {risk.score}/100
        </span>
      )}
    </span>
  );
}

function AnimNum({ value }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const delta  = target - prev.current;
    if (delta === 0) return;
    const steps = 20; let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplay(Math.round(prev.current + (delta * i) / steps));
      if (i >= steps) { clearInterval(t); prev.current = target; }
    }, 18);
    return () => clearInterval(t);
  }, [value]);
  return <>{display}</>;
}

function LiveDot() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green2, animation: "pulse 1.6s infinite" }} />
      <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(82,183,136,.6)}70%{box-shadow:0 0 0 8px rgba(82,183,136,0)}100%{box-shadow:0 0 0 0 rgba(82,183,136,0)}}`}</style>
      <span style={{ fontSize: 11, color: C.green2, fontFamily: "monospace", letterSpacing: "0.06em" }}>LIVE</span>
    </span>
  );
}

function StatCard({ label, value, sub, accent, icon, pct }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", borderTop: `3px solid ${accent || C.green1}`, display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontSize: "2.4vw", fontWeight: 900, color: accent || C.green2, fontFamily: "'Georgia', serif", lineHeight: 1 }}>
        <AnimNum value={value} />
      </div>
      <div style={{ fontSize: "0.7vw", color: C.white, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "monospace" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.65vw", color: C.muted, fontFamily: "monospace" }}>{sub}</div>}
      {pct !== undefined && (
        <div style={{ marginTop: 6 }}>
          <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${accent || C.green1}, ${C.green2})`, borderRadius: 2, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: "0.6vw", color: C.muted, marginTop: 3, fontFamily: "monospace" }}>{pct.toFixed(1)}% of scans</div>
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ margin: 0, color: C.green3, fontSize: 12, fontFamily: "monospace" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "4px 0 0", color: p.color, fontSize: 13, fontFamily: "monospace" }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── USER PROFILE VIEW ─────────────────────────────────────────────────────────
function UserProfile({ emailData, rawEvents, surveys, onBack }) {
  const risk    = calcRisk(emailData);
  const userEmail = emailData.email;

  // filter all events for this user
  const userEvents = rawEvents.filter(e => e.email === userEmail || (!e.email && false));
  const userSurvey = surveys.find(s => s.email === userEmail);

  const timeline = [
    { action: "Scanned QR Code",        done: true,                        time: userEvents.find(e => e.stage === "page_loaded")?.timestamp,       color: C.green2, icon: "📡" },
    { action: "Submitted Email",         done: emailData.emailSubmitted,    time: userEvents.find(e => e.stage === "email_submitted")?.timestamp,   color: C.green3, icon: "📧" },
    { action: "Downloaded File",         done: emailData.downloadedFile,    time: userEvents.find(e => e.stage === "file_downloaded")?.timestamp,    color: C.blue,   icon: "📥" },
    { action: "Clicked Password Field",  done: emailData.passwordClicked,   time: userEvents.find(e => e.stage === "password_clicked")?.timestamp,  color: C.red,    icon: "🔑" },
    { action: "Completed Survey (Dwell)",done: emailData.completedSurvey,   time: userEvents.find(e => e.stage === "survey_answered")?.timestamp,   color: C.purple, icon: "⏱️" },
  ];

  // radar uses cumulative risk — each step adds to the previous
  // so the shape fills progressively as the user goes deeper
  const radarData = [
    { subject: "QR Scan",      value: 10,                                    full: 10  },
    { subject: "Email",        value: emailData.emailSubmitted  ? 40  : 10,  full: 40  },
    { subject: "File DL",      value: emailData.downloadedFile  ? 70  : emailData.emailSubmitted ? 40 : 10,  full: 70  },
    { subject: "Password",     value: emailData.passwordClicked ? 90  : emailData.downloadedFile ? 70 : emailData.emailSubmitted ? 40 : 10, full: 90 },
    { subject: "Survey Dwell", value: emailData.completedSurvey ? 100 : emailData.passwordClicked ? 90 : emailData.downloadedFile ? 70 : emailData.emailSubmitted ? 40 : 10, full: 100 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Georgia', serif" }}>
      {/* header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", color: C.green2, cursor: "pointer", fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>
          ← Back
        </button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.white }}>User Profile — {userEmail}</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginTop: 1 }}>Individual Risk Analysis · Saint Leo Security Study</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {emailData.ageGroup && emailData.ageGroup !== "Unknown" && (
            <span style={{ background: C.gold + "22", color: C.gold, border: `1px solid ${C.gold}66`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>
              🎂 {emailData.ageGroup}
            </span>
          )}
          <RiskBadge risk={risk} showScore={true} />
        </div>
      </div>

      <div style={{ padding: "20px 2vw", width: "100%", boxSizing: "border-box" }}>

        {/* top cards */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
          {/* risk score big card */}
          <div style={{ background: C.card, border: `2px solid ${risk.color}44`, borderRadius: 14, padding: "24px", flex: 1, minWidth: 200, textAlign: "center", borderTop: `4px solid ${risk.color}` }}>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>Overall Risk Score</div>
            <div style={{ fontSize: 72, fontWeight: 900, color: risk.color, fontFamily: "monospace", lineHeight: 1.1, margin: "8px 0" }}>{risk.score}</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>out of 100</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 8, borderRadius: 4, background: C.border }}>
                <div style={{ height: "100%", width: `${risk.score}%`, background: `linear-gradient(90deg, ${C.green1}, ${risk.color})`, borderRadius: 4, transition: "width 1s ease", boxShadow: `0 0 12px ${risk.color}60` }} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <RiskBadge risk={risk} showScore={false} />
            </div>
          </div>

          {/* role + info */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px", flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>User Info</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>Age Group</span>
                <span style={{ fontSize: 12, color: C.gold, fontFamily: "monospace", fontWeight: 700 }}>
                  {emailData.ageGroup && emailData.ageGroup !== "Unknown" ? emailData.ageGroup : "—"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>Email</span>
                <span style={{ fontSize: 12, color: C.green3, fontFamily: "monospace", fontWeight: 700 }}>{userEmail}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>Role</span>
                <span style={{ fontSize: 12, fontFamily: "monospace" }}>
                  {emailData.roles?.student && <span style={{ background: C.green1, color: "#fff", borderRadius: 4, padding: "2px 7px", fontSize: 10, marginRight: 4 }}>Student</span>}
                  {emailData.roles?.staff   && <span style={{ background: C.gold,   color: "#000", borderRadius: 4, padding: "2px 7px", fontSize: 10 }}>Staff</span>}
                  {!emailData.roles?.student && !emailData.roles?.staff && <span style={{ color: C.muted }}>—</span>}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>First Seen</span>
                <span style={{ fontSize: 12, color: C.text, fontFamily: "monospace" }}>{emailData.timestamp ? new Date(emailData.timestamp).toLocaleString() : "—"}</span>
              </div>
              <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
              {[
                ["Submitted Email",  emailData.emailSubmitted,   C.green3],
                ["Downloaded File",  emailData.downloadedFile,   C.blue  ],
                ["Clicked Password", emailData.passwordClicked,  C.red   ],
                ["Stayed for Survey",emailData.completedSurvey,  C.purple],
              ].map(([label, done, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>{label}</span>
                  <span style={{ fontSize: 12, color: done ? color : C.border, fontFamily: "monospace", fontWeight: 700 }}>
                    {done ? "✓ Yes" : "✗ No"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* radar chart */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px", flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Risk Radar</div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke={C.border} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: C.muted, fontSize: 10, fontFamily: "monospace" }} />
                {/* outer ring shows max possible */}
                <Radar name="Max" dataKey="full" stroke={C.border} fill="transparent" strokeWidth={1} strokeDasharray="4 4" />
                {/* actual risk filled area */}
                <Radar name="Risk" dataKey="value" stroke={risk.color} fill={risk.color} fillOpacity={0.35} strokeWidth={2} dot={{ fill: risk.color, r: 4 }} />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.muted, fontFamily: "monospace" }}>
                <span style={{ width: 20, height: 2, background: risk.color, display: "inline-block", borderRadius: 1 }} /> Actual Risk
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.muted, fontFamily: "monospace" }}>
                <span style={{ width: 20, height: 2, background: C.border, display: "inline-block", borderRadius: 1, borderTop: `1px dashed ${C.border}` }} /> Max Possible
              </div>
            </div>
          </div>
        </div>

        {/* attack timeline */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.white, fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>
            Attack Timeline
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {timeline.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* line + dot */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: step.done ? step.color : C.border,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, border: `2px solid ${step.done ? step.color : C.border}`,
                    boxShadow: step.done ? `0 0 10px ${step.color}50` : "none",
                    transition: "all 0.3s",
                  }}>
                    {step.done ? step.icon : "○"}
                  </div>
                  {i < timeline.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 24, background: step.done ? step.color + "50" : C.border, margin: "4px 0" }} />
                  )}
                </div>
                {/* content */}
                <div style={{ flex: 1, paddingBottom: i < timeline.length - 1 ? 16 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: step.done ? C.white : C.muted, fontFamily: "monospace", fontWeight: step.done ? 700 : 400 }}>
                      {step.action}
                    </span>
                    <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>
                      {step.time ? new Date(step.time).toLocaleTimeString() : step.done ? "✓" : "—"}
                    </span>
                  </div>
                  {step.done && i === 4 && (
                    <div style={{ marginTop: 6, background: C.purple + "15", border: `1px solid ${C.purple}44`, borderRadius: 6, padding: "6px 10px" }}>
                      <span style={{ fontSize: 11, color: C.purple, fontFamily: "monospace" }}>
                        ⚠️ User stayed on page completing survey — maximum exploit dwell time achieved
                      </span>
                    </div>
                  )}
                  {step.done && i === 2 && (
                    <div style={{ marginTop: 6, background: C.blue + "15", border: `1px solid ${C.blue}44`, borderRadius: 6, padding: "6px 10px" }}>
                      <span style={{ fontSize: 11, color: C.blue, fontFamily: "monospace" }}>
                        ⚠️ File download simulates malware delivery vector
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* survey answers */}
        {userSurvey && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.white, fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
              Survey Responses
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Age Group",                          userSurvey.q1],
                ["Why did you trust this page?",       userSurvey.q2],
                ["Did you notice any red flags?",      userSurvey.q3],
                ["How often do you scan QR codes?",    userSurvey.q4],
              ].map(([q, a]) => (
                <div key={q} style={{ background: C.surface, borderRadius: 8, padding: "12px 16px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>{q}</div>
                  <div style={{ fontSize: 13, color: C.green3, fontFamily: "monospace", fontWeight: 700 }}>{a || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SURVEY QUESTION COMPONENT ─────────────────────────────────────────────────
// Each answer option is clickable — shows age group breakdown for that answer
function SurveyQuestion({ title, tally, surveys, qKey, selectedAnswer, onSelect }) {
  const AGE_ORDER = ["Under 18", "19–25", "26–35", "36+"];
  const AGE_COLORS = { "Under 18": C.green2, "19–25": C.green3, "26–35": C.gold, "36+": C.red };
  const total = Object.values(tally).reduce((a, b) => a + b, 0);

  // for selected answer: count how many of each age group chose it
  const ageBreakdown = selectedAnswer
    ? AGE_ORDER.map(age => ({
        age,
        count: surveys.filter(sv => sv[qKey] === selectedAnswer && sv.q1 === age).length,
      })).filter(a => a.count > 0)
    : [];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px" }}>
      <div style={S.chartTitle}>{title}</div>
      <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", marginBottom: 14, marginTop: 2 }}>
        Click an answer to see age group breakdown
      </div>

      {total === 0 ? (
        <p style={{ color: C.muted, fontFamily: "monospace", fontSize: 13 }}>No responses yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([answer, count]) => {
            const pct = Math.round((count / total) * 100);
            const isSelected = selectedAnswer === answer;
            return (
              <div key={answer}>
                {/* Clickable answer bar */}
                <div
                  onClick={() => onSelect(answer)}
                  style={{
                    cursor: "pointer",
                    border: `1.5px solid ${isSelected ? C.green2 : C.border}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    background: isSelected ? C.green1 + "33" : C.surface,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = C.green1; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = C.border; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: isSelected ? C.white : C.text, fontFamily: "monospace", fontWeight: isSelected ? 700 : 400 }}>{answer}</span>
                    <span style={{ fontSize: 12, color: isSelected ? C.green2 : C.muted, fontFamily: "monospace", fontWeight: 700 }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: C.border }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: isSelected ? C.green2 : C.green1, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>

                {/* Age breakdown — shown inline when selected */}
                {isSelected && (
                  <div style={{ background: C.surface, border: `1px solid ${C.green1}`, borderRadius: "0 0 10px 10px", borderTop: "none", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 10, color: C.green2, fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      Age group breakdown — who chose this answer:
                    </div>
                    {ageBreakdown.length === 0 ? (
                      <p style={{ color: C.muted, fontFamily: "monospace", fontSize: 11 }}>No age data available for this answer yet.</p>
                    ) : (
                      ageBreakdown.map(({ age, count: ac }) => {
                        const agePct = Math.round((ac / count) * 100);
                        return (
                          <div key={age}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: AGE_COLORS[age], fontFamily: "monospace", fontWeight: 700 }}>🎂 {age}</span>
                              <span style={{ fontSize: 11, color: AGE_COLORS[age], fontFamily: "monospace" }}>{ac} respondent{ac > 1 ? "s" : ""} ({agePct}%)</span>
                            </div>
                            <div style={{ height: 5, borderRadius: 3, background: C.border }}>
                              <div style={{ height: "100%", width: `${agePct}%`, background: AGE_COLORS[age], borderRadius: 3, transition: "width 0.5s", boxShadow: `0 0 6px ${AGE_COLORS[age]}60` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]             = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [tab, setTab]               = useState("overview");
  const [error, setError]           = useState(null);
  const [selectedUser, setSelectedUser]     = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  async function fetchData() {
    try {
      const res  = await fetch(`${BACKEND_URL}/results`);
      if (!res.ok) throw new Error("Server error");
      const json = await res.json();
      setData(json);
      setError(null);
      setLastUpdate(new Date());
    } catch {
      setError("Cannot reach server — make sure server.js is running on port 3001");
    }
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const s       = data?.summary         || { totalScans: 0, emailsSubmitted: 0, passwordsAttempted: 0, surveyResponses: 0, fileDownloads: 0, students: 0, staff: 0, faculty: 0 };
  const rates   = data?.conversionRates || {};
  const rawEmails  = data?.emails       || [];
  const surveys    = data?.surveys      || [];
  const rawEvents  = data?.rawEvents    || [];

  // enrich emails — server now sends passwordClicked, downloadedFile, and ageGroup correctly
  const emails = rawEmails.map(e => ({
    ...e,
    emailSubmitted:  true,
    downloadedFile:  e.downloadedFile  || false,
    passwordClicked: e.passwordClicked || rawEvents.some(ev => ev.stage === "password_clicked" && ev.email && ev.email === e.email),
    completedSurvey: surveys.some(sv => sv.email === e.email),
    ageGroup: e.ageGroup || surveys.find(sv => sv.email === e.email)?.q1 || null,
  }));

  const emailPct    = s.totalScans ? (s.emailsSubmitted    / s.totalScans) * 100 : 0;
  const riskPct     = s.totalScans ? (s.passwordsAttempted / s.totalScans) * 100 : 0;
  const downloadPct = s.totalScans ? (s.fileDownloads      / s.totalScans) * 100 : 0;

  const funnelData = [
    { name: "QR Scans",       value: s.totalScans,         fill: C.green1  },
    { name: "Emails Entered", value: s.emailsSubmitted,    fill: C.green2  },
    { name: "File Download",  value: s.fileDownloads,      fill: C.blue    },
    { name: "Pwd Click",      value: s.passwordsAttempted, fill: C.red     },
    { name: "Survey",         value: s.surveyResponses,    fill: C.green3  },
  ];

  const roleData = [
    { name: "Students", value: s.students, fill: C.green2 },
    { name: "Staff",    value: s.staff,    fill: C.gold   },
    { name: "Faculty",  value: s.faculty,  fill: C.blue   },
  ];

  const q1Tally = {}, q2Tally = {}, q3Tally = {}, q4Tally = {};
  surveys.forEach(sv => {
    if (sv.q1) q1Tally[sv.q1] = (q1Tally[sv.q1] || 0) + 1;
    if (sv.q2) q2Tally[sv.q2] = (q2Tally[sv.q2] || 0) + 1;
    if (sv.q3) q3Tally[sv.q3] = (q3Tally[sv.q3] || 0) + 1;
    if (sv.q4) q4Tally[sv.q4] = (q4Tally[sv.q4] || 0) + 1;
  });
  const toChart = (t) => Object.entries(t).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = [C.green2, C.green1, C.gold, C.muted, "#74b49b"];

  // risk distribution for overview — survey removed from risk
  const riskDist = [
    { name: "Critical (Password)", value: emails.filter(e => calcRisk(e).label === "CRITICAL").length, fill: C.critical },
    { name: "High (Download)",     value: emails.filter(e => calcRisk(e).label === "HIGH").length,     fill: C.red      },
    { name: "Medium (Email)",      value: emails.filter(e => calcRisk(e).label === "MEDIUM").length,   fill: C.gold     },
  ];

  // ── Correlation: Age Group vs Avg Risk Score — Unknown excluded ────────────
  const AGE_ORDER = ["Under 18", "19–25", "26–35", "36+"];
  const ageGroups = {};
  emails.filter(e => e.ageGroup && AGE_ORDER.includes(e.ageGroup)).forEach(e => {
    const age = e.ageGroup;
    if (!ageGroups[age]) ageGroups[age] = { total: 0, count: 0, critical: 0, high: 0, medium: 0 };
    ageGroups[age].total += calcRisk(e).score;
    ageGroups[age].count += 1;
    if (e.passwordClicked) ageGroups[age].critical++;
    if (e.downloadedFile)  ageGroups[age].high++;
    if (e.emailSubmitted)  ageGroups[age].medium++;
  });
  const correlationData = AGE_ORDER
    .filter(a => ageGroups[a]?.count > 0)
    .map(a => ({
      age:      a,
      avgRisk:  Math.round(ageGroups[a].total / ageGroups[a].count),
      count:    ageGroups[a].count,
      critical: ageGroups[a].critical,
      high:     ageGroups[a].high,
      medium:   ageGroups[a].medium,
    }));

  // show user profile if selected
  if (selectedUser) {
    return <UserProfile emailData={selectedUser} rawEvents={rawEvents} surveys={surveys} onBack={() => setSelectedUser(null)} />;
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, color: C.text, fontFamily: "'Georgia', serif", overflow: "hidden" }}>

      {/* header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 2vw", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${C.green1}, ${C.green2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔐</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.white }}>Saint Leo — Security Awareness Study</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginTop: 1 }}>Real-Time Research Dashboard · Spring 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <LiveDot />
          {lastUpdate && <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>Updated {lastUpdate.toLocaleTimeString()}</span>}
        </div>
      </div>

      {error && (
        <div style={{ background: "#3a0f0f", border: "1px solid #7a2222", padding: "8px 2vw", fontSize: 12, color: "#f5a0a0", fontFamily: "monospace", flexShrink: 0 }}>
          ⚠️ {error}
        </div>
      )}

      {/* scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 2vw", boxSizing: "border-box" }}>

        {/* stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1vw", marginBottom: "1.2vh" }}>
          <StatCard icon="📡" label="Total Scans"       value={s.totalScans}          accent={C.green2}  sub="QR code visits" />
          <StatCard icon="📧" label="Emails Submitted"  value={s.emailsSubmitted}     accent={C.green3}  sub="Entered email"       pct={emailPct} />
          <StatCard icon="📥" label="File Downloads"    value={s.fileDownloads}       accent={C.blue}    sub="Potential malware"   pct={downloadPct} />
          <StatCard icon="🔑" label="Password Clicks"   value={s.passwordsAttempted}  accent={C.red}     sub="Critical risk"       pct={riskPct} />
        </div>

        {/* conversion + role row */}
        <div style={{ display: "flex", gap: "1vw", marginBottom: "1.2vh", flexWrap: "wrap" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", flex: 1, minWidth: 260 }}>
            <div style={S.chartTitle}>Role Breakdown</div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              {[
                { label: "🎓 Students", value: s.students, color: C.green2 },
                { label: "💼 Staff",    value: s.staff,    color: C.gold   },
                { label: "👨‍🏫 Faculty", value: s.faculty,  color: C.blue   },
              ].map(r => (
                <div key={r.label} style={{ flex: 1, background: C.surface, borderRadius: 10, padding: "12px", textAlign: "center", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: r.color, fontFamily: "monospace" }}>{r.value}</div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginTop: 4 }}>{r.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", flex: 2, minWidth: 340 }}>
            <div style={S.chartTitle}>Conversion Rates</div>
            <div style={{ display: "flex", gap: "2vw", flexWrap: "wrap", marginTop: 12 }}>
              {[
                { label: "Scan → Email",      val: rates.scanToEmail,     color: C.green2  },
                { label: "Scan → Download",   val: rates.scanToDownload,  color: C.blue    },
                { label: "Email → Password",  val: rates.emailToPassword, color: C.red     },
                { label: "Overall Risk",      val: rates.overallRisk,     color: C.critical},
              ].map(r => (
                <div key={r.label} style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: r.color, fontFamily: "monospace" }}>{r.val || "0%"}</span>
                  <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1vh", borderBottom: `1px solid ${C.border}` }}>
          {["overview", "funnel", "roles", "survey", "emails", "correlation"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 20px", border: "none", cursor: "pointer",
              background: tab === t ? C.green1 : "transparent",
              color: tab === t ? C.white : C.muted,
              borderRadius: "8px 8px 0 0",
              fontSize: 12, fontWeight: 700, fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "0.06em",
              borderBottom: tab === t ? `2px solid ${C.green2}` : "2px solid transparent",
            }}>{t}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1vw", height: "42vh" }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column" }}>
              <div style={S.chartTitle}>Attack Funnel</div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} barSize={42} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.muted, fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {funnelData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column" }}>
              <div style={S.chartTitle}>Risk Distribution</div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskDist} cx="50%" cy="50%" innerRadius="35%" outerRadius="60%" paddingAngle={3} dataKey="value">
                      {riskDist.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", paddingTop: 8 }}>
                {riskDist.map(r => (
                  <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted, fontFamily: "monospace" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: r.fill, display: "inline-block" }} />{r.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FUNNEL */}
        {tab === "funnel" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px" }}>
            <div style={S.chartTitle}>Step-by-Step Funnel + Risk Scale</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
              {[
                { step:"1", label:"Scanned QR Code",          count: s.totalScans,          color: C.green2,  pct: 100,         score: 10  },
                { step:"2", label:"Submitted Email",           count: s.emailsSubmitted,     color: C.green3,  pct: emailPct,    score: 40  },
                { step:"3", label:"Downloaded File",           count: s.fileDownloads,       color: C.blue,    pct: downloadPct, score: 70  },
                { step:"4", label:"Clicked Password Field",    count: s.passwordsAttempted,  color: C.red,     pct: riskPct,     score: 100 },
              ].map(row => (
                <div key={row.step} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: row.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: C.bg, flexShrink: 0 }}>{row.step}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: C.white, fontFamily: "monospace" }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>
                        {row.count} users · {row.pct.toFixed(1)}% · <span style={{ color: row.color, fontWeight: 700 }}>Risk {row.score}/100</span>
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: C.border }}>
                      <div style={{ height: "100%", width: `${Math.min(row.pct, 100)}%`, background: row.color, borderRadius: 4, transition: "width 0.8s", boxShadow: `0 0 8px ${row.color}60` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROLES */}
        {tab === "roles" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px 10px" }}>
              <div style={S.chartTitle}>Students vs Staff</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {roleData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px" }}>
              <div style={S.chartTitle}>Role Risk Analysis</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                {[
                  { label: "🎓 Students",          value: s.students,            color: C.green2  },
                  { label: "💼 Staff",              value: s.staff,               color: C.gold    },
                  { label: "👨‍🏫 Faculty",           value: s.faculty,             color: C.blue    },
                  { label: "📥 File Downloads",     value: s.fileDownloads,       color: C.blue    },
                  { label: "🔑 Password Attempts",  value: s.passwordsAttempted,  color: C.red     },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.text, fontFamily: "monospace" }}>{r.label}</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: r.color, fontFamily: "monospace" }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SURVEY */}
        {tab === "survey" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { id: "q2", title: "Why did you trust this page?",       tally: q2Tally },
              { id: "q3", title: "Did you notice any red flags?",      tally: q3Tally },
              { id: "q4", title: "How often do you scan QR codes?",    tally: q4Tally },
            ].map(q => (
              <SurveyQuestion
                key={q.id}
                title={q.title}
                tally={q.tally}
                surveys={surveys}
                qKey={q.id}
                selectedAnswer={selectedSurvey?.qKey === q.id ? selectedSurvey.answer : null}
                onSelect={(answer) => setSelectedSurvey(
                  selectedSurvey?.qKey === q.id && selectedSurvey?.answer === answer
                    ? null
                    : { qKey: q.id, answer }
                )}
              />
            ))}
          </div>
        )}

        {/* EMAILS — clickable rows */}
        {tab === "emails" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={S.chartTitle}>Collected Emails ({emails.length})</div>
              <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>Click any row to view full profile ↗</span>
            </div>
            {emails.length === 0 ? (
              <p style={{ color: C.muted, fontFamily: "monospace", fontSize: 13, padding: 20 }}>No emails submitted yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.surface }}>
                    {["#", "Email", "Role", "Age Group", "Risk", "Score", "Downloaded", "Timestamp"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emails.map((e, i) => {
                    const risk = calcRisk(e);
                    return (
                      <tr key={i}
                        onClick={() => setSelectedUser(e)}
                        style={{ borderTop: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={el => el.currentTarget.style.background = C.surface}
                        onMouseLeave={el => el.currentTarget.style.background = "transparent"}>
                        <td style={S.td}>{i + 1}</td>
                        <td style={{ ...S.td, color: C.green3, fontWeight: 700 }}>
                          {e.email}
                          <span style={{ marginLeft: 6, fontSize: 10, color: C.muted }}>↗</span>
                        </td>
                        <td style={S.td}>
                          {e.roles?.student && <span style={{ background: C.green1, color: "#fff", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontFamily: "monospace", marginRight: 4 }}>Student</span>}
                          {e.roles?.staff   && <span style={{ background: C.gold,   color: "#000", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontFamily: "monospace", marginRight: 4 }}>Staff</span>}
                          {e.roles?.faculty && <span style={{ background: C.blue,   color: "#fff", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontFamily: "monospace" }}>Faculty</span>}
                          {!e.roles?.student && !e.roles?.staff && !e.roles?.faculty && <span style={{ color: C.muted, fontSize: 11 }}>—</span>}
                        </td>
                        <td style={S.td}>
                          {e.ageGroup ? (
                            <span style={{
                              background: C.green1 + "44", color: C.green3,
                              border: `1px solid ${C.green1}`,
                              borderRadius: 4, padding: "2px 8px", fontSize: 10, fontFamily: "monospace"
                            }}>
                              {e.ageGroup}
                            </span>
                          ) : <span style={{ color: C.muted, fontSize: 11 }}>—</span>}
                        </td>
                        <td style={S.td}><RiskBadge risk={risk} showScore={false} /></td>
                        <td style={{ ...S.td, color: risk.color, fontWeight: 900, fontFamily: "monospace" }}>{risk.score}</td>
                        <td style={S.td}>
                          {e.downloadedFile
                            ? <span style={{ color: C.blue, fontFamily: "monospace", fontSize: 11 }}>✓ Yes</span>
                            : <span style={{ color: C.muted, fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ ...S.td, color: C.muted }}>{new Date(e.timestamp).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* CORRELATION — Age vs Risk */}
        {tab === "correlation" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* header note */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 20px" }}>
              <div style={S.chartTitle}>H1: Age Group vs QR Code Engagement Risk</div>
              <p style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginTop: 6, lineHeight: 1.6 }}>
                Testing whether younger individuals engage more deeply with QR-based phishing simulations than older individuals.
                Risk score is derived from deepest engagement stage (Survey=100, Password=90, Download=70, Email=40).
                Chi-Square Test of Independence will be applied once data collection is complete.
              </p>
            </div>

            {correlationData.length === 0 ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <p style={{ color: C.muted, fontFamily: "monospace", fontSize: 13 }}>No survey age data yet — participants must complete the survey for age correlation data to appear.</p>
              </div>
            ) : (
              <>
                {/* Bar chart: Avg Risk by Age */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", height: "32vh", display: "flex", flexDirection: "column" }}>
                  <div style={S.chartTitle}>Average Risk Score by Age Group</div>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={correlationData} barSize={48} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                        <XAxis dataKey="age" tick={{ fill: C.muted, fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avgRisk" name="Avg Risk Score" radius={[6, 6, 0, 0]}>
                          {correlationData.map((_, i) => {
                            const colors = [C.green2, C.gold, C.red, C.purple, C.muted];
                            return <Cell key={i} fill={colors[i % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Breakdown table */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
                    <div style={S.chartTitle}>Contingency Table — Age Group × Engagement Level</div>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.surface }}>
                        {["Age Group", "n", "Avg Risk", "🔴 Critical (Pwd)", "🟠 High (File)", "🟡 Medium (Email)", "Direction"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlationData.map((row, i) => {
                        const scoreColor = row.avgRisk >= 70 ? C.red : row.avgRisk >= 40 ? C.gold : C.green2;
                        const direction = row.age === "Under 18" || row.age === "19–25" ? { label: "H1a — Younger", color: C.green2 } : row.age === "36+" ? { label: "H1b — Older", color: C.red } : { label: "Neutral", color: C.muted };
                        return (
                          <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                            <td style={{ ...S.td, fontWeight: 700, color: C.white }}>{row.age}</td>
                            <td style={{ ...S.td, color: C.muted }}>{row.count}</td>
                            <td style={{ ...S.td, color: scoreColor, fontWeight: 900, fontFamily: "monospace", fontSize: 15 }}>{row.avgRisk}</td>
                            <td style={{ ...S.td, color: C.critical }}>{row.critical}</td>
                            <td style={{ ...S.td, color: C.red }}>{row.high}</td>
                            <td style={{ ...S.td, color: C.gold }}>{row.medium}</td>
                            <td style={S.td}><span style={{ color: direction.color, fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>{direction.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Chi-Square note */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 20px", display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>H0 (Null)</div>
                    <div style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>No significant relationship between age and QR engagement</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>H1 (Alternative)</div>
                    <div style={{ fontSize: 12, color: C.green2, fontFamily: "monospace" }}>There IS a significant relationship between age and QR engagement</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>H1a</div>
                    <div style={{ fontSize: 12, color: C.green2, fontFamily: "monospace" }}>Younger individuals are more vulnerable</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>H1b</div>
                    <div style={{ fontSize: 12, color: C.red, fontFamily: "monospace" }}>Older individuals are more vulnerable</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Statistical Test</div>
                    <div style={{ fontSize: 12, color: C.gold, fontFamily: "monospace" }}>Chi-Square Test of Independence · α = .05</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Status</div>
                    <div style={{ fontSize: 12, color: emails.filter(e => e.ageGroup).length >= 30 ? C.green2 : C.gold, fontFamily: "monospace" }}>
                      {emails.filter(e => e.ageGroup).length >= 30 ? "✓ Sufficient data" : `⏳ Collecting (${emails.filter(e => e.ageGroup).length}/30 min recommended)`}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: "1.5vh", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>Saint Leo University · Cybersecurity Research · IRB Approved · Spring 2026</span>
          <span style={{ fontSize: 11, color: C.border, fontFamily: "monospace" }}>Auto-refreshing every {POLL_INTERVAL / 1000}s</span>
        </div>
      </div>
    </div>
  );
}

const S = {
  chartTitle: { fontSize: 12, fontWeight: 800, color: C.white, fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 },
  td: { padding: "9px 14px", fontSize: 13, fontFamily: "monospace", color: C.text },
};
