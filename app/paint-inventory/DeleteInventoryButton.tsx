"use client";

type Props = {
  inventoryName: string;
};

export default function DeleteInventoryButton({ inventoryName }: Props) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (
          !confirm(
            `「${inventoryName}」を削除しますか？\n使用履歴がある在庫は削除できません。`
          )
        ) {
          e.preventDefault();
        }
      }}
      className="rounded bg-red-600 px-3 py-1.5 text-sm font-bold text-white"
    >
      削除
    </button>
  );
}