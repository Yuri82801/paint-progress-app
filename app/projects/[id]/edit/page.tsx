import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updateProject(projectId: string, formData: FormData) {
  "use server";

  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({
      name: formData.get("name"),
      customer_name: formData.get("customer_name"),
      phone_number: formData.get("phone_number") || null,
      address: formData.get("address"),
      parking_count: formData.get("parking_count")
        ? Number(formData.get("parking_count"))
        : null,
      manager: formData.get("manager"),
      start_date: formData.get("start_date") || null,
      end_date: formData.get("end_date") || null,
      memo: formData.get("memo"),
      status: formData.get("status"),
    })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/projects/${projectId}`);
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return <main className="p-8">エラー：{error.message}</main>;
  }

  return (
    <main className="p-4 sm:p-8">
      <Link href={`/projects/${id}`} className="text-blue-600 underline">
        ← 工事詳細に戻る
      </Link>

      <h1 className="mt-4 mb-6 text-3xl font-bold">工事情報編集</h1>

      <form action={updateProject.bind(null, id)} className="max-w-xl space-y-4">
        <div>
          <label className="mb-1 block font-bold">工事名</label>
          <input
            name="name"
            defaultValue={project.name ?? ""}
            className="w-full rounded border p-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block font-bold">顧客名</label>
          <input
            name="customer_name"
            defaultValue={project.customer_name ?? ""}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold">電話番号</label>
          <input
            name="phone_number"
            defaultValue={project.phone_number ?? ""}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold">住所</label>
          <input
            name="address"
            defaultValue={project.address ?? ""}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold">駐車可能台数</label>
          <input
            type="number"
            min="0"
            name="parking_count"
            defaultValue={project.parking_count ?? ""}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold">担当者</label>
          <input
            name="manager"
            defaultValue={project.manager ?? ""}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold">ステータス</label>
          <select
            name="status"
            defaultValue={project.status ?? "未着手"}
            className="w-full rounded border p-2"
          >
            <option value="未着手">未着手</option>
            <option value="着工待ち">着工待ち</option>
            <option value="作業中">作業中</option>
            <option value="完了">完了</option>
            <option value="対象外">対象外</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-bold">着工予定日</label>
            <input
              type="date"
              name="start_date"
              defaultValue={project.start_date ?? ""}
              className="w-full rounded border p-2"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold">完工予定日</label>
            <input
              type="date"
              name="end_date"
              defaultValue={project.end_date ?? ""}
              className="w-full rounded border p-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-bold">メモ</label>
          <textarea
            name="memo"
            defaultValue={project.memo ?? ""}
            className="w-full rounded border p-2"
            rows={4}
          />
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          保存する
        </button>
      </form>
    </main>
  );
}