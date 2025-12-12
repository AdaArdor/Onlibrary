import { useState, useEffect, useMemo } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { useAuth } from "./AuthContext";
import { booksService } from "./lib/database";
import { sampleBooks } from "./lib/sampleData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement
);

interface Book {
  id: number;
  title: string;
  authors: string[];
  isbn?: string;
  coverUrl?: string;
  publisher?: string;
  tags?: string[];
  finishedMonth?: string; // YYYY-MM
  releaseYear?: string;
}

interface StatsProps {
  darkMode: boolean;
}

export default function Stats({ darkMode }: StatsProps) {
  const { isDemo, user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);

  // Load books from Firebase or demo data
  useEffect(() => {
    if (isDemo) {
      setBooks(sampleBooks);
      return;
    }

    if (!user) {
      setBooks([]);
      return;
    }

    // Subscribe to real-time book updates
    const unsubscribe = booksService.subscribeToUserBooks(user, (firebaseBooks) => {
      console.log("Stats: Received books from Firebase:", firebaseBooks.length);
      setBooks(firebaseBooks);
    });

    return () => unsubscribe();
  }, [isDemo, user]);

  // Normalize books
  const normalizedBooks = useMemo(
    () =>
      books.map((b) => ({
        ...b,
        tags: Array.isArray(b.tags) ? b.tags : [],
      })),
    [books]
  );

  const finishedBooks = useMemo(
    () => normalizedBooks.filter((b) => !!b.finishedMonth),
    [normalizedBooks]
  );

  // All tags in collection
  const allTags = useMemo(() => {
    const set = new Set<string>();
    normalizedBooks.forEach((b) => {
      b.tags.forEach((t) => set.add(t));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [normalizedBooks]);

  // Years from finishedMonth (YYYY-MM)
  const years = useMemo(() => {
    const set = new Set<string>();
    finishedBooks.forEach((b) => {
      if (!b.finishedMonth) return;
      const [year] = b.finishedMonth.split("-");
      if (year) set.add(year);
    });
    return Array.from(set).sort();
  }, [finishedBooks]);

  const [selectedTag, setSelectedTag] = useState<string>("All tags");
  const [yearFilter, setYearFilter] = useState<string>("All years");
  const [timelineYearFilter, setTimelineYearFilter] = useState<string>("All years");

  // Author filter + UI state
  const [selectedAuthor, setSelectedAuthor] = useState<string>("All authors");
  const [authorsExpanded, setAuthorsExpanded] = useState<boolean>(false);
  const [authorJumpLetter, setAuthorJumpLetter] = useState<string | null>(null);

  // Author counts (all books, not just finished)
  const authorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    normalizedBooks.forEach((b) => {
      b.authors.forEach((a) => {
        const name = a.trim();
        if (!name) return;
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    return counts;
  }, [normalizedBooks]);

  const sortedAuthors = useMemo(
    () =>
      Object.entries(authorCounts).sort(([aName], [bName]) =>
        aName.localeCompare(bName)
      ),
    [authorCounts]
  );

  // Keep selectedTag valid
  useEffect(() => {
    if (selectedTag !== "All tags" && !allTags.includes(selectedTag)) {
      setSelectedTag("All tags");
    }
  }, [allTags, selectedTag]);

  // Keep selectedAuthor valid
  useEffect(() => {
    if (selectedAuthor !== "All authors" && !authorCounts[selectedAuthor]) {
      setSelectedAuthor("All authors");
    }
  }, [authorCounts, selectedAuthor]);

  // Keyboard navigation: press letter to jump to authors starting with that letter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!authorsExpanded) return;
      if (/^[a-z]$/i.test(e.key)) {
        setAuthorJumpLetter(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [authorsExpanded]);

  // Scroll to first author whose name starts with the pressed letter
  useEffect(() => {
    if (!authorJumpLetter) return;
    const el = document.querySelector<HTMLElement>(
      `[data-author-initial="${authorJumpLetter}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    // Reset after use
    setAuthorJumpLetter(null);
  }, [authorJumpLetter]);

  // Finished books filtered by author
  const finishedByAuthor = useMemo(
    () =>
      selectedAuthor === "All authors"
        ? finishedBooks
        : finishedBooks.filter((b) => b.authors.includes(selectedAuthor)),
    [finishedBooks, selectedAuthor]
  );

  // Books included in "current view" (by year + author)
  const booksForStats = useMemo(
    () =>
      finishedByAuthor.filter((b) => {
        if (!b.finishedMonth) return false;
        if (yearFilter === "All years") return true;
        return b.finishedMonth.startsWith(yearFilter);
      }),
    [finishedByAuthor, yearFilter]
  );

  // Books for charts depending on selectedTag (for tag stats only)
  const booksForTagView = useMemo(
    () =>
      selectedTag === "All tags"
        ? booksForStats
        : booksForStats.filter((b) => b.tags.includes(selectedTag)),
    [booksForStats, selectedTag]
  );

  // --- Tag frequency (using booksForStats: year + author filtered) ---
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    booksForStats.forEach((b) => {
      b.tags.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [booksForStats]);

  const sortedTagEntries = useMemo(
    () =>
      Object.entries(tagCounts).sort((a, b) => b[1] - a[1]), // [tag, count]
    [tagCounts]
  );

  const topTags = sortedTagEntries.slice(0, 10);

  // --- Co-occurring tags for selectedTag (within author + year filter) ---
  const coOccurringTags = useMemo(() => {
    if (selectedTag === "All tags") return [] as [string, number][];
    const counts: Record<string, number> = {};
    booksForTagView.forEach((b) => {
      b.tags.forEach((t) => {
        if (t === selectedTag) return;
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [booksForTagView, selectedTag]);

  // --- Monthly/Yearly counts for line chart (using timeline year filter) ---
  const booksForTimeline = useMemo(
    () =>
      finishedBooks.filter((b) => {
        if (!b.finishedMonth) return false;
        if (timelineYearFilter === "All years") return true;
        return b.finishedMonth.startsWith(timelineYearFilter);
      }),
    [finishedBooks, timelineYearFilter]
  );

  const timelineData = useMemo(() => {
    if (timelineYearFilter === "All years") {
      // Group by month across ALL years
      const monthCounts: Record<string, number> = {};
      booksForTimeline.forEach((b) => {
        if (!b.finishedMonth) return;
        monthCounts[b.finishedMonth] = (monthCounts[b.finishedMonth] || 0) + 1;
      });

      const months = Object.keys(monthCounts).sort();
      if (months.length === 0) return { labels: [], data: [] };

      // Find first and last month
      const firstMonth = months[0]; // e.g., "2023-01"
      const lastMonth = months[months.length - 1]; // e.g., "2025-12"

      const [firstYear, firstMonthNum] = firstMonth.split("-").map(Number);
      const [lastYear, lastMonthNum] = lastMonth.split("-").map(Number);

      // Fill in all months between first and last
      const allMonths: string[] = [];
      const allData: number[] = [];

      let currentYear = firstYear;
      let currentMonth = firstMonthNum;

      while (currentYear < lastYear || (currentYear === lastYear && currentMonth <= lastMonthNum)) {
        const monthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        allMonths.push(monthStr);
        allData.push(monthCounts[monthStr] || 0);

        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }

      return { labels: allMonths, data: allData };
    } else {
      // Group by month for specific year
      const monthCounts: Record<string, number> = {};
      booksForTimeline.forEach((b) => {
        if (!b.finishedMonth) return;
        monthCounts[b.finishedMonth] = (monthCounts[b.finishedMonth] || 0) + 1;
      });

      // Fill in all 12 months for the selected year
      const allMonths: string[] = [];
      const allData: number[] = [];

      for (let m = 1; m <= 12; m++) {
        const monthStr = `${timelineYearFilter}-${m.toString().padStart(2, '0')}`;
        allMonths.push(monthStr);
        allData.push(monthCounts[monthStr] || 0);
      }

      return { labels: allMonths, data: allData };
    }
  }, [booksForTimeline, timelineYearFilter]);

  // Format labels for display
  const timelineLabels = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (timelineYearFilter === "All years") {
      // Show labels like "Jan 2023", but only for January of each year to reduce clutter
      return timelineData.labels.map(label => {
        const [year, month] = label.split('-');
        const monthNum = parseInt(month);
        
        // Only show label for January or first month
        if (monthNum === 1) {
          return `Jan ${year}`;
        }
        return ''; // Empty label for other months
      });
    } else {
      // Convert YYYY-MM to month names
      return timelineData.labels.map(label => {
        const [, month] = label.split('-');
        return monthNames[parseInt(month) - 1];
      });
    }
  }, [timelineData.labels, timelineYearFilter]);

  // --- Most used tag (based on current year + author filter) ---
  const mostUsedTag = useMemo(() => {
    if (!sortedTagEntries.length) return { tag: "–", count: 0 };
    const [tag, count] = sortedTagEntries[0];
    return { tag, count };
  }, [sortedTagEntries]);

  // --- Books per year (for box 3 + year toggle) based on author filter ---
  const booksPerYear = useMemo(() => {
    const counts: Record<string, number> = {};
    finishedByAuthor.forEach((b) => {
      if (!b.finishedMonth) return;
      const [year] = b.finishedMonth.split("-");
      if (!year) return;
      counts[year] = (counts[year] || 0) + 1;
    });
    return counts;
  }, [finishedByAuthor]);

  const booksInSelectedYear =
    yearFilter === "All years"
      ? finishedByAuthor.length
      : booksPerYear[yearFilter] || 0;

  // --- Average books per month (for current author filter, across all time) ---
  const averageBooksPerMonth = useMemo(() => {
    if (!finishedByAuthor.length) return 0;
    const parsed = finishedByAuthor
      .map((b) => b.finishedMonth)
      .filter(Boolean)
      .map((fm) => {
        const [y, m] = (fm as string).split("-");
        return { year: Number(y), month: Number(m) };
      })
      .filter((x) => !Number.isNaN(x.year) && !Number.isNaN(x.month));

    if (!parsed.length) return 0;

    let minYear = parsed[0].year;
    let minMonth = parsed[0].month;
    let maxYear = parsed[0].year;
    let maxMonth = parsed[0].month;

    parsed.forEach(({ year, month }) => {
      if (year < minYear || (year === minYear && month < minMonth)) {
        minYear = year;
        minMonth = month;
      }
      if (year > maxYear || (year === maxYear && month > maxMonth)) {
        maxYear = year;
        maxMonth = month;
      }
    });

    const spanMonths =
      (maxYear - minYear) * 12 + (maxMonth - minMonth) + 1 || 1;

    return finishedByAuthor.length / spanMonths;
  }, [finishedByAuthor]);

  // --- Release Year Histogram (group by decade) ---
  const releaseYearData = useMemo(() => {
    // Filter books that have releaseYear
    const booksWithYear = booksForStats.filter((b) => b.releaseYear);
    
    if (booksWithYear.length === 0) {
      return { labels: [], data: [] };
    }

    // Group by decade
    const decadeCounts: Record<string, number> = {};
    
    booksWithYear.forEach((b) => {
      const year = parseInt(b.releaseYear!);
      if (isNaN(year)) return;
      
      // Calculate decade (e.g., 1984 -> 1980s)
      const decade = Math.floor(year / 10) * 10;
      const label = `${decade}s`;
      decadeCounts[label] = (decadeCounts[label] || 0) + 1;
    });

    // Sort by decade
    const sortedDecades = Object.keys(decadeCounts).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return aNum - bNum;
    });

    return {
      labels: sortedDecades,
      data: sortedDecades.map((decade) => decadeCounts[decade]),
    };
  }, [booksForStats]);

  // --- CHART DATA ---

  const tagBarData = {
    labels: topTags.map(([tag]) => tag),
    datasets: [
      {
        label: "Books",
        data: topTags.map(([, count]) => count),
        backgroundColor: darkMode ? "#4EDF8A" : "#1A5C4E", // fern-ish / pthalo-ish
      },
    ],
  };

  // Pie chart uses same tagCounts (year + author filtered)
  const pieTags = sortedTagEntries;

  const tagPieData = {
    labels: pieTags.map(([tag]) => tag),
    datasets: [
      {
        data: pieTags.map(([, count]) => count),
        backgroundColor: pieTags.map(([, _count], i) =>
          darkMode
            ? `hsl(${(i * 37) % 360}, 60%, 55%)`
            : `hsl(${(i * 37) % 360}, 60%, 35%)`
        ),
        borderColor: darkMode ? "#111111" : "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const lineData = {
    labels: timelineLabels,
    datasets: [
      {
        label:
          timelineYearFilter === "All years"
            ? "Books read per month (all years)"
            : `Books read per month (${timelineYearFilter})`,
        data: timelineData.data,
        borderColor: darkMode ? "#4EDF8A" : "#1A5C4E",
        backgroundColor: darkMode ? "#4EDF8A" : "#1A5C4E",
        tension: 0.35,
        fill: false,
      },
    ],
  };

  const releaseYearBarData = {
    labels: releaseYearData.labels,
    datasets: [
      {
        label: "Books",
        data: releaseYearData.data,
        backgroundColor: darkMode ? "#9B87F5" : "#6B4EE5", // Purple tones for variety
      },
    ],
  };

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row transition-colors duration-700 ${
        darkMode ? "bg-night text-parchment" : "bg-paper text-ink"
      }`}
    >
      {/* SIDEBAR */}
      <aside
        className={`w-full md:w-80 p-3 sm:p-4 flex-shrink-0 border-b md:border-b-0 md:border-r transition-colors duration-700 overflow-y-auto ${
          darkMode
            ? "bg-cellar border-parchment/20 text-parchment"
            : "bg-chalk border-oak/20 text-ink"
        }`}
      >
        <h2 className="text-lg font-bold mb-4 text-pthalo dark:text-fern">
          Filters
        </h2>

        {/* YEAR FILTER */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-1 text-oak dark:text-parchment/70">
            Year
          </h3>
          <select
            className={`w-full p-2 rounded border text-sm ${
              darkMode
                ? "bg-night text-parchment border-parchment/20"
                : "bg-bone text-ink border-oak/20"
            }`}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="All years">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* AUTHORS COLLAPSIBLE */}
        <div className="mb-4">
          <button
            className="w-full flex items-center justify-between text-sm font-semibold mb-1 text-oak dark:text-parchment/70"
            onClick={() => setAuthorsExpanded((x) => !x)}
          >
            <span>Authors</span>
            <span>{authorsExpanded ? "▾" : "▸"}</span>
          </button>

          {authorsExpanded && (
            <div
              className={`max-h-64 overflow-y-auto rounded border text-xs ${
                darkMode
                  ? "bg-night text-parchment border-parchment/20"
                  : "bg-bone text-ink border-oak/20"
              }`}
            >
              <button
                className={`w-full text-left px-2 py-1 border-b text-xs ${
                  darkMode
                    ? "border-parchment/10"
                    : "border-oak/10"
                } ${
                  selectedAuthor === "All authors"
                    ? darkMode
                      ? "bg-fern/30 text-night"
                      : "bg-pthalo/10 text-pthalo"
                    : ""
                }`}
                onClick={() => setSelectedAuthor("All authors")}
              >
                All authors ({Object.keys(authorCounts).length})
              </button>
              {sortedAuthors.map(([name, count]) => {
                const initial = name.trim()[0]?.toUpperCase() || "#";
                const isSelected = selectedAuthor === name;
                return (
                  <button
                    key={name}
                    data-author-initial={initial}
                    className={`w-full flex items-center justify-between px-2 py-1 text-left transition-colors ${
  isSelected
    ? darkMode
      ? "bg-fern/30 text-night"
      : "bg-pthalo/10 text-pthalo"
    : darkMode
      ? "hover:bg-fern/20 hover:text-fern"
      : "hover:bg-pthalo/10 hover:text-pthalo"
}`}

                    onClick={() => setSelectedAuthor(name)}
                  >
                    <span>{name}</span>
                    <span className="text-[0.7rem] opacity-70">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {authorsExpanded && (
            <p className="mt-1 text-[0.65rem] text-oak dark:text-parchment/60">
              Tip: press a letter key (A–Z) to jump to authors whose last name
              starts with that letter.
            </p>
          )}
        </div>

        {/* SUMMARY */}
        <div className="mt-6 text-xs text-oak dark:text-parchment/60 space-y-1">
          <p>
            <span className="font-semibold">Books in view:</span>{" "}
            {booksForTagView.length}
          </p>
          <p>
            <span className="font-semibold">Distinct tags:</span>{" "}
            {allTags.length}
          </p>
          <p>
            <span className="font-semibold">Most used tag:</span>{" "}
            {mostUsedTag.tag}{" "}
            {mostUsedTag.count > 0 && `(${mostUsedTag.count})`}
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-3 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-pthalo dark:text-fern">
          Reading Stats
        </h1>

        {/* TOP CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* BOX 1: TOTAL BOOKS (GLOBAL) */}
          <div className="p-4 rounded-xl shadow bg-bone dark:bg-cellar text-center">
            <h3 className="font-semibold mb-1 text-oak dark:text-parchment/70">
              Total books
            </h3>
            <p className="text-2xl font-bold">{normalizedBooks.length}</p>
          </div>

          {/* BOX 2: AVERAGE BOOKS PER MONTH (CURRENT AUTHOR FILTER) */}
          <div className="p-4 rounded-xl shadow bg-bone dark:bg-cellar text-center">
            <h3 className="font-semibold mb-1 text-oak dark:text-parchment/70">
              Avg books per month
            </h3>
            <p className="text-2xl font-bold">
              {averageBooksPerMonth.toFixed(1)}
            </p>
            <p className="text-xs mt-1 text-oak dark:text-parchment/60">
              Based on finished books
              {selectedAuthor !== "All authors" && (
                <>
                  {" "}
                  for <span className="font-semibold">{selectedAuthor}</span>
                </>
              )}
            </p>
          </div>

          {/* BOX 3: BOOKS PER YEAR + TOGGLE (CURRENT AUTHOR FILTER) */}
          <div className="p-4 rounded-xl shadow bg-bone dark:bg-cellar text-center">
            <h3 className="font-semibold mb-1 text-oak dark:text-parchment/70">
              Books per year
            </h3>
            <select
              className={`w-full p-2 rounded border text-xs mb-2 ${
                darkMode
                  ? "bg-night text-parchment border-parchment/20"
                  : "bg-bone text-ink border-oak/20"
              }`}
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="All years">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <p className="text-2xl font-bold">{booksInSelectedYear}</p>
            <p className="text-xs mt-1 text-oak dark:text-parchment/60">
              {yearFilter === "All years"
                ? "Finished books"
                : `Finished in ${yearFilter}`}
              {selectedAuthor !== "All authors" && (
                <>
                  {" "}
                  by <span className="font-semibold">{selectedAuthor}</span>
                </>
              )}
            </p>
          </div>

          {/* BOX 4: MOST USED TAG */}
          <div className="p-4 rounded-xl shadow bg-bone dark:bg-cellar text-center">
            <h3 className="font-semibold mb-1 text-oak dark:text-parchment/70">
              Most used tag
            </h3>
            <p className="text-lg font-semibold mb-1">
              {mostUsedTag.tag}
            </p>
            {mostUsedTag.count > 0 ? (
              <p className="text-sm text-oak dark:text-parchment/70">
                {mostUsedTag.count} book
                {mostUsedTag.count === 1 ? "" : "s"} in current filters
              </p>
            ) : (
              <p className="text-sm text-oak dark:text-parchment/70">
                No tag data yet.
              </p>
            )}
          </div>
        </div>

        {/* TAG FREQUENCY BAR + RELATIONSHIPS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* TAG BAR CHART */}
          <div className="lg:col-span-2 p-4 rounded-xl shadow bg-bone dark:bg-cellar">
            <h2 className="font-bold mb-2 text-pthalo dark:text-fern">
              Top tags
              {yearFilter !== "All years" && ` (${yearFilter})`}
              {selectedAuthor !== "All authors" && ` — ${selectedAuthor}`}
            </h2>
            {topTags.length ? (
              <Bar
                data={tagBarData}
                options={{
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { color: darkMode ? "#E8E2D8" : "#3B3A3A" } },
                    y: { ticks: { color: darkMode ? "#E8E2D8" : "#3B3A3A" } },
                  },
                }}
              />
            ) : (
              <p className="text-sm text-oak dark:text-parchment/70">
                No tags to display yet. Add tags to your books to see tag
                statistics.
              </p>
            )}
          </div>

          {/* TAG RELATIONSHIPS + FOCUS TAG DROPDOWN */}
          <div className="p-4 rounded-xl_shadow bg-bone dark:bg-cellar">
            <h2 className="font-bold mb-2 text-pthalo dark:text-fern">
              Tag relationships
            </h2>

            {/* FOCUS TAG SELECT HERE */}
            <div className="mb-3">
              <p className="text-xs font-semibold mb-1 text-oak dark:text-parchment/70">
                Focus tag
              </p>
              <select
                className={`w-full p-2 rounded border text-xs ${
                  darkMode
                    ? "bg-night text-parchment border-parchment/20"
                    : "bg-bone text-ink border-oak/20"
                }`}
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="All tags">All tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {selectedTag === "All tags" ? (
              <p className="text-sm text-oak dark:text-parchment/70">
                Select a focus tag above to see which other tags most often
                appear with it (respecting the year and author filters).
              </p>
            ) : coOccurringTags.length === 0 ? (
              <p className="text-sm text-oak dark:text-parchment/70">
                No other tags commonly occur together with{" "}
                <span className="font-semibold">{selectedTag}</span> under the
                current filters.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {coOccurringTags.map(([tag, count]) => (
                  <li
                    key={tag}
                    className="flex items-center justify-between rounded-lg px-2 py-1 bg-fern/10 dark:bg-pthalo/30"
                  >
                    <span className="font-medium">{tag}</span>
                    <span className="text-xs text-oak dark:text-parchment/70">
                      {count} book{count === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* TAG DISTRIBUTION PIE CHART */}
        <div className="p-4 rounded-xl shadow bg-bone dark:bg-cellar mb-6">
          <h2 className="font-bold mb-2 text-pthalo dark:text-fern">
            Tag distribution
            {yearFilter !== "All years" && ` (${yearFilter})`}
            {selectedAuthor !== "All authors" && ` — ${selectedAuthor}`}
          </h2>
          {pieTags.length ? (
            <Doughnut
              data={tagPieData}
              options={{
                plugins: {
                  legend: {
                    labels: {
                      color: darkMode ? "#E8E2D8" : "#3B3A3A",
                    },
                  },
                },
              }}
            />
          ) : (
            <p className="text-sm text-oak dark:text-parchment/70">
              Not enough data to display tag distribution.
            </p>
          )}
        </div>

        {/* LINE CHART: TIMELINE */}
        <div className="p-4 rounded-xl shadow bg-bone dark:bg-cellar mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-pthalo dark:text-fern">
              Reading timeline
            </h2>
            <select
              value={timelineYearFilter}
              onChange={(e) => setTimelineYearFilter(e.target.value)}
              className="px-3 py-1 rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment text-sm"
            >
              <option value="All years">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {timelineData.labels.length ? (
            <Line
              data={lineData}
              options={{
                plugins: { legend: { display: true } },
                scales: {
                  x: { ticks: { color: darkMode ? "#E8E2D8" : "#3B3A3A" } },
                  y: { 
                    beginAtZero: true,
                    ticks: { 
                      color: darkMode ? "#E8E2D8" : "#3B3A3A",
                      stepSize: 1,
                      precision: 0
                    }
                  },
                },
              }}
            />
          ) : (
            <p className="text-sm text-oak dark:text-parchment/70">
              No finished books to display.
            </p>
          )}
        </div>

        {/* BAR CHART: RELEASE YEAR DISTRIBUTION */}
        <div className="p-4 rounded-xl shadow bg-bone dark:bg-cellar">
          <h2 className="font-bold mb-4 text-pthalo dark:text-fern">
            Books by publication decade
            {yearFilter !== "All years" && ` (Read in ${yearFilter})`}
            {selectedAuthor !== "All authors" && ` — ${selectedAuthor}`}
          </h2>
          {releaseYearData.labels.length ? (
            <Bar
              data={releaseYearBarData}
              options={{
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const count = context.parsed.y || 0;
                        const total = booksForStats.filter((b) => b.releaseYear).length;
                        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                        return `${count} book${count === 1 ? '' : 's'} (${percentage}%)`;
                      }
                    }
                  }
                },
                scales: {
                  x: { 
                    ticks: { color: darkMode ? "#E8E2D8" : "#3B3A3A" },
                    title: {
                      display: true,
                      text: "Publication Decade",
                      color: darkMode ? "#E8E2D8" : "#3B3A3A",
                    }
                  },
                  y: { 
                    beginAtZero: true,
                    ticks: { 
                      color: darkMode ? "#E8E2D8" : "#3B3A3A",
                      stepSize: 1,
                      precision: 0
                    },
                    title: {
                      display: true,
                      text: "Number of Books",
                      color: darkMode ? "#E8E2D8" : "#3B3A3A",
                    }
                  },
                },
              }}
            />
          ) : (
            <p className="text-sm text-oak dark:text-parchment/70">
              No books with release year data to display. Add release years when adding books to see this chart!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
