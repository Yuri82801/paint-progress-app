"use client";

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import ProgressStatusButtons from "./ProgressStatusButtons";

type ProgressItem = {
  id: string;
  group_id: string | null;
  category: string;
  section_name: string | null;
  task_name: string;
  status: string | null;
  completed_date: string | null;
  completed_by: string | null;
  memo: string | null;
  sort_order: number | null;
};

type Worker = {
  id: string;
  name: string;
};

type Props = {
  projectId: string;
  groupId: string;
  groupName: string;
  category: string;
  sectionName: string | null;
  items: ProgressItem[];
  workers: Worker[];
  addProgressItem: (formData: FormData) => void;
  deleteItemGroup: (formData: FormData) => void;
  deleteProgressItem: (formData: FormData) => void;
  updateItemMemo: (formData: FormData) => void;
  updateItemGroup: (formData: FormData) => void;
  updateProgressItemSortOrders: (formData: FormData) => void;
  updateCompletedInfo: (formData: FormData) => void;
};

function MemoInput({
  projectId,
  itemId,
  initialMemo,
  updateItemMemo,
}: {
  projectId: string;
  itemId: string;
  initialMemo: string | null;
  updateItemMemo: (formData: FormData) => void;
}) {
  const [memo, setMemo] = useState(initialMemo ?? "");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">(
    "saved"
  );

  useEffect(() => {
    if (memo === (initialMemo ?? "")) return;

    setSaveStatus("idle");

    const timer = setTimeout(() => {
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("item_id", itemId);
      formData.append("memo", memo);

      setSaveStatus("saving");
      updateItemMemo(formData);
      setSaveStatus("saved");
    }, 800);

    return () => clearTimeout(timer);
  }, [memo, initialMemo, itemId, projectId, updateItemMemo]);

  return (
    <div className="w-full">
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="メモ"
        className="w-full rounded border p-2 text-sm"
      />
      <div className="mt-1 text-xs text-gray-400">
        {saveStatus === "saving"
          ? "保存中..."
          : saveStatus === "saved"
          ? "保存済み"
          : "入力中..."}
      </div>
    </div>
  );
}

