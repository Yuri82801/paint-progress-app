import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updateInventory(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const canNumber = String(formData.get("can_number") ?? "").trim();
  const paintProductId = String(formData.get("paint_product_id") ?? "");
  const colorName = String(formData.get("color_name") ?? "").trim();
  const remainingAmountText = String(
    formData.get("remaining_amount") ?? ""
  ).trim();
  const receivedDate = String(formData.get("received_date") ?? "");

  if (!id || !canNumber || !paintProductId) {
    return;
  }

  const remainingAmount =
    remainingAmountText === "" ? null : Number(remainingAmountText);

  if (remainingAmountText !== "" && Number.isNaN(remainingAmount)) {
    return;
  }

  const { error } = await supabase
    .from("paint_inventory")
    .update({
      can_number: canNumber,
      paint_product_id: paintProductId,
      color_name: colorName || null,
      remaining_amount: remainingAmount,
      received_date: receivedDate || null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/paint-inventory");
  redirect("/paint-inventory");
}

export default async function EditPaintInventoryPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [inventoryResult, productsResult] = await Promise.all([
    supabase.from("paint_inventory").select("*").eq("id", id).single(),

    supabase
      .from("paint_products")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true }),
  ]);

  const { data: inventory, error: inventoryError } = inventoryResult;
  const { data: products, error: productsError } = productsResult;

  if (inventoryError || productsError || !inventory) {
    return (
      <main className="p-8">
        エラー：{inventoryError?.message || productsError?.message}
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8">
      <Link href="/paint-inventory" className="text-blue-600 underline">
        ← 在庫一覧へ戻る
      </Link>

      <h1 className="mt-4 mb-6 text-3xl font-bold">在庫編集</h1>

      <form
        action={updateInventory}
        className="max-w-xl space-y-4 rounded-lg border bg-white p-4 shadow-sm"
      >
        <input type="hidden" name="id" value={inventory.id} />

        <div>
          <label className="mb-1 block text-sm font-bold">ナンバー</label>
          <input
            name="can_number"
            defaultValue={inventory.can_number}
            className="w-full rounded border p-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold">塗料名</label>
          <select
            name="paint_product_id"
            defaultValue={inventory.paint_product_id}
            className="w-full rounded border p-2"
            required
          >
            <option value="">塗料名を選択</option>
            {products?.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            非表示にした塗料は候補に表示されません。
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold">色名</label>
          <input
            name="color_name"
            defaultValue={inventory.color_name ?? ""}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold">残量（kg）</label>
          <input
            type="number"
            step="0.1"
            name="remaining_amount"
            defaultValue={inventory.remaining_amount ?? ""}
            placeholder="空欄にすると残量未確認"
            className="w-full rounded border p-2"
          />
          <p className="mt-1 text-xs text-gray-500">
            残量が分からない場合は空欄のまま保存できます。
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold">入荷日</label>
          <input
            type="date"
            name="received_date"
            defaultValue={inventory.received_date ?? ""}
            className="w-full rounded border p-2"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-bold text-white"
        >
          保存
        </button>
      </form>
    </main>
  );
}