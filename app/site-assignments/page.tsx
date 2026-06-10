import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintButton from "./PrintButton";
import { revalidatePath } from "next/cache";
import DeleteAssignmentButton from "./DeleteAssignmentButton";

async function deleteSiteAssignment(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const assignmentId = String(formData.get("assignment_id") ?? "");

  if (!assignmentId) return;

  const { error } = await supabase
    .from("site_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/site-assignments");
}

type PageProps = {
  searchParams: Promise<{
    start?: string;
  }>;
};

type Assignment = {
  id: string;
  work_date: string;
  work_amount: number;
  projects: {
    id: string;
    name: string;
    customer_name: string | null;
    address: string | null;
  } | null;
  workers: {
    id: string;
    name: string;
  } | null;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatJapaneseDate(dateText: string) {
  const date = new Date(`${dateText}T00:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatWorkAmount(amount: number) {
  return amount === 0.5 ? "半日" : "1日";
}

export default async function SiteAssignmentsPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const today = new Date();
  const startDate = params.start ? new Date(`${params.start}T00:00:00`) : today;
  const endDate = addDays(startDate, 6);

  const startText = formatDate(startDate);
  const endText = formatDate(endDate);

  const previousStart = formatDate(addDays(startDate, -7));
  const nextStart = formatDate(addDays(startDate, 7));

  const { data, error } = await supabase
    .from("site_assignments")
    .select(
      `
      id,
      work_date,
      work_amount,
      projects (
        id,
        name,
        customer_name,
        address
      ),
      workers (
        id,
        name
      )
    `
    )
    .gte("work_date", startText)
    .lte("work_date", endText)
    .order("work_date", { ascending: true });

  if (error) {
    return <main className="p-8">エラー：{error.message}</main>;
  }

  const assignments = (data as unknown as Assignment[]) ?? [];

  const groupedByDate = assignments.reduce<Record<string, Assignment[]>>(
    (acc, assignment) => {
      if (!acc[assignment.work_date]) {
        acc[assignment.work_date] = [];
      }

      acc[assignment.work_date].push(assignment);
      return acc;
    },
    {}
  );

  const dates = Array.from({ length: 7 }, (_, index) =>
    formatDate(addDays(startDate, index))
  );

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              現場担当一覧
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              日にちごとに、誰がどの現場に入ったかを確認できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/site-assignments/new"
              className="rounded bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              入力する
            </Link>

            <PrintButton />

            <Link
              href="/"
              className="rounded bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800"
            >
              戻る
            </Link>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm print:shadow-none">
          <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={`/site-assignments?start=${previousStart}`}
              className="rounded border border-gray-300 px-4 py-2 text-center text-sm font-semibold"
            >
              ＜ 前週
            </Link>

            <div className="text-center font-bold text-gray-900">
              {formatJapaneseDate(startText)}〜{formatJapaneseDate(endText)}
            </div>

            <Link
              href={`/site-assignments?start=${nextStart}`}
              className="rounded border border-gray-300 px-4 py-2 text-center text-sm font-semibold"
            >
              次週 ＞
            </Link>
          </div>

          <div className="hidden text-center text-xl font-bold print:block">
            現場担当一覧　{formatJapaneseDate(startText)}〜
            {formatJapaneseDate(endText)}
          </div>
        </div>

        <div className="space-y-4">
          {dates.map((dateText) => {
            const dayAssignments = groupedByDate[dateText] ?? [];

            const groupedByProject = dayAssignments.reduce<
              Record<string, Assignment[]>
            >((acc, assignment) => {
              const projectId = assignment.projects?.id ?? "unknown";

              if (!acc[projectId]) {
                acc[projectId] = [];
              }

              acc[projectId].push(assignment);
              return acc;
            }, {});

            const projectGroups = Object.values(groupedByProject);

            return (
              <section
                key={dateText}
                className="rounded-xl bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none"
              >
                <h2 className="border-b pb-2 text-lg font-bold text-gray-900">
                  {formatJapaneseDate(dateText)}
                </h2>

                {projectGroups.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">
                    入力なし
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {projectGroups.map((projectAssignments) => {
                      const project = projectAssignments[0].projects;
                      const total = projectAssignments.reduce(
                        (sum, item) => sum + Number(item.work_amount),
                        0
                      );

                      return (
                        <div
                          key={project?.id ?? "unknown"}
                          className="rounded-lg border border-gray-200 p-3"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-bold text-gray-900">
                                {project?.name ?? "不明な現場"}
                              </p>

                              {project?.customer_name && (
                                <p className="text-sm text-gray-600">
                                  顧客：{project.customer_name}
                                </p>
                              )}

                              {project?.address && (
                                <p className="text-sm text-gray-600">
                                  住所：{project.address}
                                </p>
                              )}
                            </div>

                            <p className="text-sm font-bold text-gray-900">
                              合計 {total}人工
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {projectAssignments.map((assignment) => (
                              <div
                                key={assignment.id}
                                className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800"
                              >
                                <span>
                                  {assignment.workers?.name ?? "不明な職人"}（
                                  {formatWorkAmount(Number(assignment.work_amount))}）
                                </span>

                                <DeleteAssignmentButton
                                  assignmentId={assignment.id}
                                  workerName={assignment.workers?.name ?? "不明な職人"}
                                  deleteSiteAssignment={deleteSiteAssignment}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}