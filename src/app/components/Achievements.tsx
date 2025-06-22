'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Trophy,
  Award,
  Star,
  Target,
  TrendingUp,
  Calendar,
  Users,
  Zap,
  Crown,
  Medal,
  Lock,
  Unlock,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_unlocked: boolean;
  progress: number;
  max_progress: number;
  unlocked_at?: string;
  points: number;
  sport_id?: string;
  sport_name?: string;
}

const achievementCategories = [
  'Scoring',
  'Performance',
  'Social',
  'Milestone',
  'Special',
  'Seasonal',
];

const rarityColors = {
  common: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const rarityIcons = {
  common: Star,
  rare: Award,
  epic: Trophy,
  legendary: Crown,
};

const categoryIcons = {
  Scoring: Target,
  Performance: TrendingUp,
  Social: Users,
  Milestone: Calendar,
  Special: Zap,
  Seasonal: Medal,
};

interface AchievementsProps {
  achievements: Achievement[];
  onAchievementsChange: (achievements: Achievement[]) => void;
  availableSports: any[];
}

export default function Achievements({
  achievements,
  onAchievementsChange,
  availableSports,
}: AchievementsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  const filteredAchievements = achievements.filter((achievement) => {
    const categoryMatch =
      selectedCategory === 'all' || achievement.category === selectedCategory;
    const rarityMatch =
      selectedRarity === 'all' || achievement.rarity === selectedRarity;
    return categoryMatch && rarityMatch;
  });

  const unlockedCount = achievements.filter((a) => a.is_unlocked).length;
  const totalCount = achievements.length;
  const totalPoints = achievements
    .filter((a) => a.is_unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  const getRarityIcon = (rarity: string) => {
    const IconComponent =
      rarityIcons[rarity as keyof typeof rarityIcons] || Star;
    return <IconComponent className="w-4 h-4" />;
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent =
      categoryIcons[category as keyof typeof categoryIcons] || Target;
    return <IconComponent className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressPercentage = (achievement: Achievement) => {
    return Math.min(
      (achievement.progress / achievement.max_progress) * 100,
      100
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Achievements</span>
          </span>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-[var(--timberwolf)]">
                {unlockedCount}/{totalCount}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-[var(--timberwolf)]">
                {totalPoints} pts
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--ash-grey)]/5 border border-[var(--timberwolf)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--timberwolf)]">
              {unlockedCount}
            </div>
            <div className="text-sm text-[var(--ash-grey)]">
              Achievements Unlocked
            </div>
          </div>
          <div className="bg-[var(--ash-grey)]/5 border border-[var(--timberwolf)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--timberwolf)]">
              {totalPoints}
            </div>
            <div className="text-sm text-[var(--ash-grey)]">Total Points</div>
          </div>
          <div className="bg-[var(--ash-grey)]/5 border border-[var(--timberwolf)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--timberwolf)]">
              {totalCount > 0
                ? Math.round((unlockedCount / totalCount) * 100)
                : 0}
              %
            </div>
            <div className="text-sm text-[var(--ash-grey)]">
              Completion Rate
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </Button>
          {achievementCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex items-center space-x-1"
            >
              {getCategoryIcon(category)}
              <span>{category}</span>
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedRarity === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRarity('all')}
          >
            All Rarities
          </Button>
          {Object.keys(rarityIcons).map((rarity) => (
            <Button
              key={rarity}
              variant={selectedRarity === rarity ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRarity(rarity)}
              className="flex items-center space-x-1 capitalize"
            >
              {getRarityIcon(rarity)}
              <span>{rarity}</span>
            </Button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`relative bg-[var(--ash-grey)]/5 border rounded-lg p-4 space-y-3 ${
                achievement.is_unlocked
                  ? 'border-[var(--timberwolf)]'
                  : 'border-[var(--ash-grey)]/30 opacity-60'
              }`}
            >
              {/* Lock/Unlock Icon */}
              <div className="absolute top-3 right-3">
                {achievement.is_unlocked ? (
                  <Unlock className="w-4 h-4 text-green-400" />
                ) : (
                  <Lock className="w-4 h-4 text-[var(--ash-grey)]" />
                )}
              </div>

              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-2 rounded-lg ${
                      achievement.is_unlocked
                        ? 'bg-[var(--timberwolf)]/10'
                        : 'bg-[var(--ash-grey)]/10'
                    }`}
                  >
                    {getCategoryIcon(achievement.category)}
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${
                        achievement.is_unlocked
                          ? 'text-[var(--timberwolf)]'
                          : 'text-[var(--ash-grey)]'
                      }`}
                    >
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-[var(--ash-grey)]">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ash-grey)]">Progress</span>
                  <span className="text-[var(--timberwolf)]">
                    {achievement.progress}/{achievement.max_progress}
                  </span>
                </div>
                <Progress
                  value={getProgressPercentage(achievement)}
                  className="h-2"
                />
              </div>

              {/* Badges and Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${rarityColors[achievement.rarity]}`}
                  >
                    <div className="flex items-center space-x-1">
                      {getRarityIcon(achievement.rarity)}
                      <span className="capitalize">{achievement.rarity}</span>
                    </div>
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {achievement.points} pts
                  </Badge>
                </div>
                {achievement.sport_name && (
                  <Badge variant="outline" className="text-xs">
                    {achievement.sport_name}
                  </Badge>
                )}
              </div>

              {/* Unlock Date */}
              {achievement.is_unlocked && achievement.unlocked_at && (
                <div className="flex items-center space-x-1 text-xs text-[var(--ash-grey)]">
                  <Calendar className="w-3 h-3" />
                  <span>Unlocked {formatDate(achievement.unlocked_at)}</span>
                </div>
              )}

              {/* Locked Message */}
              {!achievement.is_unlocked && (
                <div className="text-xs text-[var(--ash-grey)] text-center py-2">
                  Keep playing to unlock this achievement!
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12 text-[var(--ash-grey)]">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No achievements found</p>
            <p>
              Try adjusting your filters or keep playing to earn more
              achievements
            </p>
          </div>
        )}

        {/* Recent Unlocks */}
        {achievements.filter((a) => a.is_unlocked).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--timberwolf)] flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Recently Unlocked</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {achievements
                .filter((a) => a.is_unlocked)
                .sort(
                  (a, b) =>
                    new Date(b.unlocked_at || '').getTime() -
                    new Date(a.unlocked_at || '').getTime()
                )
                .slice(0, 4)
                .map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-[var(--timberwolf)]">
                        {achievement.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getRarityIcon(achievement.rarity)}
                      <span className="text-xs text-[var(--ash-grey)] capitalize">
                        {achievement.rarity}
                      </span>
                    </div>
                    {achievement.unlocked_at && (
                      <div className="text-xs text-[var(--ash-grey)]">
                        {formatDate(achievement.unlocked_at)}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
