import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type QuerySnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

export interface Book {
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
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  createdAt: Date;
  profileImageUrl?: string;
  showBooksToFriends?: boolean;
  showListsToFriends?: boolean;
  privateTag?: string;
  themePreference?: 'light' | 'dark' | 'system';
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user1Username: string;
  user2Id: string;
  user2Username: string;
  createdAt: Date;
}

export interface BookList {
  id: number;
  name: string;
  coverUrl?: string;
  bookIds: number[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Books service
export const booksService = {
  // Get all books for a user
  async getUserBooks(user: User): Promise<Book[]> {
    const q = query(
      collection(db, 'books'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt)
    } as Book));
  },

  // Subscribe to real-time updates of user's books
  subscribeToUserBooks(user: User, callback: (books: Book[]) => void): () => void {
    const q = query(
      collection(db, 'books'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const books = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt)
      } as Book));
      callback(books);
    });
  },

  // Save a book
  async saveBook(user: User, book: Omit<Book, 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Timestamp.now();
    const bookData = {
      ...book,
      userId: user.uid,
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(doc(db, 'books', `${user.uid}_${book.id}`), bookData);
  },

  // Update a book
  async updateBook(user: User, book: Omit<Book, 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Timestamp.now();
    const docRef = doc(db, 'books', `${user.uid}_${book.id}`);
    
    // Get existing document to preserve createdAt
    const existingDocSnap = await getDoc(docRef);
    const createdAt = existingDocSnap.exists() ? existingDocSnap.data().createdAt : now;
    
    const bookData = {
      ...book,
      userId: user.uid,
      createdAt,
      updatedAt: now
    };
    
    await setDoc(docRef, bookData);
  },

  // Delete a book
  async deleteBook(user: User, bookId: number): Promise<void> {
    await deleteDoc(doc(db, 'books', `${user.uid}_${bookId}`));
  },

  // Get books for a specific user (for viewing friend's library)
  async getBooksForUser(userId: string): Promise<Book[]> {
    const q = query(
      collection(db, 'books'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt)
    } as Book));
  },

  // Subscribe to a friend's books (real-time)
  subscribeToFriendBooks(userId: string, callback: (books: Book[]) => void): () => void {
    const q = query(
      collection(db, 'books'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const books = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt)
      } as Book));
      callback(books);
    });
  }
};

// Lists service
export const listsService = {
  // Get all lists for a user
  async getUserLists(user: User): Promise<BookList[]> {
    const q = query(
      collection(db, 'lists'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt)
    } as BookList));
  },

  // Subscribe to real-time updates of user's lists
  subscribeToUserLists(user: User, callback: (lists: BookList[]) => void): () => void {
    const q = query(
      collection(db, 'lists'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const lists = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt)
      } as BookList));
      callback(lists);
    });
  },

  // Save a list
  async saveList(user: User, list: Omit<BookList, 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Timestamp.now();
    const listData = {
      ...list,
      userId: user.uid,
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(doc(db, 'lists', `${user.uid}_${list.id}`), listData);
  },

  // Update a list
  async updateList(user: User, list: Omit<BookList, 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Timestamp.now();
    const listData = {
      ...list,
      userId: user.uid,
      updatedAt: now
    };
    
    await setDoc(doc(db, 'lists', `${user.uid}_${list.id}`), listData, { merge: true });
  },

  // Delete a list
  async deleteList(user: User, listId: number): Promise<void> {
    await deleteDoc(doc(db, 'lists', `${user.uid}_${listId}`));
  }
};

// User Profile service
export const userService = {
  // Check if username is available
  async isUsernameAvailable(username: string): Promise<boolean> {
    const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  },

  // Create or update user profile
  async saveUserProfile(user: User, username: string, displayName: string): Promise<void> {
    const userProfile: UserProfile = {
      userId: user.uid,
      username: username.toLowerCase(),
      displayName: displayName || user.displayName || username,
      email: user.email || '',
      createdAt: new Date()
    };
    await setDoc(doc(db, 'users', user.uid), userProfile);
  },

  // Update user profile with partial data
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, updates, { merge: true });
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        createdAt: convertTimestamp(docSnap.data().createdAt)
      } as UserProfile;
    }
    return null;
  },

  // Find user by username
  async findUserByUsername(username: string): Promise<UserProfile | null> {
    const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return {
        ...data,
        createdAt: convertTimestamp(data.createdAt)
      } as UserProfile;
    }
    return null;
  }
};

