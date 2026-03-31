'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CourtSlot } from '@/lib/playscanner/types';
import { Badge } from '@braintwopoint0/playback-commons/ui';
import { MapPinIcon, ClockIcon, ExternalLinkIcon } from 'lucide-react';

// Dynamically import Map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});

interface MapViewProps {
  results: CourtSlot[];
  sport: string;
}

// Inject Leaflet styles once globally
let stylesInjected = false;
function injectLeafletStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  const style = document.createElement('style');
  style.textContent = `
    .leaflet-marker-icon { background: none !important; border: none !important; }
    .leaflet-marker-icon img { width: 18px !important; height: 18px !important; }
    .leaflet-popup-content-wrapper { background: #0a100d !important; border: 1px solid rgba(0,255,136,0.2) !important; border-radius: 12px !important; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.4) !important; }
    .leaflet-popup-content { margin: 0 !important; color: white !important; }
    .leaflet-popup-tip { background: #0a100d !important; border: 1px solid rgba(0,255,136,0.2) !important; box-shadow: none !important; }
    .leaflet-popup-close-button { color: #00FF88 !important; font-size: 20px !important; font-weight: 300 !important; width: 24px !important; height: 24px !important; display: flex !important; align-items: center !important; justify-content: center !important; line-height: 1 !important; padding: 0 !important; top: 8px !important; right: 8px !important; }
    .leaflet-popup-close-button:hover { color: #00E077 !important; background: rgba(0,255,136,0.1) !important; border-radius: 4px !important; }
    .leaflet-control-zoom a { background: #0a100d !important; border: 1px solid rgba(0,255,136,0.2) !important; color: #00FF88 !important; display: flex !important; align-items: center !important; justify-content: center !important; width: 30px !important; height: 30px !important; line-height: 26px !important; font-size: 18px !important; }
    .leaflet-control-zoom a:hover { background: rgba(0,255,136,0.1) !important; color: #00E077 !important; }
    .leaflet-control-attribution { background: rgba(10,16,13,0.8) !important; color: #b9baa3 !important; border: 1px solid rgba(0,255,136,0.1) !important; border-radius: 6px !important; font-size: 10px !important; }
    .leaflet-control-attribution a { color: #00FF88 !important; }
    @media (max-width: 640px) { .leaflet-popup-content-wrapper { max-width: 260px !important; } .leaflet-control-zoom a { width: 22px !important; height: 22px !important; } }
  `;
  document.head.appendChild(style);
}

function MapSkeleton() {
  return (
    <div className="absolute inset-0 z-10 rounded-xl bg-[#0a100d] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h${i}`}
            className="absolute left-0 right-0 border-t border-white"
            style={{ top: `${(i + 1) * 12}%` }}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <div
            key={`v${i}`}
            className="absolute top-0 bottom-0 border-l border-white"
            style={{ left: `${(i + 1) * 15}%` }}
          />
        ))}
      </div>
      <div className="absolute top-[30%] left-[40%] h-3 w-3 animate-pulse rounded-full bg-[#00FF88]/20" />
      <div
        className="absolute top-[45%] left-[55%] h-3 w-3 animate-pulse rounded-full bg-[#00FF88]/20"
        style={{ animationDelay: '150ms' }}
      />
      <div
        className="absolute top-[35%] left-[60%] h-3 w-3 animate-pulse rounded-full bg-[#00FF88]/20"
        style={{ animationDelay: '300ms' }}
      />
      <div
        className="absolute top-[55%] left-[45%] h-3 w-3 animate-pulse rounded-full bg-[#00FF88]/20"
        style={{ animationDelay: '100ms' }}
      />
      <div
        className="absolute top-[50%] left-[35%] h-3 w-3 animate-pulse rounded-full bg-[#00FF88]/20"
        style={{ animationDelay: '250ms' }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-4 py-2 backdrop-blur-sm">
          <MapPinIcon className="h-4 w-4 animate-pulse text-[#00FF88]/50" />
          <span className="text-xs text-gray-600">Loading map</span>
        </div>
      </div>
    </div>
  );
}

