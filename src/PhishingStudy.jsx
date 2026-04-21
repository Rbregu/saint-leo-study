import React from "react";

export default function NoticePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 p-10">
        
        <div className="mb-6">
          <span className="text-xs uppercase tracking-wider text-gray-500">
            Official Notice
          </span>
          <h1 className="text-3xl font-semibold text-gray-900 mt-2">
            Research Notice
          </h1>
        </div>

        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            This flyer was built with the purpose of a research paper testing how
            vulnerable students, staff, and faculty were to QR code phishing
            (also known as “quishing”).
          </p>

          <p>
            The experimental period is now over. The paper will be published soon.
          </p>

          <p>Thank you.</p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
          P.S. You can remove that poster.
        </div>
      </div>
    </div>
  );
}
