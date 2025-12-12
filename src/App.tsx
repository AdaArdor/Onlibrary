import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Home from "./Home";
import About from "./About";
import Lists from "./Lists";
import ListView from "./ListView";
import Stats from "./Stats";
import BookDetail from "./BookDetail";
import Login from "./Login";
import Signup from "./Signup";
import Explore from "./Explore";
import Connect from "./Connect";
import Profile from "./Profile";
import WelcomeScreen from "./components/WelcomeScreen";
import DemoBanner from "./components/DemoBanner";
import UserProfilePanel from "./components/UserProfilePanel";
import { UserIcon } from "@heroicons/react/24/solid";

// Navigation component
function Navigation({ 
  darkMode, 
  toggleDarkMode, 
  onProfileClick 
}: { 
  darkMode: boolean;
  toggleDarkMode: () => void;
  onProfileClick: () => void;
}) {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-paper dark:bg-night">
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Title and Dark Mode Toggle */}
          <div className="flex items-center gap-2 sm:gap-6">
            <NavLink 
              to="/" 
              className="text-2xl sm:text-4xl font-bold text-pthalo dark:text-fern"
            >
              Onlibrary
            </NavLink>
            <button
              onClick={toggleDarkMode}
              className="relative inline-flex h-7 w-14 sm:h-8 sm:w-16 items-center rounded-full bg-pthalo/20 dark:bg-fern/20 transition-colors duration-200 focus:outline-none hover:bg-pthalo/30 dark:hover:bg-fern/30"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {/* Background icons - Sun on left (light mode), Moon on right (dark mode) */}
              <span className="absolute left-1.5 sm:left-2 text-xs sm:text-sm opacity-60">☀️</span>
              <span className="absolute right-1.5 sm:right-2 text-xs sm:text-sm opacity-60">🌙</span>
              
              {/* Sliding indicator - slides to active mode */}
              <span 
                className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out flex items-center justify-center ${
                  darkMode ? 'translate-x-7 sm:translate-x-8' : 'translate-x-0'
                }`}
              >
                {/* Empty circle - just highlights the active mode */}
              </span>
            </button>
          </div>

          {/* Right side - Navigation Links and Profile */}
          <div className="flex items-center gap-2 sm:gap-8">
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-8">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `text-xl font-bold transition-colors ${
                    isActive 
                      ? 'text-pthalo dark:text-fern' 
                      : 'text-pthalo dark:text-fern hover:opacity-80'
                  }`
                }
              >
                Library
              </NavLink>
              <NavLink 
                to="/lists" 
                className={({ isActive }) => 
                  `text-xl font-bold transition-colors ${
                    isActive 
                      ? 'text-pthalo dark:text-fern' 
                      : 'text-pthalo dark:text-fern hover:opacity-80'
                  }`
                }
              >
                Lists
              </NavLink>
              <NavLink 
                to="/stats" 
                className={({ isActive }) => 
                  `text-xl font-bold transition-colors ${
                    isActive 
                      ? 'text-pthalo dark:text-fern' 
                      : 'text-pthalo dark:text-fern hover:opacity-80'
                  }`
                }
              >
                Stats
              </NavLink>
              <NavLink 
                to="/explore" 
                className={({ isActive }) => 
                  `text-xl font-bold transition-colors ${
                    isActive 
                      ? 'text-pthalo dark:text-fern' 
                      : 'text-pthalo dark:text-fern hover:opacity-80'
                  }`
                }
              >
                Explore
              </NavLink>
              <NavLink 
                to="/connect" 
                className={({ isActive }) => 
                  `text-xl font-bold transition-colors ${
                    isActive 
                      ? 'text-pthalo dark:text-fern' 
                      : 'text-pthalo dark:text-fern hover:opacity-80'
                  }`
                }
              >
                Connect
              </NavLink>
            </div>

            {/* Mobile Navigation - Icon-based */}
            <div className="flex md:hidden gap-1">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `p-2 rounded transition-colors ${
                    isActive 
                      ? 'bg-pthalo/20 dark:bg-fern/20 text-pthalo dark:text-fern' 
                      : 'text-oak dark:text-parchment hover:bg-pthalo/10 dark:hover:bg-fern/10'
                  }`
                }
                title="Library"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </NavLink>
              <NavLink 
                to="/lists" 
                className={({ isActive }) => 
                  `p-2 rounded transition-colors ${
                    isActive 
                      ? 'bg-pthalo/20 dark:bg-fern/20 text-pthalo dark:text-fern' 
                      : 'text-oak dark:text-parchment hover:bg-pthalo/10 dark:hover:bg-fern/10'
                  }`
                }
                title="Lists"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </NavLink>
              <NavLink 
                to="/stats" 
                className={({ isActive }) => 
                  `p-2 rounded transition-colors ${
                    isActive 
                      ? 'bg-pthalo/20 dark:bg-fern/20 text-pthalo dark:text-fern' 
                      : 'text-oak dark:text-parchment hover:bg-pthalo/10 dark:hover:bg-fern/10'
                  }`
                }
                title="Stats"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </NavLink>
              <NavLink 
                to="/explore" 
                className={({ isActive }) => 
                  `p-2 rounded transition-colors ${
                    isActive 
                      ? 'bg-pthalo/20 dark:bg-fern/20 text-pthalo dark:text-fern' 
                      : 'text-oak dark:text-parchment hover:bg-pthalo/10 dark:hover:bg-fern/10'
                  }`
                }
                title="Explore"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </NavLink>
              <NavLink 
                to="/connect" 
                className={({ isActive }) => 
                  `p-2 rounded transition-colors ${
                    isActive 
                      ? 'bg-pthalo/20 dark:bg-fern/20 text-pthalo dark:text-fern' 
                      : 'text-oak dark:text-parchment hover:bg-pthalo/10 dark:hover:bg-fern/10'
                  }`
                }
                title="Connect"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </NavLink>
            </div>
            
            {/* Profile Button */}
            <button
              onClick={isDemo ? onProfileClick : () => navigate('/profile')}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80 transition-all hover:scale-105 ${
                isDemo 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                  : 'bg-pthalo dark:bg-fern text-white'
              }`}
              title={isDemo ? "Demo Mode - Click for options" : `${user?.displayName || user?.email} - Click for profile`}
            >
              {isDemo ? (
                <UserIcon className="w-5 h-5" />
              ) : (
                (user?.displayName || user?.email || 'U').charAt(0).toUpperCase()
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Demo/Authenticated app content
function MainApp({ darkMode, toggleDarkMode }: { darkMode: boolean, toggleDarkMode: () => void }) {
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const { isDemo, setShowAuthModal } = useAuth();

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-bone dark:bg-cellar text-charcoal dark:text-bone">
        {isDemo && (
          <DemoBanner 
            onSignUp={() => setShowAuthModal(true)} 
            darkMode={darkMode} 
          />
        )}
        
        <Navigation 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode}
          onProfileClick={() => setProfilePanelOpen(true)}
        />
        
        <Routes>
          <Route path="/" element={<Home darkMode={darkMode} />} />
          <Route path="/about" element={<About darkMode={darkMode} />} />
          <Route path="/lists" element={<Lists darkMode={darkMode} />} />
          <Route path="/lists/:listId" element={<ListView darkMode={darkMode} />} />
          <Route path="/stats" element={<Stats darkMode={darkMode} />} />
          <Route path="/explore" element={<Explore darkMode={darkMode} />} />
          <Route path="/connect" element={<Connect darkMode={darkMode} />} />
          <Route path="/profile" element={<Profile darkMode={darkMode} />} />
          <Route path="/book/:id" element={<BookDetail darkMode={darkMode} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <UserProfilePanel
          isOpen={profilePanelOpen}
          onClose={() => setProfilePanelOpen(false)}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      </div>
    </div>
  );
}

// Unauthenticated app content (login/signup)
function UnauthenticatedApp({ darkMode, toggleDarkMode }: { darkMode: boolean, toggleDarkMode: () => void }) {
  const { setShowAuthModal } = useAuth();
  
  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-bone dark:bg-cellar">
        {/* Header with dark mode toggle and close button */}
        <div className="absolute top-4 right-4 z-10 flex gap-3">
          <button
            onClick={() => setShowAuthModal(false)}
            className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-charcoal dark:text-bone"
            title="Back to welcome"
          >
            ←
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <Routes>
          <Route path="/login" element={<Login darkMode={darkMode} />} />
          <Route path="/signup" element={<Signup darkMode={darkMode} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const { 
    user, 
    loading, 
    isDemo, 
    enterDemoMode, 
    showAuthModal, 
    setShowAuthModal 
  } = useAuth();

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bone dark:bg-cellar">
        <div className="text-lg text-charcoal dark:text-bone">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      {/* Show welcome screen if user is not logged in and not in demo mode and not showing auth modal */}
      {!user && !isDemo && !showAuthModal ? (
        <WelcomeScreen 
          onEnterDemo={enterDemoMode}
          onShowAuth={() => setShowAuthModal(true)}
          darkMode={darkMode}
        />
      ) : user || isDemo ? (
        <MainApp darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      ) : (
        <UnauthenticatedApp darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      )}
    </Router>
  );
}
