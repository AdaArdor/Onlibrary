import React from "react";
import { XMarkIcon, ChatBubbleLeftEllipsisIcon, PencilIcon } from "@heroicons/react/24/solid";

interface Book {
  id: number;
  title: string;
  authors: string[];
  coverUrl?: string;
  tags?: string[];
  publisher?: string;
  finishedMonth?: string; // Format: YYYY-MM
  releaseYear?: string;

  // NEW
  notes?: string;
}

interface BookCardProps {
  book: Book;

  // Visual behavior
  clickable?: boolean;
  selected?: boolean;
  view?: "grid" | "list";

  // Optional actions
  onClick?: (book: Book) => void;
  onRemove?: (id: number) => void;
  onEdit?: (book: Book) => void;

  // Drag props from dnd-kit
  dragListeners?: any;
  dragAttributes?: any;
  dragRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;

  // If used in drag overlay
  isDraggingPreview?: boolean;

  // Optional delete button visibility
  showRemove?: boolean;
  showEdit?: boolean;
}

export default function BookCard({
  book,
  clickable = false,
  selected = false,
  view = "grid",
  onClick,
  onRemove,
  onEdit,
  dragListeners,
  dragAttributes,
  dragRef,
  style,
  isDraggingPreview = false,
  showRemove = false,
  showEdit = false,
}: BookCardProps) {
  const placeholder = "https://via.placeholder.com/120x190?text=No+Cover";

  // LIST VIEW
  if (view === "list") {
    const authors = book.authors?.join(", ") || "";
    const hasNotes = Boolean(book.notes);

  return (
    <div className="relative" ref={dragRef} style={style} {...dragAttributes} {...dragListeners}>
      {/* MAIN LIST ROW */}
      <button
        onClick={clickable ? () => onClick?.(book) : undefined}
        className={`
          w-full
          text-left
          px-4 py-3
          rounded-lg
          bg-paper dark:bg-night
          text-ink dark:text-parchment
          border border-oak/10 dark:border-parchment/10
          hover:bg-pthalo/5 dark:hover:bg-fern/5
          transition-colors duration-200
          flex items-center justify-between
        `}
      >
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg text-pthalo dark:text-fern truncate">
            {book.title}
          </div>
          <div className="text-sm text-oak dark:text-parchment/70 truncate">
            {authors}
            {book.releaseYear && ` • ${book.releaseYear}`}
          </div>
        </div>

        {book.tags && book.tags.length > 0 && (
          <div className="ml-4 text-sm text-oak dark:text-parchment/70 whitespace-nowrap overflow-hidden overflow-ellipsis">
            {book.tags.join(", ")}
          </div>
        )}
      </button>

      {/* NOTES ICON (list view - visual indicator only) */}
      {hasNotes && (
        <div
          className="
            absolute top-1 right-12 
            p-1 bg-paper dark:bg-night 
            border border-oak/20 dark:border-parchment/20
            rounded text-pthalo dark:text-fern
          "
        >
          <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

  // GRID VIEW
  return (
    <div
      ref={dragRef}
      style={style}
      {...dragAttributes}
      {...dragListeners}
      onClick={clickable ? () => onClick?.(book) : undefined}
      className={`
        relative card
        bg-bone dark:bg-cellar
        text-ink dark:text-parchment
        w-[175px]
        h-[370px]
        rounded-xl
        overflow-hidden
        p-3
        flex flex-col
        transition-all duration-200
        shadow-md
        ${clickable ? "cursor-pointer" : ""}
        ${selected ? "border-4 border-pthalo dark:border-fern bg-pthalo/10 dark:bg-fern/10 scale-[1.06] shadow-xl ring-2 ring-pthalo/20 dark:ring-fern/20" : ""}
        ${
          isDraggingPreview
            ? "scale-[1.07] shadow-2xl"
            : "hover:scale-[1.02] hover:shadow-lg"
        }
      `}
    >
      {/* SELECTED INDICATOR */}
      {selected && (
        <div className="absolute top-2 right-2 bg-pthalo dark:bg-fern text-white rounded-full p-1 shadow-lg z-30">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* EDIT BUTTON */}
      {showEdit && !selected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(book);
          }}
          className="absolute top-2 right-2 p-1 bg-paper dark:bg-night border border-oak/20 dark:border-parchment/20 rounded-full shadow-sm hover:bg-pthalo/10 dark:hover:bg-fern/20 z-20 transition-colors"
        >
          <PencilIcon className="w-4 h-4 text-pthalo dark:text-fern" />
        </button>
      )}

      {/* REMOVE BUTTON */}
      {showRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(book.id);
          }}
          className="absolute top-1 right-1 bg-red-200 dark:bg-red-300 text-red-900 dark:text-night rounded-full p-0.5 shadow-sm hover:scale-110 transition-transform"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      )}

      {/* NOTES ICON (grid view — visual indicator only, positioned below edit icon) */}
      {book.notes && (
        <div
          className="
            absolute top-12 right-2
            p-1
            bg-paper dark:bg-night
            border border-oak/20 dark:border-parchment/20
            rounded-full shadow-sm
            z-20
          "
        >
          <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-pthalo dark:text-fern" />
        </div>
      )}



      {/* COVER */}
      <img
        src={book.coverUrl || placeholder}
        className="w-[120px] h-[190px] object-cover mx-auto rounded"
        alt={book.title}
      />

      {/* AUTHORS */}
      {book.authors && (
        <p className="text-sm text-oak text-center mt-1 line-clamp-1">
          {book.authors.join(", ")}
        </p>
      )}

      {/* TITLE */}
      <h2 className="title-3line font-bold text-center text-pthalo dark:text-fern mt-1">
        {book.title}
      </h2>

      {/* PUBLISHER */}
      {book.publisher && (
        <p className="text-xs text-oak/80 dark:text-parchment/70 text-center mt-1 line-clamp-1">
          {book.publisher}
        </p>
      )}

      {/* RELEASE YEAR */}
      {book.releaseYear && (
        <p className="text-xs text-oak dark:text-parchment/70 text-center mt-1">
          {book.releaseYear}
        </p>
      )}

      {/* TAGS */}
      {book.tags && book.tags.length > 0 && (
        <div className="tags-3line flex flex-wrap justify-center gap-1 mt-2">
          {book.tags.map((tag) => (
            <span
              key={tag}
              className="
                bg-fern/30 dark:bg-pthalo/40 
                text-pthalo dark:text-parchment 
                px-1.5 py-0.5 text-[8px] 
                rounded-full border border-pthalo/30
              "
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