// Friend Request service
export const friendRequestService = {
  // Send a friend request
  async sendRequest(fromUser: User, toUsername: string): Promise<void> {
    const toUserProfile = await userService.findUserByUsername(toUsername);
    if (!toUserProfile) {
      throw new Error('User not found');
    }

    const fromUserProfile = await userService.getUserProfile(fromUser.uid);
    if (!fromUserProfile) {
      throw new Error('Your profile not found');
    }

    if (toUserProfile.userId === fromUser.uid) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check if already friends
    const existingFriendship = await friendshipService.areFriends(fromUser.uid, toUserProfile.userId);
    if (existingFriendship) {
      throw new Error('Already friends with this user');
    }

    // Check if request already exists
    const existingRequest = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', fromUser.uid),
      where('toUserId', '==', toUserProfile.userId),
      where('status', '==', 'pending')
    );
    const existingSnap = await getDocs(existingRequest);
    if (!existingSnap.empty) {
      throw new Error('Friend request already sent');
    }

    const requestId = `${fromUser.uid}_${toUserProfile.userId}_${Date.now()}`;
    const now = Timestamp.now();
    const request: Omit<FriendRequest, 'createdAt' | 'updatedAt'> & { createdAt: Timestamp; updatedAt: Timestamp } = {
      id: requestId,
      fromUserId: fromUser.uid,
      fromUsername: fromUserProfile.username,
      toUserId: toUserProfile.userId,
      toUsername: toUserProfile.username,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    await setDoc(doc(db, 'friendRequests', requestId), request);
  },

  // Get incoming friend requests
  subscribeToIncomingRequests(user: User, callback: (requests: FriendRequest[]) => void): () => void {
    const q = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const requests = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt)
      } as FriendRequest));
      callback(requests);
    });
  },

  // Get outgoing friend requests
  subscribeToOutgoingRequests(user: User, callback: (requests: FriendRequest[]) => void): () => void {
    const q = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', user.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const requests = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt)
      } as FriendRequest));
      callback(requests);
    });
  },

  // Accept friend request
  async acceptRequest(requestId: string): Promise<void> {
    const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Friend request not found');
    }

    const request = requestDoc.data() as FriendRequest;
    
    // Create friendship
    await friendshipService.createFriendship(
      request.fromUserId,
      request.fromUsername,
      request.toUserId,
      request.toUsername
    );

    // Update request status
    await setDoc(doc(db, 'friendRequests', requestId), {
      ...request,
      status: 'accepted',
      updatedAt: Timestamp.now()
    });
  },

  // Decline friend request
  async declineRequest(requestId: string): Promise<void> {
    const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Friend request not found');
    }

    const request = requestDoc.data();
    await setDoc(doc(db, 'friendRequests', requestId), {
      ...request,
      status: 'declined',
      updatedAt: Timestamp.now()
    });
  },

  // Cancel outgoing request
  async cancelRequest(requestId: string): Promise<void> {
    await deleteDoc(doc(db, 'friendRequests', requestId));
  }
};

