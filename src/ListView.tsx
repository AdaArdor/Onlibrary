import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilIcon,
  Squares2X2Icon,
  Bars3Icon,
} from "@heroicons/react/24/solid";

import BookCard from "./components/ui/BookCard";
import Reordergrid from "./components/ui/Reordergrid";
import { useAuth } from "./AuthContext";
import { booksService, listsService } from "./lib/database";

interface Book {
  id: number;
  title: string;
  authors: string[];
  coverUrl?: string;
  publisher?: string;
  tags?: string[];
}

interface BookList {
  id: number;
  name: string;
  coverUrl?: string;
  bookIds: number[];
}

interface ListViewProps {
  darkMode?: boolean;
}

export default function ListView({ darkMode = false }: ListViewProps) {
  const { listId: id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  console.log("ListView: Raw listId parameter:", id, typeof id);
  const listId = id ? Number(id) : NaN;
  console.log("ListView: Parsed listId:", listId, typeof listId);

  const [books, setBooks] = useState<Book[]>([]);
  const [lists, setLists] = useState<BookList[]>([]);
  const [editing, setEditing] = useState(false);

  const [editName, setEditName] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState<string | undefined>();
  const [editBookIds, setEditBookIds] = useState<number[]>([]);
  const [bookSearch, setBookSearch] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBackgroundEditor, setShowBackgroundEditor] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Load books from Firebase
  useEffect(() => {
    if (!user) {
      setBooks([]);
      return;
    }

    const unsubscribe = booksService.subscribeToUserBooks(user, (firebaseBooks) => {
      console.log("ListView: Received books from Firebase:", firebaseBooks.length);
      setBooks(firebaseBooks);
    });

    return () => unsubscribe();
  }, [user]);

  // Load lists from Firebase
  useEffect(() => {
    if (!user) {
      setLists([]);
      return;
    }

    const unsubscribe = listsService.subscribeToUserLists(user, (firebaseLists) => {
      console.log("ListView: Received lists from Firebase:", firebaseLists.length);
      console.log("ListView: Looking for listId:", listId);
      setLists(firebaseLists);
    });

    return () => unsubscribe();
  }, [user, listId]);

  const list = lists.find((l) => l.id === listId) || null;

  useEffect(() => {
    if (list && !editing) {
      setEditName(list.name);
      setEditCoverUrl(list.coverUrl);
      setEditBookIds(list.bookIds);
    }
  }, [list, editing]);

  if (!list) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <div className="min-h-screen bg-paper dark:bg-night text-ink dark:text-parchment p-6">
          <button
            onClick={() => navigate("/lists")}
            className="flex items-center gap-1 text-pthalo dark:text-fern mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Lists
          </button>
          <h1 className="text-xl font-semibold mb-4">List not found</h1>
          <div className="text-sm text-oak dark:text-parchment/70">
            <p>Looking for list ID: {listId}</p>
            <p>Available lists: {lists.length}</p>
            <p>List IDs: {lists.map(l => l.id).join(", ")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Books in view mode
  const viewBooks = list.bookIds
    .map((id) => books.find((b) => b.id === id) || null)
    .filter((b): b is Book => b !== null);

  // Books in edit mode
  const editBooks = editBookIds
    .map((id) => books.find((b) => b.id === id) || null)
    .filter((b): b is Book => b !== null);

  function startEdit() {
    setEditing(true);
  }

  function cancelEdit() {
    if (!list) return;
    setEditing(false);
    setEditName(list.name);
    setEditCoverUrl(list.coverUrl);
    setEditBookIds(list.bookIds);
    setBookSearch("");
  }

  async function saveEdit() {
    if (!list || !user) return;
    const trimmedName = editName.trim() || "Untitled list";
    const updatedList: BookList = {
      ...list,
      name: trimmedName,
      coverUrl: editCoverUrl,
      bookIds: editBookIds,
    };

    try {
      await listsService.updateList(user, updatedList);
      setEditing(false);
    } catch (error) {
      console.error("Error updating list:", error);
      alert("Failed to update list. Please try again.");
    }
  }

  async function deleteListConfirmed() {
    if (!list || !user) return;
    
    try {
      await listsService.deleteList(user, list.id);
      navigate("/lists");
    } catch (error) {
      console.error("Error deleting list:", error);
      alert("Failed to delete list. Please try again.");
    }
  }

  function toggleBook(id: number) {
    setEditBookIds((prev) =>
      prev.includes(id)
        ? prev.filter((b) => b !== id)
        : [...prev, id]
    );
  }

  function matches(b: Book) {
    const q = bookSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      b.authors.join(" ").toLowerCase().includes(q) ||
      (b.tags || []).join(" ").toLowerCase().includes(q)
    );
  }

  const allBooksForAdd = books.filter(matches);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-paper dark:bg-night text-ink dark:text-parchment p-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/lists")}
            className="flex items-center gap-1 text-pthalo dark:text-fern"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Lists
          </button>

          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 bg-pthalo dark:bg-fern text-paper dark:text-night px-3 py-2 rounded-full shadow hover:shadow-lg transition-shadow"
            >
              <PencilIcon className="w-5 h-5" />
              Edit List
            </button>
          )}
        </div>

        {/* VIEW MODE TITLE */}
        {!editing && (
          <div className="mt-4 flex items-center justify-between">
            <h1 className="text-4xl font-bold text-pthalo dark:text-fern">
              {list.name}
            </h1>
            
            {/* View Toggle (icon buttons) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`
                  p-2 rounded 
                  ${viewMode === "grid"
                    ? "bg-pthalo dark:bg-fern text-paper"
                    : "bg-paper dark:bg-night border border-oak/30 dark:border-parchment/30"}
                `}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>

              <button
                onClick={() => setViewMode("list")}
                className={`
                  p-2 rounded 
                  ${viewMode === "list"
                    ? "bg-pthalo dark:bg-fern text-paper"
                    : "bg-paper dark:bg-night border border-oak/30 dark:border-parchment/30"}
                `}
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* EDIT MODE TITLE + BUTTONS */}
        {editing && (
          <div className="mt-4 flex flex-col gap-6">

            {/* Title Input with Background Button */}
            <div className="flex items-start gap-4">
              <div className="flex-1 flex flex-col gap-2 max-w-2xl">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value.slice(0, 50))}
                  className="text-3xl font-bold bg-transparent border-2 border-pthalo/30 dark:border-fern/30 rounded-lg px-4 py-3 text-pthalo dark:text-fern placeholder:text-pthalo/50 dark:placeholder:text-fern/50 focus:border-pthalo dark:focus:border-fern focus:outline-none transition-colors w-full"
                  placeholder="Enter list name..."
                  maxLength={50}
                />
                <div className="text-xs text-oak dark:text-parchment/60">
                  {editName.length}/50 characters
                </div>
              </div>
              
              {/* Background Button */}
              <button
                onClick={() => setShowBackgroundEditor(!showBackgroundEditor)}
                className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
                  showBackgroundEditor
                    ? 'border-pthalo dark:border-fern bg-pthalo/10 dark:bg-fern/10 text-pthalo dark:text-fern'
                    : 'border-oak/30 dark:border-parchment/30 hover:border-pthalo dark:hover:border-fern text-oak dark:text-parchment'
                }`}
              >
                🎨 {showBackgroundEditor ? 'Close' : 'Background'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 rounded-full border border-oak/40 dark:border-parchment/40 text-sm hover:bg-oak/10 dark:hover:bg-parchment/10 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="px-6 py-2 rounded-full bg-pthalo dark:bg-fern text-paper dark:text-night text-sm font-semibold shadow hover:shadow-lg transition-shadow"
              >
                Save Changes
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-full bg-red-200 dark:bg-red-300 text-red-900 dark:text-night text-sm font-semibold border border-red-300 shadow-sm hover:shadow-md transition-shadow"
              >
                Delete List
              </button>
            </div>

            {/* BACKGROUND EDITOR (conditional) */}
            {showBackgroundEditor && (
              <div className="border-2 border-pthalo/20 dark:border-fern/20 rounded-xl p-6 bg-pthalo/5 dark:bg-fern/5">
                <div className="grid grid-cols-3 gap-6">
                  {/* Left: Background Options */}
                  <div className="col-span-2">
                    <p className="text-lg font-semibold text-pthalo dark:text-fern mb-3">Choose Background</p>
                
                {/* Predefined Background Options */}
                <div className="grid grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto pr-1">
                {[
                  { name: 'None', value: undefined, preview: 'bg-chalk dark:bg-cellar' },
                  { name: 'Minimal Light', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBzdG9wLWNvbG9yPSIjZjlmYWZiIiBzdG9wLW9wYWNpdHk9IjAuOCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2UyZThmMCIgc3RvcC1vcGFjaXR5PSIwLjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==', preview: 'bg-gradient-to-br from-gray-50 to-gray-200' },
                  { name: 'Minimal Dark', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBzdG9wLWNvbG9yPSIjMzc0MTUxIiBzdG9wLW9wYWNpdHk9IjAuOSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFmMjkzNyIgc3RvcC1vcGFjaXR5PSIwLjciLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNiKSIvPjwvc3ZnPg==', preview: 'bg-gradient-to-br from-gray-700 to-gray-900' },
                  { name: 'Warm Beige', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJjIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBzdG9wLWNvbG9yPSIjZmJmOGY0IiBzdG9wLW9wYWNpdHk9IjAuOCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2Y0ZTZkNyIgc3RvcC1vcGFjaXR5PSIwLjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNjKSIvPjwvc3ZnPg==', preview: 'bg-gradient-to-br from-amber-50 to-amber-100' },
                  { name: 'Cool Blue', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBzdG9wLWNvbG9yPSIjZWZmNmZmIiBzdG9wLW9wYWNpdHk9IjAuOCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2RiZWFmZSIgc3RvcC1vcGFjaXR5PSIwLjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNkKSIvPjwvc3ZnPg==', preview: 'bg-gradient-to-br from-blue-50 to-blue-100' },
                  { name: 'Soft Green', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJlIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBzdG9wLWNvbG9yPSIjZjBmZGY0IiBzdG9wLW9wYWNpdHk9IjAuOCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2RjZmNlNyIgc3RvcC1vcGFjaXR5PSIwLjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNlKSIvPjwvc3ZnPg==', preview: 'bg-gradient-to-br from-green-50 to-green-100' },
                  { name: 'Soft Purple', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJmIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBzdG9wLWNvbG9yPSIjZmFmNWZmIiBzdG9wLW9wYWNpdHk9IjAuOCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2U5ZDVmZiIgc3RvcC1vcGFjaXR5PSIwLjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNmKSIvPjwvc3ZnPg==', preview: 'bg-gradient-to-br from-purple-50 to-purple-100' },
                  
                  // Additional presets
                  { name: 'Ocean Depths', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJvY2VhbiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agc3RvcC1jb2xvcj0iIzBmNGM3NSIgc3RvcC1vcGFjaXR5PSIwLjkiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMzI5NDEiIHN0b3Atb3BhY2l0eT0iMC44Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjb2NlYW4pIi8+PC9zdmc+', preview: 'bg-gradient-to-br from-cyan-900 to-slate-900' },
                  { name: 'Sunset', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJzdW5zZXQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiNmZWNhNTciIHN0b3Atb3BhY2l0eT0iMC45Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZWQ2NGExIiBzdG9wLW9wYWNpdHk9IjAuNyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3N1bnNldCkiLz48L3N2Zz4=', preview: 'bg-gradient-to-br from-amber-300 to-pink-400' },
                  { name: 'Forest', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJmb3Jlc3QiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiM2NWExNGIiIHN0b3Atb3BhY2l0eT0iMC45Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDY0ZTNiIiBzdG9wLW9wYWNpdHk9IjAuOCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2ZvcmVzdCkiLz48L3N2Zz4=', preview: 'bg-gradient-to-br from-green-600 to-emerald-800' },
                  { name: 'Rose Gold', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJyb3NlIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBzdG9wLWNvbG9yPSIjZmNlN2Y1IiBzdG9wLW9wYWNpdHk9IjAuOSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2Y0MjdhYSIgc3RvcC1vcGFjaXR5PSIwLjciLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNyb3NlKSIvPjwvc3ZnPg==', preview: 'bg-gradient-to-br from-pink-100 to-pink-500' }
                ].map((option) => (
                  <button
                    key={option.name}
                    onClick={() => setEditCoverUrl(option.value)}
                    className={`h-12 rounded border-2 text-xs font-medium transition-all ${
                      editCoverUrl === option.value
                        ? 'border-pthalo dark:border-fern scale-95'
                        : 'border-oak/20 dark:border-parchment/20 hover:border-oak/40 dark:hover:border-parchment/40'
                    } ${option.preview} flex items-center justify-center text-oak dark:text-parchment/80`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>

                {/* Custom Background Upload */}
                <p className="text-xs mb-2 text-oak dark:text-parchment/70">Or upload custom background:</p>
                <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  // Check file size (limit to 2MB to avoid localStorage issues)
                  if (file.size > 2 * 1024 * 1024) {
                    alert('Image file is too large. Please choose an image smaller than 2MB.');
                    return;
                  }
                  
                  // Convert to base64 to avoid blob URL issues
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const result = event.target?.result;
                      if (typeof result === 'string') {
                        setEditCoverUrl(result);
                      }
                    } catch (error) {
                      console.error('Error reading file:', error);
                      alert('Error reading image file. Please try a different image.');
                    }
                  };
                  reader.onerror = () => {
                    alert('Error reading image file. Please try again.');
                  };
                  reader.readAsDataURL(file);
                }}
                className="text-xs mb-3 w-full"
              />
              </div>

              {/* Right: Background Preview */}
              <div className="col-span-1">
                <p className="text-lg font-semibold text-pthalo dark:text-fern mb-3">Preview</p>
                {editCoverUrl ? (
                  <div className="relative w-full h-[200px] rounded-lg overflow-hidden shadow-lg border border-oak/20 dark:border-parchment/20">
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-bone dark:bg-cellar"
                      style={{ backgroundImage: `url(${editCoverUrl})` }}
                      onError={(e) => {
                        // Hide broken images gracefully
                        const target = e.target as HTMLElement;
                        target.style.backgroundImage = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <div className="text-white">
                        <div className="font-bold text-lg mb-1">{editName || 'List Name'}</div>
                        <div className="text-sm opacity-80">Preview of list background</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-[200px] rounded-lg bg-chalk dark:bg-cellar border-2 border-dashed border-oak/30 dark:border-parchment/30 flex flex-col items-center justify-center text-center p-4">
                    <div className="text-oak dark:text-parchment/70 text-sm">
                      <div className="mb-2 opacity-60">📸</div>
                      <div className="font-medium">No Background</div>
                      <div className="text-xs mt-1">Select a background to see preview</div>
                    </div>
                  </div>
                )}
              </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE - GRID OR LIST */}
        {!editing && (
          <div className={`mt-8 ${
            viewMode === "grid" 
              ? "flex flex-wrap gap-4" 
              : "grid grid-cols-1 gap-3 max-w-4xl"
          }`}>
            {viewBooks.map((book, index) => (
              <div key={book.id} className="relative">
                <div className="absolute -top-2 -left-2 z-10 bg-pthalo dark:bg-fern text-paper dark:text-night text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center shadow">
                  {index + 1}
                </div>
                <BookCard 
                  book={book} 
                  clickable={true}
                  onClick={() => navigate(`/book/${book.id}`)}
                  view={viewMode}
                />
              </div>
            ))}
          </div>
        )}

        {/* EDIT MODE REORDER GRID */}
        {editing && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-pthalo dark:text-fern mb-3">
              Reorder books
            </h2>

            <Reordergrid
              books={editBooks}
              onChange={setEditBookIds}
              onRemove={(id) =>
                setEditBookIds((prev) => prev.filter((x) => x !== id))
              }
              onBookClick={(book) => navigate(`/book/${book.id}`)}
            />
          </div>
        )}

        {/* ADD/REMOVE BOOKS */}
        {editing && (
          <div className="mt-10 w-full">
            <h2 className="text-lg font-semibold text-pthalo dark:text-fern mb-2">
              Add or remove books
            </h2>

            <input
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Search..."
              className="input-field w-full max-w-md mb-4"
            />

            <div className="grid grid-cols-6 gap-3">
              {allBooksForAdd.map((book) => {
                const selected = editBookIds.includes(book.id);
                return (
                  <BookCard
                    key={book.id}
                    book={book}
                    clickable={true}
                    selected={selected}
                    onClick={() => toggleBook(book.id)}
                  />
                );
              })}

              {allBooksForAdd.length === 0 && (
                <p className="text-sm text-oak dark:text-parchment/70 col-span-full">
                  No books match this search.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-bone dark:bg-cellar rounded-xl p-6 shadow-xl max-w-sm w-full border border-oak/20 dark:border-parchment/20">
            <h3 className="text-lg font-semibold text-pthalo dark:text-fern mb-3">
              Delete this list?
            </h3>

            <p className="text-sm text-oak dark:text-parchment/70 mb-6">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-full border border-oak/40 dark:border-parchment/40 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={deleteListConfirmed}
                className="px-4 py-1.5 rounded-full bg-red-200 dark:bg-red-300 text-red-900 dark:text-night text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
