import React, { useState, useEffect } from "react";

const BACKEND_URL = "http://localhost:3001";

function trackEvent(stage, payload = {}) {
  fetch(`${BACKEND_URL}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stage,
      ...payload,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {});
}

// ── File content for the "malware" download ───────────────────────────────────
const FILE_CONTENT = `
=======================================================
  ⚠️  YOU DOWNLOADED A FILE FROM AN UNKNOWN SOURCE
=======================================================

This file could have been MALWARE.

You are receiving this message because you participated
in the Saint Leo University Cybersecurity Awareness Study.

In a real phishing attack, this file could have:
  - Installed a keylogger on your device
  - Stolen your passwords and personal data
  - Given hackers remote access to your computer
  - Encrypted your files and demanded a ransom

-------------------------------------------------------
  👋 BUT DON'T WORRY — YOU'RE INVITED!
-------------------------------------------------------

You are cordially invited to learn more about:

  ✅ Cybersecurity Awareness Training
  ✅ Ethical Hacking & Penetration Testing
  ✅ How to protect yourself online

Join our Cybersecurity Club at Saint Leo University!

  📧 Contact: cybersecurity@saintleo.edu
  📍 Location: Kirk Hall, Room 101
  📅 Meetings: Every Thursday at 6:00 PM

Stay safe. Stay aware. Stay curious.

— Saint Leo University Cybersecurity Research Team
  Spring 2026 · IRB Approved Study
=======================================================
`;

// ── Logo ──────────────────────────────────────────────────────────────────────
function SaintLeoLogo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={styles.logoRing}>
        <img
          src="https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Saint_Leo_University_seal.png/200px-Saint_Leo_University_seal.png"
          alt="Saint Leo University"
          style={{ width: 64, height: 64, objectFit: "contain" }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      </div>
      <span style={styles.logoText}>SAINT LEO UNIVERSITY</span>
    </div>
  );
}

// ── STAGE 1 — Landing ─────────────────────────────────────────────────────────
function LandingStage({ onNext }) {
  const [email, setEmail]   = useState("");
  const [roles, setRoles]   = useState({ student: false, staff: false });
  const [error, setError]   = useState("");

  function toggleRole(role) {
    setRoles(prev => ({ ...prev, [role]: !prev[role] }));
  }

  function handleDownload() {
    trackEvent("file_downloaded", { email: email || null, roles });
    const blob = new Blob([FILE_CONTENT], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "cybersecurity_awareness.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSubmit() {
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid Saint Leo email address.");
      return;
    }
    if (!roles.student && !roles.staff) {
      setError("Please select if you are a Student and/or Staff.");
      return;
    }
    setError("");
    trackEvent("email_submitted", { email, roles });
    onNext(email, roles);
  }

  return (
    <div style={styles.card}>
      <SaintLeoLogo />
      <div style={styles.divider} />
      <div style={styles.prizeTag}>🎁 Spring 2026 Student Giveaway</div>
      <h1 style={styles.heading}>Win a $100<br />Campus Gift Card!</h1>
      <p style={styles.sub}>
        Enter your Saint Leo account to be automatically enrolled.
        One winner drawn every Friday. Open to all enrolled students and staff.
      </p>

      {/* Role checkboxes */}
      <div style={{ width: "100%", marginTop: 20 }}>
        <label style={styles.label}>I am a (select all that apply)</label>
        <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
          {[["student", "🎓 Student"], ["staff", "💼 Staff"]].map(([key, label]) => (
            <button key={key} onClick={() => toggleRole(key)} style={{
              flex: 1, padding: "10px 14px",
              border: `1.5px solid ${roles[key] ? "#2d6a4f" : "#b7d4c3"}`,
              borderRadius: 8, cursor: "pointer",
              background: roles[key] ? "#2d6a4f" : "#f0f4f1",
              color: roles[key] ? "#fff" : "#1a3a2a",
              fontWeight: roles[key] ? 700 : 500,
              fontSize: 13, fontFamily: "system-ui, sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.15s",
              boxShadow: roles[key] ? "0 2px 8px rgba(45,106,79,0.25)" : "none",
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: 4,
                border: `2px solid ${roles[key] ? "#fff" : "#2d6a4f"}`,
                background: roles[key] ? "rgba(255,255,255,0.3)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 10,
              }}>
                {roles[key] && "✓"}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Email input */}
      <div style={{ width: "100%", marginTop: 16 }}>
        <label style={styles.label}>Student / Staff Email Address</label>
        <input
          type="email"
          placeholder="yourname@email.saintleo.edu"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          style={{ ...styles.input, borderColor: error ? "#c0392b" : "#2d6a4f" }}
        />
        {error && <p style={styles.errorMsg}>{error}</p>}
      </div>

      {/* More info download */}
      <div style={{
        width: "100%", marginTop: 14,
        background: "#eafaf1", border: "1px solid #b7d4c3",
        borderRadius: 8, padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, color: "#1b4332", fontFamily: "system-ui, sans-serif" }}>
          📄 Want to know more about this promotion?
        </span>
        <button onClick={handleDownload} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#2d6a4f", fontWeight: 800, fontSize: 12,
          fontFamily: "system-ui, sans-serif", textDecoration: "underline",
          padding: 0, whiteSpace: "nowrap", marginLeft: 8,
        }}>
          Click here for more info ↓
        </button>
      </div>

      <button style={styles.btn} onClick={handleSubmit}
        onMouseEnter={e => e.target.style.background = "#1b4332"}
        onMouseLeave={e => e.target.style.background = "#2d6a4f"}>
        Enter to Win →
      </button>

      <p style={styles.fine}>
        By entering you agree to the Student Promotions Terms &amp; Conditions.
        Saint Leo University Official Promotion · Spring 2026.
      </p>
    </div>
  );
}

// ── STAGE 2 — Password + Survey ───────────────────────────────────────────────
const QUESTIONS = [
  {
    id: "q1",
    text: "Why did you trust this page?",
    options: [
      "It had the Saint Leo logo",
      "It looked like the official portal",
      "A friend told me about it",
      "I didn't fully trust it",
    ],
  },
  {
    id: "q2",
    text: "Did you notice any red flags?",
    options: [
      "No, everything looked legitimate",
      "The URL seemed different",
      "I was unsure but continued anyway",
      "Yes, but I was curious",
    ],
  },
  {
    id: "q3",
    text: "How often do you scan QR codes?",
    options: [
      "Very often — multiple times a week",
      "Sometimes — once or twice a month",
      "Rarely — only when necessary",
      "Never — this was unusual for me",
    ],
  },
];

function PasswordStage({ email, roles, onTriggered }) {
  const [answers, setAnswers]         = useState({});
  const [showQuestions, setShowQuestions] = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  function handlePasswordFocus() {
    trackEvent("password_clicked", { email, roles });
    setShowQuestions(true);
  }

  function selectAnswer(qid, option) {
    setAnswers(prev => ({ ...prev, [qid]: option }));
  }

  function handleSubmitSurvey() {
    if (!QUESTIONS.every(q => answers[q.id])) return;
    fetch(`${BACKEND_URL}/survey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, email, roles, timestamp: new Date().toISOString() }),
    }).catch(() => {});
    setSubmitted(true);
    setTimeout(() => onTriggered(), 1400);
  }

  const allAnswered = QUESTIONS.every(q => answers[q.id]);

  return (
    <div style={styles.card}>
      <SaintLeoLogo />
      <div style={styles.divider} />

      {!showQuestions ? (
        <>
          <div style={styles.prizeTag}>Step 2 of 2 — Verify Your Identity</div>
          <h1 style={styles.heading}>Confirm Your<br />Account</h1>
          <p style={styles.sub}>Enter your Saint Leo portal password to verify and complete your entry.</p>
          <div style={{ width: "100%", marginTop: 20 }}>
            <label style={styles.label}>Email</label>
            <input type="email" value={email} readOnly
              style={{ ...styles.input, background: "#f0f4f1", color: "#555", cursor: "default" }} />
          </div>
          <div style={{ width: "100%", marginTop: 12 }}>
            <label style={styles.label}>Portal Password</label>
            <input type="password" placeholder="Enter your portal password"
              onFocus={handlePasswordFocus} style={styles.input} autoComplete="off" />
          </div>
          <button style={styles.btn} onClick={handlePasswordFocus}
            onMouseEnter={e => e.target.style.background = "#1b4332"}
            onMouseLeave={e => e.target.style.background = "#2d6a4f"}>
            Verify &amp; Enter →
          </button>
          <p style={styles.fine}>🔒 Secured by Saint Leo SSO · 256-bit encrypted</p>
        </>
      ) : submitted ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 52 }}>✅</div>
          <p style={{ ...styles.sub, marginTop: 14, color: "#2d6a4f", fontWeight: 700 }}>
            Responses recorded. Redirecting…
          </p>
        </div>
      ) : (
        <>
          <div style={styles.prizeTag}>📋 Before You Continue</div>
          <h1 style={{ ...styles.heading, fontSize: 21 }}>Answer 3 Quick Questions</h1>
          <p style={{ ...styles.sub, marginBottom: 4 }}>Your answers help us improve the campus experience.</p>
          <div style={{ width: "100%", marginTop: 18, display: "flex", flexDirection: "column", gap: 22 }}>
            {QUESTIONS.map((q, qi) => (
              <div key={q.id}>
                <p style={styles.qText}>{qi + 1}. {q.text}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {q.options.map(opt => {
                    const selected = answers[q.id] === opt;
                    return (
                      <button key={opt} onClick={() => selectAnswer(q.id, opt)} style={{
                        ...styles.optionBtn,
                        background: selected ? "#2d6a4f" : "#f0f4f1",
                        color: selected ? "#fff" : "#1a3a2a",
                        borderColor: selected ? "#2d6a4f" : "#b7d4c3",
                        fontWeight: selected ? 700 : 400,
                        boxShadow: selected ? "0 2px 8px rgba(45,106,79,0.25)" : "none",
                      }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 18, height: 18, borderRadius: "50%",
                          border: `2px solid ${selected ? "#fff" : "#2d6a4f"}`,
                          marginRight: 10, flexShrink: 0,
                          background: selected ? "rgba(255,255,255,0.3)" : "transparent",
                        }}>
                          {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "block" }} />}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button
            style={{ ...styles.btn, marginTop: 24, opacity: allAnswered ? 1 : 0.4, cursor: allAnswered ? "pointer" : "not-allowed", background: allAnswered ? "#2d6a4f" : "#7aab94" }}
            onClick={handleSubmitSurvey} disabled={!allAnswered}
            onMouseEnter={e => { if (allAnswered) e.target.style.background = "#1b4332"; }}
            onMouseLeave={e => { if (allAnswered) e.target.style.background = "#2d6a4f"; }}>
            Submit &amp; Continue →
          </button>
          {!allAnswered && <p style={{ ...styles.fine, color: "#9ab5a6", marginTop: 8 }}>Please answer all 3 questions to continue.</p>}
        </>
      )}
    </div>
  );
}

// ── STAGE 3 — Debrief ─────────────────────────────────────────────────────────
function DebriefStage() {
  return (
    <div style={{ ...styles.card, borderTop: "5px solid #e8a000" }}>
      <div style={{ fontSize: 52, marginBottom: 4 }}>🔐</div>
      <h1 style={{ ...styles.heading, color: "#1b4332", fontSize: 22 }}>This Was a Security Awareness Test</h1>
      <p style={styles.sub}>
        You just participated in a <strong>cybersecurity research study</strong> conducted by
        Saint Leo University. No real credentials were captured or stored.
      </p>
      <div style={styles.alertBox}>
        <p style={{ fontWeight: 800, marginBottom: 10, color: "#7a0019", fontSize: 13 }}>⚠️ Red Flags on This Page</p>
        {[
          "The URL was not an official @saintleo.edu domain",
          "No official university email announced this promotion",
          "Urgency and prize tactics are classic phishing hooks",
          "Legitimate portals never request passwords via prize pages",
          "The downloadable file could have been malware",
          "You arrived here via an unverified QR code",
        ].map((flag, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
            <span style={{ color: "#c0392b", fontWeight: 900, flexShrink: 0, fontSize: 13 }}>✕</span>
            <span style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}>{flag}</span>
          </div>
        ))}
      </div>
      <div style={{ ...styles.alertBox, background: "#eafaf1", borderColor: "#74c69d", marginTop: 12 }}>
        <p style={{ fontWeight: 800, marginBottom: 10, color: "#1b4332", fontSize: 13 }}>✅ How to Stay Safe</p>
        {[
          "Always verify the URL before entering any credentials",
          "Never download files from unverified sources",
          "Check official announcements on MySaintLeo portal only",
          "Never enter passwords after scanning an unknown QR code",
          "Report suspicious links to IT Security immediately",
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
            <span style={{ color: "#27ae60", fontWeight: 900, flexShrink: 0, fontSize: 13 }}>✓</span>
            <span style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}>{tip}</span>
          </div>
        ))}
      </div>
      <p style={{ ...styles.fine, marginTop: 20 }}>
        Questions? Contact the research team at <strong>cybersecurity@saintleo.edu</strong>
        &nbsp;·&nbsp; Study approved by the Saint Leo IRB.
      </p>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [stage, setStage] = useState("landing");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState({ student: false, staff: false });

  useEffect(() => { trackEvent("page_loaded"); }, []);

  return (
    <div style={styles.root}>
      <div style={styles.bgDecor1} />
      <div style={styles.bgDecor2} />
      <div style={styles.topBar}>
        <span style={styles.topBarText}>Saint Leo University — Student Portal</span>
        <span style={styles.topBarDot} />
        <span style={{ ...styles.topBarText, color: "#74c69d" }}>🔒 Secure</span>
      </div>
      <div style={styles.wrapper}>
        {stage === "landing"  && <LandingStage  onNext={(e, r) => { setEmail(e); setRoles(r); setStage("password"); }} />}
        {stage === "password" && <PasswordStage email={email} roles={roles} onTriggered={() => setStage("debrief")} />}
        {stage === "debrief"  && <DebriefStage />}
      </div>
      <footer style={styles.footer}>
        © 2026 Saint Leo University &nbsp;·&nbsp; Student Technology Services &nbsp;·&nbsp; MC 2267
      </footer>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0a1a10 0%, #0d2818 40%, #1a3a2a 100%)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "56px 16px 40px", position: "relative",
    fontFamily: "'Georgia', 'Times New Roman', serif", overflow: "hidden",
  },
  bgDecor1: { position: "fixed", top: -150, right: -150, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,106,79,0.18) 0%, transparent 70%)", pointerEvents: "none" },
  bgDecor2: { position: "fixed", bottom: -100, left: -100, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,160,0,0.07) 0%, transparent 70%)", pointerEvents: "none" },
  topBar: { position: "fixed", top: 0, left: 0, right: 0, background: "#060f08", borderBottom: "1px solid #1b4332", padding: "9px 20px", display: "flex", alignItems: "center", gap: 10, zIndex: 100 },
  topBarText: { fontSize: 11, color: "#52b788", fontFamily: "system-ui, sans-serif", letterSpacing: "0.04em" },
  topBarDot: { width: 4, height: 4, borderRadius: "50%", background: "#2d6a4f" },
  wrapper: { width: "100%", maxWidth: 460, position: "relative", zIndex: 1 },
  card: { background: "#ffffff", borderRadius: 18, padding: "36px 32px", boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderTop: "5px solid #2d6a4f" },
  logoRing: { width: 92, height: 92, borderRadius: "50%", border: "3px solid #2d6a4f", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f1", boxShadow: "0 0 0 6px rgba(45,106,79,0.10)", overflow: "hidden" },
  logoText: { fontSize: 11, fontWeight: 800, color: "#1b4332", letterSpacing: "0.12em", fontFamily: "system-ui, sans-serif" },
  divider: { width: "100%", height: 1, background: "linear-gradient(to right, transparent, #b7d4c3, transparent)", margin: "20px 0 6px" },
  prizeTag: { display: "inline-block", background: "#eafaf1", color: "#1b4332", border: "1px solid #b7d4c3", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", fontFamily: "system-ui, sans-serif", marginBottom: 4 },
  heading: { fontSize: 26, fontWeight: 800, color: "#0a1a10", margin: "12px 0 0", lineHeight: 1.25 },
  sub: { fontSize: 14, color: "#4a6355", marginTop: 10, lineHeight: 1.65, fontFamily: "system-ui, sans-serif" },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#1b4332", marginBottom: 6, textAlign: "left", fontFamily: "system-ui, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" },
  input: { width: "100%", padding: "12px 14px", border: "1.5px solid #2d6a4f", borderRadius: 8, fontSize: 14, fontFamily: "system-ui, sans-serif", outline: "none", boxSizing: "border-box", color: "#1a2e20", background: "#fff", transition: "border-color 0.2s" },
  errorMsg: { fontSize: 12, color: "#c0392b", marginTop: 5, textAlign: "left", fontFamily: "system-ui, sans-serif" },
  btn: { marginTop: 18, width: "100%", padding: "13px", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "system-ui, sans-serif", letterSpacing: "0.03em", transition: "background 0.2s", boxShadow: "0 4px 16px rgba(45,106,79,0.4)" },
  fine: { marginTop: 16, fontSize: 11, color: "#8aab96", lineHeight: 1.6, fontFamily: "system-ui, sans-serif" },
  qText: { fontSize: 14, fontWeight: 700, color: "#0a1a10", margin: "0 0 8px 0", textAlign: "left", fontFamily: "system-ui, sans-serif" },
  optionBtn: { display: "flex", alignItems: "center", width: "100%", padding: "10px 14px", border: "1.5px solid #b7d4c3", borderRadius: 8, fontSize: 13, fontFamily: "system-ui, sans-serif", cursor: "pointer", textAlign: "left", transition: "all 0.15s", boxSizing: "border-box" },
  alertBox: { width: "100%", background: "#fff5f5", border: "1.5px solid #f5c6cb", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#333", fontFamily: "system-ui, sans-serif", lineHeight: 1.6, textAlign: "left", boxSizing: "border-box", marginTop: 16 },
  footer: { marginTop: 28, fontSize: 11, color: "#2d6a4f", fontFamily: "system-ui, sans-serif", position: "relative", zIndex: 1, textAlign: "center" },
};