// Friendship service
export const friendshipService = {
  // Create friendship (called when request is accepted)
  async createFriendship(user1Id: string, user1Username: string, user2Id: string, user2Username: string): Promise<void> {
    const friendshipId = [user1Id, user2Id].sort().join('_');
    const friendship: Omit<Friendship, 'createdAt'> & { createdAt: Timestamp } = {
      id: friendshipId,
      user1Id,
      user1Username,
      user2Id,
      user2Username,
      createdAt: Timestamp.now()
    };

    await setDoc(doc(db, 'friendships', friendshipId), friendship);
  },

  // Check if two users are friends
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendshipId = [userId1, userId2].sort().join('_');
    const docSnap = await getDoc(doc(db, 'friendships', friendshipId));
    return docSnap.exists();
  },

  // Get all friends for a user
  subscribeToFriends(user: User, callback: (friends: UserProfile[]) => void): () => void {
    const q1 = query(
      collection(db, 'friendships'),
      where('user1Id', '==', user.uid)
    );
    const q2 = query(
      collection(db, 'friendships'),
      where('user2Id', '==', user.uid)
    );

    let friendships1: Friendship[] = [];
    let friendships2: Friendship[] = [];

    const unsubscribe1 = onSnapshot(q1, async (snapshot) => {
      friendships1 = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt)
      } as Friendship));
      await updateFriendsList();
    });

    const unsubscribe2 = onSnapshot(q2, async (snapshot) => {
      friendships2 = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt)
      } as Friendship));
      await updateFriendsList();
    });

    async function updateFriendsList() {
      const allFriendships = [...friendships1, ...friendships2];
      const friendUserIds = allFriendships.map(f => 
        f.user1Id === user.uid ? f.user2Id : f.user1Id
      );

      const friends: UserProfile[] = [];
      for (const friendId of friendUserIds) {
        const profile = await userService.getUserProfile(friendId);
        if (profile) friends.push(profile);
      }
      callback(friends);
    }

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  },

  // Remove friendship
  async removeFriend(userId1: string, userId2: string): Promise<void> {
    const friendshipId = [userId1, userId2].sort().join('_');
    await deleteDoc(doc(db, 'friendships', friendshipId));
  }
};

// Explore Service - for discovering books from other users
export const exploreService = {
  // Get all books from all users (paginated, limit 100)
  async getAllBooks(limit: number = 100): Promise<Book[]> {
    const q = query(
      collection(db, 'books'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const books = snapshot.docs.slice(0, limit).map(doc => ({
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt)
    } as Book));
    
    return books;
  },

  // Get books by a specific user (for finding similar readers)
  async getBooksByUser(userId: string): Promise<Book[]> {
    const q = query(
      collection(db, 'books'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt)
    } as Book));
  },

  // Find users who have a specific book (by title and author match)
  async findUsersWithBook(title: string, authors: string[]): Promise<string[]> {
    const q = query(
      collection(db, 'books'),
      where('title', '==', title)
    );
    
    const snapshot = await getDocs(q);
    const userIds = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const book = doc.data() as Book;
      // Check if authors match (at least one author in common)
      const hasMatchingAuthor = book.authors.some(author => 
        authors.some(a => a.toLowerCase() === author.toLowerCase())
      );
      if (hasMatchingAuthor) {
        userIds.add(book.userId);
      }
    });
    
    return Array.from(userIds);
  },

  // Get similar books based on tags from specific users
  async getSimilarBooksFromUsers(userIds: string[], tags: string[], currentUserId: string, limit: number = 50): Promise<Book[]> {
    if (userIds.length === 0 || tags.length === 0) return [];
    
    // Get all books from these users
    const allBooks: Book[] = [];
    
    for (const userId of userIds) {
      if (userId === currentUserId) continue; // Skip current user
      
      const userBooks = await this.getBooksByUser(userId);
      allBooks.push(...userBooks);
    }
    
    // Filter books that have at least one matching tag
    const booksWithMatchingTags = allBooks.filter(book => {
      if (!book.tags || book.tags.length === 0) return false;
      return book.tags.some(tag => tags.includes(tag));
    });
    
    // Sort by number of matching tags (most relevant first)
    const sortedBooks = booksWithMatchingTags.sort((a, b) => {
      const aMatches = a.tags?.filter(tag => tags.includes(tag)).length || 0;
      const bMatches = b.tags?.filter(tag => tags.includes(tag)).length || 0;
      return bMatches - aMatches;
    });
    
    // Remove duplicates based on title + first author
    const uniqueBooks = sortedBooks.filter((book, index, self) =>
      index === self.findIndex((b) => 
        b.title.toLowerCase() === book.title.toLowerCase() &&
        b.authors[0]?.toLowerCase() === book.authors[0]?.toLowerCase()
      )
    );
    
    return uniqueBooks.slice(0, limit);
  }
};
