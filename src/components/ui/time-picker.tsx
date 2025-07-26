'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ClockIcon } from 'lucide-react';

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  className,
  disabled = false,
  min,
  max,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hours, setHours] = React.useState(
    value ? parseInt(value.split(':')[0]) : 9
  );
  const [minutes, setMinutes] = React.useState(
    value ? parseInt(value.split(':')[1]) : 0
  );

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleTimeSelect = (h: number, m: number) => {
    const timeString = formatTime(h, m);
    setHours(h);
    setMinutes(m);
    onChange?.(timeString);
    setOpen(false);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let h = 6; h <= 23; h++) {
      for (let m = 0; m < 60; m += 15) {
        const timeString = formatTime(h, m);

        // Check against min/max constraints
        if (min && timeString < min) continue;
        if (max && timeString > max) continue;

        options.push({ hours: h, minutes: m, display: timeString });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();
  const displayValue = value || '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-12 text-base',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <ClockIcon className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="max-h-60 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1 p-2">
            {timeOptions.map(({ hours: h, minutes: m, display }) => (
              <Button
                key={display}
                variant={value === display ? 'default' : 'ghost'}
                className="justify-start text-left h-8 text-sm"
                onClick={() => handleTimeSelect(h, m)}
              >
                {display}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
