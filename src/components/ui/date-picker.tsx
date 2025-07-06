'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  className?: string;
  id?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  className,
  id,
  placeholder = 'Pick a date',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Convert string value to Date object
  const selectedDate = value ? new Date(value) : undefined;

  // Convert min string to Date object
  const minDate = min ? new Date(min) : undefined;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Convert Date back to YYYY-MM-DD string format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-10 bg-zinc-800 border-none text-white shadow-input rounded-md px-3 py-2 text-sm',
            'focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-600',
            'shadow-[0px_0px_1px_1px_var(--neutral-700)]',
            'hover:shadow-none transition duration-400',
            !selectedDate && 'text-neutral-400',
            className
          )}
        >
          {selectedDate ? formatDate(selectedDate) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => (minDate ? date < minDate : false)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
