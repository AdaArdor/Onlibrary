import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { exploreService, booksService, type Book } from './lib/database';
import BookCard from './components/ui/BookCard';

export default function Explore({ darkMode = false }: { darkMode?: boolean }) {
  const { user } = useAuth();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'similar'>('all');

  // Load all books on mount
  useEffect(() => {
    if (!user) return;

    const loadBooks = async () => {
      setIsLoading(true);
      try {
        const books = await exploreService.getAllBooks(200);
        
        // Remove duplicates (same title + first author)
        const uniqueBooks = books.filter((book, index, self) =>
          index === self.findIndex((b) => 
            b.title.toLowerCase() === book.title.toLowerCase() &&
            b.authors[0]?.toLowerCase() === book.authors[0]?.toLowerCase()
          )
        );
        
        setAllBooks(uniqueBooks);
        setDisplayedBooks(uniqueBooks);
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBooks();
  }, [user]);

  // Load user's own books for "similar books" feature
  useEffect(() => {
    if (!user) return;

    const unsubscribe = booksService.subscribeToUserBooks(user, (books: Book[]) => {
      setMyBooks(books);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter books based on search query and exclude books already in user's library
  useEffect(() => {
    // Filter out books that user already has
    const booksNotInLibrary = allBooks.filter(book => {
      return !myBooks.some(myBook => 
        myBook.title.toLowerCase() === book.title.toLowerCase() &&
        myBook.authors[0]?.toLowerCase() === book.authors[0]?.toLowerCase()
      );
    });

    if (!searchQuery.trim()) {
      setDisplayedBooks(booksNotInLibrary);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = booksNotInLibrary.filter(book => {
      const titleMatch = book.title.toLowerCase().includes(query);
      const authorMatch = book.authors.some(author => author.toLowerCase().includes(query));
      const publisherMatch = book.publisher?.toLowerCase().includes(query);
      const tagMatch = book.tags?.some(tag => tag.toLowerCase().includes(query));
      
      return titleMatch || authorMatch || publisherMatch || tagMatch;
    });

    setDisplayedBooks(filtered);
  }, [searchQuery, allBooks, myBooks]);

  // Find similar books based on selected book
  const findSimilarBooks = async (book: Book) => {
    if (!user) return;

    setSelectedBook(book);
    setIsLoadingSimilar(true);
    setViewMode('similar');

    try {
      // Find users who have this book
      const usersWithBook = await exploreService.findUsersWithBook(book.title, book.authors);
      
      // Get similar books from those users based on shared tags
      const tags = book.tags || [];
      const similar = await exploreService.getSimilarBooksFromUsers(usersWithBook, tags, user.uid, 50);
      
      // Filter out: 1) the selected book itself, 2) books already in user's library
      const filteredSimilar = similar.filter(similarBook => {
        // Exclude the selected book
        const isSelectedBook = 
          similarBook.title.toLowerCase() === book.title.toLowerCase() &&
          similarBook.authors[0]?.toLowerCase() === book.authors[0]?.toLowerCase();
        
        // Exclude books already in user's library
        const isInLibrary = myBooks.some(myBook =>
          myBook.title.toLowerCase() === similarBook.title.toLowerCase() &&
          myBook.authors[0]?.toLowerCase() === similarBook.authors[0]?.toLowerCase()
        );
        
        return !isSelectedBook && !isInLibrary;
      });
      
      setSimilarBooks(filteredSimilar);
    } catch (error) {
      console.error('Error finding similar books:', error);
    } finally {
      setIsLoadingSimilar(false);
    }
  };

  const backToAllBooks = () => {
    setViewMode('all');
    setSelectedBook(null);
    setSimilarBooks([]);
  };

  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-700 ${
        darkMode ? 'bg-night text-parchment' : 'bg-paper text-ink'
      }`}>
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-pthalo dark:text-fern mb-6">
            Explore
          </h1>
          <div className="bg-chalk dark:bg-cellar rounded-lg p-8 text-center">
            <p className="text-oak dark:text-parchment/80">
              Please log in to explore books
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 ${
      darkMode ? 'bg-night text-parchment' : 'bg-paper text-ink'
    }`}>
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-pthalo dark:text-fern mb-6">
          Explore Books
        </h1>

        {viewMode === 'all' ? (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, tags, or publisher..."
                  className="w-full px-4 py-3 pr-10 rounded-lg border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-night text-ink dark:text-parchment focus:outline-none focus:ring-2 focus:ring-pthalo dark:focus:ring-fern"
                />
                <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-oak dark:text-parchment/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* My Books - For Finding Similar Books */}
            {myBooks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-pthalo dark:text-fern mb-4">
                  Find Similar Books from Your Library
                </h2>
                <p className="text-sm text-oak dark:text-parchment/70 mb-4">
                  Click one of your books to see what other readers with similar tastes are reading
                </p>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {myBooks.slice(0, 10).map((book) => (
                    <div
                      key={book.id}
                      onClick={() => findSimilarBooks(book)}
                      className="flex-shrink-0 w-32 cursor-pointer transition-transform hover:scale-105"
                    >
                      <img
                        src={book.coverUrl || '/placeholder.svg'}
                        alt={book.title}
                        className="w-32 h-48 object-cover rounded-lg shadow-md"
                      />
                      <p className="text-xs mt-2 text-center truncate text-oak dark:text-parchment/80">
                        {book.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Books Grid */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-pthalo dark:text-fern">
                All Books {searchQuery && `(${displayedBooks.length} results)`}
              </h2>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-oak dark:text-parchment">
                Loading books...
              </div>
            ) : displayedBooks.length === 0 ? (
              <div className="text-center py-12 text-oak dark:text-parchment">
                {searchQuery ? 'No books found matching your search' : 'No books available yet'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {displayedBooks.map((book) => (
                  <BookCard key={`${book.userId}_${book.id}`} book={book} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Similar Books View */}
            <button
              onClick={backToAllBooks}
              className="mb-6 flex items-center gap-2 text-pthalo dark:text-fern hover:underline"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to All Books
            </button>

            {selectedBook && (
              <div className="mb-8 bg-chalk dark:bg-cellar rounded-lg p-6">
                <h2 className="text-2xl font-bold text-pthalo dark:text-fern mb-4">
                  Books Similar to:
                </h2>
                <div className="flex items-start gap-6">
                  <img
                    src={selectedBook.coverUrl || '/placeholder.svg'}
                    alt={selectedBook.title}
                    className="w-24 h-36 object-cover rounded-lg shadow-md"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-ink dark:text-parchment">
                      {selectedBook.title}
                    </h3>
                    <p className="text-oak dark:text-parchment/80 mt-1">
                      {selectedBook.authors.join(', ')}
                    </p>
                    {selectedBook.tags && selectedBook.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedBook.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs rounded-full bg-pthalo/10 dark:bg-fern/10 text-pthalo dark:text-fern"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isLoadingSimilar ? (
              <div className="text-center py-12 text-oak dark:text-parchment">
                Finding similar books...
              </div>
            ) : similarBooks.length === 0 ? (
              <div className="text-center py-12 text-oak dark:text-parchment">
                No similar books found. Try selecting a book with more tags!
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-pthalo dark:text-fern mb-4">
                  {similarBooks.length} Similar Books Found
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {similarBooks.map((book) => (
                    <BookCard key={`${book.userId}_${book.id}`} book={book} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
