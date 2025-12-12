import { useMemo } from 'react';

interface Book {
  id: number;
  title: string;
  authors: string[];
  tags?: string[];
}

interface WorldMapProps {
  books: Book[];
  darkMode: boolean;
}

// Country name mappings for easier recognition
const COUNTRY_MAPPINGS: { [key: string]: string } = {
  // Americas
  'america': 'United States',
  'usa': 'United States',
  'united states': 'United States',
  'us': 'United States',
  'american': 'United States',
  'canada': 'Canada',
  'canadian': 'Canada',
  'brazil': 'Brazil',
  'brazilian': 'Brazil',
  'mexico': 'Mexico',
  'mexican': 'Mexico',
  'argentina': 'Argentina',
  'argentinian': 'Argentina',
  
  // Europe
  'britain': 'United Kingdom',
  'uk': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'england': 'United Kingdom',
  'english': 'United Kingdom',
  'british': 'United Kingdom',
  'france': 'France',
  'french': 'France',
  'germany': 'Germany',
  'german': 'Germany',
  'italy': 'Italy',
  'italian': 'Italy',
  'spain': 'Spain',
  'spanish': 'Spain',
  'russia': 'Russia',
  'russian': 'Russia',
  'poland': 'Poland',
  'polish': 'Poland',
  'netherlands': 'Netherlands',
  'dutch': 'Netherlands',
  'sweden': 'Sweden',
  'swedish': 'Sweden',
  'norway': 'Norway',
  'norwegian': 'Norway',
  'denmark': 'Denmark',
  'danish': 'Denmark',
  'finland': 'Finland',
  'finnish': 'Finland',
  'ireland': 'Ireland',
  'irish': 'Ireland',
  'portugal': 'Portugal',
  'portuguese': 'Portugal',
  'greece': 'Greece',
  'greek': 'Greece',
  
  // Asia
  'japan': 'Japan',
  'japanese': 'Japan',
  'china': 'China',
  'chinese': 'China',
  'india': 'India',
  'indian': 'India',
  'korea': 'South Korea',
  'south korea': 'South Korea',
  'korean': 'South Korea',
  'thailand': 'Thailand',
  'thai': 'Thailand',
  'vietnam': 'Vietnam',
  'vietnamese': 'Vietnam',
  'indonesia': 'Indonesia',
  'indonesian': 'Indonesia',
  'philippines': 'Philippines',
  'filipino': 'Philippines',
  
  // Africa
  'egypt': 'Egypt',
  'egyptian': 'Egypt',
  'south africa': 'South Africa',
  'nigeria': 'Nigeria',
  'nigerian': 'Nigeria',
  'kenya': 'Kenya',
  'kenyan': 'Kenya',
  'morocco': 'Morocco',
  'moroccan': 'Morocco',
  
  // Oceania
  'australia': 'Australia',
  'australian': 'Australia',
  'new zealand': 'New Zealand',
};

