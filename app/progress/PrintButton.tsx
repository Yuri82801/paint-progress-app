"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
    >
      印刷する
    </button>
  );
}