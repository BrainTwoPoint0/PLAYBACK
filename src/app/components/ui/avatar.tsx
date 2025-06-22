'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '../../../lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    />
  )
);
Avatar.displayName = 'Avatar';

interface AvatarImageProps extends React.ComponentProps<typeof Image> {
  alt: string;
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, alt, ...props }, ref) => (
    <Image
      ref={ref}
      className={cn('aspect-square h-full w-full object-cover', className)}
      alt={alt}
      {...props}
    />
  )
);
AvatarImage.displayName = 'AvatarImage';

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
