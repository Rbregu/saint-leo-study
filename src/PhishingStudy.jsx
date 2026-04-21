import React from "react";

export default function NoticePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-10 max-w-xl text-center">
        <h1 className="text-2xl font-semibold mb-6">
          Research Notice
        </h1>

        <p className="text-gray-700 mb-4">
          This flyer was built with the purpose of a research paper testing how
          vulnerable students, staff, and faculty were to QR code phishing
          (also known as “quishing”).
        </p>

        <p className="text-gray-700 mb-4">
          The experimental period is now over. The paper will be published soon.
        </p>

        <p className="text-gray-700 mb-6">
          Thank you.
        </p>

        <p className="text-sm text-gray-500">
          P.S. You can remove that poster.
        </p>
      </div>
    </div>
  );
}
