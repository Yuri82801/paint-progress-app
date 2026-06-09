"use client";

import { useState } from "react";
import { taskTemplates } from "@/lib/taskTemplates";

type Row = {
  category: keyof typeof taskTemplates;
  section_name: string;
};

type Props = {
  createProject: (formData: FormData) => void;
};

const mainCategories = ["屋根塗装", "外壁塗装", "コーキング工事"] as const;

const optionCategories = [
  "灯油タンク塗装",
  "軒天塗装",
  "雨樋塗装",
  "基礎塗装",
  "水切り塗装",
  "シャッター塗装",
  "物置塗装",
  "木部塗装",
  "ホームタンク塗装",
  "鉄骨塗装",
  "手すり塗装",
  "ウッドデッキ塗装",
  "その他",
] as const;

export default function NewProjectForm({ createProject }: Props) {
  const categories = Object.keys(taskTemplates) as (keyof typeof taskTemplates)[];

  const [rows, setRows] = useState<Row[]>([
    {
      category: categories[0],
      section_name: "",
    },
  ]);

  const addRow = () => {
    setRows([
      ...rows,
      {
        category: categories[0],
        section_name: "",
      },
    ]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = <K extends keyof Row>(
    index: number,
    key: K,
    value: Row[K]
  ) => {
    const newRows = [...rows];
    newRows[index][key] = value;
    setRows(newRows);
  };

  return (
    <form action={createProject} className="space-y-6">
      <section className="space-y-3">
        <input name="name" placeholder="工事名" className="w-full rounded border p-2" required />
        <input name="customer_name" placeholder="顧客名" className="w-full rounded border p-2" />
        <input name="address" placeholder="住所" className="w-full rounded border p-2" />
        <input name="manager" placeholder="担当者" className="w-full rounded border p-2" />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
  <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        着工予定日
      </label>
      <input
        type="date"
        name="start_date"
        className="w-full rounded border p-2"
      />
    </div>

    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        完工予定日
      </label>
      <input
        type="date"
        name="end_date"
        className="w-full rounded border p-2"
      />
    </div>
  </div>

        <textarea name="memo" placeholder="メモ" className="w-full rounded border p-2" />
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">工事項目</h2>

        <input type="hidden" name="rows" value={JSON.stringify(rows)} />

        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <select
              value={row.category}
              onChange={(e) =>
                updateRow(index, "category", e.target.value as keyof typeof taskTemplates)
              }
              className="rounded border p-2"
            >
              <optgroup label="主要工事">
                {mainCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </optgroup>

              <optgroup label="オプション塗装">
                {optionCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </optgroup>
            </select>

            <input
              value={row.section_name}
              onChange={(e) => updateRow(index, "section_name", e.target.value)}
              placeholder="例：上屋根、A面"
              className="rounded border p-2"
            />

            <button
              type="button"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1}
              className="rounded bg-gray-200 px-3 py-2 disabled:opacity-40"
            >
              削除
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          className="rounded bg-gray-200 px-4 py-2"
        >
          ＋行追加
        </button>
      </section>

      <button className="rounded bg-blue-600 px-4 py-2 text-white">
        工事を登録
      </button>
    </form>
  );
}