export default function WorldMap({ books, darkMode }: WorldMapProps) {
  // Calculate country counts from book tags
  const countryData = useMemo(() => {
    const counts: { [country: string]: number } = {};
    
    books.forEach(book => {
      if (book.tags) {
        book.tags.forEach(tag => {
          const normalizedTag = tag.toLowerCase().trim();
          const country = COUNTRY_MAPPINGS[normalizedTag];
          if (country) {
            counts[country] = (counts[country] || 0) + 1;
          }
        });
      }
    });
    
    return counts;
  }, [books]);

  // Calculate max count for color scaling
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(countryData), 1);
  }, [countryData]);

  // Get color intensity based on count
  const getCountryColor = (count: number) => {
    if (count === 0) return 'transparent';
    
    const intensity = count / maxCount;
    const baseColor = darkMode ? '34, 197, 94' : '16, 185, 129'; // fern/green colors
    const alpha = 0.3 + (intensity * 0.7); // Scale from 0.3 to 1.0
    
    return `rgba(${baseColor}, ${alpha})`;
  };

  const hasData = Object.keys(countryData).length > 0;

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold text-center mb-6 text-pthalo dark:text-fern">
        Reading Around the World 🌍
      </h3>
      
      {!hasData ? (
        <div className="text-center py-12">
          <p className="text-oak dark:text-parchment/70 text-lg mb-4">
            Add country tags to your books to see your reading map!
          </p>
          <div className="bg-paper dark:bg-night rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-sm text-oak/80 dark:text-parchment/60 mb-3">
              <strong>Try adding tags like:</strong>
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Japan', 'Britain', 'America', 'France', 'Germany', 'Australia', 'Canada', 'Italy'].map(country => (
                <span
                  key={country}
                  className="px-3 py-1 bg-fern/20 dark:bg-pthalo/30 text-pthalo dark:text-fern text-sm rounded-full border border-pthalo/30"
                >
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Simple world representation with emoji flags */}
          <div className="bg-paper dark:bg-night rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-lg font-semibold text-pthalo dark:text-fern mb-2">
                Countries You've Read From ({Object.keys(countryData).length})
              </p>
            </div>
            
            {/* Country Grid with Emoji Flags */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(countryData)
                .sort(([,a], [,b]) => b - a)
                .map(([country, count]) => {
                  const countryEmoji = getCountryEmoji(country);
                  const intensity = count / maxCount;
                  
                  return (
                    <div
                      key={country}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all duration-300
                        ${darkMode ? 'bg-cellar border-pthalo/40' : 'bg-chalk border-fern/40'}
                        hover:scale-105 cursor-pointer
                      `}
                      style={{
                        backgroundColor: getCountryColor(count),
                        borderColor: intensity > 0.5 ? (darkMode ? '#22c55e' : '#10b981') : undefined
                      }}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{countryEmoji}</div>
                        <div className="font-semibold text-sm text-ink dark:text-parchment mb-1">
                          {country}
                        </div>
                        <div className="text-xs text-oak dark:text-parchment/70">
                          {count} book{count !== 1 ? 's' : ''}
                        </div>
                        
                        {/* Count Badge */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                          {count}
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[0.3, 0.5, 0.7, 1.0].map((alpha, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 border border-oak/20 dark:border-parchment/20"
                    style={{
                      backgroundColor: `rgba(${darkMode ? '34, 197, 94' : '16, 185, 129'}, ${alpha})`
                    }}
                  />
                ))}
              </div>
              <span className="text-oak dark:text-parchment/80">More books = Stronger color</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-amber-500 bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                #
              </div>
              <span className="text-oak dark:text-parchment/80">Book count</span>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-chalk dark:bg-cellar rounded-lg">
              <div className="text-2xl font-bold text-pthalo dark:text-fern">
                {Object.keys(countryData).length}
              </div>
              <div className="text-sm text-oak dark:text-parchment/70">
                Countries Explored
              </div>
            </div>
            <div className="text-center p-4 bg-chalk dark:bg-cellar rounded-lg">
              <div className="text-2xl font-bold text-pthalo dark:text-fern">
                {Object.values(countryData).reduce((sum, count) => sum + count, 0)}
              </div>
              <div className="text-sm text-oak dark:text-parchment/70">
                Total Country Tags
              </div>
            </div>
            <div className="text-center p-4 bg-chalk dark:bg-cellar rounded-lg">
              <div className="text-2xl font-bold text-pthalo dark:text-fern">
                {Object.entries(countryData).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
              </div>
              <div className="text-sm text-oak dark:text-parchment/70">
                Most Read Country
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to get country emoji flags
function getCountryEmoji(country: string): string {
  const emojiMap: { [key: string]: string } = {
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'India': '🇮🇳',
    'Australia': '🇦🇺',
    'Brazil': '🇧🇷',
    'Russia': '🇷🇺',
    'South Korea': '🇰🇷',
    'Mexico': '🇲🇽',
    'Argentina': '🇦🇷',
    'Netherlands': '🇳🇱',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Ireland': '🇮🇪',
    'Portugal': '🇵🇹',
    'Greece': '🇬🇷',
    'Poland': '🇵🇱',
    'Thailand': '🇹🇭',
    'Vietnam': '🇻🇳',
    'Indonesia': '🇮🇩',
    'Philippines': '🇵🇭',
    'Egypt': '🇪🇬',
    'South Africa': '🇿🇦',
    'Nigeria': '🇳🇬',
    'Kenya': '🇰🇪',
    'Morocco': '🇲🇦',
    'New Zealand': '🇳🇿',
  };
  
  return emojiMap[country] || '🏳️';
}
