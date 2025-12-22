"use client";

import { useEffect, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Id = string;

type Props<T extends { id: Id }> = {
  items: T[];
  onReorderLocal: (next: T[]) => void;
  onReorderPersist: (next: T[]) => Promise<void>;
  renderItem: (
    item: T,
    index: number,
    ctx: { dragHandleProps: React.HTMLAttributes<HTMLElement> }
  ) => React.ReactNode;
  debounceMs?: number;
};

export function QuestionsSortableList<T extends { id: Id }>({
  items,
  onReorderLocal,
  onReorderPersist,
  renderItem,
  debounceMs = 500,
}: Props<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // --- Debounce persist
  const timerRef = useRef<number | null>(null);
  const lastPayloadRef = useRef<T[] | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  function schedulePersist(next: T[], rollbackTo: T[]) {
    lastPayloadRef.current = next;
  
    if (timerRef.current) window.clearTimeout(timerRef.current);
  
    timerRef.current = window.setTimeout(async () => {
      // attend la requête précédente
      if (inFlightRef.current) {
        try {
          await inFlightRef.current;
        } catch {
          // ignore
        }
      }
  
      const payload = lastPayloadRef.current;
      if (!payload) return;
  
      const p = onReorderPersist(payload);
      inFlightRef.current = p;
  
      try {
        await p;
      } catch {
        onReorderLocal(rollbackTo);
      } finally {
        inFlightRef.current = null;
      }
    }, debounceMs);
  }
  
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  function SortableRow({
    id,
    children,
  }: {
    id: Id;
    children: (ctx: {
      dragHandleProps: React.HTMLAttributes<HTMLElement>;
    }) => React.ReactNode;
  }) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
      useSortable({ id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.7 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        {children({ dragHandleProps: listeners as React.HTMLAttributes<HTMLElement> })}
      </div>
    );
  }
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
  
    const moved = arrayMove(items, oldIndex, newIndex);
  
    // recalculer orderIndex si présent
    const next = moved.map((it: T, idx: number) => {
      if ("orderIndex" in it) return { ...it, orderIndex: idx + 1 };
      return it;
    });
    const prev = items;
    onReorderLocal(next);
    schedulePersist(next, prev);
  }
  
  if (!mounted) {
    // SSR-friendly fallback
    return <div className="space-y-2">{items.map((it, i) => renderItem(it, i, { dragHandleProps: {} }))}</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableRow key={item.id} id={item.id}>
              {(ctx) => renderItem(item, index, ctx)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
