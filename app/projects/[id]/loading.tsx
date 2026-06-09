export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            工事詳細を読み込み中...
          </p>
          <div className="mt-4 h-7 w-2/3 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="h-6 w-1/3 rounded bg-gray-200" />
          <div className="mt-4 space-y-3">
            <div className="h-12 rounded bg-gray-200" />
            <div className="h-12 rounded bg-gray-200" />
            <div className="h-12 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </main>
  );
}