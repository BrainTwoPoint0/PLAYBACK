'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchIcon, MapPinIcon, CalendarIcon } from 'lucide-react';
import { SearchFormProps, SearchParams } from '@/lib/playscanner/types';

export default function SearchForm({
  sport,
  onSearch,
  isSearching,
}: SearchFormProps) {
  const [location, setLocation] = useState('London');
  const [date, setDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location || !date) {
      alert('Please enter location and date');
      return;
    }

    const searchParams: SearchParams = {
      sport,
      location,
      date,
    };

    onSearch(searchParams);
  };

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Search Fields */}
      <div className="grid grid-cols-2 md:gap-4 gap-6 w-full">
        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center space-x-2">
            <MapPinIcon className="h-4 w-4" />
            <span>Location</span>
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="London"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full sm:text-left text-center"
            disabled
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <span>Date</span>
          </Label>
          <Input
            id="date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full sm:text-left text-center"
          />
        </div>
      </div>

      {/* Search Button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSearching || !location || !date}
      >
        {isSearching ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span>Searching...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <SearchIcon className="h-5 w-5" />
            <span>
              Search {sport === 'padel' ? 'Padel Courts' : 'Football Pitches'}
            </span>
          </div>
        )}
      </Button>
    </form>
  );
}
