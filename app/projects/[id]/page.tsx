import Link from "next/link";
import DeleteProjectButton from "./DeleteProjectButton";
import { redirect } from "next/navigation";
import ProgressItemGroup from "./ProgressItemGroup";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import WorkerSelector from "./WorkerSelector";

type ProgressItem = {
  id: string;
  group_id: string | null;
  category: string;
  section_name: string | null;
  task_name: string;
  status: string | null;
  completed_date: string | null;
  completed_by: string | null;
  memo: string | null;
  sort_order: number | null;
};

type ProgressGroup = {
  id: string;
  project_id: string;
  category: string;
  section_name: string | null;
  sort_order: number;
  created_at: string | null;
};

type Worker = {
  id: string;
  name: string;
};

type SiteAssignment = {
  id: string;
  worker_id: string;
  work_date: string;
  work_amount: number;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function addProgressItem(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const projectId = String(formData.get("project_id") ?? "");
  const groupId = String(formData.get("group_id") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const sectionName = String(formData.get("section_name") ?? "").trim();
  const taskName = String(formData.get("task_name") ?? "").trim();

  if (!projectId || !groupId || !category || !taskName) return;

  const { data: existingItems, error: countError } = await supabase
    .from("progress_items")
    .select("sort_order")
    .eq("project_id", projectId)
    .eq("group_id", groupId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (countError) {
    throw new Error(countError.message);
  }

  const nextSortOrder =
    ((existingItems?.[0]?.sort_order as number | null) ?? 0) + 1;

  const { error } = await supabase.from("progress_items").insert({
    project_id: projectId,
    group_id: groupId,
    category,
    section_name: sectionName || null,
    task_name: taskName,
    status: "未着手",
    sort_order: nextSortOrder,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
}

async function deleteItemGroup(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const projectId = formData.get("project_id") as string;
  const groupId = formData.get("group_id") as string;

  const { error } = await supabase
    .from("progress_groups")
    .delete()
    .eq("id", groupId)
    .eq("project_id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
}

async function deleteProgressItem(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const projectId = formData.get("project_id") as string;
  const itemId = formData.get("item_id") as string;

  const { error } = await supabase
    .from("progress_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
}

async function deleteProject(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const projectId = formData.get("project_id") as string;

  await supabase.from("progress_items").delete().eq("project_id", projectId);
  await supabase.from("progress_groups").delete().eq("project_id", projectId);

  const { error: projectError } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (projectError) {
    throw new Error(projectError.message);
  }

  redirect("/");
}

async function updateItemMemo(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const projectId = formData.get("project_id") as string;
  const itemId = formData.get("item_id") as string;
  const memo = formData.get("memo") as string;

  const { error } = await supabase
    .from("progress_items")
    .update({ memo: memo || null })
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
}

async function updateItemGroup(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const projectId = formData.get("project_id") as string;
  const groupId = formData.get("group_id") as string;
  const newCategory = String(formData.get("new_category") ?? "").trim();
  const newSectionName = String(formData.get("new_section_name") ?? "").trim();

  if (!projectId || !groupId || !newCategory) return;

  const { error: groupError } = await supabase
    .from("progress_groups")
    .update({
      category: newCategory,
      section_name: newSectionName || null,
    })
    .eq("id", groupId)
    .eq("project_id", projectId);

  if (groupError) {
    throw new Error(groupError.message);
  }

  const { error: itemError } = await supabase
    .from("progress_items")
    .update({
      category: newCategory,
      section_name: newSectionName || null,
    })
    .eq("group_id", groupId)
    .eq("project_id", projectId);

  if (itemError) {
    throw new Error(itemError.message);
  }

  revalidatePath(`/projects/${projectId}`);
}

async function updateProgressItemSortOrders(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const projectId = formData.get("project_id") as string;
  const itemIdsText = formData.get("item_ids") as string;

  const itemIds = JSON.parse(itemIdsText) as string[];

  for (const [index, itemId] of itemIds.entries()) {
    const { error } = await supabase
      .from("progress_items")
      .update({ sort_order: index + 1 })
      .eq("id", itemId)
      .eq("project_id", projectId);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath(`/projects/${projectId}`);
}

async function updateCompletedInfo(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const projectId = formData.get("project_id") as string;
  const itemId = formData.get("item_id") as string;

  const completedDate = (formData.get("completed_date") as string) || null;
  const completedBy = (formData.get("completed_by") as string) || null;

  const { error } = await supabase
    .from("progress_items")
    .update({
      completed_date: completedDate,
      completed_by: completedBy,
    })
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    projectResult,
    groupsResult,
    progressResult,
    workersResult,
    siteAssignmentsResult,
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),

    supabase
      .from("progress_groups")
      .select("*")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),

    supabase
      .from("progress_items")
      .select("*")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),

    supabase.from("workers").select("*").order("name", { ascending: true }),

    supabase
      .from("site_assignments")
      .select("id, worker_id, work_date, work_amount")
      .eq("project_id", id)
      .order("work_date", { ascending: false }),
  ]);

  const { data: project, error: projectError } = projectResult;
  const { data: progressGroups, error: groupsError } = groupsResult;
  const { data: progressItems, error: progressError } = progressResult;
  const { data: workers, error: workersError } = workersResult;
  const { data: siteAssignments, error: siteAssignmentsError } =
    siteAssignmentsResult;

  if (
    projectError ||
    groupsError ||
    progressError ||
    workersError ||
    siteAssignmentsError
  ) {
    return (
      <main className="p-8">
        エラー：
        {projectError?.message ||
          groupsError?.message ||
          progressError?.message ||
          workersError?.message ||
          siteAssignmentsError?.message}
      </main>
    );
  }

  const groupList = (progressGroups as ProgressGroup[]) ?? [];
  const progressItemList = (progressItems as ProgressItem[]) ?? [];
  const workerList = (workers as Worker[]) ?? [];
  const siteAssignmentList = (siteAssignments as SiteAssignment[]) ?? [];

  const totalManDays = siteAssignmentList.reduce(
    (sum, assignment) => sum + Number(assignment.work_amount),
    0
  );

  const siteAssignmentsByDate = siteAssignmentList.reduce<
    Record<string, SiteAssignment[]>
  >((acc, assignment) => {
    if (!acc[assignment.work_date]) {
      acc[assignment.work_date] = [];
    }

    acc[assignment.work_date].push(assignment);
    return acc;
  }, {});

  const workerNameMap = new Map(
    workerList.map((worker) => [worker.id, worker.name])
  );

  const groupsWithItems = groupList.map((group) => ({
    id: group.id,
    category: group.category,
    section_name: group.section_name,
    sort_order: group.sort_order,
    items: progressItemList
      .filter((item) => item.group_id === group.id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  }));

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <Link
        href="/projects"
        className="inline-block rounded bg-gray-700 px-4 py-2 font-medium text-white hover:bg-gray-800"
      >
        ← 工事一覧に戻る
      </Link>

      <h1 className="mt-4 mb-2 text-3xl font-bold">{project.name}</h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={`/projects/${id}/add-category`}
          className="inline-block rounded bg-black px-4 py-2 text-white"
        >
          ＋工事項目追加
        </Link>

        <Link
          href={`/projects/${id}/edit`}
          className="inline-block rounded bg-gray-700 px-4 py-2 text-white"
        >
          工事情報を編集
        </Link>

        <DeleteProjectButton
          projectId={id}
          projectName={project.name}
          deleteProject={deleteProject}
        />
      </div>

      <div className="mb-6 rounded-lg border bg-white p-4 text-gray-700 shadow-sm">
        <p>顧客名：{project.customer_name || "未入力"}</p>
        <p>住所：{project.address || "未入力"}</p>
        <p>担当者：{project.manager || "未入力"}</p>
        <p>ステータス：{project.status || "未入力"}</p>
        <p className="font-bold text-red-600">累計人工：{totalManDays}人工</p>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-4 text-gray-700 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-gray-900">現場担当履歴</h2>

        {siteAssignmentList.length === 0 ? (
          <p className="text-sm text-gray-500">
            まだ現場担当の記録はありません。
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(siteAssignmentsByDate).map(([date, assignments]) => (
              <div key={date} className="rounded border border-gray-200 p-3">
                <p className="font-bold text-gray-900">
                  {Number(date.slice(5, 7))}月{Number(date.slice(8, 10))}日
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {assignments.map((assignment) => (
                    <span
                      key={assignment.id}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800"
                    >
                      {workerNameMap.get(assignment.worker_id) ?? "不明な職人"}
                      （
                      {Number(assignment.work_amount) === 0.5 ? "半日" : "1日"}
                      ）
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WorkerSelector workers={workerList} />

      <div className="space-y-8">
        {groupsWithItems.map((group) => {
          const groupName = group.section_name
            ? `${group.category} ${group.section_name}`
            : group.category;

          return (
            <ProgressItemGroup
              key={group.id}
              projectId={id}
              groupId={group.id}
              groupName={groupName}
              category={group.category}
              sectionName={group.section_name}
              items={group.items}
              workers={workerList}
              addProgressItem={addProgressItem}
              deleteItemGroup={deleteItemGroup}
              deleteProgressItem={deleteProgressItem}
              updateItemMemo={updateItemMemo}
              updateItemGroup={updateItemGroup}
              updateProgressItemSortOrders={updateProgressItemSortOrders}
              updateCompletedInfo={updateCompletedInfo}
            />
          );
        })}
      </div>
    </main>
  );
}