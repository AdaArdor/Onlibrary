import { useState } from 'react';
import { 
  XMarkIcon, 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  CogIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../AuthContext';
import { updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import { Link } from 'react-router-dom';

interface UserProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function UserProfilePanel({ 
  isOpen, 
  onClose, 
  darkMode, 
  onToggleDarkMode 
}: UserProfilePanelProps) {
  const { user, logout, isDemo, exitDemoMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'settings'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      await updateProfile(user, {
        displayName: displayName
      });
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      await updateEmail(user, newEmail);
      setMessage({ text: 'Email updated successfully!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Failed to update email. You may need to re-authenticate.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await updatePassword(user, newPassword);
      setMessage({ text: 'Password updated successfully!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage({ text: 'Failed to update password. You may need to re-authenticate.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={darkMode ? 'dark' : ''}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[400px] bg-paper dark:bg-night shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-oak/20 dark:border-parchment/20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-pthalo dark:text-fern">
              {isDemo ? 'Demo Mode' : 'Account Settings'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-oak/10 dark:hover:bg-parchment/10 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-oak dark:text-parchment" />
            </button>
          </div>
          
          {isDemo ? (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                You're in demo mode. Sign up to save your data and access all features!
              </p>
              <button
                onClick={exitDemoMode}
                className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
              >
                Create Account →
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pthalo dark:bg-fern flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-paper dark:text-night" />
              </div>
              <div>
                <p className="font-medium text-ink dark:text-parchment">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-sm text-oak dark:text-parchment/70">
                  {user?.email}
                </p>
              </div>
            </div>
          )}
        </div>

        {!isDemo && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-oak/20 dark:border-parchment/20">
              {[
                { id: 'profile', label: 'Profile', icon: UserIcon },
                { id: 'account', label: 'Account', icon: EnvelopeIcon },
                { id: 'settings', label: 'Settings', icon: CogIcon },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === id
                      ? 'text-pthalo dark:text-fern border-b-2 border-pthalo dark:border-fern bg-pthalo/5 dark:bg-fern/5'
                      : 'text-oak dark:text-parchment/70 hover:text-ink dark:hover:text-parchment'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6">
              {message && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                }`}>
                  {message.text}
                </div>
              )}

              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-oak dark:text-parchment/70 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full p-3 border border-oak/30 dark:border-parchment/30 rounded-lg bg-paper dark:bg-cellar text-ink dark:text-parchment focus:ring-2 focus:ring-pthalo dark:focus:ring-fern focus:border-transparent"
                      placeholder="Your display name"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-pthalo dark:bg-fern text-paper dark:text-night py-3 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  {/* Update Email */}
                  <form onSubmit={handleUpdateEmail} className="space-y-4">
                    <h3 className="font-semibold text-ink dark:text-parchment flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4" />
                      Update Email
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-oak dark:text-parchment/70 mb-2">
                        New Email
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full p-3 border border-oak/30 dark:border-parchment/30 rounded-lg bg-paper dark:bg-cellar text-ink dark:text-parchment focus:ring-2 focus:ring-pthalo dark:focus:ring-fern focus:border-transparent"
                        placeholder="new@example.com"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-pthalo dark:bg-fern text-paper dark:text-night py-3 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {loading ? 'Updating...' : 'Update Email'}
                    </button>
                  </form>

                  <div className="border-t border-oak/20 dark:border-parchment/20 pt-6">
                    {/* Update Password */}
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <h3 className="font-semibold text-ink dark:text-parchment flex items-center gap-2">
                        <LockClosedIcon className="w-4 h-4" />
                        Update Password
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-oak dark:text-parchment/70 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-3 border border-oak/30 dark:border-parchment/30 rounded-lg bg-paper dark:bg-cellar text-ink dark:text-parchment focus:ring-2 focus:ring-pthalo dark:focus:ring-fern focus:border-transparent"
                          placeholder="New password (min 6 characters)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-oak dark:text-parchment/70 mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full p-3 border border-oak/30 dark:border-parchment/30 rounded-lg bg-paper dark:bg-cellar text-ink dark:text-parchment focus:ring-2 focus:ring-pthalo dark:focus:ring-fern focus:border-transparent"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-pthalo dark:bg-fern text-paper dark:text-night py-3 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* Theme Toggle */}
                  <div>
                    <h3 className="font-semibold text-ink dark:text-parchment mb-4 flex items-center gap-2">
                      <CogIcon className="w-4 h-4" />
                      Appearance
                    </h3>
                    <div className="flex items-center justify-between p-4 border border-oak/20 dark:border-parchment/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        {darkMode ? (
                          <MoonIcon className="w-5 h-5 text-pthalo dark:text-fern" />
                        ) : (
                          <SunIcon className="w-5 h-5 text-pthalo dark:text-fern" />
                        )}
                        <div>
                          <p className="font-medium text-ink dark:text-parchment">
                            {darkMode ? 'Dark Mode' : 'Light Mode'}
                          </p>
                          <p className="text-sm text-oak dark:text-parchment/70">
                            Choose your preferred theme
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onToggleDarkMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          darkMode ? 'bg-pthalo dark:bg-fern' : 'bg-oak/30'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            darkMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* About Link */}
                  <div>
                    <h3 className="font-semibold text-ink dark:text-parchment mb-4 flex items-center gap-2">
                      <InformationCircleIcon className="w-4 h-4" />
                      Information
                    </h3>
                    <Link
                      to="/about"
                      onClick={onClose}
                      className="flex items-center justify-between p-4 border border-oak/20 dark:border-parchment/20 rounded-lg hover:bg-pthalo/5 dark:hover:bg-fern/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <InformationCircleIcon className="w-5 h-5 text-pthalo dark:text-fern" />
                        <div>
                          <p className="font-medium text-ink dark:text-parchment">
                            About
                          </p>
                          <p className="text-sm text-oak dark:text-parchment/70">
                            Learn more about Onlibrary
                          </p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-oak dark:text-parchment/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-auto p-6 border-t border-oak/20 dark:border-parchment/20">
          {isDemo ? (
            <button
              onClick={exitDemoMode}
              className="w-full bg-gradient-to-r from-pthalo to-fern text-white py-3 px-4 rounded-lg font-medium hover:from-pthalo/90 hover:to-fern/90 transition-all"
            >
              Create Account
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 py-3 px-4 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
