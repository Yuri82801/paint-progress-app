"use client";

type Props = {
  assignmentId: string;
  workerName: string;
  deleteSiteAssignment: (formData: FormData) => void;
};

export default function DeleteAssignmentButton({
  assignmentId,
  workerName,
  deleteSiteAssignment,
}: Props) {
  return (
    <form
      action={deleteSiteAssignment}
      onSubmit={(event) => {
        if (!confirm(`${workerName}の記録を削除しますか？`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="assignment_id" value={assignmentId} />

      <button
        type="submit"
        className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-600 print:hidden"
      >
        削除
      </button>
    </form>
  );
}