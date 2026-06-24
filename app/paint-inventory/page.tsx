import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import DeleteInventoryButton from "./DeleteInventoryButton";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    error?: string;
    stock?: string;
  }>;
};

async function deleteInventory(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const inventoryId = String(formData.get("inventory_id") ?? "");

  if (!inventoryId) return;

  const { data: usageLogs, error: usageError } = await supabase
    .from("paint_usage_logs")
    .select("id")
    .eq("paint_inventory_id", inventoryId)
    .limit(1);

  if (usageError) {
    throw new Error(usageError.message);
  }

  if (usageLogs && usageLogs.length > 0) {
    redirect(
      "/paint-inventory?error=使用履歴がある在庫は削除できません。先に使用履歴を削除してください。"
    );
  }

  const { error } = await supabase
    .from("paint_inventory")
    .delete()
    .eq("id", inventoryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/paint-inventory");
  redirect("/paint-inventory");
}

export default async function PaintInventoryPage({ searchParams }: PageProps) {
  const {
    q = "",
    error: errorMessage = "",
    stock = "available",
  } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: inventory, error } = await supabase
    .from("paint_inventory")
    .select(`
      *,
      paint_products (
        name
      )
    `);

  if (error) {
    return <main className="p-8">エラー：{error.message}</main>;
  }

  const sortedInventory =
    inventory?.sort((a, b) => {
      const aEmpty = a.remaining_amount === 0;
      const bEmpty = b.remaining_amount === 0;

      if (aEmpty !== bEmpty) {
        return aEmpty ? 1 : -1;
      }

      return String(a.can_number).localeCompare(String(b.can_number), "ja", {
        numeric: true,
      });
    }) ?? [];

  const keyword = q.trim().toLowerCase();

  const filteredInventory = sortedInventory.filter((item) => {
    const paintName = String((item.paint_products as any)?.name ?? "");
    const canNumber = String(item.can_number ?? "");
    const colorName = String(item.color_name ?? "");

    if (!keyword) return true;

    return (
      paintName.toLowerCase().includes(keyword) ||
      canNumber.toLowerCase().includes(keyword) ||
      colorName.toLowerCase().includes(keyword)
    );
  });

  const availableInventory = filteredInventory.filter(
    (item) => item.remaining_amount !== 0
  );

  const outOfStockInventory = filteredInventory.filter(
    (item) => item.remaining_amount === 0
  );

  const tabFilteredInventory =
    stock === "out"
      ? outOfStockInventory
      : stock === "all"
        ? filteredInventory
        : availableInventory;

  const makeTabHref = (stockValue: string) => {
    const params = new URLSearchParams();

    params.set("stock", stockValue);

    if (q.trim()) {
      params.set("q", q.trim());
    }

    return `/paint-inventory?${params.toString()}`;
  };

  return (
    <main className="p-4 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">在庫管理</h1>
          <p className="text-sm text-gray-500">
            塗料の在庫状況を確認できます
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/paint-inventory/new"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            在庫登録
          </Link>

          <Link
            href="/paint-products"
            className="rounded bg-green-600 px-4 py-2 text-white"
          >
            塗料マスタ管理
          </Link>

          <Link href="/" className="rounded bg-gray-200 px-4 py-2">
            戻る
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <form className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="stock" value={stock} />

        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="No・塗料名・色名で検索"
          className="w-full rounded border bg-white px-3 py-2"
        />

        <button
          type="submit"
          className="rounded bg-gray-800 px-4 py-2 font-bold text-white"
        >
          検索
        </button>

        <Link
          href="/paint-inventory"
          className="rounded bg-gray-200 px-4 py-2 text-center font-bold"
        >
          クリア
        </Link>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={makeTabHref("available")}
          className={`rounded px-4 py-2 font-bold ${
            stock === "available"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          在庫あり（{availableInventory.length}）
        </Link>

        <Link
          href={makeTabHref("out")}
          className={`rounded px-4 py-2 font-bold ${
            stock === "out"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          在庫切れ（{outOfStockInventory.length}）
        </Link>

        <Link
          href={makeTabHref("all")}
          className={`rounded px-4 py-2 font-bold ${
            stock === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          全て（{filteredInventory.length}）
        </Link>
      </div>

      <div className="mb-3 text-sm text-gray-600">
        表示件数：{tabFilteredInventory.length}件
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">No.</th>
              <th className="p-3 text-left">塗料名</th>
              <th className="p-3 text-left">色</th>
              <th className="p-3 text-left">残量</th>
              <th className="p-3 text-left">入荷日</th>
              <th className="p-3 text-left">操作</th>
            </tr>
          </thead>

          <tbody>
            {tabFilteredInventory.map((item) => {
              const inventoryName = `No.${item.can_number} ${
                (item.paint_products as any)?.name ?? ""
              }`;

              return (
                <tr key={item.id} className="border-t">
                  <td className="p-3 font-bold">{item.can_number}</td>

                  <td className="p-3">{(item.paint_products as any)?.name}</td>

                  <td className="p-3">{item.color_name}</td>

                  <td className="p-3">
                    {item.remaining_amount === 0 ? (
                      <span className="rounded bg-red-100 px-2 py-1 text-sm font-bold text-red-700">
                        在庫切れ
                      </span>
                    ) : item.remaining_amount === null ? (
                      <span className="rounded bg-yellow-100 px-2 py-1 text-sm font-bold text-yellow-700">
                        残量未確認
                      </span>
                    ) : (
                      <span>{item.remaining_amount}kg</span>
                    )}
                  </td>

                  <td className="p-3">{item.received_date}</td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/paint-inventory/${item.id}/edit`}
                        className="rounded bg-gray-700 px-3 py-1.5 text-sm font-bold text-white"
                      >
                        編集
                      </Link>

                      <Link
                        href={`/paint-inventory/${item.id}`}
                        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-bold text-white"
                      >
                        履歴
                      </Link>

                      <form action={deleteInventory}>
                        <input
                          type="hidden"
                          name="inventory_id"
                          value={item.id}
                        />

                        <DeleteInventoryButton inventoryName={inventoryName} />
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}

            {tabFilteredInventory.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  該当する在庫はありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}