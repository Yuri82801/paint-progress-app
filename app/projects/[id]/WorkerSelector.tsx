"use client";

import { useEffect, useState } from "react";

type Worker = {
  id: string;
  name: string;
};

type Props = {
  workers: Worker[];
};

export default function WorkerSelector({ workers }: Props) {
  const [selectedWorker, setSelectedWorker] = useState("");

  useEffect(() => {
    const savedWorker = localStorage.getItem("selected_worker") ?? "";
    setSelectedWorker(savedWorker);
  }, []);

  const handleChange = (workerName: string) => {
    setSelectedWorker(workerName);
    localStorage.setItem("selected_worker", workerName);

    window.dispatchEvent(
      new CustomEvent("selectedWorkerChanged", {
        detail: workerName,
      })
    );
  };

  return (
    <div className="mb-6 rounded-lg border bg-gray-50 p-4">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        現在の作業者
      </label>

      <select
        value={selectedWorker}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded border bg-white p-3 text-base sm:max-w-xs"
      >
        <option value="">作業者を選択</option>
        {workers.map((worker) => (
          <option key={worker.id} value={worker.name}>
            {worker.name}
          </option>
        ))}
      </select>

      <p className="mt-2 text-xs text-gray-500">
        ここで選んだ作業者名が、完了時に自動で記録されます。
      </p>
    </div>
  );
}