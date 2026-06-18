"use client";

import { useState } from "react";

type Inventory = {
  id: string;
  can_number: string;
  color_name: string | null;
  remaining_amount: number;
  paint_products: {
    name: string;
  } | null;
};

type Props = {
  projectId: string;
  inventory: Inventory[];
  addPaintUsage: (formData: FormData) => void;
};

export default function PaintUsageForm({
  projectId,
  inventory,
  addPaintUsage,
}: Props) {
  const [selectedId, setSelectedId] = useState("");

  const selected = inventory.find((item) => item.id === selectedId);

  return (
    <section className="mt-8 rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold">使用材料</h2>

      <form action={addPaintUsage} className="space-y-3">
        <input type="hidden" name="project_id" value={projectId} />

        <select
          name="paint_inventory_id"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded border p-2"
          required
        >
          <option value="">缶No.を選択</option>
          {inventory.map((item) => (
            <option key={item.id} value={item.id}>
              No.{item.can_number} / {item.paint_products?.name} /{" "}
              {item.color_name || "色名なし"} / 残量{item.remaining_amount}kg
            </option>
          ))}
        </select>

        {selected && (
          <div className="rounded bg-gray-50 p-3 text-sm">
            <p>塗料名：{selected.paint_products?.name}</p>
            <p>色名：{selected.color_name || "未入力"}</p>
            <p>残量：{selected.remaining_amount}kg</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="number"
            step="0.1"
            name="used_amount"
            placeholder="使用量（kg）"
            className="rounded border p-2"
          />

          <label className="flex items-center gap-2 rounded border p-2">
            <input type="checkbox" name="used_all" value="true" />
            使い切り
          </label>
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white"
        >
          使用材料を登録
        </button>
      </form>
    </section>
  );
}