import { useState } from 'react';
import { 
  BookOpenIcon, 
  ListBulletIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/solid';

interface WelcomeScreenProps {
  onEnterDemo: () => void;
  onShowAuth: () => void;
  darkMode: boolean;
}

export default function WelcomeScreen({ onEnterDemo, onShowAuth, darkMode }: WelcomeScreenProps) {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: BookOpenIcon,
      title: "Track Your Books",
      description: "Add books with covers, notes, ratings, and tags. Never forget what you've read!",
      animation: "fade-in-up"
    },
    {
      icon: ListBulletIcon,
      title: "Create Custom Lists",
      description: "Organize your books into beautiful lists with custom backgrounds and themes.",
      animation: "fade-in-left"
    },
    {
      icon: ChartBarIcon,
      title: "Reading Analytics",
      description: "Visualize your reading habits with charts, stats, and reading goals.",
      animation: "fade-in-right"
    },
    {
      icon: UserGroupIcon,
      title: "Social Features",
      description: "Share your favorite lists and discover new books from other readers.",
      animation: "fade-in-down"
    }
  ];

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen bg-gradient-to-br from-paper via-chalk to-bone dark:from-night dark:via-cellar dark:to-night`}>
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pthalo/10 to-fern/10 dark:from-pthalo/20 dark:to-fern/20" />
        
        <div className="relative container mx-auto px-6 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-pthalo to-fern mb-6">
              <BookOpenIcon className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-5xl font-bold text-pthalo dark:text-fern mb-4">
              Welcome to Onlibrary
            </h1>
            
            <p className="text-xl text-oak dark:text-parchment/80 mb-8 max-w-2xl mx-auto">
              Your personal book tracking companion. Organize your reading life, 
              discover new books, and connect with fellow readers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onEnterDemo}
                className="bg-gradient-to-r from-pthalo to-fern text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-3"
              >
                <PlayIcon className="w-5 h-5" />
                Try Demo
              </button>
              
              <button
                onClick={onShowAuth}
                className="border-2 border-pthalo dark:border-fern text-pthalo dark:text-fern px-8 py-4 rounded-full font-semibold text-lg hover:bg-pthalo/10 dark:hover:bg-fern/10 transition-all duration-300 flex items-center gap-3"
              >
                Sign Up Free
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-ink dark:text-parchment mb-4">
            Everything you need to manage your books
          </h2>
          <p className="text-lg text-oak dark:text-parchment/70">
            Discover the features that make Onlibrary the perfect reading companion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`group p-6 rounded-2xl bg-paper dark:bg-cellar shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 ${
                  currentFeature === index ? 'ring-2 ring-pthalo dark:ring-fern' : ''
                }`}
                onMouseEnter={() => setCurrentFeature(index)}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pthalo to-fern flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-ink dark:text-parchment mb-2">
                  {feature.title}
                </h3>
                
                <p className="text-oak dark:text-parchment/70">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Screenshots/Demo Preview */}
      <div className="bg-gradient-to-b from-transparent to-pthalo/5 dark:to-fern/5 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ink dark:text-parchment mb-4">
              See it in action
            </h2>
            <p className="text-lg text-oak dark:text-parchment/70 mb-8">
              Get a preview of what you can do with Onlibrary
            </p>
            
            <button
              onClick={onEnterDemo}
              className="inline-flex items-center gap-3 bg-white dark:bg-night text-pthalo dark:text-fern px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <PlayIcon className="w-5 h-5" />
              Start Interactive Demo
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Mock Interface Preview */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-paper dark:bg-night rounded-2xl shadow-2xl overflow-hidden border border-oak/20 dark:border-parchment/20">
              <div className="bg-gradient-to-r from-pthalo to-fern p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/30"></div>
                  <div className="w-3 h-3 rounded-full bg-white/30"></div>
                  <div className="w-3 h-3 rounded-full bg-white/30"></div>
                  <div className="ml-4 text-white/80 text-sm">onlibrary-7795e.web.app</div>
                </div>
              </div>
              
              <div className="p-8 bg-gradient-to-br from-chalk to-bone dark:from-cellar dark:to-night">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-paper dark:bg-night p-4 rounded-lg shadow-sm">
                      <div className="w-full h-24 bg-gradient-to-br from-pthalo/20 to-fern/20 rounded mb-2"></div>
                      <div className="h-2 bg-oak/20 dark:bg-parchment/20 rounded mb-1"></div>
                      <div className="h-2 bg-oak/10 dark:bg-parchment/10 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center text-oak dark:text-parchment/60">
                  <div className="animate-pulse">Your books and lists will appear here...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-gradient-to-r from-pthalo to-fern text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start your reading journey?</h2>
          <p className="text-xl text-white/90 mb-8">Join thousands of readers who organize their books with Onlibrary</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onShowAuth}
              className="bg-white text-pthalo px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 hover:scale-105 transition-all duration-300"
            >
              Create Free Account
            </button>
            
            <button
              onClick={onEnterDemo}
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300"
            >
              Continue with Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
