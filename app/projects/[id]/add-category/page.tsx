import { createClient } from "@/lib/supabase/server";
import { taskTemplates } from "@/lib/taskTemplates";
import { redirect } from "next/navigation";
import AddCategoryForm from "./AddCategoryForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function addCategories(projectId: string, formData: FormData) {
  "use server";

  const supabase = await createClient();

  const rowsJson = formData.get("rows") as string;
  const rows = JSON.parse(rowsJson) as {
    category: keyof typeof taskTemplates;
    section_name: string;
  }[];

  const progressItems = rows.flatMap((row) => {
    const template = taskTemplates[row.category];

    return template.map((taskName, index) => ({
      project_id: projectId,
      category: row.category,
      section_name: row.section_name || null,
      task_name: taskName,
      sort_order: index + 1,
    }));
  });

  const { error } = await supabase
    .from("progress_items")
    .insert(progressItems);

  if (error) {
    throw new Error(error.message);
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