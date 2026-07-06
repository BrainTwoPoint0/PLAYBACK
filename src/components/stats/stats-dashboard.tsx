'use client';

import { useState, useEffect } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Button } from '@braintwopoint0/playback-commons/ui';
import { LumaSpin } from '@braintwopoint0/playback-commons/ui';
import {
  getUserStatistics,
  getPersonalBests,
  deleteStatistic,
  type Statistic,
} from '@/lib/stats/utils';
import {
  BarChart3,
  TrendingUp,
  Star,
  Trophy,
  Calendar,
  Target,
  Trash2,
  Edit3,
  Filter,
  Plus,
} from 'lucide-react';

interface StatsDashboardProps {
  userId: string;
  userSports?: any[];
  onAddStat?: () => void;
}

export function StatsDashboard({
  userId,
  userSports = [],
  onAddStat,
}: StatsDashboardProps) {
  const t = useTranslations('stats.dashboard');
  const format = useFormatter();
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [personalBests, setPersonalBests] = useState<Statistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport_id: '',
    stat_type: '',
    season: '',
  });

  // Load statistics
  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [statsResult, bestsResult] = await Promise.all([
        getUserStatistics(userId, filters),
        getPersonalBests(userId, filters.sport_id || undefined),
      ]);

      if (statsResult.data) {
        setStatistics(statsResult.data);
      }

      if (bestsResult.data) {
        setPersonalBests(bestsResult.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [userId, filters]);

  // Handle delete statistic
  const handleDelete = async (statId: string) => {
    if (!confirm(t('confirmDelete'))) {
      return;
    }

    try {
      const result = await deleteStatistic(statId);
      if (result.success) {
        setStatistics((prev) => prev.filter((s) => s.id !== statId));
        setPersonalBests((prev) => prev.filter((s) => s.id !== statId));
      } else {
        alert(t('deleteFailed'));
      }
    } catch (error) {
      console.error('Failed to delete statistic:', error);
      alert(t('deleteFailed'));
    }
  };

  // Group statistics by type
  const groupedStats = statistics.reduce(
    (acc, stat) => {
      const key = stat.stat_type || 'other';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(stat);
      return acc;
    },
    {} as Record<string, Statistic[]>
  );

  // Calculate summary stats
  const summaryStats = {
    totalStats: statistics.length,
    personalBests: personalBests.length,
    sportsTracked: new Set(statistics.map((s) => s.sport_id).filter(Boolean))
      .size,
    recentStats: statistics.slice(0, 5),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            {t('title')}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--ash-grey)' }}>
            {t('subtitle')}
          </p>
        </div>

        {onAddStat && (
          <Button
            onClick={onAddStat}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
          >
            <Plus className="h-4 w-4 me-2" />
            {t('addStatistic')}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-400/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p
                className="text-lg font-bold"
                style={{ color: 'var(--timberwolf)' }}
              >
                {summaryStats.totalStats}
              </p>
              <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                {t('totalStatistics')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400/10 rounded-lg">
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p
                className="text-lg font-bold"
                style={{ color: 'var(--timberwolf)' }}
              >
                {summaryStats.personalBests}
              </p>
              <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                {t('personalBests')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-400/10 rounded-lg">
              <Trophy className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p
                className="text-lg font-bold"
                style={{ color: 'var(--timberwolf)' }}
              >
                {summaryStats.sportsTracked}
              </p>
              <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                {t('sportsTracked')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-400/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p
                className="text-lg font-bold"
                style={{ color: 'var(--timberwolf)' }}
              >
                {summaryStats.recentStats.length}
              </p>
              <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                {t('recentStats')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={filters.sport_id}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, sport_id: e.target.value }))
          }
          className="px-3 py-2 bg-neutral-800/50 border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ color: 'var(--timberwolf)' }}
        >
          <option value="">{t('allSports')}</option>
          {userSports.map((userSport) => (
            <option key={userSport.sport?.id} value={userSport.sport?.id}>
              {userSport.sport?.name}
            </option>
          ))}
        </select>

        <select
          value={filters.stat_type}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, stat_type: e.target.value }))
          }
          className="px-3 py-2 bg-neutral-800/50 border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ color: 'var(--timberwolf)' }}
        >
          <option value="">{t('allCategories')}</option>
          {Object.keys(groupedStats).map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder={t('seasonPlaceholder')}
          value={filters.season}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, season: e.target.value }))
          }
          className="px-3 py-2 bg-neutral-800/50 border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ color: 'var(--timberwolf)' }}
        />
      </div>

      {/* Personal Bests */}
      {personalBests.length > 0 && (
        <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-400/10 rounded-xl">
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <h3
              className="text-lg font-semibold"
              style={{ color: 'var(--timberwolf)' }}
            >
              {t('personalBests')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalBests.slice(0, 6).map((stat) => (
              <div
                key={stat.id}
                className="bg-gradient-to-br from-yellow-400/5 to-orange-400/5 border border-yellow-400/20 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4
                      className="font-medium"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      {stat.stat_type}
                    </h4>
                    <p className="text-lg font-bold text-yellow-400">
                      {stat.metrics?.value} {stat.metrics?.unit}
                    </p>
                  </div>
                  <Star className="h-4 w-4 text-yellow-400" />
                </div>

                <div
                  className="text-xs space-y-1"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  <p>{format.dateTime(new Date(stat.stat_date), 'short')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics by Category */}
      {Object.keys(groupedStats).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedStats).map(([type, stats]) => (
            <div
              key={type}
              className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6"
            >
              <h3
                className="text-lg font-semibold mb-4 capitalize"
                style={{ color: 'var(--timberwolf)' }}
              >
                {t('categoryStatistics', { type })}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.id}
                    className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-4 hover:border-neutral-600/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4
                          className="font-medium"
                          style={{ color: 'var(--timberwolf)' }}
                        >
                          {stat.stat_type}
                        </h4>
                        <p className="text-lg font-bold text-blue-400">
                          {stat.metrics?.value} {stat.metrics?.unit}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Personal best not supported in current schema */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(stat.id)}
                          className="p-1 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    <div
                      className="text-xs space-y-1"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      <p>
                        {format.dateTime(new Date(stat.stat_date), 'short')}
                      </p>
                      {stat.metrics?.description && (
                        <p className="line-clamp-2 mt-2">
                          {stat.metrics.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="p-4 bg-neutral-800/30 rounded-2xl inline-block mb-4">
            <BarChart3
              className="h-12 w-12"
              style={{ color: 'var(--ash-grey)' }}
            />
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--timberwolf)' }}
          >
            {t('noStatsTitle')}
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--ash-grey)' }}>
            {t('noStatsHint')}
          </p>
          {onAddStat && (
            <Button
              onClick={onAddStat}
              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
            >
              <Plus className="h-4 w-4 me-2" />
              {t('addFirstStatistic')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
