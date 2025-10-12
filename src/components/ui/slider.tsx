'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  // Get the number of thumbs based on the value array length
  const thumbCount = Array.isArray(props.value)
    ? props.value.length
    : Array.isArray(props.defaultValue)
      ? props.defaultValue.length
      : 1;

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-800">
        <SliderPrimitive.Range className="absolute h-full bg-[#00FF88]" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className="block h-5 w-5 rounded-full border-2 border-[#00FF88] bg-[#00FF88] shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-opacity-50 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 active:scale-95"
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
