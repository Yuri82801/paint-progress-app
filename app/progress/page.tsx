import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintButton from "./PrintButton";

type ProgressItem = {
  id: string;
  category: string;
  section_name: string | null;
  task_name: string;
  status: string | null;
  completed_date: string | null;
  completed_by: string | null;
  sort_order: number | null;
};

type SiteAssignment = {
  work_amount: number;
};

type Project = {
  id: string;
  name: string;
  customer_name: string | null;
  address: string | null;
  manager: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  progress_items: ProgressItem[];
  site_assignments: SiteAssignment[];
};

function getGroupName(item: ProgressItem) {
  return item.section_name
    ? `${item.category} ${item.section_name}`
    : item.category;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "未入力";

  return new Date(`${date}T00:00:00`).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

function getLatestCompletedByGroup(items: ProgressItem[]) {
  const groups = new Map<string, ProgressItem>();

  items
    .filter(
      (item) =>
        (item.status === "完了" || item.status === "対象外") &&
        item.completed_date
    )
    .sort((a, b) =>
      (b.completed_date ?? "").localeCompare(a.completed_date ?? "")
    )
    .forEach((item) => {
      const groupName = getGroupName(item);
      if (!groups.has(groupName)) groups.set(groupName, item);
    });

  return Array.from(groups.values());
}

function getActiveByGroup(items: ProgressItem[]) {
  const groups = new Map<string, ProgressItem>();

  items
    .filter((item) => item.status === "作業中")
    .sort((a, b) => {
      const categoryCompare = a.category.localeCompare(b.category);
      if (categoryCompare !== 0) return categoryCompare;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .forEach((item) => {
      const groupName = getGroupName(item);
      if (!groups.has(groupName)) groups.set(groupName, item);
    });

  return Array.from(groups.values());
}

function getNextItemsByGroup(items: ProgressItem[]) {
  const groups = new Map<string, ProgressItem>();

  items
    .filter(
      (item) =>
        item.status !== "完了" &&
        item.status !== "対象外" &&
        item.status !== "作業中"
    )
    .sort((a, b) => {
      const categoryCompare = a.category.localeCompare(b.category);
      if (categoryCompare !== 0) return categoryCompare;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .forEach((item) => {
      const groupName = getGroupName(item);
      if (!groups.has(groupName)) groups.set(groupName, item);
    });

  return Array.from(groups.values());
}

function getFirstCompletedDate(items: ProgressItem[]) {
  return items
    .filter((item) => item.completed_date)
    .sort((a, b) =>
      (a.completed_date ?? "").localeCompare(b.completed_date ?? "")
    )[0]?.completed_date;
}

function getElapsedDaysFrom(date: string | null | undefined) {
  if (!date) return null;

  const startDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return Math.max(
    1,
    Math.floor(
      (todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );
}

function getDelayedDays(endDate: string | null | undefined) {
  if (!endDate) return null;

  const end = new Date(`${endDate}T00:00:00`);
  const today = new Date();
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const diff = Math.floor(
    (todayDate.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)
  );

  return diff > 0 ? diff : null;
}

function WorkList({
  items,
  emptyText,
  showDate = false,
}: {
  items: ProgressItem[];
  emptyText: string;
  showDate?: boolean;
}) {
  if (items.length === 0) {
    return <p className="font-medium text-gray-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <p key={item.id} className="font-medium leading-relaxed">
          {showDate && item.completed_date ? (
            <span className="mr-1 text-gray-500">
              {formatDate(item.completed_date)}
            </span>
          ) : null}
          {getGroupName(item)}：{item.task_name}
          {item.completed_by ? (
            <span className="text-gray-500"> / {item.completed_by}</span>
          ) : null}
        </p>
      ))}
    </div>
  );
}

export default async function ProgressPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      customer_name,
      address,
      manager,
      status,
      start_date,
      end_date,
      progress_items (
        id,
        category,
        section_name,
        task_name,
        status,
        completed_date,
        completed_by,
        sort_order
      ),
      site_assignments (
        work_amount
      )
    `)
    .eq("status", "作業中")
    .order("start_date", { ascending: true, nullsFirst: false });

  if (error) {
    return <main className="p-8">エラー：{error.message}</main>;
  }

  const projectList = ((projects as Project[]) ?? []).sort((a, b) => {
    const aFirstCompletedDate = getFirstCompletedDate(a.progress_items ?? []);
    const bFirstCompletedDate = getFirstCompletedDate(b.progress_items ?? []);

    if (!aFirstCompletedDate && !bFirstCompletedDate) return 0;
    if (!aFirstCompletedDate) return 1;
    if (!bFirstCompletedDate) return -1;

    return aFirstCompletedDate.localeCompare(bFirstCompletedDate);
  });

  const outputDate = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <main className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
      <div className="mx-auto max-w-6xl print:max-w-none">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-bold">進捗一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              現在動いている現場の進み具合を確認できます。
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <PrintButton />

            <Link
              href="/projects"
              className="rounded bg-gray-700 px-4 py-2 text-center font-medium text-white hover:bg-gray-800"
            >
              工事一覧に戻る
            </Link>
          </div>
        </div>

        <div className="hidden print:mb-5 print:block">
          <div className="border-b-4 border-black pb-3">
            <h1 className="text-3xl font-bold">工事進捗確認表</h1>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-sm">出力日：{outputDate}</p>
              <p className="text-sm font-bold">
                作業中現場：{projectList.length}件
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 print:space-y-3">
          {projectList.length === 0 && (
            <div className="rounded-xl border bg-white p-6 text-gray-500 print:border-2 print:border-black">
              現在動いている現場はありません。
            </div>
          )}

          {projectList.map((project, index) => {
            const items = [...(project.progress_items ?? [])].sort((a, b) => {
              const categoryCompare = a.category.localeCompare(b.category);
              if (categoryCompare !== 0) return categoryCompare;
              return (a.sort_order ?? 0) - (b.sort_order ?? 0);
            });

            const totalManDays = (project.site_assignments ?? []).reduce(
              (sum, assignment) => sum + Number(assignment.work_amount),
              0
            );

            const total = items.length;

            const completedItems = items.filter(
              (item) => item.status === "完了" || item.status === "対象外"
            );

            const completed = completedItems.length;

            const progress =
              total === 0 ? 0 : Math.round((completed / total) * 100);

            const latestCompletedItems = getLatestCompletedByGroup(items);
            const activeItems = getActiveByGroup(items);
            const nextItems = getNextItemsByGroup(items);

            const remainingCount = items.filter(
              (item) => item.status !== "完了" && item.status !== "対象外"
            ).length;

            const firstCompletedDate = getFirstCompletedDate(items);
            const elapsedDays = getElapsedDaysFrom(firstCompletedDate);
            const delayedDays = getDelayedDays(project.end_date);

            return (
              <section
                key={project.id}
                className="break-inside-avoid rounded-2xl border bg-white p-5 shadow-sm print:rounded-xl print:border-2 print:border-black print:p-4 print:shadow-none"
              >
                <div className="mb-4 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between print:mb-3 print:gap-2 print:pb-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white print:h-7 print:w-7 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                        {index + 1}
                      </span>

                      <Link
                        href={`/projects/${project.id}`}
                        className="text-2xl font-bold hover:underline print:text-xl print:no-underline"
                      >
                        {project.name}
                      </Link>
                    </div>

                    <p className="text-sm text-gray-600 print:text-xs">
                      顧客：{project.customer_name ?? "未入力"}
                      {project.manager ? `　/　担当：${project.manager}` : ""}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-gray-600">
                      累計人工：
                      <span className="ml-1 text-3xl font-bold text-red-600 print:text-2xl">
                        {totalManDays}
                      </span>
                      <span className="ml-0.5 text-xs text-red-600">人工</span>
                    </p>

                    <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 print:border print:border-gray-400">
                      <p className="text-base font-medium text-gray-700 print:text-sm">
                        📍 {project.address ?? "未入力"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-stretch gap-2 print:gap-1">
                    <div className="rounded-xl bg-green-50 px-4 py-2 text-center print:border print:border-black [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                      <div className="text-xs font-medium text-gray-500">
                        進捗率
                      </div>
                      <div className="text-3xl font-bold text-green-700 print:text-2xl">
                        {progress}%
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 px-4 py-2 text-center print:border print:border-black [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                      <div className="text-xs font-medium text-gray-500">
                        残り
                      </div>
                      <div className="text-3xl font-bold print:text-2xl">
                        {remainingCount}
                        <span className="ml-1 text-base">工程</span>
                      </div>
                    </div>

                    {elapsedDays !== null && (
                      <div className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-2 text-center [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                        <div className="text-xs font-bold text-red-700">
                          実作業開始から
                        </div>
                        <div className="font-bold text-red-600">
                          <span className="text-4xl print:text-3xl">
                            {elapsedDays}
                          </span>
                          <span className="ml-1 text-lg">日</span>
                        </div>
                      </div>
                    )}

                    {delayedDays !== null && (
                      <div className="rounded-xl border-2 border-red-600 bg-red-100 px-4 py-2 text-center [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                        <div className="text-xs font-bold text-red-700">
                          遅延
                        </div>
                        <div className="font-bold text-red-700">
                          <span className="text-4xl print:text-3xl">
                            {delayedDays}
                          </span>
                          <span className="ml-1 text-lg">日</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4 print:mb-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-gray-600">
                      完了 {completed} / 全{total}工程
                    </span>
                    <span className="font-bold">
                      完工予定：{formatDate(project.end_date)}
                    </span>
                  </div>

                  <div className="h-4 overflow-hidden rounded-full bg-gray-200 print:h-3 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                    <div
                      className="h-full rounded-full bg-green-500 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 text-sm md:grid-cols-3 print:grid-cols-3 print:gap-2 print:text-xs">
                  <div className="rounded-xl border bg-gray-50 p-3 print:rounded-lg [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                    <p className="mb-2 border-b pb-1 text-base font-bold text-gray-700 print:text-sm">
                      最新完了
                    </p>
                    <WorkList
                      items={latestCompletedItems}
                      emptyText="まだ完了作業なし"
                      showDate
                    />
                  </div>

                  <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 print:rounded-lg [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                    <p className="mb-2 border-b pb-1 text-base font-bold text-yellow-800 print:text-sm">
                      作業中
                    </p>
                    <WorkList items={activeItems} emptyText="作業中の工程なし" />
                  </div>

                  <div className="rounded-xl border bg-gray-50 p-3 print:rounded-lg [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                    <p className="mb-2 border-b pb-1 text-base font-bold text-gray-700 print:text-sm">
                      次の作業
                    </p>
                    <WorkList items={nextItems} emptyText="なし" />
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}