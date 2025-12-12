interface Book {
  id: number;
  title: string;
  authors: string[];
  tags?: string[];
}

interface Globe3DProps {
  books: Book[];
}

// Country name mappings
const COUNTRY_MAPPINGS: { [key: string]: string } = {
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
  'egypt': 'Egypt',
  'egyptian': 'Egypt',
  'south africa': 'South Africa',
  'nigeria': 'Nigeria',
  'nigerian': 'Nigeria',
  'kenya': 'Kenya',
  'kenyan': 'Kenya',
  'morocco': 'Morocco',
  'moroccan': 'Morocco',
  'australia': 'Australia',
  'australian': 'Australia',
  'new zealand': 'New Zealand',
};

/* 
// CSS 3D Globe component with rotation (currently unused but kept for future)
function CSS3DGlobe({ countryData, darkMode }: { countryData: { [country: string]: number }, darkMode: boolean }) {
  const globeRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto rotation effect
  useEffect(() => {
    if (!autoRotate) return;
    
    const interval = setInterval(() => {
      setRotation(prev => ({ ...prev, y: prev.y + 0.5 }));
    }, 50);

    return () => clearInterval(interval);
  }, [autoRotate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setAutoRotate(true), 3000); // Resume auto-rotation after 3 seconds
  };

  const getMarkerPosition = (country: string) => {
    const coords = COUNTRY_COORDINATES[country];
    if (!coords) return { x: 0, y: 0, visible: true };
    
    const [lat, lng] = coords;
    
    // Calculate position on the sphere
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng - rotation.y) * (Math.PI / 180);
    
    const radius = 150;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    // Simple visibility check (front hemisphere)
    const visible = z > 0;
    
    return { x, y: y + Math.sin(rotation.x * Math.PI / 180) * 20, visible };
  };

  return (
    <div 
      ref={globeRef}
      className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      style={{ perspective: '1000px' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      Globe sphere
      <div 
        className="relative"
        style={{
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: darkMode 
            ? 'radial-gradient(circle at 30% 30%, #1e40af, #1e3a8a, #0f172a)'
            : 'radial-gradient(circle at 30% 30%, #3b82f6, #1d4ed8, #1e40af)',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          boxShadow: darkMode
            ? 'inset -30px -30px 50px rgba(0,0,0,0.7), 0 0 50px rgba(34, 197, 94, 0.3)'
            : 'inset -30px -30px 50px rgba(0,0,0,0.3), 0 0 50px rgba(16, 185, 129, 0.3)',
        }}
      >
        Globe grid lines
        <div className="absolute inset-0 rounded-full overflow-hidden">
          Latitude lines
          {[20, 40, 60, 80].map(lat => (
            <div
              key={`lat-${lat}`}
              className={`absolute left-0 right-0 border-t ${darkMode ? 'border-blue-400/20' : 'border-blue-600/20'}`}
              style={{ 
                top: `${lat}%`,
                borderRadius: '50%',
              }}
            />
          ))}
          
          Longitude lines
          {[25, 50, 75].map(lng => (
            <div
              key={`lng-${lng}`}
              className={`absolute top-0 bottom-0 border-l ${darkMode ? 'border-blue-400/20' : 'border-blue-600/20'}`}
              style={{ 
                left: `${lng}%`,
                borderRadius: '50%',
              }}
            />
          ))}
        </div>

        Country markers
        {Object.entries(countryData).map(([country, count]) => {
          const position = getMarkerPosition(country);
          
          if (!position.visible) return null;
          
          const size = Math.max(8, Math.min(20, count * 4));
          
          return (
            <div
              key={country}
              className="absolute pointer-events-none"
              style={{
                left: `calc(50% + ${position.x}px)`,
                top: `calc(50% - ${position.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              Pulsing marker
              <div 
                className={`relative rounded-full ${darkMode ? 'bg-green-400' : 'bg-green-500'} shadow-lg animate-pulse`}
                style={{ width: size, height: size }}
              >
                Count badge
                <div 
                  className={`absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-amber-400 text-gray-900' : 'bg-amber-500 text-white'} shadow-sm`}
                  style={{ fontSize: '10px' }}
                >
                  {count}
                </div>
              </div>
              
              Country label on hover
              <div 
                className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg pointer-events-auto`}
              >
                {country}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
*/

export default function Globe3D({ books }: Globe3DProps) {
  // Calculate country counts from book tags
  const countryData: { [country: string]: number } = {};
  
  books.forEach(book => {
    if (book.tags) {
      book.tags.forEach(tag => {
        const normalizedTag = tag.toLowerCase().trim();
        const country = COUNTRY_MAPPINGS[normalizedTag];
        if (country) {
          countryData[country] = (countryData[country] || 0) + 1;
        }
      });
    }
  });

  const hasData = Object.keys(countryData).length > 0;

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold text-center mb-6 text-pthalo dark:text-fern">
        🌍 Reading by Country
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
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-chalk dark:bg-cellar rounded-lg">
              <div className="text-2xl font-bold text-pthalo dark:text-fern">
                {Object.keys(countryData).length}
              </div>
              <div className="text-sm text-oak dark:text-parchment/70">
                Countries
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
                {Object.entries(countryData).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'None'}
              </div>
              <div className="text-sm text-oak dark:text-parchment/70">
                Most Read Country
              </div>
            </div>
          </div>
          
          {/* Country List */}
          <div className="bg-chalk dark:bg-cellar rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4 text-pthalo dark:text-fern text-center">
              Countries You've Explored ({Object.keys(countryData).length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(countryData)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([country, count]) => (
                  <div
                    key={country}
                    className="flex justify-between items-center p-3 rounded-lg bg-paper dark:bg-night border border-oak/20 dark:border-parchment/20 hover:border-pthalo dark:hover:border-fern transition-colors"
                  >
                    <span className="text-sm font-medium text-ink dark:text-parchment">
                      {country}
                    </span>
                    <span className="font-bold text-pthalo dark:text-fern text-lg">
                      {count}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
}
