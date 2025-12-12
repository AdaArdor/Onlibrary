import React, { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import BookCard from "./BookCard";

interface Book {
  id: number;
  title: string;
  authors: string[];
  coverUrl?: string;
  tags?: string[];
  publisher?: string;
}

interface Props {
  books: Book[];
  onChange: (newOrder: number[]) => void;
  onRemove: (id: number) => void;
  onBookClick?: (book: Book) => void;
}

// -----------------------------------
// Main Component
// -----------------------------------
export default function Reordergrid({ books, onChange, onRemove, onBookClick }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const [activeId, setActiveId] = useState<number | null>(null);

  const activeBook = books.find((b) => b.id === activeId) || null;

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = books.findIndex((b) => b.id === active.id);
    const newIndex = books.findIndex((b) => b.id === over.id);

    const reordered = arrayMove(books, oldIndex, newIndex);
    onChange(reordered.map((b) => b.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={books.map((b) => b.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-6 gap-3">
          {books.map((book, index) => (
            <SortableItem
              key={book.id}
              book={book}
              onRemove={onRemove}
              index={index}
              onBookClick={onBookClick}
            />
          ))}
        </div>
      </SortableContext>

      {/* OVERLAY PREVIEW */}
      <DragOverlay>
        {activeBook ? (
          <BookCard
            book={activeBook}
            showRemove={false}
            isDraggingPreview={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// -----------------------------------
// Sortable Card Wrapper
// -----------------------------------
function SortableItem({ book, onRemove, index, onBookClick }: { book: Book; onRemove: (id: number) => void; index: number; onBookClick?: (book: Book) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: book.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.15 : 1,
  };

  return (
    <div className="relative">

      {/* Book Number */}
      <div className="absolute -top-2 -left-2 z-30 bg-pthalo dark:bg-fern text-paper dark:text-night text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center shadow">
        {index + 1}
      </div>

      {/* Drag Handle - positioned below the number */}
      <div
        {...listeners}
        {...attributes}
        className="absolute top-6 -left-1 z-20 cursor-grab active:cursor-grabbing bg-pthalo/90 dark:bg-fern/90 text-paper dark:text-night text-sm select-none px-2 py-1 rounded shadow-sm hover:bg-pthalo dark:hover:bg-fern transition-colors"
      >
        {/* Drag handle icon: grip lines */}
        <div className="flex flex-col items-center gap-0.5 leading-none">
          <div className="w-3 h-0.5 bg-current rounded"></div>
          <div className="w-3 h-0.5 bg-current rounded"></div>
          <div className="w-3 h-0.5 bg-current rounded"></div>
        </div>
      </div>

      <BookCard
        book={book}
        onRemove={onRemove}
        showRemove={true}
        dragRef={setNodeRef}
        style={style}
        clickable={!!onBookClick}
        onClick={onBookClick}
      />
    </div>
  );
}
