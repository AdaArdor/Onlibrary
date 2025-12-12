import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  userService, 
  friendRequestService, 
  friendshipService,
  booksService,
  type UserProfile,
  type FriendRequest,
  type Book
} from './lib/database';
import { 
  MagnifyingGlassIcon, 
  CheckIcon, 
  XMarkIcon,
  UserPlusIcon,
  BookOpenIcon,
  TagIcon
} from '@heroicons/react/24/solid';
import BookCard from './components/ui/BookCard';

// Helper function to format timestamps
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export default function Connect({ darkMode = false }: { darkMode?: boolean }) {
  const { user } = useAuth();
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isSettingUpProfile, setIsSettingUpProfile] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  
  // Search
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Friend requests
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  
  // Friends
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);
  const [friendBooks, setFriendBooks] = useState<Book[]>([]);
  const [isLoadingFriendBooks, setIsLoadingFriendBooks] = useState(false);
  const [viewMode, setViewMode] = useState<'books' | 'lists'>('books');
  const [showFriendModal, setShowFriendModal] = useState(false);
  
  // Activity feed
  const [recentActivity, setRecentActivity] = useState<Array<{
    userId: string;
    username: string;
    displayName: string;
    book: Book;
    action: 'added' | 'finished';
    timestamp: Date;
  }>>([]);

  // Load current user profile
  useEffect(() => {
    if (!user) {
      setIsLoadingProfile(false);
      return;
    }
    
    setIsLoadingProfile(true);
    userService.getUserProfile(user.uid).then(profile => {
      setCurrentUserProfile(profile);
      if (profile) {
        setDisplayNameInput(profile.displayName);
      }
      setIsLoadingProfile(false);
    });
  }, [user]);

  // Subscribe to friend requests and friends
  useEffect(() => {
    if (!user || !currentUserProfile) return;

    console.log('📡 Subscribing to friend requests for user:', user.uid);
    
    const unsubIncoming = friendRequestService.subscribeToIncomingRequests(user, (requests) => {
      console.log('📥 Incoming requests updated:', requests);
      setIncomingRequests(requests);
    });
    
    const unsubOutgoing = friendRequestService.subscribeToOutgoingRequests(user, (requests) => {
      console.log('📤 Outgoing requests updated:', requests);
      setOutgoingRequests(requests);
    });
    
    const unsubFriends = friendshipService.subscribeToFriends(user, (friendsList) => {
      console.log('👥 Friends list updated:', friendsList);
      setFriends(friendsList);
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
      unsubFriends();
    };
  }, [user, currentUserProfile]);

  // Load friend's books when selected
  useEffect(() => {
    if (!selectedFriend || !user) {
      setFriendBooks([]);
      return;
    }

    setIsLoadingFriendBooks(true);
    
    // Subscribe to friend's books in real-time
    const unsubscribe = booksService.subscribeToFriendBooks(selectedFriend.userId, (books) => {
      // Apply privacy filtering
      let filteredBooks = books;
      
      // Check if friend has disabled showing books to friends
      if (selectedFriend.showBooksToFriends === false) {
        filteredBooks = [];
      } else if (selectedFriend.privateTag) {
        // Filter out books with the private tag
        const privateTag = selectedFriend.privateTag.toLowerCase();
        filteredBooks = books.filter(book => 
          !book.tags?.some(tag => tag.toLowerCase() === privateTag)
        );
      }
      
      setFriendBooks(filteredBooks);
      setIsLoadingFriendBooks(false);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedFriend, user]);

  // Load recent activity from all friends
  useEffect(() => {
    if (!friends.length || !user) return;

    const loadRecentActivity = async () => {
      const activities: typeof recentActivity = [];
      
      // Get books from all friends (most recently added)
      for (const friend of friends) {
        try {
          const books = await booksService.getUserBooks({ uid: friend.userId } as any);
          
          // Apply privacy filtering
          let visibleBooks = books;
          if (friend.showBooksToFriends === false) continue;
          if (friend.privateTag) {
            const privateTag = friend.privateTag.toLowerCase();
            visibleBooks = books.filter(book => 
              !book.tags?.some(tag => tag.toLowerCase() === privateTag)
            );
          }
          
          // Get 5 most recent books from this friend
          const recentBooks = visibleBooks
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);
          
          recentBooks.forEach(book => {
            activities.push({
              userId: friend.userId,
              username: friend.username,
              displayName: friend.displayName,
              book,
              action: book.finishedMonth ? 'finished' : 'added',
              timestamp: book.createdAt
            });
          });
        } catch (error) {
          console.error(`Error loading books for ${friend.username}:`, error);
        }
      }
      
      // Sort by timestamp and take top 10
      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);
      
      setRecentActivity(sortedActivities);
    };

    loadRecentActivity();
  }, [friends, user]);

  const handleSetupProfile = async () => {
    if (!user) return;
    
    const username = usernameInput.trim().toLowerCase();
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setIsSettingUpProfile(true);
    setUsernameError('');

    try {
      const available = await userService.isUsernameAvailable(username);
      if (!available) {
        setUsernameError('Username already taken');
        setIsSettingUpProfile(false);
        return;
      }

      await userService.saveUserProfile(user, username, displayNameInput || username);
      const profile = await userService.getUserProfile(user.uid);
      setCurrentUserProfile(profile);
      setUsernameInput('');
      setDisplayNameInput('');
    } catch (error) {
      console.error('Error setting up profile:', error);
      setUsernameError('Failed to create profile. Please try again.');
    } finally {
      setIsSettingUpProfile(false);
    }
  };

  const handleSearch = async () => {
    if (!searchUsername.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const result = await userService.findUserByUsername(searchUsername.trim());
      if (result) {
        if (result.userId === user?.uid) {
          setSearchError('This is your own profile!');
        } else {
          setSearchResult(result);
        }
      } else {
        setSearchError('User not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!user || !searchResult) return;

    try {
      await friendRequestService.sendRequest(user, searchResult.username);
      setSearchUsername('');
      setSearchResult(null);
    } catch (error: any) {
      setSearchError(error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendRequestService.acceptRequest(requestId);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await friendRequestService.declineRequest(requestId);
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await friendRequestService.cancelRequest(requestId);
    } catch (error) {
      console.error('Error canceling request:', error);
    }
  };

  // Show loading state while checking profile
  if (isLoadingProfile) {
    return (
      <div className={`min-h-screen transition-colors duration-700 ${
        darkMode ? 'bg-night text-parchment' : 'bg-paper text-ink'
      }`}>
        <div className="container mx-auto px-6 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pthalo dark:border-fern mx-auto mb-4"></div>
            <p className="text-oak dark:text-parchment/70">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no profile, show setup screen
  if (!currentUserProfile) {
    return (
      <div className={`min-h-screen transition-colors duration-700 ${
        darkMode ? 'bg-night text-parchment' : 'bg-paper text-ink'
      }`}>
        <div className="container mx-auto px-6 py-12 max-w-md">
          <h1 className="text-4xl font-bold text-pthalo dark:text-fern mb-6 text-center">
            Create Your Profile
          </h1>
          <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
            <p className="text-sm text-oak dark:text-parchment/70 mb-4">
              Choose a unique username to connect with friends and share your book collection.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                  placeholder="e.g., bookworm123"
                  className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-paper dark:bg-night"
                  maxLength={20}
                />
                {usernameError && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{usernameError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Display Name (optional)</label>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-paper dark:bg-night"
                  maxLength={50}
                />
              </div>

              <button
                onClick={handleSetupProfile}
                disabled={isSettingUpProfile || !usernameInput.trim()}
                className="w-full px-4 py-2 bg-pthalo dark:bg-fern text-paper dark:text-night rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {isSettingUpProfile ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
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
        <h1 className="text-4xl font-bold text-pthalo dark:text-fern mb-2">
          Connect
        </h1>
        <p className="text-sm text-oak dark:text-parchment/70 mb-6">
          Your username: <span className="font-semibold">@{currentUserProfile.username}</span>
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Search & Requests */}
          <div className="space-y-6">
            {/* Search for Users */}
            <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
              <h2 className="text-xl font-bold text-pthalo dark:text-fern mb-4">Find Friends</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by username"
                  className="flex-1 px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-paper dark:bg-night"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-2 bg-pthalo dark:bg-fern text-paper dark:text-night rounded-lg hover:opacity-90"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>

              {searchError && (
                <p className="text-red-600 dark:text-red-400 text-sm">{searchError}</p>
              )}

              {searchResult && (
                <div className="border border-oak/20 dark:border-parchment/20 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">@{searchResult.username}</p>
                    <p className="text-sm text-oak dark:text-parchment/70">{searchResult.displayName}</p>
                  </div>
                  <button
                    onClick={handleSendRequest}
                    className="px-3 py-1 bg-pthalo dark:bg-fern text-paper dark:text-night rounded-lg text-sm hover:opacity-90 flex items-center gap-1"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Add Friend
                  </button>
                </div>
              )}
            </div>

            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
                <h2 className="text-xl font-bold text-pthalo dark:text-fern mb-4">
                  Friend Requests ({incomingRequests.length})
                </h2>
                <div className="space-y-3">
                  {incomingRequests.map(request => (
                    <div key={request.id} className="border border-oak/20 dark:border-parchment/20 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">@{request.fromUsername}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                          title="Accept"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          title="Decline"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Requests - Always visible */}
            <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
              <h2 className="text-xl font-bold text-pthalo dark:text-fern mb-4">
                Pending Requests {outgoingRequests.length > 0 && `(${outgoingRequests.length})`}
              </h2>
              {outgoingRequests.length > 0 ? (
                <div className="space-y-3">
                  {outgoingRequests.map(request => (
                    <div key={request.id} className="border border-oak/20 dark:border-parchment/20 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">@{request.toUsername}</p>
                        <p className="text-xs text-oak dark:text-parchment/60">Waiting for response...</p>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-oak dark:text-parchment/60">
                  No pending requests. Search for friends above to send a request!
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Friends List & Activity Feed */}
          <div className="space-y-6">
            {/* Friends List */}
            <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
              <h2 className="text-xl font-bold text-pthalo dark:text-fern mb-4">
                Friends ({friends.length})
              </h2>
              {friends.length === 0 ? (
                <p className="text-oak dark:text-parchment/70 text-center py-8">
                  No friends yet. Search for users to connect!
                </p>
              ) : (
                <div className="space-y-2">
                  {friends.map(friend => (
                    <button
                      key={friend.userId}
                      onClick={() => {
                        setSelectedFriend(friend);
                        setShowFriendModal(true);
                      }}
                      className="w-full border border-oak/20 dark:border-parchment/20 rounded-lg p-3 hover:bg-paper dark:hover:bg-night transition-colors text-left flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold">@{friend.username}</p>
                        <p className="text-sm text-oak dark:text-parchment/70">{friend.displayName}</p>
                      </div>
                      <BookOpenIcon className="w-5 h-5 text-pthalo dark:text-fern" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Feed */}
            {friends.length > 0 && recentActivity.length > 0 && (
              <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
                <h2 className="text-xl font-bold text-pthalo dark:text-fern mb-4">
                  Recent Activity
                </h2>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div 
                      key={`${activity.userId}-${activity.book.id}-${index}`}
                      className="border border-oak/20 dark:border-parchment/20 rounded-lg p-3 hover:bg-paper dark:hover:bg-night transition-colors"
                    >
                      <div className="flex gap-3">
                        {activity.book.coverUrl && (
                          <img 
                            src={activity.book.coverUrl} 
                            alt={activity.book.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-semibold text-pthalo dark:text-fern">
                              @{activity.username}
                            </span>
                            {' '}
                            {activity.action === 'finished' ? 'finished' : 'added'}
                          </p>
                          <p className="font-medium text-sm truncate">
                            {activity.book.title}
                          </p>
                          <p className="text-xs text-oak dark:text-parchment/60">
                            {activity.book.authors.join(', ')}
                          </p>
                          <p className="text-xs text-oak dark:text-parchment/50 mt-1">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Friend Library Modal */}
        {showFriendModal && selectedFriend && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFriendModal(false)}>
            <div 
              className="bg-paper dark:bg-cellar rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-chalk dark:bg-night px-6 py-4 border-b border-oak/20 dark:border-parchment/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-pthalo dark:text-fern">
                      {selectedFriend.displayName}'s Library
                    </h2>
                    <p className="text-sm text-oak dark:text-parchment/60 mt-1">
                      @{selectedFriend.username}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowFriendModal(false)}
                    className="text-2xl text-oak dark:text-parchment/60 hover:text-pthalo dark:hover:text-fern w-8 h-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>

                {/* Privacy Notice */}
                {selectedFriend.showBooksToFriends === false ? (
                  <p className="text-sm text-oak dark:text-parchment/60 mt-3 flex items-center gap-1">
                    🔒 This user's library is private
                  </p>
                ) : selectedFriend.privateTag ? (
                  <p className="text-sm text-oak dark:text-parchment/60 mt-3 flex items-center gap-1">
                    <TagIcon className="w-3 h-3" />
                    Books tagged "{selectedFriend.privateTag}" are hidden
                  </p>
                ) : null}

                {/* Tab Navigation */}
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => setViewMode('books')}
                    className={`pb-2 px-1 border-b-2 transition-colors ${
                      viewMode === 'books'
                        ? 'border-pthalo dark:border-fern text-pthalo dark:text-fern font-semibold'
                        : 'border-transparent text-oak dark:text-parchment/70 hover:text-pthalo dark:hover:text-fern'
                    }`}
                  >
                    Books ({friendBooks.length})
                  </button>
                  <button
                    onClick={() => setViewMode('lists')}
                    className={`pb-2 px-1 border-b-2 transition-colors ${
                      viewMode === 'lists'
                        ? 'border-pthalo dark:border-fern text-pthalo dark:text-fern font-semibold'
                        : 'border-transparent text-oak dark:text-parchment/70 hover:text-pthalo dark:hover:text-fern'
                    }`}
                  >
                    Lists (Coming Soon)
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingFriendBooks ? (
                  <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pthalo dark:border-fern"></div>
                    <p className="mt-4 text-sm text-oak dark:text-parchment/60">Loading books...</p>
                  </div>
                ) : selectedFriend.showBooksToFriends === false || friendBooks.length === 0 ? (
                  <div className="text-center py-20">
                    <BookOpenIcon className="w-16 h-16 mx-auto text-oak/30 dark:text-parchment/30 mb-4" />
                    <p className="text-lg text-oak dark:text-parchment/70">
                      {selectedFriend.showBooksToFriends === false 
                        ? 'This library is private'
                        : 'No books in this library yet'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {friendBooks.map(book => (
                      <BookCard 
                        key={book.id} 
                        book={book}
                        clickable={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
