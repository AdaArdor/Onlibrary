import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  Squares2X2Icon,
  Bars3Icon,
} from "@heroicons/react/24/solid";

import BookCard from "./components/ui/BookCard";
import TagManagementPanel from "./components/TagManagementPanel";
import { useAuth } from "./AuthContext";
import { sampleBooks } from "./lib/sampleData";
import { booksService } from "./lib/database";

interface Book {
  id: number;
  title: string;
  authors: string[];
  isbn?: string;
  coverUrl?: string;
  publisher?: string;
  tags?: string[];
  finishedMonth?: string;
  releaseYear?: string;
  notes?: string;
}

interface CombinedProps {
  darkMode?: boolean;
}

export default function CombinedLibrary({ darkMode = false }: CombinedProps) {
  const navigate = useNavigate();
  const { isDemo, user } = useAuth();

  // === BOOK STORAGE ===
  const [books, setBooks] = useState<Book[]>([]);

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

    // Subscribe to real-time book updates from Firebase
    const unsubscribe = booksService.subscribeToUserBooks(user, (firebaseBooks) => {
      console.log("Home: Received books from Firebase:", firebaseBooks.length);
      setBooks(firebaseBooks);
    });

    return () => unsubscribe();
  }, [isDemo, user]);

  // === UI STATE ===
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFetchingCover, setIsFetchingCover] = useState(false);
  const [coverFound, setCoverFound] = useState(false);

  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  
  // Book search mode
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [bookSearchResults, setBookSearchResults] = useState<any[]>([]);
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);

  // Grid / list toggle
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const BOOKS_PER_PAGE = 50;

  // Bulk tag management
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<number>>(new Set());
  const [showTagManagementPanel, setShowTagManagementPanel] = useState(false);

  const placeholder = "https://via.placeholder.com/120x190?text=No+Cover";

  // === NOTES UI (popover + modal) ===
  const [hoveredNote, setHoveredNote] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [modalNotesText, setModalNotesText] = useState("");

  // === FORM ===
  const [form, setForm] = useState({
    title: "",
    authors: [""],
    isbn: "",
    tags: [] as string[],
    newTag: "",
    coverUrl: undefined as string | undefined,
    publisher: "",
    releaseYear: "",
    finishedMonth: "",
    finishedYear: "",
    showMonthPicker: false,
    showYearPicker: false,
    notes: "",
    showNotes: false,
  });

  const [showInlineDeleteConfirm, setShowInlineDeleteConfirm] = useState(false);

  function resetForm() {
    setForm({
      title: "",
      authors: [""],
      isbn: "",
      tags: [],
      newTag: "",
      coverUrl: undefined,
      publisher: "",
      releaseYear: "",
      finishedMonth: "",
      finishedYear: "",
      showMonthPicker: false,
      showYearPicker: false,
      notes: "",
      showNotes: false,
    });
    setEditingId(null);
    setSidebarOpen(false);
    setIsFetchingCover(false);
    setCoverFound(false);
  }

  function startAdd() {
    resetForm();
    setIsSearchMode(true); // Start with search mode
    setSidebarOpen(true);
    setBookSearchQuery('');
    setBookSearchResults([]);
  }

  function switchToManualMode() {
    setIsSearchMode(false);
    setBookSearchQuery('');
    setBookSearchResults([]);
    // Don't call resetForm() since that closes the sidebar
    // Just clear the form fields
    setForm({
      title: '',
      authors: [''],
      isbn: '',
      tags: [],
      newTag: '',
      coverUrl: '',
      publisher: '',
      releaseYear: '',
      finishedMonth: '',
      finishedYear: '',
      showMonthPicker: false,
      showYearPicker: false,
      notes: '',
      showNotes: false,
    });
  }

  // Generate a better placeholder with title and author
  function generateStyledPlaceholder(title: string, authors: string[]): string {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return placeholder;

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 300, 480);
    const colors = [
      ['#0f4c75', '#032941'], // Ocean
      ['#65a14b', '#064e3b'], // Forest
      ['#c84b15', '#7c3aed'], // Lavender
      ['#64748b', '#33414e'], // Slate
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    gradient.addColorStop(0, randomColor[0]);
    gradient.addColorStop(1, randomColor[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 480);

    // Add title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Word wrap title
    const words = title.split(' ');
    let line = '';
    const lines: string[] = [];
    const maxWidth = 260;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        lines.push(line.trim());
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    // Draw title (max 4 lines)
    const displayLines = lines.slice(0, 4);
    const startY = 200;
    displayLines.forEach((line, i) => {
      ctx.fillText(line, 150, startY + (i * 35));
    });

    // Add author
    if (authors.length > 0 && authors[0]) {
      ctx.font = '20px Arial';
      ctx.fillText(authors.join(', '), 150, startY + (displayLines.length * 35) + 40);
    }

    return canvas.toDataURL('image/png');
  }

  // Search for books by title/author/ISBN across multiple APIs
  async function searchBooks(query: string) {
    if (!query.trim()) return;
    
    setIsSearchingBooks(true);
    setBookSearchResults([]);

    try {
      const results: any[] = [];
      const cleanQuery = query.trim();
      
      // Check if query looks like an ISBN (10 or 13 digits, possibly with hyphens)
      const isISBN = /^[\d-]{10,17}$/.test(cleanQuery.replace(/\s/g, ''));
      const cleanISBN = cleanQuery.replace(/[-\s]/g, '');

      // 1. If it's an ISBN, search specifically by ISBN first
      if (isISBN) {
        try {
          console.log('Detected ISBN search:', cleanISBN);
          const googleIsbnRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`);
          if (googleIsbnRes.ok) {
            const data = await googleIsbnRes.json();
            if (data.items) {
              data.items.forEach((item: any) => {
                const book = item.volumeInfo;
                results.push({
                  source: 'Google Books (ISBN)',
                  title: book.title || '',
                  authors: book.authors || [],
                  publisher: book.publisher || '',
                  releaseYear: book.publishedDate?.split('-')[0] || '',
                  isbn: book.industryIdentifiers?.[0]?.identifier || cleanISBN,
                  coverUrl: book.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
                  description: book.description || ''
                });
              });
            }
          }
        } catch (error) {
          console.log('Google Books ISBN search failed:', error);
        }

        // Also try OpenLibrary ISBN search
        try {
          const olIsbnRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`);
          if (olIsbnRes.ok) {
            const data = await olIsbnRes.json();
            const bookKey = `ISBN:${cleanISBN}`;
            if (data[bookKey]) {
              const book = data[bookKey];
              results.push({
                source: 'OpenLibrary (ISBN)',
                title: book.title || '',
                authors: book.authors?.map((a: any) => a.name) || [],
                publisher: book.publishers?.[0]?.name || '',
                releaseYear: book.publish_date?.match(/\d{4}/)?.[0] || '',
                isbn: cleanISBN,
                coverUrl: book.cover?.medium || book.cover?.large || '',
                description: ''
              });
            }
          }
        } catch (error) {
          console.log('OpenLibrary ISBN search failed:', error);
        }
      }

      // 2. General search (title/author) on Google Books
      if (results.length < 5) { // Only do general search if ISBN didn't return enough results
        try {
          const searchQuery = isISBN ? cleanISBN : cleanQuery;
          const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=10`);
          if (googleRes.ok) {
            const data = await googleRes.json();
            if (data.items) {
              data.items.forEach((item: any) => {
                const book = item.volumeInfo;
                results.push({
                  source: 'Google Books',
                  title: book.title || '',
                  authors: book.authors || [],
                  publisher: book.publisher || '',
                  releaseYear: book.publishedDate?.split('-')[0] || '',
                  isbn: book.industryIdentifiers?.[0]?.identifier || '',
                  coverUrl: book.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
                  description: book.description || ''
                });
              });
            }
          }
        } catch (error) {
          console.log('Google Books search failed:', error);
        }
      }

      // 3. OpenLibrary general search (if not ISBN or need more results)
      if (results.length < 10 && !isISBN) {
        try {
          const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(cleanQuery)}&limit=10`);
          if (olRes.ok) {
            const data = await olRes.json();
            if (data.docs) {
              data.docs.forEach((doc: any) => {
                const isbn = doc.isbn?.[0] || '';
                results.push({
                  source: 'OpenLibrary',
                  title: doc.title || '',
                  authors: doc.author_name || [],
                  publisher: doc.publisher?.[0] || '',
                  releaseYear: doc.first_publish_year?.toString() || '',
                  isbn: isbn,
                  coverUrl: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : '',
                  description: ''
                });
              });
            }
          }
        } catch (error) {
          console.log('OpenLibrary search failed:', error);
        }
      }

      // Remove duplicates based on title similarity
      const uniqueResults = results.filter((book, index, self) =>
        index === self.findIndex((b) => 
          b.title.toLowerCase() === book.title.toLowerCase() &&
          b.authors[0]?.toLowerCase() === book.authors[0]?.toLowerCase()
        )
      );

      setBookSearchResults(uniqueResults);
    } catch (error) {
      console.error('Book search error:', error);
    } finally {
      setIsSearchingBooks(false);
    }
  }

  // Helper function to convert "First Last" to "Last, First"
  function formatAuthorName(name: string): string {
    if (!name) return '';
    
    // Split by spaces
    const parts = name.trim().split(/\s+/);
    
    // If only one name, return as is
    if (parts.length === 1) return name;
    
    // Last part is the last name, everything else is first/middle names
    const lastName = parts[parts.length - 1];
    const firstAndMiddle = parts.slice(0, -1).join(' ');
    
    return `${lastName}, ${firstAndMiddle}`;
  }

  // Select a book from search results
  function selectBookFromSearch(book: any) {
    // Format author names to "Last, First" format
    const formattedAuthors = book.authors.length > 0 
      ? book.authors.map((author: string) => formatAuthorName(author))
      : [''];

    setForm({
      title: book.title,
      authors: formattedAuthors,
      isbn: book.isbn,
      coverUrl: book.coverUrl || generateStyledPlaceholder(book.title, book.authors),
      publisher: book.publisher,
      releaseYear: book.releaseYear,
      tags: [],
      newTag: '',
      finishedMonth: '',
      finishedYear: '',
      showMonthPicker: false,
      showYearPicker: false,
      notes: '',
      showNotes: false,
    });
    setIsSearchMode(false);
    setBookSearchQuery('');
    setBookSearchResults([]);
  }

  // Helper function to verify image actually loads
  async function verifyImageUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 1 && img.height > 1);
      img.onerror = () => resolve(false);
      img.src = url;
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  async function fetchBookDataByISBN(isbn: string) {
    let coverUrl = placeholder;
    let publisher: string | undefined;
    let releaseYear: string | undefined;

    if (!isbn) return { coverUrl, publisher, releaseYear };
    if (form.coverUrl?.startsWith("blob:")) return { coverUrl: form.coverUrl, publisher, releaseYear };

    // Clean ISBN (remove dashes, spaces)
    const cleanIsbn = isbn.replace(/[^0-9X]/g, '');
    
    try {
      // 1. Try Google Books API FIRST (most reliable and includes metadata)
      try {
        console.log(`🔍 Searching Google Books for ISBN: ${cleanIsbn}`);
        const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
        if (googleRes.ok) {
          const googleData = await googleRes.json();
          if (googleData.items && googleData.items.length > 0) {
            const book = googleData.items[0].volumeInfo;
            console.log(`📚 Found book on Google Books:`, book.title);
            
            // Try to get cover from Google Books (in order of quality), verify each one loads
            const coverSources = [
              { url: book.imageLinks?.extraLarge, name: 'extra large' },
              { url: book.imageLinks?.large, name: 'large' },
              { url: book.imageLinks?.medium, name: 'medium' },
              { url: book.imageLinks?.thumbnail?.replace('&zoom=1', '&zoom=3'), name: 'thumbnail' },
              { url: book.imageLinks?.smallThumbnail?.replace('&zoom=1', '&zoom=3'), name: 'small thumbnail' }
            ];

            for (const source of coverSources) {
              if (source.url) {
                const httpsUrl = source.url.replace('http:', 'https:');
                console.log(`🖼️ Testing ${source.name} cover...`);
                if (await verifyImageUrl(httpsUrl)) {
                  coverUrl = httpsUrl;
                  console.log(`✅ Verified ${source.name} cover from Google Books`);
                  break;
                } else {
                  console.log(`❌ ${source.name} cover failed to load`);
                }
              }
            }
            
            // Get publisher if available
            if (book.publisher) {
              publisher = book.publisher;
            }
            
            // Get release year if available
            if (book.publishedDate) {
              const year = book.publishedDate.split('-')[0];
              if (year && /^\d{4}$/.test(year)) {
                releaseYear = year;
              }
            }
          } else {
            console.log(`ℹ️ No results from Google Books for ISBN: ${cleanIsbn}`);
          }
        }
      } catch (error) {
        console.log(`❌ Google Books API failed:`, error);
      }

      // 2. If Google Books didn't work, try OpenLibrary
      if (coverUrl === placeholder) {
        try {
          console.log(`🔍 Trying OpenLibrary for ISBN: ${cleanIsbn}`);
          const olCover = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
          
          console.log(`🖼️ Testing OpenLibrary cover...`);
          if (await verifyImageUrl(olCover)) {
            coverUrl = olCover;
            console.log(`✅ Verified cover on OpenLibrary`);
          } else {
            console.log(`❌ OpenLibrary cover failed to load`);
          }
        } catch (error) {
          console.log(`❌ OpenLibrary failed:`, error);
        }
      }

      // Fallback: Try OpenLibrary book info for publisher and year (even if cover failed)
      if (!publisher || !releaseYear) {
        try {
          const infoRes = await fetch(`https://openlibrary.org/isbn/${cleanIsbn}.json`);
          if (infoRes.ok) {
            const data = await infoRes.json();
            if (!publisher && data.publishers?.length) {
              publisher = data.publishers[0];
            }
            if (!releaseYear && data.publish_date) {
              // Extract year from various date formats
              const dateMatch = data.publish_date.match(/\b(\d{4})\b/);
              if (dateMatch) {
                releaseYear = dateMatch[1];
              }
            }
          }
        } catch (error) {
          console.log(`❌ OpenLibrary info failed: ${error}`);
        }
      }

    } catch (error) {
      console.log(`❌ Overall fetch failed: ${error}`);
    }

    if (coverUrl === placeholder) {
      console.log(`⚠️ No valid cover found, generating styled placeholder`);
      coverUrl = generateStyledPlaceholder(form.title, form.authors);
    }

    return { coverUrl, publisher, releaseYear };
  }

  function startEdit(book: Book) {
    setEditingId(book.id);

    const [year = "", month = ""] = (book.finishedMonth || "").split("-");

    setForm({
      title: book.title,
      authors: [...book.authors],
      isbn: book.isbn || "",
      tags: book.tags || [],
      newTag: "",
      coverUrl: book.coverUrl,
      publisher: book.publisher || "",
      releaseYear: book.releaseYear || "",
      finishedMonth: month,
      finishedYear: year,
      showMonthPicker: false,
      showYearPicker: false,
      notes: book.notes || "",
      showNotes: !!book.notes,
    });

    setSidebarOpen(true);
  }

  function handleBookClick(book: Book) {
    navigate(`/book/${book.id}`);
  }

  // Close sidebar when clicking outside the edit panel
  function handleOutsideClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!sidebarOpen) return;

    const sidebar = document.getElementById("edit-sidebar");
    if (!sidebar) return;

    if (!sidebar.contains(e.target as Node)) {
      resetForm();
    }
  }

  // === AUTO ISBN FETCH ===
  useEffect(() => {
    let active = true;

    async function run() {
      if (!form.isbn.trim() || form.coverUrl?.startsWith("blob:")) {
        setCoverFound(false);
        setIsFetchingCover(false);
        return;
      }

      setIsFetchingCover(true);
      setCoverFound(false);

      const data = await fetchBookDataByISBN(form.isbn.trim());
      if (!active) return;

      setForm((f) => ({
        ...f,
        coverUrl: data.coverUrl,
        publisher: data.publisher || "",
        releaseYear: data.releaseYear || "",
      }));

      setIsFetchingCover(false);
      setCoverFound(true);
    }

    run();
    return () => {
      active = false;
    };
  }, [form.isbn]);

  // Max 7 tags
  function addTagFromInput() {
    if (!form.newTag.trim()) return;
    if (form.tags.length >= 7) return; // LIMIT HERE
    if (form.tags.includes(form.newTag.trim())) return;

    setForm((f) => ({
      ...f,
      tags: [...f.tags, f.newTag.trim()],
      newTag: "",
    }));
  }

  async function saveForm() {
    if (!form.title.trim()) return;

    if (isDemo) {
      alert("This is a demo! Sign up to save your own books.");
      return;
    }

    if (!user) {
      alert("You must be logged in to save books.");
      return;
    }

    const authors = form.authors.map((a) => a.trim()).filter(Boolean);
    const finished =
      form.finishedYear && form.finishedMonth
        ? `${form.finishedYear}-${form.finishedMonth}`
        : undefined;

    // Handle cover URL
    let coverToSave = form.coverUrl;
    
    // If no cover URL or it's a data URL (canvas-generated placeholder), generate a styled placeholder
    if (!coverToSave || coverToSave === placeholder || coverToSave.startsWith('data:')) {
      console.log('📘 No valid cover URL, generating styled placeholder');
      coverToSave = generateStyledPlaceholder(form.title, authors);
    }

    // Build book object, only including defined fields (Firestore doesn't accept undefined)
    const newBook: any = {
      id: editingId ?? Date.now(),
      title: form.title,
      authors,
      coverUrl: coverToSave,
    };

    // Only add optional fields if they have values
    if (form.isbn.trim()) newBook.isbn = form.isbn.trim();
    if (form.publisher) newBook.publisher = form.publisher;
    if (form.releaseYear.trim()) newBook.releaseYear = form.releaseYear.trim();
    if (form.tags.length) newBook.tags = form.tags;
    if (finished) newBook.finishedMonth = finished;
    if (form.notes.trim()) newBook.notes = form.notes.trim();

    try {
      if (editingId) {
        await booksService.updateBook(user, newBook);
      } else {
        await booksService.saveBook(user, newBook);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving book:", error);
      alert("Failed to save book. Please try again.");
    }
  }

  async function deleteBookFromEdit() {
    if (editingId === null) return;
    
    if (isDemo) {
      alert("This is a demo! Sign up to modify books.");
      return;
    }

    if (!user) {
      alert("You must be logged in to delete books.");
      return;
    }
    
    try {
      await booksService.deleteBook(user, editingId);
      resetForm();
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("Failed to delete book. Please try again.");
    }
  }

  // TAG SUGGESTIONS
  const existingTags = Array.from(
    new Set(books.flatMap((b) => b.tags || []))
  ).sort((a, b) => a.localeCompare(b));

  // FILTER + SORT
  const allFilteredBooks = books
    .slice()
    .sort((a, b) => {
      if (sortOption === "title") return a.title.localeCompare(b.title);
      if (sortOption === "author")
        return (a.authors[0] || "").localeCompare(b.authors[0] || "");
      if (sortOption === "oldest") return a.id - b.id;
      return b.id - a.id;
    })
    .filter((book) => {
      const s = search.toLowerCase();
      return (
        book.title.toLowerCase().includes(s) ||
        book.authors.join(" ").toLowerCase().includes(s) ||
        (book.tags || []).some((t) => t.toLowerCase().includes(s)) ||
        (book.notes || "").toLowerCase().includes(s)
      );
    });

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOption]);

  // Calculate pagination
  const totalPages = Math.ceil(allFilteredBooks.length / BOOKS_PER_PAGE);
  const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
  const endIndex = startIndex + BOOKS_PER_PAGE;
  const sortedFilteredBooks = allFilteredBooks.slice(startIndex, endIndex);

  // === BULK TAG MANAGEMENT FUNCTIONS ===
  function toggleSelectMode() {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      // Exiting select mode - clear selections
      setSelectedBookIds(new Set());
    }
  }

  function toggleBookSelection(bookId: number) {
    const newSelected = new Set(selectedBookIds);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    setSelectedBookIds(newSelected);
  }

  async function addTagsToSelected(tagsToAdd: string[]) {
    if (!user || isDemo || selectedBookIds.size === 0) return;

    try {
      const updatePromises = Array.from(selectedBookIds).map(async (bookId) => {
        const book = books.find(b => b.id === bookId);
        if (!book) return;

        const currentTags = book.tags || [];
        const newTags = [...new Set([...currentTags, ...tagsToAdd])]; // Merge and dedupe
        
        await booksService.updateBook(user, { ...book, tags: newTags });
      });

      await Promise.all(updatePromises);
      console.log(`Added tags to ${selectedBookIds.size} books`);
    } catch (error) {
      console.error("Error adding tags to books:", error);
      alert("Failed to add tags. Please try again.");
    }
  }

  async function removeTagsFromSelected(tagsToRemove: string[]) {
    if (!user || isDemo || selectedBookIds.size === 0) return;

    try {
      const updatePromises = Array.from(selectedBookIds).map(async (bookId) => {
        const book = books.find(b => b.id === bookId);
        if (!book) return;

        const currentTags = book.tags || [];
        const newTags = currentTags.filter(tag => !tagsToRemove.includes(tag));
        
        await booksService.updateBook(user, { ...book, tags: newTags });
      });

      await Promise.all(updatePromises);
      console.log(`Removed tags from ${selectedBookIds.size} books`);
    } catch (error) {
      console.error("Error removing tags from books:", error);
      alert("Failed to remove tags. Please try again.");
    }
  }

  async function renameTagGlobally(oldTag: string, newTag: string) {
    if (!user || isDemo) return;

    const booksWithTag = books.filter(b => b.tags?.includes(oldTag));
    if (booksWithTag.length === 0) return;

    try {
      const updatePromises = booksWithTag.map(async (book) => {
        const newTags = book.tags!.map(tag => tag === oldTag ? newTag : tag);
        await booksService.updateBook(user, { ...book, tags: newTags });
      });

      await Promise.all(updatePromises);
      console.log(`Renamed tag "${oldTag}" to "${newTag}" in ${booksWithTag.length} books`);
    } catch (error) {
      console.error("Error renaming tag:", error);
      alert("Failed to rename tag. Please try again.");
    }
  }

  async function deleteTagGlobally(tagToDelete: string) {
    if (!user || isDemo) return;

    const booksWithTag = books.filter(b => b.tags?.includes(tagToDelete));
    if (booksWithTag.length === 0) return;

    if (!confirm(`Delete tag "${tagToDelete}" from ${booksWithTag.length} books?`)) {
      return;
    }

    try {
      const updatePromises = booksWithTag.map(async (book) => {
        const newTags = book.tags!.filter(tag => tag !== tagToDelete);
        await booksService.updateBook(user, { ...book, tags: newTags });
      });

      await Promise.all(updatePromises);
      console.log(`Deleted tag "${tagToDelete}" from ${booksWithTag.length} books`);
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert("Failed to delete tag. Please try again.");
    }
  }

  async function mergeTagsGlobally(sourceTags: string[], targetTag: string) {
    if (!user || isDemo) return;

    const booksWithSourceTags = books.filter(b => 
      sourceTags.some(tag => b.tags?.includes(tag))
    );
    if (booksWithSourceTags.length === 0) return;

    try {
      const updatePromises = booksWithSourceTags.map(async (book) => {
        const currentTags = book.tags || [];
        // Remove source tags and add target tag
        const filteredTags = currentTags.filter(tag => !sourceTags.includes(tag));
        const newTags = [...new Set([...filteredTags, targetTag])]; // Add target and dedupe
        
        await booksService.updateBook(user, { ...book, tags: newTags });
      });

      await Promise.all(updatePromises);
      console.log(`Merged tags into "${targetTag}" for ${booksWithSourceTags.length} books`);
    } catch (error) {
      console.error("Error merging tags:", error);
      alert("Failed to merge tags. Please try again.");
    }
  }

  async function addTagConditionally(conditionTag: string, tagToAdd: string) {
    if (!user || isDemo) return;

    const booksWithCondition = books.filter(b => b.tags?.includes(conditionTag));
    if (booksWithCondition.length === 0) return;

    try {
      const updatePromises = booksWithCondition.map(async (book) => {
        const currentTags = book.tags || [];
        if (currentTags.includes(tagToAdd)) return; // Skip if already has the tag
        
        const newTags = [...currentTags, tagToAdd];
        await booksService.updateBook(user, { ...book, tags: newTags });
      });

      await Promise.all(updatePromises);
      console.log(`Added "${tagToAdd}" to ${booksWithCondition.length} books with tag "${conditionTag}"`);
    } catch (error) {
      console.error("Error adding tag conditionally:", error);
      alert("Failed to add tag. Please try again.");
    }
  }

  // === Bridge functions for BookCard to call (no prop-drilling) ===
  useEffect(() => {
    // use any to avoid TS complaining about custom window properties
    (window as any).__showNotePreview = (text: string, iconRight: number, iconTop: number) => {
      // Position the popover slightly left of the icon and a bit below its top
      // iconRight and iconTop are from getBoundingClientRect()
      const x = Math.max(8, iconRight - 220); // left coordinate
      const y = iconTop + 12; // top coordinate
      setHoveredNote({ text, x, y });
    };
    (window as any).__hideNotePreview = () => {
      setHoveredNote(null);
    };
    (window as any).__openNotesModal = (text: string) => {
      setModalNotesText(text);
      setShowNotesModal(true);
    };

    return () => {
      // cleanup
      delete (window as any).__showNotePreview;
      delete (window as any).__hideNotePreview;
      delete (window as any).__openNotesModal;
    };
  }, []);

  return (
    <div className={darkMode ? "dark" : ""} onClick={handleOutsideClick}>
      <div className="min-h-screen bg-paper dark:bg-night text-ink dark:text-parchment">

        {/* HEADER */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 pt-4 sm:pt-6">
          
          <h1 className="text-2xl sm:text-3xl font-bold text-pthalo dark:text-fern">
            My Library
          </h1>

          {/* Add Book button stays next to header */}
          <button
            onClick={(e) => { e.stopPropagation(); startAdd(); }}
            className="bg-pthalo dark:bg-fern hover:bg-fern dark:hover:bg-pthalo text-paper dark:text-night p-1.5 sm:p-2 rounded-full shadow"
            title="Add book"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* View Toggle (icon buttons) */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setViewMode("grid"); }}
              className={`
                p-1.5 sm:p-2 rounded 
                ${viewMode === "grid"
                  ? "bg-pthalo dark:bg-fern text-paper"
                  : "bg-paper dark:bg-night border border-oak/30 dark:border-parchment/30"}
              `}
            >
              <Squares2X2Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setViewMode("list"); }}
              className={`
                p-1.5 sm:p-2 rounded 
                ${viewMode === "list"
                  ? "bg-pthalo dark:bg-fern text-paper"
                  : "bg-paper dark:bg-night border border-oak/30 dark:border-parchment/30"}
              `}
            >
              <Bars3Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

        </div>

        {/* SEARCH */}
        <div className="px-3 sm:px-6 mt-3 sm:mt-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, or tag..."
            className="w-full px-3 py-2 text-sm sm:text-base rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment"
          />
        </div>

        {/* SORTING AND BULK ACTIONS */}
        <div className="px-3 sm:px-6 mt-2 flex flex-wrap gap-2 items-center">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-2 py-1 text-xs sm:text-sm rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar"
          >
            <option value="newest">Newest added</option>
            <option value="oldest">Oldest added</option>
            <option value="title">Title (A–Z)</option>
            <option value="author">Author (A–Z)</option>
          </select>

          {/* Tag Management Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowTagManagementPanel(true); }}
            className="px-2 sm:px-3 py-1 rounded bg-pthalo dark:bg-fern text-paper dark:text-night hover:bg-fern dark:hover:bg-pthalo transition-colors flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium"
            title="Manage Tags"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="hidden sm:inline">Manage Tags</span>
            <span className="sm:hidden">Tags</span>
          </button>

          {/* Select Books Button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleSelectMode(); }}
            className={`
              px-2 sm:px-3 py-1 rounded flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium transition-colors
              ${isSelectMode 
                ? "bg-fern dark:bg-pthalo text-night dark:text-paper" 
                : "bg-pthalo dark:bg-fern text-paper dark:text-night hover:bg-fern dark:hover:bg-pthalo"
              }
            `}
            title={isSelectMode ? "Exit Select Mode" : "Select Books"}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="hidden sm:inline">{isSelectMode ? "Exit Select" : "Select Books"}</span>
            <span className="sm:hidden">{isSelectMode ? "Exit" : "Select"}</span>
          </button>
        </div>

        {/* SELECTION TOOLBAR (shown when books are selected) */}
        {isSelectMode && selectedBookIds.size > 0 && (
          <div className="px-3 sm:px-6 mt-3">
            <div className="bg-pthalo/10 dark:bg-fern/10 border border-pthalo/30 dark:border-fern/30 rounded-lg p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm font-medium text-pthalo dark:text-fern">
                  {selectedBookIds.size} book{selectedBookIds.size === 1 ? '' : 's'} selected
                </span>
                
                <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto sm:ml-auto">
                  <button
                    onClick={() => {
                      const tags = prompt("Enter tags to add (comma-separated):");
                      if (tags) {
                        const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
                        addTagsToSelected(tagArray);
                      }
                    }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-pthalo dark:bg-fern text-paper dark:text-night hover:bg-fern dark:hover:bg-pthalo text-xs sm:text-sm flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden xs:inline">Add Tags</span>
                    <span className="xs:hidden">Add</span>
                  </button>

                  <button
                    onClick={() => {
                      const tags = prompt("Enter tags to remove (comma-separated):");
                      if (tags) {
                        const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
                        removeTagsFromSelected(tagArray);
                      }
                    }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-oak/20 dark:bg-parchment/20 text-pthalo dark:text-fern hover:bg-oak/30 dark:hover:bg-parchment/30 text-xs sm:text-sm flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    <span className="hidden xs:inline">Remove Tags</span>
                    <span className="xs:hidden">Remove</span>
                  </button>

                  <button
                    onClick={() => setSelectedBookIds(new Set())}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-oak/20 dark:bg-parchment/20 text-oak dark:text-parchment hover:bg-oak/30 dark:hover:bg-parchment/30 text-xs sm:text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === SIDEBAR FORM === */}
        <div
          id="edit-sidebar"
          onClick={(e) => e.stopPropagation()}
          className={`
            fixed top-0 left-0 h-full z-50 bg-chalk dark:bg-cellar 
            border-r border-oak/20 dark:border-parchment/20 shadow 
            transform transition-transform duration-300 overflow-y-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            w-full sm:w-96 md:w-[28rem]
          `}
        >
          {sidebarOpen && (
            <button
              onClick={() => resetForm()}
              className="sticky top-4 left-4 bg-pthalo dark:bg-fern text-paper dark:text-night p-1 rounded-full z-10"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
          )}

          {/* SEARCH MODE OR FORM */}
          <div className="pt-16 p-4">
            {isSearchMode ? (
              <>
                <h2 className="text-lg mb-4 text-pthalo dark:text-fern font-bold">
                  Add a Book
                </h2>
                
                {/* Search Input */}
                <div className="mb-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={bookSearchQuery}
                      onChange={(e) => setBookSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          searchBooks(bookSearchQuery);
                        }
                      }}
                      placeholder="Search by title, author, or ISBN..."
                      className="input-field w-full pr-10"
                    />
                    <button
                      onClick={() => searchBooks(bookSearchQuery)}
                      disabled={isSearchingBooks || !bookSearchQuery.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-pthalo dark:text-fern disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Manual Add Button */}
                <div className="mb-4">
                  <button
                    onClick={switchToManualMode}
                    className="w-full px-4 py-2 rounded-lg border-2 border-pthalo dark:border-fern text-pthalo dark:text-fern hover:bg-pthalo hover:text-paper dark:hover:bg-fern dark:hover:text-night transition-colors font-medium"
                  >
                    Add Manually
                  </button>
                </div>

                {/* Loading */}
                {isSearchingBooks && (
                  <div className="text-center py-8 text-oak dark:text-parchment">
                    Searching...
                  </div>
                )}

                {/* Search Results */}
                {!isSearchingBooks && bookSearchResults.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <p className="text-sm text-oak dark:text-parchment mb-2">
                      {bookSearchResults.length} result{bookSearchResults.length !== 1 ? 's' : ''} found
                    </p>
                    {bookSearchResults.map((book, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectBookFromSearch(book)}
                        className="flex gap-3 p-3 rounded-lg border border-oak/30 dark:border-parchment/30 hover:bg-oak/10 dark:hover:bg-parchment/10 cursor-pointer transition-colors"
                      >
                        <img
                          src={book.coverUrl || placeholder}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-pthalo dark:text-fern truncate">
                            {book.title}
                          </h3>
                          <p className="text-xs text-oak dark:text-parchment truncate">
                            {book.authors.join(', ')}
                          </p>
                          {book.releaseYear && (
                            <p className="text-xs text-oak/70 dark:text-parchment/70">
                              {book.releaseYear}
                            </p>
                          )}
                          <p className="text-xs text-oak/60 dark:text-parchment/60 mt-1">
                            {book.source}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!isSearchingBooks && bookSearchQuery && bookSearchResults.length === 0 && (
                  <div className="text-center py-8 text-oak dark:text-parchment">
                    No books found. Try a different search term.
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg mb-2 text-pthalo dark:text-fern font-bold">
                  {editingId ? "Edit Book" : "Add Book"}
                </h2>

                {/* TITLE */}
                <div className="mb-2">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, 200) }))}
                placeholder="Title"
                className="input-field w-full"
                maxLength={200}
              />
              <div className="text-xs text-oak dark:text-parchment/60 mt-1">
                {form.title.length}/200 characters
              </div>
            </div>

            {/* AUTHORS */}
            {form.authors.map((a, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  value={a}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      authors: prev.authors.map((x, i) =>
                        i === idx ? e.target.value.slice(0, 100) : x
                      ),
                    }))
                  }
                  placeholder="Author (last name, first name)"
                  className="input-field flex-1"
                  maxLength={100}
                />
                {form.authors.length > 1 && (
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        authors: f.authors.filter((_, i) => i !== idx),
                      }))
                    }
                    className="bg-red-500 text-white rounded px-2 text-xs"
                  >
                    −
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={() =>
                setForm((f) => ({ ...f, authors: [...f.authors, ""] }))
              }
              className="bg-pthalo dark:bg-fern text-paper dark:text-night rounded px-2 mb-2 text-sm"
            >
              + Add author
            </button>

            {/* ISBN */}
            <div className="mb-2">
              <input
                value={form.isbn}
                onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value.slice(0, 20) }))}
                placeholder="ISBN (auto-fetch cover)"
                className="input-field w-full"
                maxLength={20}
              />
              <div className="text-xs text-oak dark:text-parchment/60 mt-1">
                {form.isbn.length}/20 characters
              </div>
            </div>

            {/* UPLOAD COVER */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setForm((f) => ({ ...f, coverUrl: url }));
                setCoverFound(true);
              }}
              className="mb-3 text-xs"
            />

            {isFetchingCover && (
              <p className="text-xs text-oak dark:text-parchment/70 animate-pulse">
                Fetching cover…
              </p>
            )}
            {coverFound && (
              <p className="text-xs text-fern dark:text-pthalo">✔ Cover applied</p>
            )}

            {/* TAGS */}
            <div className="mb-2">
              <div className="flex flex-wrap gap-1 mb-2">
                {form.tags.map((t, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        tags: f.tags.filter((x) => x !== t),
                      }))
                    }
                    className="bg-fern/30 dark:bg-pthalo/40 text-pthalo dark:text-parchment px-2 py-1 text-xs rounded-full border border-pthalo/30"
                  >
                    {t} ✕
                  </button>
                ))}
              </div>

              <div className="flex gap-1">
                <div className="relative flex-1">
                  <input
                    value={form.newTag}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, newTag: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && addTagFromInput()}
                    placeholder="Add tag"
                    list="tag-suggestions"
                    className="input-field w-full"
                  />
                  
                  {/* Show matching suggestions */}
                  {form.newTag.trim() && existingTags.filter(t => 
                    t.toLowerCase().includes(form.newTag.toLowerCase()) && 
                    !form.tags.includes(t)
                  ).length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-paper dark:bg-night border border-oak/30 dark:border-parchment/30 rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
                      {existingTags
                        .filter(t => 
                          t.toLowerCase().includes(form.newTag.toLowerCase()) && 
                          !form.tags.includes(t)
                        )
                        .slice(0, 5)
                        .map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                tags: [...f.tags, tag],
                                newTag: ""
                              }));
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-pthalo/10 dark:hover:bg-fern/10 text-sm"
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                  )}
                  
                  <datalist id="tag-suggestions">
                    {existingTags.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
                <button
                  onClick={addTagFromInput}
                  className="bg-pthalo dark:bg-fern text-paper dark:text-night rounded px-2"
                >
                  +
                </button>
              </div>

              {form.tags.length >= 7 && (
                <p className="text-xs text-red-500 mt-1">
                  Maximum of 7 tags reached.
                </p>
              )}
            </div>

            {/* NOTES (moved below tags, spaced, with limit + counter) */}
            <div className="mt-4 mb-4">
              <button
                onClick={() =>
                  setForm((f) => ({ ...f, showNotes: !f.showNotes }))
                }
                className="w-full px-4 py-1 rounded bg-pthalo dark:bg-fern text-paper dark:text-night font-semibold mb-2"
              >
                {form.showNotes ? "Hide Notes" : "Add Notes"}
              </button>

              {form.showNotes && (
                <div>
                  <textarea
                    value={form.notes}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.length <= 2000) {
                        setForm((f) => ({ ...f, notes: v }));
                      } else {
                        // ignore extra characters beyond limit
                        setForm((f) => ({ ...f, notes: v.slice(0, 2000) }));
                      }
                    }}
                    maxLength={2000}
                    placeholder="Write notes about this book..."
                    className="w-full h-32 p-2 rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment resize-none"
                  />
                  <p className="text-xs text-oak dark:text-parchment/60 mt-1 text-right">
                    {form.notes.length} / 2000
                  </p>
                </div>
              )}
            </div>

            {/* DATE PICKERS */}
            <div className="flex flex-col gap-2 mb-2">
              <button
                onClick={() =>
                  setForm((f) => ({ ...f, showMonthPicker: !f.showMonthPicker }))
                }
                className="w-full px-4 py-1 rounded bg-pthalo dark:bg-fern text-paper dark:text-night font-semibold"
              >
                {form.finishedMonth ? `Month: ${form.finishedMonth}` : "Select Month"}
              </button>

              <button
                onClick={() =>
                  setForm((f) => ({ ...f, showYearPicker: !f.showYearPicker }))
                }
                className="w-full px-4 py-1 rounded bg-pthalo dark:bg-fern text-paper dark:text-night font-semibold"
              >
                {form.finishedYear ? `Year: ${form.finishedYear}` : "Select Year"}
              </button>
            </div>

            {form.showMonthPicker && (
              <div className="grid grid-cols-6 gap-1 mt-2">
                {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m) => (
                  <button
                    key={m}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        finishedMonth: m,
                        showMonthPicker: false,
                      }))
                    }
                    className={`p-1 rounded ${
                      form.finishedMonth === m
                        ? "bg-pthalo text-paper"
                        : "bg-fern/20"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {form.showYearPicker && (
              <div className="mt-2 flex flex-wrap gap-1">
                {["2020","2021","2022","2023","2024","2025"].map((year) => (
                  <button
                    key={year}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        finishedYear: year,
                        showYearPicker: false,
                      }))
                    }
                    className={`p-1 rounded ${
                      form.finishedYear === year
                        ? "bg-pthalo text-paper"
                        : "bg-fern/20"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}

            {/* SAVE + DELETE */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={saveForm}
                className="flex-1 px-4 py-2 rounded bg-pthalo dark:bg-fern text-paper dark:text-night font-semibold"
              >
                Save
              </button>

              {editingId !== null && (
  <button
    onClick={() => setShowInlineDeleteConfirm((v) => !v)}
    className="px-4 py-2 rounded bg-pthalo dark:bg-fern text-paper dark:text-night"
  >
    <TrashIcon className="w-4 h-4" />
  </button>
)}

            </div>
            {/* INLINE SLIDE-UP DELETE CONFIRMATION */}
<div
  className={`
    overflow-hidden transition-all duration-300 
    ${showInlineDeleteConfirm ? "max-h-40 mt-3" : "max-h-0"}
  `}
>
  <div className="p-3 rounded bg-paper dark:bg-cellar border border-oak/20 dark:border-parchment/20">
    <p className="text-sm text-oak dark:text-parchment/70 mb-3">
      Are you sure you want to delete this book?
    </p>

    <div className="flex gap-2">
      <button
        onClick={() => setShowInlineDeleteConfirm(false)}
        className="flex-1 px-3 py-1 rounded bg-oak/20 dark:bg-parchment/20 
                   text-ink dark:text-parchment font-semibold"
      >
        Cancel
      </button>

      <button
        onClick={() => {
          deleteBookFromEdit();
          setShowInlineDeleteConfirm(false);
        }}
        className="flex-1 px-3 py-1 rounded bg-red-600 text-white font-semibold"
      >
        Delete
      </button>
    </div>
  </div>
</div>

                {/* COVER PREVIEW */}
                {form.coverUrl && (
                  <div className="mt-4 flex flex-col items-center">
                    <img
                      src={form.coverUrl}
                      className="w-[120px] h-[190px] object-cover rounded shadow"
                    />
                    {form.publisher && (
                      <p className="text-xs text-oak dark:text-parchment/60 mt-2 italic">
                        {form.publisher}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* === BOOK LIST === */}
        <div className="p-3 sm:p-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {sortedFilteredBooks.map((book) => (
                <div key={book.id} className="relative">

                  {/* SELECT MODE CHECKBOX */}
                  {isSelectMode && (
                    <div
                      onClick={(e) => { e.stopPropagation(); toggleBookSelection(book.id); }}
                      className="absolute top-2 left-2 z-20 cursor-pointer"
                    >
                      <div className={`
                        w-6 h-6 rounded border-2 flex items-center justify-center
                        ${selectedBookIds.has(book.id)
                          ? 'bg-pthalo dark:bg-fern border-pthalo dark:border-fern'
                          : 'bg-paper dark:bg-cellar border-oak/50 dark:border-parchment/50'
                        }
                      `}>
                        {selectedBookIds.has(book.id) && (
                          <svg className="w-4 h-4 text-paper dark:text-night" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* BookCard is now clickable for navigation OR selection */}
                  <div onClick={isSelectMode ? (e) => { e.stopPropagation(); toggleBookSelection(book.id); } : undefined}>
                    <BookCard
                      book={book}
                      clickable={!isSelectMode}
                      onClick={isSelectMode ? undefined : handleBookClick}
                      onEdit={isSelectMode ? undefined : startEdit}
                      showEdit={!isSelectMode}
                      view="grid"
                    />
                  </div>
                </div>
              ))}

              {sortedFilteredBooks.length === 0 && (
                <p className="text-oak dark:text-parchment/60 text-sm mt-4">
                  No books match your search.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFilteredBooks.map((book) => (
                <div key={book.id} className="relative">

                  {/* SELECT MODE CHECKBOX for list view */}
                  {isSelectMode && (
                    <div
                      onClick={(e) => { e.stopPropagation(); toggleBookSelection(book.id); }}
                      className="absolute top-3 left-2 z-20 cursor-pointer"
                    >
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center
                        ${selectedBookIds.has(book.id)
                          ? 'bg-pthalo dark:bg-fern border-pthalo dark:border-fern'
                          : 'bg-paper dark:bg-cellar border-oak/50 dark:border-parchment/50'
                        }
                      `}>
                        {selectedBookIds.has(book.id) && (
                          <svg className="w-3.5 h-3.5 text-paper dark:text-night" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* list view row */}
                  <div onClick={isSelectMode ? (e) => { e.stopPropagation(); toggleBookSelection(book.id); } : undefined}>
                    <BookCard
                      book={book}
                      clickable={!isSelectMode}
                      onClick={isSelectMode ? undefined : handleBookClick}
                      onEdit={isSelectMode ? undefined : startEdit}
                      showEdit={!isSelectMode}
                      view="list"
                    />
                  </div>
                </div>
              ))}

              {sortedFilteredBooks.length === 0 && (
                <p className="text-oak dark:text-parchment/60 text-sm mt-4">
                  No books match your search.
                </p>
              )}
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {allFilteredBooks.length > BOOKS_PER_PAGE && (
            <div className="flex items-center justify-center gap-2 mt-6 pb-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pthalo/10 dark:hover:bg-fern/10 transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {/* Show page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage = 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1);
                  
                  const showEllipsis = 
                    (page === 2 && currentPage > 3) ||
                    (page === totalPages - 1 && currentPage < totalPages - 2);

                  if (!showPage && !showEllipsis) return null;

                  if (showEllipsis) {
                    return (
                      <span key={page} className="px-2 text-oak dark:text-parchment/60">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded min-w-[40px] transition-colors ${
                        page === currentPage
                          ? 'bg-pthalo dark:bg-fern text-paper dark:text-night font-bold'
                          : 'border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment hover:bg-pthalo/10 dark:hover:bg-fern/10'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pthalo/10 dark:hover:bg-fern/10 transition-colors"
              >
                Next
              </button>

              <span className="ml-4 text-sm text-oak dark:text-parchment/70">
                Showing {startIndex + 1}-{Math.min(endIndex, allFilteredBooks.length)} of {allFilteredBooks.length}
              </span>
            </div>
          )}
        </div>

        {/* NOTES POPOVER (hover preview) */}
        {hoveredNote && (
          <div
            className="
              fixed z-50
              px-3 py-2 
              max-w-xs
              bg-paper dark:bg-night
              border border-oak/30 dark:border-parchment/30
              text-ink dark:text-parchment
              rounded shadow-lg
              text-sm
              pointer-events-none
            "
            style={{
              top: `${hoveredNote.y}px`,
              left: `${hoveredNote.x}px`,
            }}
          >
            {hoveredNote.text.length > 180
              ? hoveredNote.text.slice(0, 180) + "…"
              : hoveredNote.text}
          </div>
        )}

        {/* NOTES MODAL (full text on click) */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-paper dark:bg-cellar text-ink dark:text-parchment w-11/12 max-w-lg p-6 rounded shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-pthalo dark:text-fern">Notes</h2>

              <div className="max-h-[60vh] overflow-y-auto whitespace-pre-line">
                {modalNotesText}
              </div>

              <button
                onClick={() => setShowNotesModal(false)}
                className="mt-6 px-4 py-2 rounded bg-pthalo dark:bg-fern text-paper dark:text-night font-semibold w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* TAG MANAGEMENT PANEL */}
        {showTagManagementPanel && (
          <TagManagementPanel
            existingTags={existingTags}
            onClose={() => setShowTagManagementPanel(false)}
            onRenameTag={renameTagGlobally}
            onDeleteTag={deleteTagGlobally}
            onMergeTags={mergeTagsGlobally}
            onConditionalTag={addTagConditionally}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  );
}
