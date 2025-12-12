import { useState, useEffect } from "react";
import {
  PlusIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { sampleBooks, sampleLists } from "./lib/sampleData";
import { booksService, listsService } from "./lib/database";


interface Book {
  id: number;
  title: string;
  authors: string[];
  coverUrl?: string;
  tags?: string[];
}

interface BookList {
  id: number;
  name: string;
  coverUrl?: string;
  bookIds: number[];
}

export default function Lists({ darkMode = false }) {
  const { isDemo, user } = useAuth();
  
  const [books, setBooks] = useState<Book[]>([]);
  const [lists, setLists] = useState<BookList[]>([]);

  // Load books from Firebase or demo data
  useEffect(() => {
    if (isDemo) {
      setBooks(sampleBooks);
      return;
    }

    if (!user) {
      setBooks([]);
      return;
    }

    // Subscribe to real-time book updates
    const unsubscribe = booksService.subscribeToUserBooks(user, (firebaseBooks) => {
      console.log("Lists: Received books from Firebase:", firebaseBooks.length);
      setBooks(firebaseBooks);
    });

    return () => unsubscribe();
  }, [isDemo, user]);

  // Load lists from Firebase or demo data
  useEffect(() => {
    if (isDemo) {
      setLists(sampleLists);
      return;
    }

    if (!user) {
      setLists([]);
      return;
    }

    // Subscribe to real-time list updates
    const unsubscribe = listsService.subscribeToUserLists(user, (firebaseLists) => {
      console.log("Lists: Received lists from Firebase:", firebaseLists.length);
      setLists(firebaseLists);
    });

    return () => unsubscribe();
  }, [isDemo, user]);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form
  const [newListName, setNewListName] = useState("");
  const [listCoverUrl, setListCoverUrl] = useState<string | undefined>();
  const [tempBookIds, setTempBookIds] = useState<number[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const navigate = useNavigate();


  function resetForm() {
    setNewListName("");
    setListCoverUrl(undefined);
    setTempBookIds([]);
    setEditingListId(null);
  }

  function openAddList() {
    resetForm();
    setSidebarOpen(true);
  }

  function openEditList(list: BookList) {
    setEditingListId(list.id);
    setNewListName(list.name);
    setListCoverUrl(list.coverUrl);
    setTempBookIds([...list.bookIds]);
    setSidebarOpen(true);
  }

  function cancelListEditing() {
    setSidebarOpen(false);
    resetForm();
  }

  async function saveList() {
    console.log("💾 saveList called", { newListName, user: !!user, isDemo, editingListId });
    
    if (!newListName.trim()) {
      console.log("❌ List name is empty");
      alert("Please enter a list name");
      return;
    }

    if (isDemo) {
      alert("This is a demo! Sign up to save your own lists.");
      return;
    }

    if (!user) {
      alert("You must be logged in to save lists.");
      return;
    }

    try {
      let coverToSave = listCoverUrl;

      // If it's a data URL (uploaded from computer), upload to Firebase Storage
      if (listCoverUrl?.startsWith('data:')) {
        console.log("📤 Uploading image to Firebase Storage...");
        const { uploadImageToStorage, generateImageFilename } = await import('./lib/imageUtils');
        const filename = generateImageFilename(user.uid, 'list-covers');
        coverToSave = await uploadImageToStorage(listCoverUrl, filename);
        console.log("✅ Image uploaded:", coverToSave);
      }

      const updated: BookList = {
        id: editingListId ?? Date.now(),
        name: newListName.trim(),
        bookIds: tempBookIds,
        // Only include coverUrl if it has a valid value
        ...(coverToSave && { coverUrl: coverToSave }),
      };

      console.log("📝 Saving list:", updated);

      if (editingListId !== null) {
        console.log("✏️ Updating existing list");
        await listsService.updateList(user, updated);
      } else {
        console.log("➕ Creating new list");
        await listsService.saveList(user, updated);
      }
      console.log("✅ List saved successfully");
      cancelListEditing();
    } catch (error) {
      console.error("❌ Error saving list:", error);
      alert(`Failed to save list: ${error}`);
    }
  }

  async function deleteListFromEdit() {
    if (editingListId === null) return;
    
    if (isDemo) {
      alert("This is a demo! Sign up to modify lists.");
      return;
    }

    if (!user) {
      alert("You must be logged in to delete lists.");
      return;
    }
    
    try {
      await listsService.deleteList(user, editingListId);
      cancelListEditing();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting list:", error);
      alert("Failed to delete list. Please try again.");
    }
  }

  function toggleBook(bookId: number) {
    setTempBookIds((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
  }

  function matchesBookSearch(b: Book, query: string) {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const authorText = b.authors.join(" ").toLowerCase();
    const tagsText = (b.tags || []).join(" ").toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      authorText.includes(q) ||
      tagsText.includes(q)
    );
  }

  const detailBooks = tempBookIds
    .map((id) => books.find((b) => b.id === id) || null)
    .filter((b): b is Book => b !== null);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-paper dark:bg-night text-ink dark:text-parchment">

        {/* HEADER */}
        <div className="flex items-center gap-3 px-6 pt-6">
          <h1 className="text-3xl font-bold text-pthalo dark:text-fern">
            My Lists
          </h1>

          <button
            onClick={openAddList}
            className="bg-pthalo dark:bg-fern text-paper dark:text-night p-2 rounded-full shadow"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {/* LEFT SIDEBAR (LIST FORM) */}
        <div
          className={`fixed top-0 left-0 h-full z-50 bg-chalk dark:bg-cellar w-80 shadow-lg border-r transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full overflow-y-auto">
            {sidebarOpen && (
              <div className="sticky top-0 bg-chalk dark:bg-cellar z-10 p-4 pb-2">
                <button
                  onClick={cancelListEditing}
                  className="flex items-center gap-1 bg-pthalo dark:bg-fern text-paper dark:text-night px-2 py-1 rounded-full text-xs"
                >
                  <ArrowLeftIcon className="w-3 h-3" />
                  <span>Back</span>
                </button>
              </div>
            )}

            <div className="p-4 pt-2">

            <h2 className="text-lg mb-2 font-bold text-pthalo dark:text-fern">
              {editingListId ? "Edit List" : "Create New List"}
            </h2>

            {/* LIST NAME */}
            <div className="mb-4">
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value.slice(0, 50))}
                placeholder="List Name"
                className="input-field w-full"
                maxLength={50}
              />
              <div className="text-xs text-oak dark:text-parchment/60 mt-1">
                {newListName.length}/50 characters
              </div>
            </div>

            {/* LIST BACKGROUND */}
            <p className="text-sm mb-2 font-semibold text-pthalo dark:text-fern">
              List Background
            </p>

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
                
                // New additions
                { name: 'Ocean Depths', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJvY2VhbiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agc3RvcC1jb2xvcj0iIzBmNGM3NSIgc3RvcC1vcGFjaXR5PSIwLjkiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMzI5NDEiIHN0b3Atb3BhY2l0eT0iMC44Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjb2NlYW4pIi8+PC9zdmc+', preview: 'bg-gradient-to-br from-cyan-900 to-slate-900' },
                { name: 'Sunset', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJzdW5zZXQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiNmZWNhNTciIHN0b3Atb3BhY2l0eT0iMC45Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZWQ2NGExIiBzdG9wLW9wYWNpdHk9IjAuNyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3N1bnNldCkiLz48L3N2Zz4=', preview: 'bg-gradient-to-br from-amber-300 to-pink-400' },
                { name: 'Forest', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJmb3Jlc3QiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiM2NWExNGIiIHN0b3Atb3BhY2l0eT0iMC45Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDY0ZTNiIiBzdG9wLW9wYWNpdHk9IjAuOCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2ZvcmVzdCkiLz48L3N2Zz4=', preview: 'bg-gradient-to-br from-green-600 to-emerald-800' },
                { name: 'Lavender Field', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJsYXZlbmRlciIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agc3RvcC1jb2xvcj0iI2M4NGIxNSIgc3RvcC1vcGFjaXR5PSIwLjkiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3YzNhZWQiIHN0b3Atb3BhY2l0eT0iMC43Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjbGF2ZW5kZXIpIi8+PC9zdmc+', preview: 'bg-gradient-to-br from-violet-600 to-purple-700' },
                { name: 'Rose Gold', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJyb3NlIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBzdG9wLWNvbG9yPSIjZmNlN2Y1IiBzdG9wLW9wYWNpdHk9IjAuOSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2Y0MjdhYSIgc3RvcC1vcGFjaXR5PSIwLjciLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNyb3NlKSIvPjwvc3ZnPg==', preview: 'bg-gradient-to-br from-pink-100 to-pink-500' },
                { name: 'Midnight', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJtaWRuaWdodCIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBzdG9wLWNvbG9yPSIjMTUxNTIzIiBzdG9wLW9wYWNpdHk9IjAuOTUiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwZjBmMTQiIHN0b3Atb3BhY2l0eT0iMC45Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjbWlkbmlnaHQpIi8+PC9zdmc+', preview: 'bg-gradient-to-br from-gray-900 to-black' },
                { name: 'Parchment', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJwYXJjaG1lbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiNmZmY3ZWQiIHN0b3Atb3BhY2l0eT0iMC45Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZWRkYmE4IiBzdG9wLW9wYWNpdHk9IjAuNyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3BhcmNobWVudCkiLz48L3N2Zz4=', preview: 'bg-gradient-to-br from-yellow-50 to-amber-200' },
                { name: 'Sage', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJzYWdlIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBzdG9wLWNvbG9yPSIjZjNmNGY2IiBzdG9wLW9wYWNpdHk9IjAuOSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzg3YTk5MSIgc3RvcC1vcGFjaXR5PSIwLjciLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNzYWdlKSIvPjwvc3ZnPg==', preview: 'bg-gradient-to-br from-gray-100 to-emerald-300' },
                { name: 'Copper', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJjb3BwZXIiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiNmZGU2OGEiIHN0b3Atb3BhY2l0eT0iMC45Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZGM3NjMzIiBzdG9wLW9wYWNpdHk9IjAuOCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2NvcHBlcikiLz48L3N2Zz4=', preview: 'bg-gradient-to-br from-yellow-200 to-orange-600' },
                { name: 'Slate Storm', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJzbGF0ZSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBzdG9wLWNvbG9yPSIjNjQ3NDhiIiBzdG9wLW9wYWNpdHk9IjAuOSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzMzNDE0ZSIgc3RvcC1vcGFjaXR5PSIwLjgiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNzbGF0ZSkiLz48L3N2Zz4=', preview: 'bg-gradient-to-br from-slate-500 to-slate-700' },
                { name: 'Cherry Blossom', value: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJjaGVycnkiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiNmY2VmZjMiIHN0b3Atb3BhY2l0eT0iMC45Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZmJiNmNlIiBzdG9wLW9wYWNpdHk9IjAuNyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2NoZXJyeSkiLz48L3N2Zz4=', preview: 'bg-gradient-to-br from-pink-50 to-pink-300' }
              ].map((option) => (
                <button
                  key={option.name}
                  onClick={() => setListCoverUrl(option.value)}
                  className={`h-16 rounded border-2 text-xs font-medium transition-all ${
                    listCoverUrl === option.value
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
                      setListCoverUrl(result);
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

            {/* Background Preview */}
            {listCoverUrl && (
              <div className="relative w-full h-[100px] rounded mb-3 overflow-hidden shadow">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-bone dark:bg-cellar"
                  style={{ backgroundImage: `url(${listCoverUrl})` }}
                  onError={(e) => {
                    // Hide broken images gracefully
                    const target = e.target as HTMLElement;
                    target.style.backgroundImage = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <div className="text-white">
                    <div className="font-bold text-sm">Preview</div>
                    <div className="text-xs opacity-80">Background will fill entire list card</div>
                  </div>
                </div>
              </div>
            )}

            {/* SELECTED BOOKS */}
            <p className="font-semibold text-pthalo dark:text-fern mb-1">
              Selected Books:
            </p>
            <div className="max-h-32 overflow-y-auto pr-1 flex flex-col gap-1">
              {detailBooks.map((book, index) => (
                <div
                  key={book.id}
                  className="flex items-start text-xs text-oak dark:text-parchment/75"
                >
                  <span className="w-4 text-right mr-1">{index + 1}</span>
                  <span className="flex-1 truncate">{book.title}</span>
                </div>
              ))}
            </div>

            {/* SAVE & DELETE */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={saveList}
                className="flex-1 px-4 py-2 rounded bg-pthalo dark:bg-fern text-paper dark:text-night font-semibold"
              >
                Save List
              </button>
              
              {editingListId !== null && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 rounded bg-red-600 text-white font-semibold"
                >
                  Delete
                </button>
              )}
            </div>

            {/* DELETE CONFIRMATION */}
            {showDeleteConfirm && editingListId !== null && (
              <div className="mt-4 p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700">
                <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                  Are you sure you want to delete this list?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteListFromEdit}
                    className="flex-1 px-3 py-1 rounded bg-red-600 text-white font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

          </div>
          </div>
        </div>

        {/* FULL-RIGHT BOOK SELECTOR */}
        {sidebarOpen && (
          <div
            className="fixed top-0 left-80 right-0 h-full z-40 bg-paper dark:bg-night border-l overflow-y-auto p-4 pt-16"
          >
            <input
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Search by title, author, or tag..."
              className="input-field w-full mb-4"
            />

            <div className="grid grid-cols-6 gap-3">
              {books
                .filter((b) => matchesBookSearch(b, bookSearch))
                .map((book) => {
                  const selected = tempBookIds.includes(book.id);
                  return (
                    <div
                      key={book.id}
                      onClick={() => toggleBook(book.id)}
                      className={`cursor-pointer rounded border p-1 flex flex-col items-center transition-all shadow-sm ${
                        selected
                          ? "border-fern dark:border-pthalo scale-[1.03]"
                          : "border-oak/20 dark:border-parchment/20"
                      }`}
                    >
                      <div className="w-full h-[120px] flex items-center justify-center bg-oak/10 dark:bg-cellar overflow-hidden rounded">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-oak dark:text-parchment/60 px-1 text-center">
                            No cover
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] mt-1 text-center line-clamp-2">
                        {book.title}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* MAIN LISTS — bigger size with background images */}
        <div className="p-6 flex flex-wrap gap-6">
          {lists.map((list) => {
            const firstTen = list.bookIds
              .slice(0, 10)
              .map((id) => books.find((b) => b.id === id)?.title || "?");

            return (
              <div
                key={list.id}
                onClick={() => navigate(`/lists/${list.id}`)}
                className="relative w-[300px] h-[320px] overflow-hidden shadow cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] rounded-lg group"
                style={{
                  backgroundImage: list.coverUrl ? `url(${list.coverUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Background overlay for readability */}
                <div className={`absolute inset-0 ${
                  list.coverUrl 
                    ? 'bg-gradient-to-t from-black/80 via-black/40 to-black/20' 
                    : 'bg-bone dark:bg-cellar'
                }`} />
                
                {/* Content */}
                <div className="relative h-full p-6 flex flex-col justify-end">
                  <div className={`${list.coverUrl ? 'text-white' : 'text-ink dark:text-parchment'}`}>
                    <h2 className={`font-bold text-xl mb-2 ${
                      list.coverUrl 
                        ? 'text-white drop-shadow-lg' 
                        : 'text-pthalo dark:text-fern'
                    }`}>
                      {list.name}
                    </h2>

                    <p className={`text-sm mb-3 ${
                      list.coverUrl 
                        ? 'text-white/90 drop-shadow' 
                        : 'text-oak dark:text-parchment/70'
                    }`}>
                      {list.bookIds.length} book{list.bookIds.length !== 1 ? 's' : ''}
                    </p>

                    {firstTen.length > 0 && (
                      <div className={`text-xs max-h-[140px] overflow-y-auto space-y-1 ${
                        list.coverUrl 
                          ? 'text-white/80 drop-shadow' 
                          : 'text-oak dark:text-parchment/65'
                      }`}>
                        {firstTen.slice(0, 6).map((title, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-xs opacity-60 font-mono">{i + 1}.</span>
                            <span className="flex-1 line-clamp-1">{title}</span>
                          </div>
                        ))}
                        {list.bookIds.length > 6 && (
                          <div className="text-center opacity-60 text-xs mt-2">
                            +{list.bookIds.length - 6} more...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit button */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent navigating to list view
                      openEditList(list);
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                      list.coverUrl 
                        ? 'bg-white/20 hover:bg-white/30 text-white' 
                        : 'bg-pthalo/20 dark:bg-fern/20 hover:bg-pthalo/30 dark:hover:bg-fern/30 text-pthalo dark:text-fern'
                    }`}
                    title="Edit list"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
