"use client";

import { useState } from "react";
import Link from "next/link";

type ProgressItem = {
  id: string;
  status: string | null;
};

type Project = {
  id: string;
  name: string;
  customer_name: string | null;
  address: string | null;
  manager: string | null;
  status: string | null;
  progress_items: ProgressItem[];
};

type Props = {
  projects: Project[];
};

type Tab = "施工中" | "施工前" | "完了済み";

const tabs: Tab[] = ["施工中", "施工前", "完了済み"];

function calculateProgress(items: ProgressItem[]) {
  const total = items.length;

  if (total === 0) {
    return 0;
  }

  const completed = items.filter(
    (item) => item.status === "完了" || item.status === "対象外"
  ).length;

  return Math.round((completed / total) * 100);
}

function getTabByStatus(status: string | null): Tab {
  if (status === "完了") {
    return "完了済み";
  }

  if (status === "未着手" || status === "着工待ち") {
    return "施工前";
  }

  return "施工中";
}

function getStatusBadgeClass(status: string | null) {
  if (status === "完了") {
    return "bg-green-100 text-green-700";
  }

  if (status === "作業中") {
    return "bg-yellow-100 text-yellow-700";
  }

  if (status === "着工待ち" || status === "未着手") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-gray-100 text-gray-700";
}

export default function ProjectsList({ projects }: Props) {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("施工中");

  const filteredProjects = projects.filter((project) => {
    const matchesTab = getTabByStatus(project.status) === activeTab;

    const text = [
      project.name,
      project.customer_name,
      project.address,
      project.manager,
      project.status,
    ]
      .join(" ")
      .toLowerCase();

    const matchesKeyword = text.includes(keyword.toLowerCase());

    return matchesTab && matchesKeyword;
  });

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const count = projects.filter(
            (project) => getTabByStatus(project.status) === tab
          ).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded px-2 py-2 text-sm ${
                activeTab === tab
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <span className="block">{tab}</span>
              <span className="text-xs">({count})</span>
            </button>
          );
        })}
      </div>

      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="工事名・顧客名・住所・担当者で検索"
        className="mb-4 w-full rounded border p-3 text-base"
      />

      <div className="space-y-3">
        {filteredProjects.length === 0 && (
          <div className="rounded border bg-gray-50 p-4 text-gray-500">
            該当する工事はありません
          </div>
        )}

        {filteredProjects.map((project) => {
          const progress = calculateProgress(project.progress_items ?? []);

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded border bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">{project.name}</h2>

                  <p className="text-sm text-gray-600">
                    顧客：{project.customer_name || "未設定"}
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700">
                    住所：{project.address || "未設定"}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    担当：{project.manager || "未設定"}
                  </p>
                </div>

                <span
                  className={`w-fit rounded px-2 py-1 text-sm font-medium ${getStatusBadgeClass(
                    project.status
                  )}`}
                >
                  {project.status || "未設定"}
                </span>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-sm">
                  <span>進捗率</span>
                  <span>{progress}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded bg-gray-200">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}