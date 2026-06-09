"use client";

type Props = {
  projectId: string;
  projectName: string;
  deleteProject: (formData: FormData) => void;
};

export default function DeleteProjectButton({
  projectId,
  projectName,
  deleteProject,
}: Props) {
  return (
    <form
      action={deleteProject}
      onSubmit={(e) => {
        const ok = window.confirm(
          `${projectName} を削除しますか？\nこの工事に登録されている工事項目も削除されます。`
        );

        if (!ok) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="project_id" value={projectId} />

      <button
        type="submit"
        className="rounded bg-red-700 px-4 py-2 text-white hover:bg-red-800"
      >
        工事を削除
      </button>
    </form>
  );
}