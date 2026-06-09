import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectsList from "./projects/ProjectsList";
import LogoutButton from "./LogoutButton";

type ProgressItem = {
  id: string;
  status: string | null;
};

type Project = {
  id: string;
  name: string;
  customer_name: string | null;
  address: string | null;
  manager: string | null;
  status: string | null;
  progress_items: ProgressItem[];
};

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      customer_name,
      address,
      manager,
      status,
      progress_items (
        id,
        status
      )
    `)
    .order("start_date", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const projectList = (projects as Project[]) ?? [];

  const beforeCount = projectList.filter(
    (project) =>
      project.status === "未着手" || project.status === "着工待ち"
  ).length;

  const workingCount = projectList.filter(
    (project) => project.status === "作業中"
  ).length;

  const completedCount = projectList.filter(
    (project) => project.status === "完了"
  ).length;

  return (
    <main className="p-4">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-end gap-3">
          <h1 className="text-3xl font-bold">工事一覧</h1>
          <span className="pb-1 text-sm text-gray-500">
            株式会社幸和塗装
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/progress"
            className="rounded bg-green-600 px-4 py-2 text-center text-white"
          >
            進捗一覧
          </Link>

          {isAdmin && (
            <Link
              href="/settings"
              className="rounded bg-gray-700 px-4 py-2 text-center text-white"
            >
              設定
            </Link>
          )}

          <Link
            href="/projects/new"
            className="rounded bg-blue-600 px-4 py-2 text-center text-white"
          >
            新規工事登録
          </Link>

          <LogoutButton />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">施工前</p>
          <p className="text-2xl font-bold">{beforeCount}件</p>
        </div>

        <div className="rounded border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">施工中</p>
          <p className="text-2xl font-bold">{workingCount}件</p>
        </div>

        <div className="rounded border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">完了済み</p>
          <p className="text-2xl font-bold">{completedCount}件</p>
        </div>
      </div>

      <ProjectsList projects={projectList} />
    </main>
  );
}