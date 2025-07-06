'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchResultsProps } from '@/lib/playscanner/types';
import {
  MapPinIcon,
  ClockIcon,
  PoundSterlingIcon,
  ExternalLinkIcon,
} from 'lucide-react';

export default function SearchResults({
  results,
  isLoading,
  sport,
  error,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Searching for{' '}
            {sport === 'padel' ? 'Padel Courts' : 'Football Pitches'}...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Loading skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Search Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error.message}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Results Found</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎾</div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              No {sport === 'padel' ? 'padel courts' : 'football pitches'} found
              for your search criteria.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Try adjusting your search criteria:</p>
              <ul className="mt-2 space-y-1">
                <li>• Search in a different location</li>
                <li>• Try a different date</li>
                <li>• Remove some filters</li>
                <li>• Expand your time range</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Found {results.length}{' '}
          {sport === 'padel' ? 'Padel Courts' : 'Football Pitches'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((slot) => (
            <Card key={slot.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-3">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-0">
                        {slot.venue.name}
                      </h3>
                      <Badge variant="outline" className="text-xs w-fit">
                        {slot.provider}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{slot.venue.location.city}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {new Date(slot.startTime).toLocaleTimeString(
                            'en-GB',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}{' '}
                          -{' '}
                          {new Date(slot.endTime).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col lg:text-right items-center lg:items-end justify-between lg:justify-start space-x-4 lg:space-x-0 lg:space-y-2">
                    <div className="text-xl lg:text-2xl font-bold text-[#00FF88]">
                      £{(slot.price / 100).toFixed(2)}
                    </div>
                    <Button
                      onClick={() => window.open(slot.bookingUrl, '_blank')}
                      className="flex items-center space-x-2 text-sm lg:text-base"
                      size="sm"
                    >
                      <span>Book Now</span>
                      <ExternalLinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Court/Pitch Details */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {slot.features.indoor && (
                    <Badge variant="secondary" className="text-xs">
                      Indoor
                    </Badge>
                  )}
                  {slot.features.lights && (
                    <Badge variant="secondary" className="text-xs">
                      Lights
                    </Badge>
                  )}
                  {slot.features.surface && (
                    <Badge variant="secondary" className="text-xs">
                      {slot.features.surface}
                    </Badge>
                  )}

                  {/* Sport-specific metadata */}
                  {sport === 'padel' && 'courtType' in slot.sportMeta && (
                    <Badge variant="secondary" className="text-xs">
                      {slot.sportMeta.courtType}
                    </Badge>
                  )}

                  {sport === 'football' && 'format' in slot.sportMeta && (
                    <Badge variant="secondary" className="text-xs">
                      {slot.sportMeta.format}
                    </Badge>
                  )}
                </div>

                {/* Availability */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div>
                    {slot.availability.spotsAvailable} of{' '}
                    {slot.availability.totalSpots} spots available
                  </div>
                  <div>
                    Updated {new Date(slot.lastUpdated).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
