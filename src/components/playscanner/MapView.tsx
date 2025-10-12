'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CourtSlot } from '@/lib/playscanner/types';
import { Card, CardContent } from '@playback/commons/components/ui/card';
import { Badge } from '@playback/commons/components/ui/badge';
import { Button } from '@playback/commons/components/ui/button';
import { MapPinIcon, ClockIcon, ExternalLinkIcon, Loader2 } from 'lucide-react';

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
  sport: 'padel' | 'football';
}

export default function MapView({ results, sport }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Load Leaflet dynamically
    if (typeof window !== 'undefined') {
      // Load CSS dynamically
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Add custom dark theme styles for Leaflet popups
      const customStyles = document.createElement('style');
      customStyles.textContent = `
        .leaflet-popup-content-wrapper {
          background: #0a100d !important;
          border: 1px solid rgba(0, 255, 136, 0.2) !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2) !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          color: white !important;
        }
        .leaflet-popup-tip {
          background: #0a100d !important;
          border: 1px solid rgba(0, 255, 136, 0.2) !important;
          box-shadow: none !important;
        }
        .leaflet-popup-close-button {
          color: #00FF88 !important;
          font-size: 16px !important;
          font-weight: bold !important;
          padding: 6px !important;
          top: 6px !important;
          right: 6px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #00E077 !important;
          background: rgba(0, 255, 136, 0.1) !important;
          border-radius: 4px !important;
        }
        .leaflet-control-zoom a {
          background: #0a100d !important;
          border: 1px solid rgba(0, 255, 136, 0.2) !important;
          color: #00FF88 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          line-height: 1 !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(0, 255, 136, 0.1) !important;
          color: #00E077 !important;
        }
        .leaflet-control-attribution {
          background: rgba(10, 16, 13, 0.8) !important;
          color: #b9baa3 !important;
          border: 1px solid rgba(0, 255, 136, 0.1) !important;
          border-radius: 6px !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: #00FF88 !important;
        }
        @media (max-width: 640px) {
          .leaflet-popup-content-wrapper {
            max-width: 260px !important;
          }
          .leaflet-popup-close-button {
            font-size: 14px !important;
            padding: 4px !important;
            top: 4px !important;
            right: 4px !important;
          }
          .leaflet-control-zoom {
            font-size: 14px !important;
          }
          .leaflet-control-zoom a {
            width: 22px !important;
            height: 22px !important;
            line-height: 20px !important;
          }
        }
      `;
      document.head.appendChild(customStyles);

      import('leaflet').then((L) => {
        // Create custom green marker icon for sports venues
        const customIcon = L.divIcon({
          html: `
            <div style="
              background-color: #00FF88;
              border: 3px solid white;
              border-radius: 50%;
              width: 24px;
              height: 24px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            ">
              <div style="
                color: #0a100d;
                font-size: 12px;
                font-weight: bold;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
              ">🎾</div>
            </div>
          `,
          className: 'custom-venue-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        });

        // Set as default marker
        L.Marker.prototype.options.icon = customIcon;

        setLeafletLoaded(true);
      });
    }
  }, []);

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
          <div className="flex items-center justify-between mt-1">
            <Badge
              variant="outline"
              className="text-xs border-[#00FF88] text-[#00FF88] px-1.5 py-0.5 text-[10px]"
            >
              {cheapestSlot.provider}
            </Badge>
            <span className="text-xs text-[#00FF88] bg-[#00FF88]/10 px-1 py-0.5 rounded text-[10px]">
              {sport === 'padel' ? '🏓' : '⚽'}
            </span>
          </div>
        </div>

        {(venue.location?.city || venue.address?.city) && (
          <div className="flex items-center justify-between text-xs text-[#b9baa3] mb-2">
            <div className="flex items-center">
              <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate text-xs">
                {venue.location?.city || venue.address?.city}
              </span>
            </div>
            <span className="text-xs ml-2 flex-shrink-0">
              {slots.length} slot{slots.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
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
          onClick={() => window.open(cheapestSlot.bookingUrl, '_blank')}
          className="w-full bg-[#00FF88] hover:bg-[#00E077] text-[#0a100d] font-medium py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1 transition-colors text-xs"
        >
          <span>Book</span>
          <ExternalLinkIcon className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  if (!isClient) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading map...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leafletLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Initializing map...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const uniqueVenues = getUniqueVenues();
  const { center, zoom } = getMapSettings();

  if (uniqueVenues.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-96">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-semibold mb-2">
            No venues to show on map
          </h3>
          <p className="text-gray-600 text-center">
            The search results don&apos;t contain location data for mapping. Try
            searching in a different area or check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative">
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
            />

            {uniqueVenues.map((venueData, index) => (
              <Marker
                key={index}
                position={[
                  venueData.coordinates.lat,
                  venueData.coordinates.lng,
                ]}
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
        </div>
      </CardContent>
    </Card>
  );
}
