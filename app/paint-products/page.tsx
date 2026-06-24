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

  const { error } = await supabase.from("paint_products").insert({
    name,
    is_active: true,
  });

  if (error) {
    redirect("/paint-products?error=add");
  }

  revalidatePath("/paint-products");
  redirect("/paint-products?success=add");
}

async function updatePaintProductStatus(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!id) {
    return;
  }

  const { error } = await supabase
    .from("paint_products")
    .update({
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    redirect("/paint-products?error=status");
  }

  revalidatePath("/paint-products");
  redirect("/paint-products?success=status");
}

type PageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function PaintProductsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: products, error } = await supabase
    .from("paint_products")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    return <main className="p-8">エラー：{error.message}</main>;
  }

  const activeProducts = (products ?? []).filter(
    (product) => product.is_active !== false,
  );

  const inactiveProducts = (products ?? []).filter(
    (product) => product.is_active === false,
  );

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

      {params.error === "add" && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">
          追加中にエラーが発生しました。
        </div>
      )}

      {params.error === "status" && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">
          表示状態の変更中にエラーが発生しました。
        </div>
      )}

      {params.success === "add" && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm font-bold text-green-700">
          塗料を追加しました。
        </div>
      )}

      {params.success === "status" && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm font-bold text-green-700">
          表示状態を変更しました。
        </div>
      )}

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

      <section className="mb-6 rounded-lg border bg-white">
        <div className="border-b bg-gray-100 p-3 font-bold">
          表示中の塗料
        </div>

        {activeProducts.length > 0 ? (
          <div className="divide-y">
            {activeProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <div className="font-medium">{product.name}</div>

                <form action={updatePaintProductStatus}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="is_active" value="false" />

                  <button
                    type="submit"
                    className="rounded bg-orange-600 px-3 py-1.5 text-sm text-white"
                  >
                    非表示
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-500">
            表示中の塗料はありません。
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-white">
        <div className="border-b bg-gray-100 p-3 font-bold">
          非表示の塗料
        </div>

        {inactiveProducts.length > 0 ? (
          <div className="divide-y">
            {inactiveProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 bg-gray-50 p-3"
              >
                <div>
                  <div className="font-medium text-gray-500">{product.name}</div>
                  <div className="text-xs text-gray-400">
                    新規在庫登録の候補には表示しない塗料です
                  </div>
                </div>

                <form action={updatePaintProductStatus}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="is_active" value="true" />

                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white"
                  >
                    再表示
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-500">
            非表示の塗料はありません。
          </div>
        )}
      </section>
    </main>
  );
}