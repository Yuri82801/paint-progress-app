import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteAssignmentForm from "./SiteAssignmentForm";

type Project = {
  id: string;
  name: string;
  customer_name: string | null;
  address: string | null;
  status: string | null;
};

type Worker = {
  id: string;
  name: string;
};

async function saveSiteAssignments(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const assignmentsText = String(formData.get("assignments") ?? "[]");

  const assignments = JSON.parse(assignmentsText) as {
    work_date: string;
    project_id: string;
    worker_id: string;
    work_amount: number;
  }[];

  const rows = assignments.filter(
    (item) =>
      item.work_date &&
      item.project_id &&
      item.worker_id &&
      (item.work_amount === 1 || item.work_amount === 0.5)
  );

  if (rows.length === 0) {
    redirect("/site-assignments/new");
  }

  const { error } = await supabase.from("site_assignments").insert(rows);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/");
}

export default async function NewSiteAssignmentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, customer_name, address, status")
    .in("status", [
      "施工前",
      "施工中",
      "未着手",
      "着工待ち",
      "作業中",
    ])
    .order("created_at", { ascending: false });

  const { data: workers, error: workersError } = await supabase
    .from("workers")
    .select("id, name")
    .order("name", { ascending: true });

  if (projectsError || workersError) {
    return (
      <main className="p-8">
        エラー：{projectsError?.message || workersError?.message}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              現場担当入力
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              日ごとに、どの現場に誰が入ったかを記録します。
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/site-assignments"
              className="rounded bg-gray-700 px-4 py-2 text-sm font-semibold text-white"
            >
              現場担当一覧
            </Link>

            <Link
              href="/"
              className="rounded bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800"
            >
              戻る
            </Link>
          </div>
        </div>

        <SiteAssignmentForm
          projects={(projects as Project[]) ?? []}
          workers={(workers as Worker[]) ?? []}
          saveSiteAssignments={saveSiteAssignments}
        />
      </div>
    </main>
  );
}