'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Trophy,
  Search,
  Heart,
  Briefcase,
  Users,
  Shield,
  ChevronRight,
  Check,
  Lock,
} from 'lucide-react';

interface ProfileType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  available: boolean;
  comingSoon?: boolean;
}

const PROFILE_TYPES: ProfileType[] = [
  {
    id: 'player',
    name: 'Player Profile',
    description:
      'Showcase your athletic skills, highlights, and connect with scouts',
    icon: <Trophy className="h-6 w-6 text-yellow-400" />,
    features: [
      'Sports & Position Management',
      'Video Highlights & Reels',
      'Performance Analytics',
      'Scout Connections',
      'Tournament History',
    ],
    available: true,
  },
  {
    id: 'scout',
    name: 'Scout Profile',
    description: 'Discover and evaluate talent, manage your scouting network',
    icon: <Search className="h-6 w-6 text-blue-400" />,
    features: [
      'Player Discovery Tools',
      'Talent Evaluation System',
      'Scouting Reports',
      'Team Management',
      'Analytics Dashboard',
    ],
    available: false,
    comingSoon: true,
  },
  {
    id: 'coach',
    name: 'Coach Profile',
    description: 'Build your coaching portfolio and connect with teams',
    icon: <Users className="h-6 w-6 text-green-400" />,
    features: [
      'Coaching Experience',
      'Team Management',
      'Training Programs',
      'Player Development',
      'Performance Tracking',
    ],
    available: false,
    comingSoon: true,
  },
  {
    id: 'agent',
    name: 'Agent Profile',
    description: 'Represent athletes and manage their career development',
    icon: <Briefcase className="h-6 w-6 text-purple-400" />,
    features: [
      'Client Portfolio',
      'Contract Management',
      'Career Development',
      'Network Building',
      'Deal Analytics',
    ],
    available: false,
    comingSoon: true,
  },
  {
    id: 'fan',
    name: 'Fan Profile',
    description: 'Follow your favorite players and teams, engage with content',
    icon: <Heart className="h-6 w-6 text-red-400" />,
    features: [
      'Follow Players & Teams',
      'Highlight Collections',
      'Community Features',
      'Live Updates',
      'Fan Rewards',
    ],
    available: false,
    comingSoon: true,
  },
  {
    id: 'club_admin',
    name: 'Club Admin',
    description: 'Manage your club, teams, and organizational presence',
    icon: <Shield className="h-6 w-6 text-orange-400" />,
    features: [
      'Club Management',
      'Team Administration',
      'Player Recruitment',
      'Event Management',
      'Club Analytics',
    ],
    available: false,
    comingSoon: true,
  },
];

interface ProfileTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (profileType: string) => void;
}

export function ProfileTypeSelector({
  open,
  onOpenChange,
  onSelectType,
}: ProfileTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelect = (typeId: string) => {
    if (!PROFILE_TYPES.find((t) => t.id === typeId)?.available) return;
    setSelectedType(typeId);
  };

  const handleConfirm = () => {
    if (selectedType) {
      onSelectType(selectedType);
      onOpenChange(false);
      setSelectedType(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--night)', color: 'var(--timberwolf)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--timberwolf)' }}>
            Choose Your Profile Type
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--ash-grey)' }}>
            Select the type of profile that best represents your role in sports.
            You can always change this later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROFILE_TYPES.map((profileType) => (
              <Card
                key={profileType.id}
                className={`cursor-pointer transition-all duration-200 relative ${
                  selectedType === profileType.id
                    ? 'ring-2 ring-green-400 border-green-400/50'
                    : profileType.available
                      ? 'hover:border-green-400/30 border-neutral-600'
                      : 'opacity-60 cursor-not-allowed border-neutral-700'
                }`}
                style={{
                  backgroundColor:
                    selectedType === profileType.id
                      ? 'rgba(74, 222, 128, 0.05)'
                      : 'rgba(185, 186, 163, 0.05)',
                  borderColor:
                    selectedType === profileType.id
                      ? 'rgba(74, 222, 128, 0.3)'
                      : 'rgba(185, 186, 163, 0.2)',
                }}
                onClick={() => handleSelect(profileType.id)}
              >
                {!profileType.available && (
                  <div className="absolute top-2 right-2 z-10">
                    {profileType.comingSoon ? (
                      <Badge
                        variant="outline"
                        className="bg-orange-400/10 text-orange-400 border-orange-400/30 text-xs"
                      >
                        Coming Soon
                      </Badge>
                    ) : (
                      <Lock className="h-4 w-4 text-neutral-500" />
                    )}
                  </div>
                )}

                {selectedType === profileType.id && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-neutral-800/30 rounded-xl">
                      {profileType.icon}
                    </div>
                    <div>
                      <CardTitle
                        className="text-lg"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {profileType.name}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription style={{ color: 'var(--ash-grey)' }}>
                    {profileType.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <p
                      className="text-xs font-medium"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      Key Features:
                    </p>
                    <ul className="space-y-1">
                      {profileType.features.slice(0, 3).map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-sm flex items-center gap-2"
                          style={{ color: 'var(--ash-grey)' }}
                        >
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></span>
                          {feature}
                        </li>
                      ))}
                      {profileType.features.length > 3 && (
                        <li
                          className="text-xs"
                          style={{ color: 'var(--ash-grey)', opacity: 0.7 }}
                        >
                          +{profileType.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedType}
            className="bg-green-600 hover:bg-green-700"
          >
            Create{' '}
            {selectedType
              ? PROFILE_TYPES.find((t) => t.id === selectedType)?.name
              : 'Profile'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
