'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
// UserProfile interface - matches the one from auth context
interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  social_links: any;
  is_verified: boolean | null;
  profile_type: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: string | null;
  organization_name: string | null;
  organization_role: string | null;
  user_sports: any[];
}
import {
  Target,
  User,
  MapPin,
  Camera,
  Edit3,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

interface ProfileCompletionProps {
  profile: UserProfile | null;
}

interface CompletionItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  weight: number;
  action: {
    text: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };
}

export function ProfileCompletion({ profile }: ProfileCompletionProps) {
  const completionItems = useMemo((): CompletionItem[] => {
    if (!profile) return [];

    return [
      {
        id: 'basic_info',
        label: 'Basic Information',
        description: 'Add your full name and bio',
        completed: !!(profile.full_name && profile.bio),
        weight: 20,
        action: {
          text: 'Complete Profile',
          href: '/profile/edit',
          icon: User,
        },
      },
      {
        id: 'avatar',
        label: 'Profile Photo',
        description: 'Upload your profile picture',
        completed: !!profile.avatar_url,
        weight: 15,
        action: {
          text: 'Upload Photo',
          href: '/profile/edit',
          icon: Camera,
        },
      },
      {
        id: 'location',
        label: 'Location',
        description: 'Add your city and country',
        completed: !!profile.location,
        weight: 10,
        action: {
          text: 'Add Location',
          href: '/profile/edit',
          icon: MapPin,
        },
      },
      {
        id: 'physical_attributes',
        label: 'Physical Attributes',
        description: 'Add height and weight measurements',
        completed: !!(profile.height_cm || profile.weight_kg),
        weight: 15,
        action: {
          text: 'Add Details',
          href: '/profile/edit?tab=physical',
          icon: Edit3,
        },
      },
      {
        id: 'social_links',
        label: 'Social Media',
        description: 'Connect your social accounts',
        completed: !!(
          profile.social_links &&
          Object.values(profile.social_links).some((link) => link)
        ),
        weight: 15,
        action: {
          text: 'Add Socials',
          href: '/profile/edit?tab=social',
          icon: ArrowRight,
        },
      },
    ];
  }, [profile]);

  const completionData = useMemo(() => {
    const completedItems = completionItems.filter((item) => item.completed);
    const totalWeight = completionItems.reduce(
      (sum, item) => sum + item.weight,
      0
    );
    const completedWeight = completedItems.reduce(
      (sum, item) => sum + item.weight,
      0
    );
    const percentage =
      totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    return {
      percentage,
      completedCount: completedItems.length,
      totalCount: completionItems.length,
      nextAction: completionItems.find((item) => !item.completed),
    };
  }, [completionItems]);

  const getCompletionStatus = (percentage: number) => {
    if (percentage >= 90) return { label: 'Elite', color: 'text-yellow-400' };
    if (percentage >= 70) return { label: 'Strong', color: 'text-green-400' };
    if (percentage >= 50) return { label: 'Good', color: 'text-blue-400' };
    if (percentage >= 30) return { label: 'Basic', color: 'text-orange-400' };
    return { label: 'Getting Started', color: 'text-red-400' };
  };

  const status = getCompletionStatus(completionData.percentage);

  return (
    <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-400/10 rounded-xl">
          <Target className="h-5 w-5 text-green-400" />
        </div>
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--timberwolf)' }}
        >
          Profile Power
        </h3>
      </div>

      <div className="space-y-4">
        {/* Progress Overview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              Completion
            </span>
            <span className={`text-sm font-bold ${status.color}`}>
              {completionData.percentage}%
            </span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionData.percentage}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: 'var(--ash-grey)' }}>
              {completionData.completedCount} of {completionData.totalCount}{' '}
              completed
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full bg-opacity-10 ${status.color}`}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* Next Action Prompt */}
        {completionData.nextAction && completionData.percentage < 100 && (
          <div className="p-4 bg-neutral-800/30 border border-neutral-700/50 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-400/10 rounded-lg mt-0.5">
                <completionData.nextAction.action.icon className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className="text-sm font-medium mb-1"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  {completionData.nextAction.label}
                </h4>
                <p
                  className="text-xs mb-3"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  {completionData.nextAction.description}
                </p>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-xs"
                  onClick={() =>
                    (window.location.href =
                      completionData.nextAction!.action.href)
                  }
                >
                  {completionData.nextAction.action.text}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Perfect Profile Message */}
        {completionData.percentage === 100 && (
          <div className="p-4 bg-gradient-to-r from-green-400/10 to-blue-400/10 border border-green-400/30 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <h4
                  className="text-sm font-medium"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  Perfect Profile! 🎉
                </h4>
                <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                  Your profile is complete and ready to make connections.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        {completionData.percentage < 70 && (
          <div className="text-xs" style={{ color: 'var(--ash-grey)' }}>
            <p>
              💡 Complete your profile to increase visibility and make valuable
              connections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
