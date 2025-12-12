interface AboutProps {
  darkMode: boolean;
}

export default function About({ darkMode }: AboutProps) {
  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-700 ${
        darkMode ? "bg-night text-parchment" : "bg-paper text-ink"
      }`}
    >
      <div
        className={`max-w-3xl w-full rounded-2xl shadow p-8 transition-colors duration-700 ${
          darkMode ? "bg-cellar text-parchment" : "bg-bone text-ink"
        }`}
      >
        <h1
          className={`text-3xl font-bold mb-4 text-center transition-colors duration-700 ${
            darkMode ? "text-fern" : "text-pthalo"
          }`}
        >
          About Onlibrary
        </h1>

        <p className={`mb-4 text-center text-oak dark:text-parchment/70`}>
          Welcome to <strong>Onlibrary</strong>! You can track your personal
          book collection, including titles, authors, ISBNs, covers, publishers,
          and genres. You can add new books, edit existing ones, and filter your
          library by genre.
        </p>

        <p className={`mb-4 text-center text-oak dark:text-parchment/70`}>
          Onlibrary is a simple and intuitive app designed to help book lovers
          manage their collections effortlessly. Whether you're an avid reader
          or a casual collector, Onlibrary provides the tools you need to keep
          track of your books in one convenient place.
        </p>

        <p className={`mb-4 text-center text-oak dark:text-parchment/70`}>
          Into making lists? Onlibrary allows you to create and manage custom
          lists of your books, making it easy to organize and access your
          favorite 50 books, 10 essential books on European history, or
          something else entirely!
        </p>

        <p className={`mb-4 text-center text-oak dark:text-parchment/70`}>
          The app automatically fetches cover images and publisher information
          for books with ISBN numbers using Open Library APIs.
        </p>

        <p className={`mb-4 text-center text-oak dark:text-parchment/70`}>
          On the Stats page, you can explore various statistics about your
          reading habits, including the number of books read per month, favorite
          genres, and more.
        </p>

        <p className={`mb-6 text-center text-oak dark:text-parchment/70`}>
          Dark mode is supported, so you can switch between light and dark
          themes for a comfortable reading experience.
        </p>

        <p className="text-center text-oak/70 dark:text-parchment/50 text-sm">
          Created with ❤️ using React, TypeScript, and TailwindCSS.
        </p>
      </div>
    </div>
  );
}
