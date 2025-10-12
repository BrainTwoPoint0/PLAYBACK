'use client';

import { useState } from 'react';
import { Button } from '@playback/commons/components/ui/button';
import { Input } from '@playback/commons/components/ui/input';
import { Label } from '@playback/commons/components/ui/label';
import { DatePicker } from '@playback/commons/components/ui/date-picker';
import { SearchIcon, MapPinIcon, CalendarIcon } from 'lucide-react';
import { SearchFormProps, SearchParams } from '@/lib/playscanner/types';

export default function SearchForm({
  sport,
  onSearch,
  isSearching,
}: SearchFormProps) {
  const [location, setLocation] = useState('London');

  // Get today's date in YYYY-MM-DD format (always use local date)
  const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getToday();
  const [date, setDate] = useState(today);

  // Calculate max date (7 days from today)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 6); // 6 days ahead (today + 6 = 7 days total)
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, '0');
    const day = String(maxDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const maxDate = getMaxDate();

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
          <DatePicker
            id="date"
            min={today}
            max={maxDate}
            value={date}
            onChange={setDate}
            className="w-full sm:text-left text-center"
            placeholder="Select date"
          />
        </div>
      </div>

      {/* Search Button */}
      <Button
        type="submit"
        className="w-full bg-[#00FF88] hover:bg-[#00E077] text-[#0a100d] font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        size="lg"
        disabled={isSearching || !location || !date}
      >
        {isSearching ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#0a100d] border-t-transparent" />
            <span className="text-lg">Searching...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <SearchIcon className="h-5 w-5" />
            <span className="text-lg">
              Search {sport === 'padel' ? 'Padel Courts' : 'Football Pitches'}
            </span>
          </div>
        )}
      </Button>
    </form>
  );
}
