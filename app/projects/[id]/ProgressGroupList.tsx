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
import ProgressItemGroup from "./ProgressItemGroup";

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

type GroupWithItems = {
  id: string;
  category: string;
  section_name: string | null;
  sort_order: number;
  items: ProgressItem[];
};

type Props = {
  projectId: string;
  groups: GroupWithItems[];
  workers: Worker[];
  addProgressItem: (formData: FormData) => void;
  deleteItemGroup: (formData: FormData) => void;
  deleteProgressItem: (formData: FormData) => void;
  updateItemMemo: (formData: FormData) => void;
  updateItemGroup: (formData: FormData) => void;
  updateProgressItemSortOrders: (formData: FormData) => void;
  updateProgressGroupSortOrders: (formData: FormData) => void;
  updateCompletedInfo: (formData: FormData) => void;
};

function SortableGroup({
  group,
  projectId,
  workers,
  addProgressItem,
  deleteItemGroup,
  deleteProgressItem,
  updateItemMemo,
  updateItemGroup,
  updateProgressItemSortOrders,
  updateCompletedInfo,
}: {
  group: GroupWithItems;
  projectId: string;
  workers: Worker[];
  addProgressItem: (formData: FormData) => void;
  deleteItemGroup: (formData: FormData) => void;
  deleteProgressItem: (formData: FormData) => void;
  updateItemMemo: (formData: FormData) => void;
  updateItemGroup: (formData: FormData) => void;
  updateProgressItemSortOrders: (formData: FormData) => void;
  updateCompletedInfo: (formData: FormData) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const groupName = group.section_name
    ? `${group.category} ${group.section_name}`
    : group.category;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-60" : ""}
    >
      <ProgressItemGroup
        projectId={projectId}
        groupId={group.id}
        groupName={groupName}
        category={group.category}
        sectionName={group.section_name}
        items={group.items}
        workers={workers}
        dragAttributes={attributes}
        dragListeners={listeners}
        addProgressItem={addProgressItem}
        deleteItemGroup={deleteItemGroup}
        deleteProgressItem={deleteProgressItem}
        updateItemMemo={updateItemMemo}
        updateItemGroup={updateItemGroup}
        updateProgressItemSortOrders={updateProgressItemSortOrders}
        updateCompletedInfo={updateCompletedInfo}
      />
    </div>
  );
}

export default function ProgressGroupList({
  projectId,
  groups,
  workers,
  addProgressItem,
  deleteItemGroup,
  deleteProgressItem,
  updateItemMemo,
  updateItemGroup,
  updateProgressItemSortOrders,
  updateProgressGroupSortOrders,
  updateCompletedInfo,
}: Props) {
  const [orderedGroups, setOrderedGroups] = useState(groups);

  useEffect(() => {
    setOrderedGroups(groups);
  }, [groups]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedGroups.findIndex((group) => group.id === active.id);
    const newIndex = orderedGroups.findIndex((group) => group.id === over.id);

    const newGroups = arrayMove(orderedGroups, oldIndex, newIndex);
    setOrderedGroups(newGroups);

    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append(
      "group_ids",
      JSON.stringify(newGroups.map((group) => group.id))
    );

    updateProgressGroupSortOrders(formData);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedGroups.map((group) => group.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-8">
          {orderedGroups.map((group) => (
            <SortableGroup
              key={group.id}
              group={group}
              projectId={projectId}
              workers={workers}
              addProgressItem={addProgressItem}
              deleteItemGroup={deleteItemGroup}
              deleteProgressItem={deleteProgressItem}
              updateItemMemo={updateItemMemo}
              updateItemGroup={updateItemGroup}
              updateProgressItemSortOrders={updateProgressItemSortOrders}
              updateCompletedInfo={updateCompletedInfo}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}