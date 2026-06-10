"use client";

import { useMemo, useState } from "react";

type Project = {
  id: string;
  name: string;
  customer_name: string | null;
  address: string | null;
  status: string | null;
};

type Worker = {
  id: string;
  name: string;
};

type AssignmentRow = {
  id: string;
  work_date: string;
  project_id: string;
  worker_ids: string[];
  work_amount: number;
};

type Props = {
  projects: Project[];
  workers: Worker[];
  saveSiteAssignments: (formData: FormData) => void;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyRow(): AssignmentRow {
  return {
    id: crypto.randomUUID(),
    work_date: getToday(),
    project_id: "",
    worker_ids: [],
    work_amount: 1,
  };
}

export default function SiteAssignmentForm({
  projects,
  workers,
  saveSiteAssignments,
}: Props) {
  const [rows, setRows] = useState<AssignmentRow[]>([createEmptyRow()]);

  const assignmentsJson = useMemo(() => {
    return JSON.stringify(
      rows.flatMap(({ work_date, project_id, worker_ids, work_amount }) =>
        worker_ids.map((worker_id) => ({
          work_date,
          project_id,
          worker_id,
          work_amount,
        }))
      )
    );
  }, [rows]);

  const addRow = () => {
    setRows((current) => [...current, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    setRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.id !== id)
    );
  };

  const updateRow = (
    id: string,
    key: "work_date" | "project_id" | "work_amount",
    value: string | number
  ) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              [key]: value,
            }
          : row
      )
    );
  };

  const toggleWorker = (rowId: string, workerId: string) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const alreadySelected = row.worker_ids.includes(workerId);

        return {
          ...row,
          worker_ids: alreadySelected
            ? row.worker_ids.filter((id) => id !== workerId)
            : [...row.worker_ids, workerId],
        };
      })
    );
  };

  return (
    <form action={saveSiteAssignments} className="space-y-4">
      <input type="hidden" name="assignments" value={assignmentsJson} />

      <div className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">入力 {index + 1}</h2>

              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="rounded bg-red-50 px-3 py-1 text-sm font-semibold text-red-600 disabled:opacity-40"
                disabled={rows.length === 1}
              >
                削除
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  日付
                </span>
                <input
                  type="date"
                  value={row.work_date}
                  onChange={(event) =>
                    updateRow(row.id, "work_date", event.target.value)
                  }
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  現場
                </span>
                <select
                  value={row.project_id}
                  onChange={(event) =>
                    updateRow(row.id, "project_id", event.target.value)
                  }
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="">選択してください</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                      {project.customer_name
                        ? ` / ${project.customer_name}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">
                  時間
                </span>
                <select
                  value={row.work_amount}
                  onChange={(event) =>
                    updateRow(row.id, "work_amount", Number(event.target.value))
                  }
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value={1}>1日</option>
                  <option value={0.5}>半日</option>
                </select>
              </label>

              <div className="block sm:col-span-2">
                <p className="text-sm font-semibold text-gray-700">
                  職人
                </p>

                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {workers.map((worker) => {
                    const checked = row.worker_ids.includes(worker.id);

                    return (
                      <label
                        key={worker.id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold ${
                          checked
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleWorker(row.id, worker.id)}
                          className="h-4 w-4"
                        />
                        {worker.name}
                      </label>
                    );
                  })}
                </div>

                {row.worker_ids.length > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    選択中：{row.worker_ids.length}人
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={addRow}
          className="rounded bg-gray-700 px-4 py-3 font-semibold text-white"
        >
          ＋ 入力行を追加
        </button>

        <button
          type="submit"
          className="rounded bg-black px-4 py-3 font-semibold text-white"
        >
          保存する
        </button>
      </div>
    </form>
  );
}