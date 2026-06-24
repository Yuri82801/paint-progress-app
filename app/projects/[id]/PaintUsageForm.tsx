"use client";

import { useState } from "react";

type Inventory = {
  id: string;
  can_number: string;
  color_name: string | null;
  remaining_amount: number | null;
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
  const [canNumberInput, setCanNumberInput] = useState("");

  const selected = inventory.find((item) => item.id === selectedId);

  const handleCanNumberChange = (value: string) => {
    setCanNumberInput(value);

    const matchedInventory = inventory.find(
      (item) => String(item.can_number) === value.trim()
    );

    setSelectedId(matchedInventory?.id ?? "");
  };

  const handleSelectChange = (value: string) => {
    setSelectedId(value);

    const selectedInventory = inventory.find((item) => item.id === value);
    setCanNumberInput(selectedInventory?.can_number ?? "");
  };

  return (
    <section className="mt-8 rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold">使用材料</h2>

      <form action={addPaintUsage} className="space-y-3">
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="paint_inventory_id" value={selectedId} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-700">
              缶No.を入力
            </label>
            <input
              type="text"
              value={canNumberInput}
              onChange={(e) => handleCanNumberChange(e.target.value)}
              placeholder="例：12"
              className="w-full rounded border p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-gray-700">
              一覧から選択
            </label>
            <select
              value={selectedId}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">缶No.を選択</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  No.{item.can_number} / {item.paint_products?.name} /{" "}
                  {item.color_name || "色名なし"} /{" "}
                  {item.remaining_amount === null
                    ? "残量未確認"
                    : `残量${item.remaining_amount}kg`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {canNumberInput && !selected && (
          <div className="rounded bg-red-50 p-3 text-sm font-bold text-red-700">
            該当する缶No.が見つかりません。
          </div>
        )}

        {selected && (
          <div className="rounded bg-gray-50 p-3 text-sm">
            <p>缶No.：{selected.can_number}</p>
            <p>塗料名：{selected.paint_products?.name}</p>
            <p>色名：{selected.color_name || "未入力"}</p>
            <p>
              現在の登録残量：
              {selected.remaining_amount === null
                ? "未確認"
                : `${selected.remaining_amount}kg`}
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-bold text-gray-700">
            使用後の残量
          </label>
          <input
            type="number"
            step="0.1"
            name="new_remaining_amount"
            placeholder="計測した残量（kg）"
            className="w-full rounded border p-2"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            職人さんが計測した「使用後の残量」を入力してください。
          </p>
        </div>

        <button
          type="submit"
          disabled={!selectedId}
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:bg-gray-300"
        >
          使用後の残量を登録
        </button>
      </form>
    </section>
  );
}