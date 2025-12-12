import { ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

interface DemoBannerProps {
  onSignUp: () => void;
  darkMode: boolean;
}

export default function DemoBanner({ onSignUp, darkMode }: DemoBannerProps) {
  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-100" />
            <div>
              <span className="font-semibold">Demo Mode</span>
              <span className="ml-2 text-amber-100">
                You're exploring with sample data. Create an account to save your own books!
              </span>
            </div>
          </div>
          
          <button
            onClick={onSignUp}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium transition-all hover:scale-105 flex items-center gap-2"
          >
            Sign Up Free
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Spacer to push content below the banner */}
      <div className="h-[60px]" />
    </div>
  );
}