export default function MapView({ results, sport }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTilesReady(false);
    injectLeafletStyles();

    import('leaflet').then((L) => {
      const srcMap: Record<string, string> = {
        football: '/assets/football.svg',
        basketball: '/assets/basketball.svg',
        padel: '/assets/tennis.svg',
        tennis: '/assets/tennis.svg',
      };
      const src = srcMap[sport] || '/assets/football.svg';

      const customIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;border-radius:50%;background:#00FF88;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.4);border:2px solid white;overflow:hidden;"><img src="${src}" style="display:block;width:18px;height:18px;max-width:18px;max-height:18px;" /></div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      L.Marker.prototype.options.icon = customIcon;
      setLeafletLoaded(true);
    });
  }, [sport]);

  // Get center point and zoom for map
  const getMapSettings = (): { center: [number, number]; zoom: number } => {
    if (results.length === 0) return { center: [51.5074, -0.1278], zoom: 12 }; // London

    const validCoords = results
      .map((slot) => slot.venue.location?.coordinates)
      .filter((coords) => coords && coords.lat && coords.lng) as Array<{
      lat: number;
      lng: number;
    }>;

    if (validCoords.length === 0)
      return { center: [51.5074, -0.1278], zoom: 12 };

    // Calculate center
    const avgLat =
      validCoords.reduce((sum, coord) => sum + coord.lat, 0) /
      validCoords.length;
    const avgLng =
      validCoords.reduce((sum, coord) => sum + coord.lng, 0) /
      validCoords.length;

    // Calculate zoom based on spread of coordinates
    const latitudes = validCoords.map((coord) => coord.lat);
    const longitudes = validCoords.map((coord) => coord.lng);

    const latSpread = Math.max(...latitudes) - Math.min(...latitudes);
    const lngSpread = Math.max(...longitudes) - Math.min(...longitudes);
    const maxSpread = Math.max(latSpread, lngSpread);

    // Determine zoom level based on coordinate spread
    let zoom = 12;
    if (maxSpread < 0.01)
      zoom = 15; // Very close venues
    else if (maxSpread < 0.05)
      zoom = 13; // Close venues
    else if (maxSpread < 0.1)
      zoom = 12; // Medium spread
    else if (maxSpread < 0.2)
      zoom = 11; // Wide spread
    else zoom = 10; // Very wide spread

    return { center: [avgLat, avgLng], zoom };
  };

  // Group venues by location to avoid overlapping markers
  const getUniqueVenues = () => {
    const venueMap = new Map<string, CourtSlot[]>();

    results.forEach((slot) => {
      const coords = slot.venue.location?.coordinates;
      if (coords && coords.lat && coords.lng) {
        const key = `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
        if (!venueMap.has(key)) {
          venueMap.set(key, []);
        }
        venueMap.get(key)!.push(slot);
      }
    });

    return Array.from(venueMap.entries()).map(([coords, slots]) => ({
      coordinates: slots[0].venue.location!.coordinates,
      venue: slots[0].venue,
      slots: slots,
      cheapestSlot: slots.reduce((min, slot) =>
        slot.price < min.price ? slot : min
      ),
    }));
  };

  const VenuePopup = ({
    venue,
    slots,
    cheapestSlot,
  }: {
    venue: any;
    slots: CourtSlot[];
    cheapestSlot: CourtSlot;
  }) => (
    <div className="w-[240px] sm:min-w-[280px] sm:max-w-[320px] p-1 bg-[#0a100d] text-white">
      <div className="mb-2 pt-2 px-2">
        <div className="mb-1">
          <h3 className="font-semibold text-sm text-white leading-tight">
            {venue.name}
          </h3>
        </div>

        <div className="flex items-center justify-between text-xs mt-1.5 mb-2">
          <div className="flex items-center text-[#b9baa3]">
            <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {venue.location?.city || venue.address?.city || 'London'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="border-[#00FF88] text-[#00FF88] px-1.5 py-0.5 text-[10px]"
            >
              {cheapestSlot.provider}
            </Badge>
            <span className="text-[10px] text-gray-500">
              {slots.length} slot{slots.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#1a2520] rounded-lg p-2 mb-2 border border-[#00FF88]/20 mx-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#b9baa3] uppercase tracking-wide font-medium">
              From
            </div>
            <div className="text-base font-bold text-[#00FF88]">
              £{(cheapestSlot.price / 100).toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#b9baa3] uppercase tracking-wide font-medium">
              Next
            </div>
            <div className="text-xs font-medium flex items-center justify-end text-white">
              <ClockIcon className="h-3 w-3 mr-1" />
              {new Date(cheapestSlot.startTime).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-2">
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/playscanner/redirect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  provider: cheapestSlot.provider,
                  venueName: cheapestSlot.venue.name,
                  venueId: cheapestSlot.venue.id,
                  bookingUrl: cheapestSlot.bookingUrl,
                  price: cheapestSlot.price,
                  sport: cheapestSlot.sport,
                  startTime: cheapestSlot.startTime,
                }),
              });
              const data = await res.json();
              window.open(data.bookingUrl || cheapestSlot.bookingUrl, '_blank');
            } catch {
              window.open(cheapestSlot.bookingUrl, '_blank');
            }
          }}
          className="w-full bg-[#00FF88] hover:bg-[#00E077] text-[#0a100d] font-medium py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1 transition-colors text-xs"
        >
          <span>Book</span>
          <ExternalLinkIcon className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  const uniqueVenues = getUniqueVenues();
  const { center, zoom } = getMapSettings();

  if (isClient && leafletLoaded && uniqueVenues.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
        <MapPinIcon className="mx-auto h-8 w-8 text-gray-600 mb-3" />
        <h3 className="text-base font-semibold text-white mb-1">
          No venues to show on map
        </h3>
        <p className="text-sm text-gray-500">
          Try a different search or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[500px] rounded-xl overflow-hidden">
      {/* Skeleton overlay — visible until tiles load, then fades out */}
      {!tilesReady && <MapSkeleton />}

      {/* Actual map — renders underneath skeleton, invisible until tiles ready */}
      {isClient && leafletLoaded && (
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '500px', width: '100%' }}
          className="rounded-lg"
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            eventHandlers={{ load: () => setTilesReady(true) }}
          />
          {uniqueVenues.map((venueData, index) => (
            <Marker
              key={index}
              position={[venueData.coordinates.lat, venueData.coordinates.lng]}
            >
              <Popup>
                <VenuePopup
                  venue={venueData.venue}
                  slots={venueData.slots}
                  cheapestSlot={venueData.cheapestSlot}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
