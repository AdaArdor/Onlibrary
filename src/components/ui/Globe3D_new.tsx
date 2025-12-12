import React, { useMemo, useState, useEffect, useRef } from 'react';

interface Book {
  id: number;
  title: string;
  authors: string[];
  tags?: string[];
}

interface Globe3DProps {
  books: Book[];
  darkMode: boolean;
}

// Country coordinates (latitude, longitude)
const COUNTRY_COORDINATES: { [key: string]: [number, number] } = {
  'United States': [39.8283, -98.5795],
  'United Kingdom': [55.3781, -3.4360],
  'Canada': [56.1304, -106.3468],
  'France': [46.6034, 1.8883],
  'Germany': [51.1657, 10.4515],
  'Italy': [41.8719, 12.5674],
  'Spain': [40.4637, -3.7492],
  'Japan': [36.2048, 138.2529],
  'China': [35.8617, 104.1954],
  'India': [20.5937, 78.9629],
  'Australia': [-25.2744, 133.7751],
  'Brazil': [-14.2350, -51.9253],
  'Russia': [61.5240, 105.3188],
  'South Korea': [35.9078, 127.7669],
  'Mexico': [23.6345, -102.5528],
  'Argentina': [-38.4161, -63.6167],
  'Netherlands': [52.1326, 5.2913],
  'Sweden': [60.1282, 18.6435],
  'Norway': [60.4720, 8.4689],
  'Denmark': [56.2639, 9.5018],
  'Finland': [61.9241, 25.7482],
  'Ireland': [53.4129, -8.2439],
  'Portugal': [39.3999, -8.2245],
  'Greece': [39.0742, 21.8243],
  'Poland': [51.9194, 19.1451],
  'Thailand': [15.8700, 100.9925],
  'Vietnam': [14.0583, 108.2772],
  'Indonesia': [-0.7893, 113.9213],
  'Philippines': [12.8797, 121.7740],
  'Egypt': [26.0975, 30.0444],
  'South Africa': [-30.5595, 22.9375],
  'Nigeria': [9.0820, 8.6753],
  'Kenya': [-0.0236, 37.9062],
  'Morocco': [31.7917, -7.0926],
};

// Tag to country mappings
const COUNTRY_MAPPINGS: { [key: string]: string } = {
  'usa': 'United States',
  'america': 'United States',
  'american': 'United States',
  'united states': 'United States',
  'uk': 'United Kingdom',
  'britain': 'United Kingdom',
  'british': 'United Kingdom',
  'england': 'United Kingdom',
  'english': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'canada': 'Canada',
  'canadian': 'Canada',
  'france': 'France',
  'french': 'France',
  'germany': 'Germany',
  'german': 'Germany',
  'italia': 'Italy',
  'italy': 'Italy',
  'italian': 'Italy',
  'spain': 'Spain',
  'spanish': 'Spain',
  'japan': 'Japan',
  'japanese': 'Japan',
  'china': 'China',
  'chinese': 'China',
  'india': 'India',
  'indian': 'India',
  'australia': 'Australia',
  'australian': 'Australia',
  'brazil': 'Brazil',
  'brazilian': 'Brazil',
  'russia': 'Russia',
  'russian': 'Russia',
  'korea': 'South Korea',
  'south korea': 'South Korea',
  'korean': 'South Korea',
  'mexico': 'Mexico',
  'mexican': 'Mexico',
  'argentina': 'Argentina',
  'argentinian': 'Argentina',
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
  'poland': 'Poland',
  'polish': 'Poland',
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
};

// CSS 3D Globe component with rotation
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
      {/* Globe sphere */}
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
        {/* Globe grid lines */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {/* Latitude lines */}
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
          
          {/* Longitude lines */}
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

        {/* Country markers */}
        {Object.entries(countryData).map(([country, count]) => {
          const position = getMarkerPosition(country);
          
          if (!position.visible) return null;
          
          const size = Math.max(8, Math.min(20, count * 4));
          
          return (
            <div
              key={country}
              className="absolute group"
              style={{
                left: `calc(50% + ${position.x}px)`,
                top: `calc(50% - ${position.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Pulsing marker */}
              <div 
                className={`relative rounded-full ${darkMode ? 'bg-green-400' : 'bg-green-500'} shadow-lg animate-pulse cursor-pointer`}
                style={{ width: size, height: size }}
              >
                {/* Count badge */}
                <div 
                  className={`absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-amber-400 text-gray-900' : 'bg-amber-500 text-white'} shadow-sm`}
                  style={{ fontSize: '10px' }}
                >
                  {count}
                </div>
              </div>
              
              {/* Country label on hover */}
              <div 
                className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg`}
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

export default function Globe3D({ books, darkMode }: Globe3DProps) {
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

  const hasData = Object.keys(countryData).length > 0;

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold text-center mb-6 text-pthalo dark:text-fern">
        🌍 Interactive 3D Reading Globe
      </h3>
      
      {!hasData ? (
        <div className="text-center py-12">
          <p className="text-oak dark:text-parchment/70 text-lg mb-4">
            Add country tags to your books to see your 3D reading globe!
          </p>
          <div className="bg-paper dark:bg-night rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-sm text-oak/80 dark:text-parchment/60 mb-3">
              <strong>Try adding tags like:</strong>
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Japan', 'Britain', 'America', 'France', 'Germany', 'Australia', 'Canada', 'Italy'].map(country => (
                <span
                  key={country}
                  className="px-3 py-1 bg-pthalo/10 dark:bg-fern/10 text-pthalo dark:text-fern rounded-full text-sm"
                >
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 3D Globe Container */}
          <div className="bg-gradient-to-b from-blue-900/20 via-blue-800/10 to-blue-900/20 rounded-lg p-8 mb-8 shadow-2xl backdrop-blur-sm border border-blue-500/20">
            <div className="h-96">
              <CSS3DGlobe countryData={countryData} darkMode={darkMode} />
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-chalk dark:bg-cellar rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-pthalo dark:text-fern mb-2">
                {Object.values(countryData).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-oak dark:text-parchment/70">
                Total Books
              </div>
            </div>
            
            <div className="bg-chalk dark:bg-cellar rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-pthalo dark:text-fern mb-2">
                {Object.keys(countryData).length}
              </div>
              <div className="text-sm text-oak dark:text-parchment/70">
                Countries Visited
              </div>
            </div>
            
            <div className="bg-chalk dark:bg-cellar rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-pthalo dark:text-fern mb-2">
                {Object.entries(countryData).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
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
                .sort(([,a], [,b]) => b - a)
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
          
          {/* Globe Instructions */}
          <div className="mt-6 text-center">
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              🎮 Drag to rotate the globe • ⏸️ Auto-rotates after 3 seconds of inactivity
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-oak dark:text-parchment/80">Country markers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-amber-500 bg-transparent"></div>
                <span className="text-oak dark:text-parchment/80">Book counts</span>
              </div>
              <div className="text-oak dark:text-parchment/80">
                💡 Larger markers = more books from that country
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
