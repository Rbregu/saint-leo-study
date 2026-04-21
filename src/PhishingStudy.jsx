import React from "react";

export default function NoticePage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f3f4f6",
      fontFamily: "Arial, sans-serif",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "700px",
        background: "white",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
      }}>
        
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
          Official Notice
        </div>

        <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
          Research Notice
        </h1>

        <p style={{ marginBottom: "15px", lineHeight: "1.6" }}>
          This flyer was built with the purpose of a research paper testing how
          vulnerable students, staff, and faculty were to QR code phishing
          (also known as “quishing”).
        </p>

        <p style={{ marginBottom: "15px", lineHeight: "1.6" }}>
          The experimental period is now over. The paper will be published soon.
        </p>

        <p style={{ marginBottom: "25px" }}>Thank you.</p>

        <div style={{ fontSize: "13px", color: "#777", borderTop: "1px solid #eee", paddingTop: "15px" }}>
          P.S. You can remove that poster.
        </div>

      </div>
    </div>
  );
}
