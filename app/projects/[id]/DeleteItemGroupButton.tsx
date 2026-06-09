"use client";

type Props = {
  projectId: string;
  category: string;
  sectionName: string | null;
  deleteItemGroup: (formData: FormData) => void;
};

export default function DeleteItemGroupButton({
  projectId,
  category,
  sectionName,
  deleteItemGroup,
}: Props) {
  return (
    <form
      action={deleteItemGroup}
      onSubmit={(e) => {
        const ok = window.confirm(
          `${category}${sectionName ? ` ${sectionName}` : ""} を削除しますか？\nこの中の工程もすべて削除されます。`
        );

        if (!ok) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="section_name" value={sectionName ?? ""} />

      <button
        type="submit"
        className="h-10 rounded bg-red-600 px-4 text-white hover:bg-red-700"
      >
        この工事項目を削除
      </button>
    </form>
  );
}