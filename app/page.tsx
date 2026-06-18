import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center">
        <div className="w-full rounded-2xl bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-2xl font-bold text-gray-900">
            メニュー
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            使用する機能を選択してください。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/projects"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-bold text-gray-900">
                工事進捗管理
              </p>
              <p className="mt-2 text-sm text-gray-600">
                工事一覧・工程管理・進捗確認を行います。
              </p>
            </Link>

            <Link
              href="/site-assignments/new"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-bold text-gray-900">
                現場担当入力
              </p>
              <p className="mt-2 text-sm text-gray-600">
                日ごとに、どの現場に誰が入ったかを記録します。
              </p>
            </Link>
            <Link
              href="/paint-inventory"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-bold text-gray-900">
                在庫管理
              </p>
              <p className="mt-2 text-sm text-gray-600">
                塗料の在庫登録・残量確認を行います。
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}