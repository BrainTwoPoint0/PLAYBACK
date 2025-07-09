'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileHeaderProps {
  title: string;
  description: string;
  backTo: string;
  backLabel: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    className?: string;
  };
  mobileActionLabel?: string;
  gradient?: string;
}

export function ProfileHeader({
  title,
  description,
  backTo,
  backLabel,
  action,
  mobileActionLabel,
  gradient = 'from-green-400 to-blue-400',
}: ProfileHeaderProps) {
  const router = useRouter();

  const handleBackClick = () => {
    router.push(backTo);
  };

  return (
    <div className="mb-8">
      {/* Mobile Header */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="flex items-center gap-2 hover:bg-neutral-800/50"
            style={{ color: 'var(--ash-grey)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {action && (
            <Button
              onClick={action.onClick}
              size="sm"
              variant={action.variant || 'default'}
              className={
                action.className ||
                'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              }
            >
              {mobileActionLabel || action.label}
            </Button>
          )}
        </div>
        <div className="text-center">
          <h1
            className={`text-xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}
          >
            {title}
          </h1>
          <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
            {description}
          </p>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="flex items-center gap-2 hover:bg-neutral-800/50"
            style={{ color: 'var(--ash-grey)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
          <div className="h-6 w-px bg-neutral-600" />
          <div>
            <h1
              className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
            >
              {title}
            </h1>
            <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              {description}
            </p>
          </div>
        </div>

        {action && (
          <div className="flex items-center gap-3">
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              className={
                action.className ||
                'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              }
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
