"use client";

import { useState } from "react";
import { taskTemplates } from "@/lib/taskTemplates";

type Row = {
  category: keyof typeof taskTemplates;
  section_name: string;
};

type Props = {
  projectId: string;
  addCategories: (projectId: string, formData: FormData) => void;
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

export default function AddCategoryForm({ projectId, addCategories }: Props) {
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
    <form action={addCategories.bind(null, projectId)} className="space-y-4">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
          >
            <select
              value={row.category}
              onChange={(e) =>
                updateRow(
                  index,
                  "category",
                  e.target.value as keyof typeof taskTemplates
                )
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
              type="text"
              value={row.section_name}
              onChange={(e) =>
                updateRow(index, "section_name", e.target.value)
              }
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
      </div>

      <button
        type="button"
        onClick={addRow}
        className="rounded bg-gray-200 px-4 py-2"
      >
        ＋行追加
      </button>

      <div>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          まとめて登録
        </button>
      </div>
    </form>
  );
}