import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/solid';
import { useAuth } from './AuthContext';
import { booksService } from './lib/database';

interface Book {
  id: number;
  title: string;
  authors: string[];
  isbn?: string;
  coverUrl?: string;
  publisher?: string;
  tags?: string[];
  finishedMonth?: string;
  notes?: string;
  releaseYear?: string;
}

interface BookDetailProps {
  darkMode?: boolean;
}

export default function BookDetail({ darkMode = false }: BookDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [loading, setLoading] = useState(true);

  const placeholder = "https://via.placeholder.com/300x480?text=No+Cover";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('BookDetail: Looking for book with ID:', id);
    
    // Subscribe to real-time book updates from Firebase
    const unsubscribe = booksService.subscribeToUserBooks(user, (firebaseBooks) => {
      console.log('BookDetail: Received books from Firebase:', firebaseBooks.length);
      console.log('BookDetail: All book IDs:', firebaseBooks.map(b => b.id));
      
      const foundBook = firebaseBooks.find(b => b.id === parseInt(id || '0'));
      console.log('BookDetail: Found book:', foundBook ? foundBook.title : 'NOT FOUND');
      
      if (foundBook) {
        setBook(foundBook);
        setNotes(foundBook.notes || '');
      } else {
        setBook(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user]);

  const handleNotesChange = async (newNotes: string) => {
    setNotes(newNotes);
    if (book && user) {
      try {
        const updatedBook = { ...book, notes: newNotes };
        await booksService.updateBook(user, updatedBook);
        setBook(updatedBook);
      } catch (error) {
        console.error("Error updating notes:", error);
        alert("Failed to update notes. Please try again.");
      }
    }
  };

  const handleSaveNotes = () => {
    handleNotesChange(notes);
    setIsEditingNotes(false);
  };

  // Show loading state while fetching book
  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-700 ${
        darkMode 
          ? 'bg-night text-parchment' 
          : 'bg-paper text-ink'
      } flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show "not found" after loading is complete
  if (!book) {
    return (
      <div className={`min-h-screen transition-colors duration-700 ${
        darkMode 
          ? 'bg-night text-parchment' 
          : 'bg-paper text-ink'
      } flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-xl mb-4">Book not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-pthalo dark:bg-fern text-paper dark:text-night rounded hover:opacity-80 transition-opacity"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 ${
      darkMode 
        ? 'bg-night text-parchment' 
        : 'bg-paper text-ink'
    }`}>
      {/* Navigation Header */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-pthalo dark:text-fern hover:opacity-80 transition-opacity"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Library
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-pthalo dark:bg-fern text-paper dark:text-night rounded hover:opacity-80 transition-opacity"
          >
            <PencilIcon className="w-5 h-5" />
            Edit Book
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-8">
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          
          {/* Left Side - Large Cover */}
          <div className="lg:w-1/3">
            <div className="sticky top-6">
              <img
                src={book.coverUrl || placeholder}
                alt={book.title}
                className="w-full max-w-sm mx-auto lg:mx-0 rounded-lg shadow-lg book-shadow"
              />
            </div>
          </div>

          {/* Right Side - Book Information */}
          <div className="lg:w-2/3 space-y-6">
            
            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold text-pthalo dark:text-fern mb-2">
                {book.title}
              </h1>
            </div>

            {/* Authors */}
            {book.authors && book.authors.length > 0 && (
              <div>
                <h2 className="text-2xl text-oak dark:text-parchment/80 mb-1">
                  by {book.authors.join(', ')}
                </h2>
              </div>
            )}

            {/* Book Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-t border-b border-oak/20 dark:border-parchment/20">
              
              {/* Publisher */}
              {book.publisher && (
                <div>
                  <dt className="text-sm font-medium text-oak dark:text-parchment/70 mb-1">
                    Publisher
                  </dt>
                  <dd className="text-lg text-pthalo dark:text-fern">
                    {book.publisher}
                  </dd>
                </div>
              )}

              {/* ISBN */}
              {book.isbn && (
                <div>
                  <dt className="text-sm font-medium text-oak dark:text-parchment/70 mb-1">
                    ISBN
                  </dt>
                  <dd className="text-lg font-mono text-pthalo dark:text-fern">
                    {book.isbn}
                  </dd>
                </div>
              )}

              {/* Release Year */}
              {book.releaseYear && (
                <div>
                  <dt className="text-sm font-medium text-oak dark:text-parchment/70 mb-1">
                    Release Year
                  </dt>
                  <dd className="text-lg text-pthalo dark:text-fern">
                    {book.releaseYear}
                  </dd>
                </div>
              )}

              {/* Finished Reading */}
              {book.finishedMonth && (
                <div>
                  <dt className="text-sm font-medium text-oak dark:text-parchment/70 mb-1">
                    Finished Reading
                  </dt>
                  <dd className="text-lg text-pthalo dark:text-fern">
                    {book.finishedMonth}
                  </dd>
                </div>
              )}
            </div>

            {/* Tags */}
            {book.tags && book.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-oak dark:text-parchment/80 mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="
                        bg-fern/30 dark:bg-pthalo/40 
                        text-pthalo dark:text-parchment 
                        px-3 py-1 text-sm 
                        rounded-full border border-pthalo/30
                      "
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-medium text-oak dark:text-parchment/80">
                  Notes
                </h3>
                <button
                  onClick={() => setIsEditingNotes(!isEditingNotes)}
                  className="p-1 text-pthalo dark:text-fern hover:opacity-70 transition-opacity"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
              
              {isEditingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your notes about this book..."
                    rows={12}
                    className="
                      w-full p-4 rounded-lg text-base leading-relaxed
                      bg-chalk dark:bg-cellar
                      text-ink dark:text-parchment
                      border border-oak/30 dark:border-parchment/20 
                      focus:border-pthalo dark:focus:border-fern 
                      focus:outline-none resize-y
                    "
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNotes}
                      className="
                        px-4 py-2 bg-pthalo dark:bg-fern 
                        text-paper dark:text-night rounded
                        hover:opacity-80 transition-opacity
                      "
                    >
                      Save Notes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingNotes(false);
                        setNotes(book.notes || '');
                      }}
                      className="
                        px-4 py-2 bg-oak/20 dark:bg-parchment/20 
                        text-ink dark:text-parchment rounded
                        hover:opacity-80 transition-opacity
                      "
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingNotes(true)}
                  className="
                    w-full p-4 rounded-lg text-base leading-relaxed min-h-[200px]
                    bg-chalk dark:bg-cellar
                    text-ink dark:text-parchment
                    border border-oak/30 dark:border-parchment/20 
                    cursor-text hover:border-pthalo dark:hover:border-fern
                    transition-colors
                    whitespace-pre-wrap break-words overflow-wrap-anywhere
                  "
                >
                  {book.notes || (
                    <span className="text-oak/60 dark:text-parchment/50 italic">
                      Click to add notes about this book...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
