"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-gray-700 px-4 py-2 text-sm font-semibold text-white"
    >
      印刷
    </button>
  );
}