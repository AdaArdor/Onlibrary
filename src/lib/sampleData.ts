// Sample data for demo mode
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
}

export interface BookList {
  id: number;
  name: string;
  coverUrl?: string;
  bookIds: number[];
}

export const sampleBooks: Book[] = [
  {
    id: 1,
    title: "The Midnight Library",
    authors: ["Matt Haig"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg",
    publisher: "Canongate Books",
    tags: ["Fiction", "Philosophy", "Britain"],
    finishedMonth: "2024-03",
    releaseYear: "2020",
    notes: "A beautiful exploration of life's possibilities and the paths we choose."
  },
  {
    id: 2,
    title: "Dune",
    authors: ["Frank Herbert"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg",
    publisher: "Chilton Books",
    tags: ["Science Fiction", "Epic", "America"],
    finishedMonth: "2024-02",
    releaseYear: "1965",
    notes: "An epic space opera with incredible world-building and political intrigue."
  },
  {
    id: 3,
    title: "Klara and the Sun",
    authors: ["Kazuo Ishiguro"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1603206535i/54120408.jpg",
    publisher: "Faber & Faber",
    tags: ["Science Fiction", "Literary Fiction", "Japan", "Britain"],
    finishedMonth: "2024-01",
    releaseYear: "2021",
    notes: "A touching story about artificial intelligence and human connection."
  },
  {
    id: 4,
    title: "The Seven Husbands of Evelyn Hugo",
    authors: ["Taylor Jenkins Reid"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1551393571i/32620332.jpg",
    publisher: "Atria Books",
    tags: ["Historical Fiction", "Romance", "America"],
    finishedMonth: "2023-12",
    releaseYear: "2017",
    notes: "A captivating story of old Hollywood glamour and hidden truths."
  },
  {
    id: 5,
    title: "Norwegian Wood",
    authors: ["Haruki Murakami"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1386924361i/11297.jpg",
    publisher: "Kodansha International",
    tags: ["Literary Fiction", "Romance", "Japan"],
    finishedMonth: "2023-11",
    releaseYear: "1987",
    notes: "A melancholic coming-of-age story set in 1960s Tokyo."
  },
  {
    id: 6,
    title: "The Handmaid's Tale",
    authors: ["Margaret Atwood"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1578028274i/38447.jpg",
    publisher: "McClelland & Stewart",
    tags: ["Dystopian", "Feminist", "Canada"],
    finishedMonth: "2023-10",
    releaseYear: "1985",
    notes: "A chilling dystopian vision that feels increasingly relevant."
  },
  {
    id: 7,
    title: "Educated",
    authors: ["Tara Westover"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1506026635i/35133922.jpg",
    publisher: "Random House",
    tags: ["Memoir", "Education", "America"],
    finishedMonth: "2023-09",
    releaseYear: "2018",
    notes: "A powerful memoir about education, family, and finding your own path."
  },
  {
    id: 8,
    title: "Circe",
    authors: ["Madeline Miller"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1565909496i/35959740.jpg",
    publisher: "Little, Brown and Company",
    tags: ["Mythology", "Fantasy", "Greece"],
    finishedMonth: "2023-08",
    releaseYear: "2018",
    notes: "Greek mythology retold with beautiful prose and feminist perspective."
  },
  {
    id: 9,
    title: "The Alchemist",
    authors: ["Paulo Coelho"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg",
    publisher: "HarperOne",
    tags: ["Philosophy", "Adventure", "Brazil"],
    finishedMonth: "2023-07",
    releaseYear: "1988",
    notes: "A philosophical tale about following your dreams and personal legend."
  },
  {
    id: 10,
    title: "Where the Crawdads Sing",
    authors: ["Delia Owens"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1582135294i/36809135.jpg",
    publisher: "G.P. Putnam's Sons",
    tags: ["Mystery", "Nature", "America"],
    finishedMonth: "2023-06",
    releaseYear: "2018",
    notes: "A haunting story of isolation, resilience, and the natural world."
  },
  {
    id: 11,
    title: "1984",
    authors: ["George Orwell"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1532714506i/40961427.jpg",
    publisher: "Secker & Warburg",
    tags: ["Dystopian", "Political", "Britain"],
    finishedMonth: "2023-05",
    releaseYear: "1949",
    notes: "The ultimate dystopian warning about surveillance and totalitarianism."
  },
  {
    id: 12,
    title: "The Kite Runner",
    authors: ["Khaled Hosseini"],
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1579036753i/77203.jpg",
    publisher: "Riverhead Books",
    tags: ["Historical Fiction", "Friendship", "Afghanistan"],
    finishedMonth: "2023-04",
    releaseYear: "2003",
    notes: "A powerful story of friendship, guilt, and redemption set in Afghanistan."
  }
];

export const sampleLists: BookList[] = [
  {
    id: 1,
    name: "Sci-Fi Favorites",
    coverUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJvY2VhbiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agc3RvcC1jb2xvcj0iIzBmNGM3NSIgc3RvcC1vcGFjaXR5PSIwLjkiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMzI5NDEiIHN0b3Atb3BhY2l0eT0iMC44Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjb2NlYW4pIi8+PC9zdmc+',
    bookIds: [2, 3, 6]
  },
  {
    id: 2,
    name: "Must-Read Classics",
    coverUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJwYXJjaG1lbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiNmZmY3ZWQiIHN0b3Atb3BhY2l0eT0iMC45Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZWRkYmE4IiBzdG9wLW9wYWNpdHk9IjAuNyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3BhcmNobWVudCkiLz48L3N2Zz4=',
    bookIds: [11, 6, 5]
  },
  {
    id: 3,
    name: "Recent Discoveries",
    coverUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJzdW5zZXQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiNmZWNhNTciIHN0b3Atb3BhY2l0eT0iMC45Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZWQ2NGExIiBzdG9wLW9wYWNpdHk9IjAuNyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3N1bnNldCkiLz48L3N2Zz4=',
    bookIds: [1, 4, 8, 10]
  },
  {
    id: 4,
    name: "International Authors",
    coverUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJmb3Jlc3QiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiM2NWExNGIiIHN0b3Atb3BhY2l0eT0iMC45Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDY0ZTNiIiBzdG9wLW9wYWNpdHk9IjAuOCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2ZvcmVzdCkiLz48L3N2Zz4=',
    bookIds: [3, 5, 9, 12]
  }
];
