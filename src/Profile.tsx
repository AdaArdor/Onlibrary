import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { userService, booksService, type UserProfile, type Book } from './lib/database';
import { 
  UserCircleIcon,
  KeyIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/solid';

export default function Profile({ darkMode = false }: { darkMode?: boolean }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'settings' | 'data' | 'about'>('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile tab
  const [displayName, setDisplayName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Account tab
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Settings tab
  const [showBooksToFriends, setShowBooksToFriends] = useState(true);
  const [showListsToFriends, setShowListsToFriends] = useState(true);
  const [privateTag, setPrivateTag] = useState('');
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');

  // Data tab
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStats, setImportStats] = useState<{ total: number; success: number; failed: number } | null>(null);

  // Load user profile
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    userService.getUserProfile(user.uid).then(profile => {
      if (profile) {
        setUserProfile(profile);
        setDisplayName(profile.displayName);
      }
      setIsLoading(false);
    });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user || !userProfile) return;
    
    setIsSavingProfile(true);
    try {
      const updates: Partial<UserProfile> = {
        displayName: displayName.trim() || userProfile.username,
      };
      
      // Handle profile image upload if it's a data URL (uploaded from computer)
      if (profileImageUrl.trim()) {
        if (profileImageUrl.startsWith('data:')) {
          // Upload to Firebase Storage
          console.log('Uploading profile image to Firebase Storage...');
          const { uploadImageToStorage, generateImageFilename } = await import('./lib/imageUtils');
          const path = generateImageFilename(user.uid, 'profile-images');
          const uploadedUrl = await uploadImageToStorage(profileImageUrl, path);
          updates.profileImageUrl = uploadedUrl;
          setProfileImageUrl(uploadedUrl); // Update state with the uploaded URL
        } else {
          // Regular URL, save as-is
          updates.profileImageUrl = profileImageUrl.trim();
        }
      }
      
      console.log('Updating profile with:', updates);
      await userService.updateUserProfile(user.uid, updates);
      
      // Reload the user profile
      const updated = await userService.getUserProfile(user.uid);
      if (updated) {
        setUserProfile(updated);
        setDisplayName(updated.displayName);
        setProfileImageUrl(updated.profileImageUrl || '');
      }
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangeEmail = async () => {
    // TODO: Implement email change with Firebase Auth
    alert('Email change functionality coming soon!');
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // TODO: Implement password change with Firebase Auth
    alert('Password change functionality coming soon!');
  };

  const handleSaveSettings = async () => {
    // TODO: Save privacy settings to user profile in Firestore
    alert('Settings saved! (Privacy features will be implemented in next update)');
  };

  const handleExportCSV = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      const books = await booksService.getUserBooks(user);
      
      // Create CSV header
      const headers = [
        'Title',
        'Author',
        'ISBN',
        'Publisher',
        'Release Year',
        'Tags',
        'Finished Month',
        'Finished Year',
        'Notes',
        'Date Added'
      ];
      
      // Create CSV rows
      const rows = books.map((book: Book) => {
        // Extract finished year from finishedMonth (YYYY-MM format)
        const finishedYear = book.finishedMonth ? book.finishedMonth.split('-')[0] : '';
        
        return [
          `"${book.title.replace(/"/g, '""')}"`,
          `"${book.authors.join(', ').replace(/"/g, '""')}"`,
          book.isbn || '',
          `"${(book.publisher || '').replace(/"/g, '""')}"`,
          book.releaseYear || '',
          `"${(book.tags || []).join(', ').replace(/"/g, '""')}"`,
          book.finishedMonth || '',
          finishedYear,
          `"${(book.notes || '').replace(/"/g, '""')}"`,
          book.createdAt.toISOString().split('T')[0]
        ];
      });
      
      // Combine headers and rows
      const csv = [headers.join(','), ...rows.map((row: string[]) => row.join(','))].join('\n');
      
      // Create download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `onlibrary_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Successfully exported ${books.length} books!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export books. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportCSV = async () => {
    if (!user || !importFile) return;
    
    setIsImporting(true);
    setImportStats(null);
    
    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file is empty or invalid.');
        setIsImporting(false);
        return;
      }
      
      // Parse header to detect format (Goodreads or Onlibrary)
      const header = lines[0].toLowerCase();
      const isGoodreads = header.includes('book id') || header.includes('my rating');
      
      let success = 0;
      let failed = 0;
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        try {
          const line = lines[i];
          if (!line.trim()) continue;
          
          // Parse CSV line (handle quoted fields)
          const values = parseCSVLine(line);
          
          let book: Partial<Book>;
          
          if (isGoodreads) {
            // Goodreads format: Book Id, Title, Author, ISBN, My Rating, Average Rating, Publisher, Year Published, Date Read, Date Added
            book = {
              title: values[1] || 'Untitled',
              authors: values[2] ? [values[2]] : ['Unknown Author'],
              isbn: values[3] || undefined,
              publisher: values[6] || undefined,
              releaseYear: values[7] || undefined,
              notes: values[4] ? `Rating: ${values[4]}/5` : undefined,
              finishedMonth: values[8] || undefined,
            };
          } else {
            // Onlibrary format: Title, Author, ISBN, Publisher, Release Year, Tags, Finished Month, Finished Year, Notes, Date Added
            book = {
              title: values[0] || 'Untitled',
              authors: values[1] ? values[1].split(',').map(a => a.trim()) : ['Unknown Author'],
              isbn: values[2] || undefined,
              publisher: values[3] || undefined,
              releaseYear: values[4] || undefined,
              tags: values[5] ? values[5].split(',').map(t => t.trim()).filter(Boolean) : undefined,
              finishedMonth: values[6] || undefined,
              // values[7] is Finished Year (redundant with finishedMonth, so we skip it)
              notes: values[8] || undefined,
            };
          }
          
          // Add book to database
          await booksService.saveBook(user, {
            ...book,
            id: Date.now() + i,
            title: book.title || 'Untitled',
            authors: book.authors || ['Unknown Author']
          } as Omit<Book, 'userId' | 'createdAt' | 'updatedAt'>);
          
          success++;
        } catch (error) {
          console.error(`Failed to import line ${i}:`, error);
          failed++;
        }
      }
      
      setImportStats({ total: lines.length - 1, success, failed });
      alert(`Import complete!\nSuccessfully imported: ${success}\nFailed: ${failed}`);
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import CSV. Please check the file format.');
    } finally {
      setIsImporting(false);
      setImportFile(null);
    }
  };

  // Helper function to parse CSV line with quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // Toggle quotes
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-700 ${
        darkMode ? 'bg-night text-parchment' : 'bg-paper text-ink'
      }`}>
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-oak dark:text-parchment/80">
            Please log in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen transition-colors duration-700 ${
        darkMode ? 'bg-night text-parchment' : 'bg-paper text-ink'
      }`}>
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pthalo dark:border-fern mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-700 ${
      darkMode ? 'bg-night text-parchment' : 'bg-paper text-ink'
    }`}>
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-oak/20 dark:border-parchment/20 p-3 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-pthalo dark:text-fern mb-4 sm:mb-6">
          {userProfile?.displayName || 'Profile'}
        </h1>
        
        <nav className="flex md:flex-col gap-1 sm:gap-2 overflow-x-auto md:overflow-x-visible">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'profile'
                ? 'bg-pthalo dark:bg-fern text-paper dark:text-night'
                : 'hover:bg-chalk dark:hover:bg-cellar'
            }`}
          >
            <UserCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'account'
                ? 'bg-pthalo dark:bg-fern text-paper dark:text-night'
                : 'hover:bg-chalk dark:hover:bg-cellar'
            }`}
          >
            <KeyIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Account</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'bg-pthalo dark:bg-fern text-paper dark:text-night'
                : 'hover:bg-chalk dark:hover:bg-cellar'
            }`}
          >
            <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'data'
                ? 'bg-pthalo dark:bg-fern text-paper dark:text-night'
                : 'hover:bg-chalk dark:hover:bg-cellar'
            }`}
          >
            <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Data</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'about'
                ? 'bg-pthalo dark:bg-fern text-paper dark:text-night'
                : 'hover:bg-chalk dark:hover:bg-cellar'
            }`}
          >
            <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">About</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-pthalo dark:text-fern mb-4 sm:mb-6">
              Profile
            </h2>

            <div className="bg-chalk dark:bg-cellar rounded-lg p-6 space-y-6">
              {/* Profile Picture and Username */}
              <div>
                <label className="block text-sm font-medium mb-2">Profile</label>
                <div className="flex items-start gap-4">
                  {/* Profile Picture with Upload Button */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-pthalo dark:bg-fern flex items-center justify-center text-paper dark:text-night text-2xl font-bold overflow-hidden">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                      ) : (
                        userProfile?.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    {/* Edit Button (Pen Icon) */}
                    <button
                      onClick={() => document.getElementById('profile-image-input')?.click()}
                      className="absolute top-0 right-0 w-6 h-6 rounded-full bg-pthalo dark:bg-fern text-paper dark:text-night flex items-center justify-center hover:opacity-80 transition-opacity shadow-md"
                      title="Upload profile picture"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                      </svg>
                    </button>
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileImageUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Username (read-only) */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1 text-oak dark:text-parchment/70">Username</label>
                    <input
                      type="text"
                      value={userProfile?.username || ''}
                      disabled
                      className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-sm"
                    />
                    <p className="text-xs text-oak dark:text-parchment/60 mt-1">
                      Username cannot be changed
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  maxLength={50}
                  className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-paper dark:bg-night"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
                <p className="text-xs text-oak dark:text-parchment/60 mt-1">
                  Change email in the Account tab
                </p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="w-full px-4 py-2 bg-pthalo dark:bg-fern text-paper dark:text-night rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-pthalo dark:text-fern mb-6">
              Account
            </h2>

            {/* Change Email */}
            <div className="bg-chalk dark:bg-cellar rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Change Email</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Email</label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-gray-100 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-paper dark:bg-night"
                  />
                </div>
                <button
                  onClick={handleChangeEmail}
                  className="w-full px-4 py-2 bg-pthalo dark:bg-fern text-paper dark:text-night rounded-lg font-semibold hover:opacity-90"
                >
                  Update Email
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-paper dark:bg-night"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-paper dark:bg-night"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-paper dark:bg-night"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  className="w-full px-4 py-2 bg-pthalo dark:bg-fern text-paper dark:text-night rounded-lg font-semibold hover:opacity-90"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-pthalo dark:text-fern mb-6">
              Settings
            </h2>

            {/* Theme */}
            <div className="bg-chalk dark:bg-cellar rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Appearance</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select
                  value={themePreference}
                  onChange={(e) => setThemePreference(e.target.value as 'light' | 'dark' | 'system')}
                  className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-paper dark:bg-night"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
                <p className="text-xs text-oak dark:text-parchment/60 mt-1">
                  Currently using: {darkMode ? 'Dark' : 'Light'} mode
                </p>
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Privacy</h3>
              <p className="text-sm text-oak dark:text-parchment/70 mb-4">
                Control what your friends can see when they visit your profile.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Books to Friends</p>
                    <p className="text-sm text-oak dark:text-parchment/60">
                      Friends can view your book collection
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBooksToFriends}
                      onChange={(e) => setShowBooksToFriends(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pthalo dark:peer-checked:bg-fern"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Lists to Friends</p>
                    <p className="text-sm text-oak dark:text-parchment/60">
                      Friends can view your lists
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showListsToFriends}
                      onChange={(e) => setShowListsToFriends(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pthalo dark:peer-checked:bg-fern"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Private Tag</label>
                  <input
                    type="text"
                    value={privateTag}
                    onChange={(e) => setPrivateTag(e.target.value)}
                    placeholder="e.g., private"
                    className="w-full px-3 py-2 border border-oak/20 dark:border-parchment/20 rounded-lg bg-paper dark:bg-night"
                  />
                  <p className="text-xs text-oak dark:text-parchment/60 mt-1">
                    Books with this tag will be hidden from friends, even if "Show Books" is enabled
                  </p>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="w-full px-4 py-2 bg-pthalo dark:bg-fern text-paper dark:text-night rounded-lg font-semibold hover:opacity-90"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-pthalo dark:text-fern mb-6">
              Import & Export Data
            </h2>

            <div className="space-y-6">
              {/* Export Section */}
              <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ArrowDownTrayIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-pthalo dark:text-fern mb-2">
                      Export Your Library
                    </h3>
                    <p className="text-sm text-oak dark:text-parchment/70 mb-4">
                      Download all your books as a CSV file. You can open it in Excel, Google Sheets, or import it into other apps.
                    </p>
                    <button
                      onClick={handleExportCSV}
                      disabled={isExporting}
                      className="px-4 py-2 bg-pthalo dark:bg-fern text-paper dark:text-night rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      {isExporting ? 'Exporting...' : 'Export to CSV'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Import Section */}
              <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ArrowUpTrayIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-pthalo dark:text-fern mb-2">
                      Import Books
                    </h3>
                    <p className="text-sm text-oak dark:text-parchment/70 mb-4">
                      Import books from a CSV file. Supports both Goodreads exports and OnLibrary format.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-oak dark:text-parchment/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pthalo/10 dark:file:bg-fern/10 file:text-pthalo dark:file:text-fern hover:file:bg-pthalo/20 dark:hover:file:bg-fern/20 file:cursor-pointer"
                        />
                      </div>
                      
                      {importFile && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-oak dark:text-parchment/70">
                            Selected: {importFile.name}
                          </span>
                        </div>
                      )}
                      
                      <button
                        onClick={handleImportCSV}
                        disabled={!importFile || isImporting}
                        className="px-4 py-2 bg-pthalo dark:bg-fern text-paper dark:text-night rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                      >
                        <ArrowUpTrayIcon className="w-4 h-4" />
                        {isImporting ? 'Importing...' : 'Import CSV'}
                      </button>
                      
                      {importStats && (
                        <div className="mt-4 p-4 bg-paper dark:bg-night rounded-lg border border-oak/20 dark:border-parchment/20">
                          <h4 className="font-semibold mb-2">Import Results:</h4>
                          <ul className="text-sm space-y-1">
                            <li className="text-green-600 dark:text-green-400">✓ Successfully imported: {importStats.success}</li>
                            {importStats.failed > 0 && (
                              <li className="text-red-600 dark:text-red-400">✗ Failed: {importStats.failed}</li>
                            )}
                            <li className="text-oak dark:text-parchment/70">Total lines processed: {importStats.total}</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Format Information */}
              <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
                <h3 className="text-lg font-bold text-pthalo dark:text-fern mb-3">
                  Supported Formats
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">Goodreads Export</h4>
                    <p className="text-oak dark:text-parchment/70">
                      To export from Goodreads: Go to My Books → Import and Export → Export Library
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">OnLibrary Format</h4>
                    <p className="text-oak dark:text-parchment/70">
                      Columns: Title, Author, ISBN, Publisher, Release Year, Tags, Finished Month, Finished Year, Notes, Date Added
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-pthalo dark:text-fern mb-6">
              About
            </h2>

            <div className="bg-chalk dark:bg-cellar rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-pthalo dark:text-fern mb-3">
                  About OnLibrary
                </h3>
                <p className="text-oak dark:text-parchment/80 leading-relaxed">
                  OnLibrary is your personal book tracking and discovery platform. Keep track of your reading journey, 
                  connect with friends, and discover new books based on what others are reading.
                </p>
              </div>

              <div>
                <h4 className="text-xl font-bold text-pthalo dark:text-fern mb-2">Features</h4>
                <ul className="list-disc list-inside space-y-2 text-oak dark:text-parchment/80">
                  <li>Track your reading progress and finished books</li>
                  <li>Organize books with custom lists and tags</li>
                  <li>Search and add books from multiple sources</li>
                  <li>Connect with friends and share your library</li>
                  <li>Explore what others are reading</li>
                  <li>Discover similar books based on your taste</li>
                  <li>View detailed reading statistics</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-bold text-pthalo dark:text-fern mb-2">Version</h4>
                <p className="text-oak dark:text-parchment/80">
                  Version 1.0.0 - December 2025
                </p>
              </div>

              <div>
                <h4 className="text-xl font-bold text-pthalo dark:text-fern mb-2">Contact</h4>
                <p className="text-oak dark:text-parchment/80">
                  For support or feedback, please contact us at support@onlibrary.net
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
