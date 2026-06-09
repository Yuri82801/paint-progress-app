"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Worker = {
  id: string;
  name: string;
};

type Props = {
  itemId: string;
  currentStatus: string | null;
  projectId: string;
  workers: Worker[];
};

type ProgressItemStatus = {
  status: string | null;
};

const statuses = ["未着手", "作業中", "完了", "対象外"];

export default function ProgressStatusButtons({
  itemId,
  currentStatus,
  projectId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedWorker, setSelectedWorker] = useState("");

  useEffect(() => {
    const savedWorker = localStorage.getItem("selected_worker") ?? "";
    setSelectedWorker(savedWorker);

    const handleWorkerChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setSelectedWorker(customEvent.detail);
    };

    window.addEventListener("selectedWorkerChanged", handleWorkerChange);

    return () => {
      window.removeEventListener("selectedWorkerChanged", handleWorkerChange);
    };
  }, []);

  const updateProjectStatus = async () => {
    const { data: items, error } = await supabase
      .from("progress_items")
      .select("status")
      .eq("project_id", projectId);

    if (error) {
      alert("工事ステータス更新用データの取得に失敗しました：" + error.message);
      return;
    }

    const itemList = (items as ProgressItemStatus[]) ?? [];
    const total = itemList.length;

    const completed = itemList.filter(
      (item) => item.status === "完了" || item.status === "対象外"
    ).length;

    const working = itemList.some((item) => item.status === "作業中");

    let projectStatus = "未着手";

    if (total > 0 && completed === total) {
      projectStatus = "完了";
    } else if (working || completed > 0) {
      projectStatus = "作業中";
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({ status: projectStatus })
      .eq("id", projectId);

    if (updateError) {
      alert("工事ステータスの更新に失敗しました：" + updateError.message);
    }
  };

  const updateStatus = async (status: string) => {
    const completedDate =
      status === "完了" ? new Date().toISOString().slice(0, 10) : null;

    const completedBy = status === "完了" ? selectedWorker : null;

    if (status === "完了" && !completedBy) {
      alert("画面上部で作業者を選択してください");
      return;
    }

    const { error } = await supabase
      .from("progress_items")
      .update({
        status,
        completed_date: completedDate,
        completed_by: completedBy,
      })
      .eq("id", itemId);

    if (error) {
      alert("更新に失敗しました：" + error.message);
      return;
    }

    await updateProjectStatus();

    router.refresh();
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => updateStatus(status)}
          className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition active:scale-95 sm:min-h-9 sm:px-3 sm:py-1 ${
            currentStatus === status
              ? "border-black bg-black text-white"
              : "border-gray-300 bg-white text-gray-700"
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}