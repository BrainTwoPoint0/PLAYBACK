'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import { ClockIcon } from 'lucide-react';
import { CourtSlot } from '@/lib/playscanner/types';

interface TimeRange {
  start: string;
  end: string;
}

interface TimeFiltersProps {
  timeRange?: TimeRange;
  onTimeRangeChange: (range: TimeRange | undefined) => void;
  searchResults: CourtSlot[]; // Add search results to calculate dynamic bounds
}

export default function TimeFilters({
  timeRange,
  onTimeRangeChange,
  searchResults,
}: TimeFiltersProps) {
  // Calculate dynamic time bounds from search results
  const { dynamicStart, dynamicEnd } = useMemo(() => {
    if (searchResults.length === 0) {
      return { dynamicStart: '08:00', dynamicEnd: '22:00' }; // Default 8am-10pm
    }

    const times = searchResults.map((slot) => {
      const startDate = new Date(slot.startTime);
      const endDate = new Date(slot.endTime);
      return {
        start: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
        end: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
      };
    });

    const allTimes = [...times.map((t) => t.start), ...times.map((t) => t.end)];
    const sortedTimes = allTimes.sort();

    return {
      dynamicStart: sortedTimes[0] || '08:00',
      dynamicEnd: sortedTimes[sortedTimes.length - 1] || '22:00',
    };
  }, [searchResults]);

  const currentStart = timeRange?.start || '';
  const currentEnd = timeRange?.end || '';

  const handleStartTimeChange = (start: string) => {
    const newRange = {
      start,
      end: currentEnd || dynamicEnd,
    };
    onTimeRangeChange(newRange);
  };

  const handleEndTimeChange = (end: string) => {
    const newRange = {
      start: currentStart || dynamicStart,
      end,
    };
    onTimeRangeChange(newRange);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <ClockIcon className="h-4 w-4" />
        <Label className="text-sm font-medium">Time Range</Label>
      </div>

      {/* Custom Time Range with dynamic bounds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">
            From
            <span className="text-muted-foreground ml-1">
              (earliest: {dynamicStart})
            </span>
          </Label>
          <TimePicker
            value={currentStart}
            onChange={handleStartTimeChange}
            placeholder="Select start time"
            min={dynamicStart}
            max={dynamicEnd}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">
            To
            <span className="text-muted-foreground ml-1">
              (latest: {dynamicEnd})
            </span>
          </Label>
          <TimePicker
            value={currentEnd}
            onChange={handleEndTimeChange}
            placeholder="Select end time"
            min={dynamicStart}
            max={dynamicEnd}
          />
        </div>
      </div>
    </div>
  );
}