function CompletedInfoEditor({
  item,
  projectId,
  workers,
  updateCompletedInfo,
}: {
  item: ProgressItem;
  projectId: string;
  workers: Worker[];
  updateCompletedInfo: (formData: FormData) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [completedDate, setCompletedDate] = useState(item.completed_date ?? "");
  const [completedBy, setCompletedBy] = useState(item.completed_by ?? "");

  if (!item.completed_date) return null;

  if (!isEditing) {
    return (
      <div className="space-y-1 text-sm">
        <div>完了日：{item.completed_date}</div>
        {item.completed_by && (
          <div className="text-gray-600">作業者：{item.completed_by}</div>
        )}
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded bg-gray-200 px-2 py-1 text-xs"
        >
          変更
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        updateCompletedInfo(formData);
        setIsEditing(false);
      }}
      className="space-y-2"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="item_id" value={item.id} />

      <input
        type="date"
        name="completed_date"
        value={completedDate}
        onChange={(e) => setCompletedDate(e.target.value)}
        className="w-full rounded border p-1 text-sm"
      />

      <select
        name="completed_by"
        value={completedBy}
        onChange={(e) => setCompletedBy(e.target.value)}
        className="w-full rounded border p-1 text-sm"
      >
        <option value="">未選択</option>
        {workers.map((worker) => (
          <option key={worker.id} value={worker.name}>
            {worker.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button type="submit" className="rounded bg-blue-600 px-2 py-1 text-xs text-white">
          保存
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="rounded bg-gray-300 px-2 py-1 text-xs"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

function AddProgressItemForm({
  projectId,
  groupId,
  category,
  sectionName,
  addProgressItem,
}: {
  projectId: string;
  groupId: string;
  category: string;
  sectionName: string | null;
  addProgressItem: (formData: FormData) => void;
}) {
  const [taskName, setTaskName] = useState("");

  return (
    <form
      action={(formData) => {
        addProgressItem(formData);
        setTaskName("");
      }}
      className="mt-4 rounded-lg border border-dashed bg-gray-50 p-3"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="section_name" value={sectionName ?? ""} />

      <p className="mb-2 text-sm font-bold text-gray-700">
        ＋ この項目に工程を追加
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="task_name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="追加する工程名"
          className="flex-1 rounded border p-2 text-sm"
          required
        />

        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          追加
        </button>
      </div>
    </form>
  );
}

function ProgressItemRowContent({
  item,
  projectId,
  workers,
  deleteProgressItem,
  updateItemMemo,
  updateCompletedInfo,
}: {
  item: ProgressItem;
  projectId: string;
  workers: Worker[];
  deleteProgressItem: (formData: FormData) => void;
  updateItemMemo: (formData: FormData) => void;
  updateCompletedInfo: (formData: FormData) => void;
}) {
  const statusColor =
    item.status === "完了"
      ? "bg-green-100 text-green-800"
      : item.status === "作業中"
      ? "bg-yellow-100 text-yellow-800"
      : item.status === "対象外"
      ? "bg-gray-200 text-gray-600"
      : "bg-white text-gray-700";

  return (
    <>
      <div>
        <div className="text-xs text-gray-500 md:hidden">工程名</div>
        <div className="font-medium">{item.task_name}</div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-500 md:hidden">ステータス</div>
        <span className={`inline-block rounded-full px-3 py-1 text-sm ${statusColor}`}>
          {item.status}
        </span>
        <ProgressStatusButtons
          itemId={item.id}
          currentStatus={item.status}
          projectId={projectId}
          workers={workers}
        />
      </div>

      <div>
        <CompletedInfoEditor
          item={item}
          projectId={projectId}
          workers={workers}
          updateCompletedInfo={updateCompletedInfo}
        />
      </div>

      <div>
        <div className="text-xs text-gray-500 md:hidden">メモ</div>
        <MemoInput
          projectId={projectId}
          itemId={item.id}
          initialMemo={item.memo}
          updateItemMemo={updateItemMemo}
        />
      </div>

      <form action={deleteProgressItem}>
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="item_id" value={item.id} />
        <button
          type="submit"
          onClick={(e) => {
            if (!confirm(`「${item.task_name}」を削除しますか？`)) {
              e.preventDefault();
            }
          }}
          className="w-full rounded bg-red-600 px-3 py-2 text-sm text-white md:w-auto"
        >
          削除
        </button>
      </form>
    </>
  );
}

function StaticProgressItemRow(props: {
  item: ProgressItem;
  projectId: string;
  workers: Worker[];
  deleteProgressItem: (formData: FormData) => void;
  updateItemMemo: (formData: FormData) => void;
  updateCompletedInfo: (formData: FormData) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b bg-white py-3 md:grid-cols-[auto_1.2fr_1.4fr_1fr_1.4fr_auto] md:items-center md:gap-4">
      <button type="button" className="w-full rounded bg-gray-200 px-3 py-2 text-sm font-bold text-gray-700 md:w-auto">
        ☰
      </button>
      <ProgressItemRowContent {...props} />
    </div>
  );
}

function SortableProgressItemRow(props: {
  item: ProgressItem;
  projectId: string;
  workers: Worker[];
  deleteProgressItem: (formData: FormData) => void;
  updateItemMemo: (formData: FormData) => void;
  updateCompletedInfo: (formData: FormData) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid grid-cols-1 gap-3 border-b bg-white py-3 md:grid-cols-[auto_1.2fr_1.4fr_1fr_1.4fr_auto] md:items-center md:gap-4 ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="w-full cursor-grab rounded bg-gray-200 px-3 py-2 text-sm font-bold text-gray-700 md:w-auto"
      >
        ☰
      </button>
      <ProgressItemRowContent {...props} />
    </div>
  );
}

export default function ProgressItemGroup({
  projectId,
  groupId,
  groupName,
  category,
  sectionName,
  items,
  workers,
  addProgressItem,
  deleteItemGroup,
  deleteProgressItem,
  updateItemMemo,
  updateItemGroup,
  updateProgressItemSortOrders,
  updateCompletedInfo,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [orderedItems, setOrderedItems] = useState(items);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedItems.findIndex((item) => item.id === active.id);
    const newIndex = orderedItems.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(orderedItems, oldIndex, newIndex);
    setOrderedItems(newItems);

    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("item_ids", JSON.stringify(newItems.map((item) => item.id)));
    updateProgressItemSortOrders(formData);
  };

  const total = orderedItems.length;
  const completed = orderedItems.filter(
    (item) => item.status === "完了" || item.status === "対象外"
  ).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-left text-xl font-bold md:text-2xl"
        >
          {isOpen ? "▼" : "▶"} {groupName} ({progress}%)
        </button>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="h-10 rounded bg-gray-700 px-4 text-white"
          >
            {isEditing ? "編集を閉じる" : "項目名を編集"}
          </button>

          <form action={deleteItemGroup}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="group_id" value={groupId} />
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm(`「${groupName}」を削除しますか？`)) {
                  e.preventDefault();
                }
              }}
              className="h-10 w-full rounded bg-red-600 px-4 text-white md:w-auto"
            >
              項目削除
            </button>
          </form>
        </div>
      </div>

      {isEditing && (
        <form action={updateItemGroup} className="mb-4 rounded bg-gray-50 p-3">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="group_id" value={groupId} />

          <div className="grid gap-3 md:grid-cols-2">
            <input name="new_category" defaultValue={category} className="w-full rounded border p-2" required />
            <input name="new_section_name" defaultValue={sectionName ?? ""} className="w-full rounded border p-2" />
          </div>

          <button type="submit" className="mt-3 rounded bg-black px-4 py-2 text-white">
            保存
          </button>
        </form>
      )}

      <div className="mb-3">
        <div className="h-2 rounded bg-gray-200">
          <div className="h-2 rounded bg-green-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {isOpen && (
        <>
          {!isMounted ? (
            <div className="space-y-3">
              {orderedItems.map((item) => (
                <StaticProgressItemRow
                  key={item.id}
                  item={item}
                  projectId={projectId}
                  workers={workers}
                  deleteProgressItem={deleteProgressItem}
                  updateItemMemo={updateItemMemo}
                  updateCompletedInfo={updateCompletedInfo}
                />
              ))}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={orderedItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {orderedItems.map((item) => (
                    <SortableProgressItemRow
                      key={item.id}
                      item={item}
                      projectId={projectId}
                      workers={workers}
                      deleteProgressItem={deleteProgressItem}
                      updateItemMemo={updateItemMemo}
                      updateCompletedInfo={updateCompletedInfo}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <AddProgressItemForm
            projectId={projectId}
            groupId={groupId}
            category={category}
            sectionName={sectionName}
            addProgressItem={addProgressItem}
          />
        </>
      )}
    </section>
  );
}