import { createClient } from "@/lib/supabase/server";
import { taskTemplates } from "@/lib/taskTemplates";
import { redirect } from "next/navigation";
import NewProjectForm from "./NewProjectForm";

async function createProject(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const rowsJson = formData.get("rows") as string;

  const rows = JSON.parse(rowsJson) as {
    category: keyof typeof taskTemplates;
    section_name: string;
  }[];

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: formData.get("name"),
      customer_name: formData.get("customer_name"),
      address: formData.get("address"),
      manager: formData.get("manager"),
      start_date: formData.get("start_date") || null,
      end_date: formData.get("end_date") || null,
      memo: formData.get("memo"),
      status: "未着手",
    })
    .select()
    .single();

  if (projectError) {
    throw new Error(projectError.message);
  }

  if (rows.length > 0) {
    const progressItems = rows.flatMap((row) => {
      const template = taskTemplates[row.category];

      return template.map((taskName, index) => ({
        project_id: project.id,
        category: row.category,
        section_name: row.section_name || null,
        task_name: taskName,
        sort_order: index + 1,
      }));
    });

    const { error: progressError } = await supabase
      .from("progress_items")
      .insert(progressItems);

    if (progressError) {
      throw new Error(progressError.message);
    }
  }

  redirect(`/projects/${project.id}`);
}

export default async function NewProjectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="p-4">
      <h1 className="mb-4 text-xl font-bold">新規工事登録</h1>
      <NewProjectForm createProject={createProject} />
    </main>
  );
}