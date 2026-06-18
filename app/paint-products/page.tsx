import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function addPaintProduct(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return;
  }

  const { error } = await supabase
    .from("paint_products")
    .insert({
      name,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/paint-products");
}

async function deletePaintProduct(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const { error } = await supabase
    .from("paint_products")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/paint-products");
}

export default async function PaintProductsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: products, error } = await supabase
    .from("paint_products")
    .select("*")
    .order("name");

  if (error) {
    return <main className="p-8">エラー：{error.message}</main>;
  }

  return (
    <main className="p-4 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">塗料マスタ管理</h1>
          <p className="text-sm text-gray-500">
            在庫登録で選択する塗料名を管理します
          </p>
        </div>

        <Link
          href="/paint-inventory"
          className="w-fit rounded bg-gray-200 px-4 py-2"
        >
          在庫管理に戻る
        </Link>
      </div>

      <section className="mb-6 rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-bold">塗料を追加</h2>

        <form action={addPaintProduct} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="name"
            placeholder="例：ファインパーフェクトトップ"
            className="w-full rounded border px-3 py-2"
            required
          />

          <button
            type="submit"
            className="rounded bg-blue-600 px-5 py-2 text-white"
          >
            追加
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-white">
        <div className="border-b bg-gray-100 p-3 font-bold">
          登録済み塗料
        </div>

        {products && products.length > 0 ? (
          <div className="divide-y">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <div className="font-medium">{product.name}</div>

                <form action={deletePaintProduct}>
                  <input type="hidden" name="id" value={product.id} />

                  <button
                    type="submit"
                    className="rounded bg-red-600 px-3 py-1.5 text-sm text-white"
                  >
                    削除
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-500">
            まだ塗料が登録されていません。
          </div>
        )}
      </section>
    </main>
  );
}