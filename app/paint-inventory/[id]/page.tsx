import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PaintInventoryDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [inventoryResult, usageLogsResult] = await Promise.all([
    supabase
      .from("paint_inventory")
      .select(`
        id,
        can_number,
        color_name,
        remaining_amount,
        received_date,
        paint_products (
          name
        )
      `)
      .eq("id", id)
      .single(),

    supabase
      .from("paint_usage_logs")
      .select(`
        id,
        used_amount,
        used_all,
        used_date,
        projects (
          name,
          customer_name
        )
      `)
      .eq("paint_inventory_id", id)
      .order("used_date", { ascending: false }),
  ]);

  const { data: inventory, error: inventoryError } = inventoryResult;
  const { data: usageLogs, error: usageLogsError } = usageLogsResult;

  if (inventoryError || usageLogsError || !inventory) {
    return (
      <main className="p-8">
        エラー：{inventoryError?.message || usageLogsError?.message}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <Link
        href="/paint-inventory"
        className="inline-block rounded bg-gray-700 px-4 py-2 font-medium text-white"
      >
        ← 在庫一覧に戻る
      </Link>

      <div className="mt-4 mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <h1 className="mb-3 text-3xl font-bold">
          No.{inventory.can_number}
        </h1>

        <div className="space-y-1 text-gray-700">
          <p>
            塗料名：
            <span className="font-bold">
              {(inventory.paint_products as any)?.name || "未入力"}
            </span>
          </p>
          <p>色名：{inventory.color_name || "未入力"}</p>
          <p>
            残量：
            {Number(inventory.remaining_amount) <= 0 ? (
              <span className="ml-1 rounded bg-red-100 px-2 py-1 text-sm font-bold text-red-700">
                在庫切れ
              </span>
            ) : (
              <span className="font-bold text-blue-700">
                {inventory.remaining_amount}kg
              </span>
            )}
          </p>
          <p>入荷日：{inventory.received_date || "未入力"}</p>
        </div>
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">この在庫の使用履歴</h2>

        {usageLogs && usageLogs.length > 0 ? (
          <div className="space-y-3">
            {usageLogs.map((log: any) => (
              <div
                key={log.id}
                className="rounded border border-gray-200 p-3 text-sm"
              >
                <p className="font-bold">
                  {Number(log.used_date.slice(5, 7))}月
                  {Number(log.used_date.slice(8, 10))}日
                </p>

                <p>
                  工事：
                  <span className="font-semibold">
                    {log.projects?.name || "不明な工事"}
                  </span>
                </p>

                <p>顧客名：{log.projects?.customer_name || "未入力"}</p>

                <p className="font-semibold text-blue-700">
                  {log.used_all ? "使い切り" : `${log.used_amount}kg使用`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            この在庫はまだ使用されていません。
          </p>
        )}
      </section>
    </main>
  );
}