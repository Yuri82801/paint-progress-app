"use client";

import { useMemo, useState } from "react";

type PaintProduct = {
  id: string;
  name: string;
};

type Row = {
  id: string;
  can_number: string;
  paint_product_id: string;
  other_paint_name: string;
  color_name: string;
  remaining_amount: string;
  received_date: string;
};

type Props = {
  createInventory: (formData: FormData) => void;
  paintProducts: PaintProduct[];
};

function createEmptyRow(): Row {
  return {
    id: crypto.randomUUID(),
    can_number: "",
    paint_product_id: "",
    other_paint_name: "",
    color_name: "",
    remaining_amount: "",
    received_date: "",
  };
}

export default function PaintInventoryForm({
  createInventory,
  paintProducts,
}: Props) {
  const [rows, setRows] = useState<Row[]>([createEmptyRow()]);

  const rowsJson = useMemo(() => {
    return JSON.stringify(
      rows.map(
        ({
          can_number,
          paint_product_id,
          other_paint_name,
          color_name,
          remaining_amount,
          received_date,
        }) => ({
          can_number,
          paint_product_id,
          other_paint_name,
          color_name,
          remaining_amount,
          received_date,
        })
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

  const updateRow = (id: string, key: keyof Row, value: string) => {
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

  if (paintProducts.length === 0) {
    return (
      <div className="rounded-lg border bg-yellow-50 p-4 text-sm text-yellow-800">
        先に塗料マスタを登録してください。
      </div>
    );
  }

  return (
    <form action={createInventory} className="space-y-4">
      <input type="hidden" name="rows" value={rowsJson} />

      {rows.map((row, index) => (
        <div key={row.id} className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">入力 {index + 1}</h2>

            <button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              className="rounded bg-red-50 px-3 py-1 text-sm font-bold text-red-600 disabled:opacity-40"
            >
              削除
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={row.can_number}
              onChange={(e) => updateRow(row.id, "can_number", e.target.value)}
              placeholder="ナンバー"
              className="rounded border p-2"
              required
            />

            <div className="space-y-2">
              <select
                value={row.paint_product_id}
                onChange={(e) =>
                  updateRow(row.id, "paint_product_id", e.target.value)
                }
                className="w-full rounded border p-2"
                required
              >
                <option value="">塗料名を選択</option>

                {paintProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}

                <option value="__other__">その他</option>
              </select>

              {row.paint_product_id === "__other__" && (
                <input
                  value={row.other_paint_name}
                  onChange={(e) =>
                    updateRow(row.id, "other_paint_name", e.target.value)
                  }
                  placeholder="その他の塗料名"
                  className="w-full rounded border p-2"
                  required
                />
              )}
            </div>

            <input
              value={row.color_name}
              onChange={(e) => updateRow(row.id, "color_name", e.target.value)}
              placeholder="色名"
              className="rounded border p-2"
            />

            <input
              type="number"
              step="0.1"
              value={row.remaining_amount}
              onChange={(e) =>
                updateRow(row.id, "remaining_amount", e.target.value)
              }
              placeholder="残量（kg）"
              className="rounded border p-2"
              required
            />

            <input
              type="date"
              value={row.received_date}
              onChange={(e) =>
                updateRow(row.id, "received_date", e.target.value)
              }
              className="rounded border p-2"
            />
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={addRow}
          className="rounded bg-gray-700 px-4 py-2 font-semibold text-white"
        >
          ＋ 行追加
        </button>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white"
        >
          まとめて登録
        </button>
      </div>
    </form>
  );
}