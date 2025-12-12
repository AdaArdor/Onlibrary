# 📚 Onlibrary

**Your personal book tracking and social reading platform**

Onlibrary is a full-stack web application that helps users organize their personal book collections, track reading progress, and connect with fellow readers. Built with modern web technologies, it features real-time data synchronization, interactive data visualizations, and a polished user experience.

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12.6-FFCA28?style=flat&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Key Features

### 📚 Library Management
- **ISBN Lookup**: Automatically fetch book covers and metadata from Open Library API
- **Auto-Generated Covers**: Beautiful styled placeholder covers for books without ISBNs  
- **Rich Metadata**: Track titles, authors, publishers, release years, tags, notes, and reading dates
- **Smart Organization**: Tag-based categorization with bulk tag management
- **Multiple Views**: Toggle between grid and list views with drag-and-drop reordering
- **Advanced Search**: Filter books by title, author, publisher, or tags
- **Pagination**: Optimized for collections of 200+ books (50 per page)

### 📊 Reading Analytics
- **Interactive Charts**: Visualize reading trends with Chart.js
- **Reading Statistics**: Books read per month, genre preferences, publishing year distributions
- **Progress Tracking**: Monitor your reading journey over time

### 👥 Social Features
- **Friend System**: Connect with readers via username-based discovery
- **Friend Requests**: Send and receive friend requests with real-time notifications
- **Activity Feed**: See what your friends are currently reading
- **Explore Page**: Discover books from the community based on shared interests
- **Privacy Controls**: Manage what friends can see about your library

### 📋 Custom Lists
- **Themed Collections**: Create custom reading lists with visual themes
- **Cover Images**: Set custom cover images for your lists
- **Flexible Organization**: Add any book to multiple lists

### 💾 Data Portability
- **CSV Export**: Export your entire library with full metadata
- **CSV Import**: Import from Onlibrary or Goodreads CSV format
- **Data Ownership**: Your data, your control - no vendor lock-in

### 🎨 User Experience
- **Dark Mode**: Comprehensive dark theme support with custom color palette
- **Responsive Design**: Mobile-first approach that works on all devices
- **Smooth Animations**: Powered by Framer Motion
- **Demo Mode**: Try the full app without signing up

## 🛠️ Technical Stack

### Frontend
- **React 19.2** with **TypeScript** - Type-safe component architecture
- **Vite 7.2** - Lightning-fast build tool and dev server
- **React Router 7.9** - Client-side routing with protected routes
- **TailwindCSS 3.4** - Custom design system with utility-first styling
- **Framer Motion 12.2** - Smooth animations and transitions
- **Chart.js 4.5** - Interactive data visualizations
- **DND Kit 6.3** - Accessible drag-and-drop functionality
- **Hero Icons 2.2** - Consistent iconography

### Backend & Services
- **Firebase 12.6**
  - **Firestore**: NoSQL database with real-time subscriptions
  - **Authentication**: Secure email/password authentication
  - **Storage**: Cloud storage for book cover images
  - **Hosting**: Production deployment
- **Open Library API**: Book metadata and cover fetching

### Development Tools
- **TypeScript 5.9** - Static type checking
- **ESLint 9** - Code quality enforcement
- **PostCSS & Autoprefixer** - CSS processing

## 🏗️ Architecture

### Key Design Patterns
- **Real-time Subscriptions**: Firestore listeners keep data synchronized across devices
- **Context API**: Global state management for authentication and app state
- **Component Composition**: Reusable, modular components
- **Type Safety**: Comprehensive TypeScript interfaces for all data models

### Performance Optimizations
- Pagination (50 books per page) for large collections
- Lazy loading of components
- Efficient Firestore queries with indexes
- Optimistic UI updates for better UX

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase account (for backend services)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/AdaArdor/Onlibrary.git
   cd Onlibrary/my-book-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore, Authentication (Email/Password), Storage, and Hosting
   - Copy your Firebase config

4. **Configure Firebase**
   
   Update \`src/lib/firebase.ts\` with your Firebase config

5. **Deploy Firestore rules and indexes**
   \`\`\`bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   firebase deploy --only storage
   \`\`\`

6. **Run development server**
   \`\`\`bash
   npm run dev
   \`\`\`

7. **Build for production**
   \`\`\`bash
   npm run build
   \`\`\`

8. **Deploy to Firebase Hosting**
   \`\`\`bash
   firebase deploy --only hosting
   \`\`\`

## 📱 Usage

### Demo Mode
Try the app without signing up - click "Try Demo" to explore with sample data.

### Adding Books
1. Click the "+" button to open the add book sidebar
2. Enter an ISBN to auto-fetch book details, or manually enter book information
3. Add tags, notes, and mark as finished
4. Save to add to your library

### Creating Lists
1. Navigate to the Lists page
2. Click "New List" to create a custom reading list
3. Add a name, optional cover image, and select books

### Connecting with Friends
1. Set up your profile with a unique username
2. Search for friends by username
3. Send friend requests and view activity feed
4. Explore books that your friends are reading

## 🔒 Security

- Firestore security rules ensure users can only access their own data
- Friend privacy settings control what others can see
- Firebase Authentication handles secure user management
- Environment variables keep sensitive configuration private

## 👨‍💻 Developer

**Nikolaj Jacobsen**
- GitHub: [@AdaArdor](https://github.com/AdaArdor)

## 🙏 Acknowledgments

- [Open Library API](https://openlibrary.org/developers/api) for book metadata
- [Heroicons](https://heroicons.com/) for beautiful icons
- [Firebase](https://firebase.google.com/) for backend infrastructure
- [TailwindCSS](https://tailwindcss.com/) for styling utilities

---

**Built with ❤️ using React, TypeScript, and Firebase**
