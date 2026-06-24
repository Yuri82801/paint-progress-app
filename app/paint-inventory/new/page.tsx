import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PaintInventoryForm from "./PaintInventoryForm";

type InventoryRow = {
  can_number: string;
  paint_product_id: string;
  other_paint_name: string;
  color_name: string;
  remaining_amount: string;
  received_date: string;
};

async function createInventory(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const rowsText = String(formData.get("rows") ?? "[]");
  const rows = JSON.parse(rowsText) as InventoryRow[];

  const validRows = rows.filter(
    (row) => row.can_number.trim() && row.paint_product_id.trim()
  );

  if (validRows.length === 0) {
    redirect("/paint-inventory/new");
  }

  for (const row of validRows) {
    let paintProductId = row.paint_product_id;

    if (row.paint_product_id === "__other__") {
      const otherPaintName = row.other_paint_name.trim();

      if (!otherPaintName) {
        continue;
      }

      const { data: existingProduct } = await supabase
        .from("paint_products")
        .select("id")
        .eq("name", otherPaintName)
        .maybeSingle();

      if (existingProduct) {
        paintProductId = existingProduct.id;
      } else {
        const { data: newProduct, error: productError } = await supabase
          .from("paint_products")
          .insert({
            name: otherPaintName,
            is_active: true,
          })
          .select("id")
          .single();

        if (productError) {
          throw new Error(productError.message);
        }

        paintProductId = newProduct.id;
      }
    }

    const remainingAmount =
      row.remaining_amount.trim() === ""
        ? null
        : Number(row.remaining_amount);

    const { error } = await supabase.from("paint_inventory").insert({
      can_number: row.can_number.trim(),
      paint_product_id: paintProductId,
      color_name: row.color_name.trim() || null,
      remaining_amount: remainingAmount,
      received_date: row.received_date || null,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  redirect("/paint-inventory");
}

export default async function NewPaintInventoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: paintProducts, error } = await supabase
    .from("paint_products")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return <main className="p-8">エラー：{error.message}</main>;
  }

  return (
    <main className="p-4 sm:p-8">
      <Link href="/paint-inventory" className="text-blue-600 underline">
        ← 在庫一覧へ戻る
      </Link>

      <h1 className="mt-4 mb-6 text-3xl font-bold">在庫登録</h1>

      <PaintInventoryForm
        createInventory={createInventory}
        paintProducts={paintProducts ?? []}
      />
    </main>
  );
}