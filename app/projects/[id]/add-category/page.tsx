import { createClient } from "@/lib/supabase/server";
import { taskTemplates } from "@/lib/taskTemplates";
import { redirect } from "next/navigation";
import AddCategoryForm from "./AddCategoryForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ProgressGroup = {
  id: string;
  category: keyof typeof taskTemplates;
  section_name: string | null;
};

async function addCategories(projectId: string, formData: FormData) {
  "use server";

  const supabase = await createClient();

  const rowsJson = formData.get("rows") as string;
  const rows = JSON.parse(rowsJson) as {
    category: keyof typeof taskTemplates;
    section_name: string;
  }[];

  if (rows.length === 0) {
    redirect(`/projects/${projectId}`);
  }

  const { data: latestGroup } = await supabase
    .from("progress_groups")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const latestSortOrder =
    ((latestGroup?.[0]?.sort_order as number | null) ?? 0) + 1;

  const groupRows = rows.map((row, index) => ({
    project_id: projectId,
    category: row.category,
    section_name: row.section_name || null,
    sort_order: latestSortOrder + index,
  }));

  const { data: insertedGroups, error: groupError } = await supabase
    .from("progress_groups")
    .insert(groupRows)
    .select("id, category, section_name");

  if (groupError) {
    throw new Error(groupError.message);
  }

  const groupList = (insertedGroups as ProgressGroup[]) ?? [];

  const progressItems = groupList.flatMap((group) => {
    const template = taskTemplates[group.category];

    return template.map((taskName, index) => ({
      project_id: projectId,
      group_id: group.id,
      category: group.category,
      section_name: group.section_name,
      task_name: taskName,
      status: "未着手",
      sort_order: index + 1,
    }));
  });

  if (progressItems.length > 0) {
    const { error: itemsError } = await supabase
      .from("progress_items")
      .insert(progressItems);

    if (itemsError) {
      throw new Error(itemsError.message);
    }
  }

  redirect(`/projects/${projectId}`);
}

export default async function AddCategoryPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="p-4">
      <h1 className="mb-4 text-xl font-bold">工事項目を追加</h1>

      <AddCategoryForm projectId={id} addCategories={addCategories} />
    </main>
  );
}