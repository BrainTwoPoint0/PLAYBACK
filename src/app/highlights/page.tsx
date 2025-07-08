'use client';

import { useState, useEffect } from 'react';
import { useAuth, useProfile } from '@/lib/auth/context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { EnhancedHighlightForm } from '@/components/highlights/enhanced-highlight-form';
import { HighlightGrid } from '@/components/highlights/highlight-grid';
import { HighlightReelBuilder } from '@/components/highlights/highlight-reel-builder';
import { StatsForm } from '@/components/stats/stats-form';
import { StatsDashboard } from '@/components/stats/stats-dashboard';
import {
  getUserHighlights,
  deleteHighlight,
  type Highlight,
} from '@/lib/highlights/utils';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  ArrowLeft,
  Trophy,
  Film,
  Upload,
  Grid3X3,
  List,
  Filter,
  Search,
  Target,
  Zap,
  Star,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

function HighlightsContent() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [activeTab, setActiveTab] = useState<'highlights' | 'stats' | 'reels'>(
    'highlights'
  );
  const [showStatsForm, setShowStatsForm] = useState(false);
  const [showReelBuilder, setShowReelBuilder] = useState(false);

  // Check URL params for tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'stats') {
      setActiveTab('stats');
    } else if (tab === 'reels') {
      setActiveTab('reels');
    }
  }, [searchParams]);

  // Load highlights
  const loadHighlights = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await getUserHighlights(user.id);
      if (result.data) {
        setHighlights(result.data);
      }
    } catch (error) {
      console.error('Failed to load highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHighlights();
  }, [user]);

  // Handle highlight creation success
  const handleHighlightCreated = (newHighlight: Highlight) => {
    setHighlights((prev) => [newHighlight, ...prev]);
    setShowForm(false);
  };

  // Handle highlight deletion
  const handleDelete = async (highlight: Highlight) => {
    if (!confirm(`Are you sure you want to delete "${highlight.title}"?`)) {
      return;
    }

    try {
      const result = await deleteHighlight(highlight.id);
      if (result.success) {
        setHighlights((prev) => prev.filter((h) => h.id !== highlight.id));
      } else {
        alert('Failed to delete highlight');
      }
    } catch (error) {
      console.error('Failed to delete highlight:', error);
      alert('Failed to delete highlight');
    }
  };

  // Handle highlight sharing
  const handleShare = (highlight: Highlight) => {
    if (navigator.share) {
      navigator.share({
        title: highlight.title,
        text: highlight.description || 'Check out this highlight!',
        url: window.location.origin + `/highlights/${highlight.id}`,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(
        window.location.origin + `/highlights/${highlight.id}`
      );
      alert('Link copied to clipboard!');
    }
  };

  // Filter highlights
  const filteredHighlights = highlights.filter((highlight) => {
    const matchesSearch =
      !searchQuery ||
      highlight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      highlight.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      highlight.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesSport = !filterSport || highlight.sport_id === filterSport;

    return matchesSearch && matchesSport;
  });

  // Get unique sports for filter
  const availableSports = Array.from(
    new Set(highlights.map((h) => h.sport_id).filter(Boolean))
  );

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--night)' }}
      >
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p style={{ color: 'var(--ash-grey)' }}>Loading your highlights...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="flex items-center gap-2 hover:bg-neutral-800/50"
              style={{ color: 'var(--ash-grey)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Highlights
            </Button>
          </div>

          <EnhancedHighlightForm
            userId={user!.id}
            userSports={profile.data?.user_sports || []}
            onSuccess={handleHighlightCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </div>
    );
  }

  if (showStatsForm) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStatsForm(false)}
              className="flex items-center gap-2 hover:bg-neutral-800/50"
              style={{ color: 'var(--ash-grey)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Statistics
            </Button>
          </div>

          <StatsForm
            userId={user!.id}
            userSports={profile.data?.user_sports || []}
            onSuccess={() => {
              setShowStatsForm(false);
              // Could add refresh logic here
            }}
            onCancel={() => setShowStatsForm(false)}
          />
        </div>
      </div>
    );
  }

  if (showReelBuilder) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReelBuilder(false)}
              className="flex items-center gap-2 hover:bg-neutral-800/50"
              style={{ color: 'var(--ash-grey)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Highlight Reels
            </Button>
          </div>

          <HighlightReelBuilder
            userId={user!.id}
            userSports={profile.data?.user_sports || []}
            onSuccess={() => {
              setShowReelBuilder(false);
              // Could add refresh logic here
            }}
            onCancel={() => setShowReelBuilder(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 hover:bg-neutral-800/50"
                style={{ color: 'var(--ash-grey)' }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-neutral-600" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  My Content
                </h1>
                <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                  Manage your highlights and performance statistics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  if (activeTab === 'highlights') {
                    setShowForm(true);
                  } else if (activeTab === 'stats') {
                    setShowStatsForm(true);
                  } else if (activeTab === 'reels') {
                    setShowReelBuilder(true);
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {activeTab === 'highlights' && 'Add Highlight'}
                {activeTab === 'stats' && 'Add Statistic'}
                {activeTab === 'reels' && 'Create Reel'}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6">
            <div className="bg-neutral-800/50 p-1 rounded-lg">
              <Button
                variant={activeTab === 'highlights' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('highlights')}
                className={`
                  ${
                    activeTab === 'highlights'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'hover:bg-neutral-700/50'
                  }
                  transition-all duration-200
                `}
              >
                <Film className="h-4 w-4 mr-2" />
                Highlights
              </Button>
              <Button
                variant={activeTab === 'reels' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('reels')}
                className={`
                  ${
                    activeTab === 'reels'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : 'hover:bg-neutral-700/50'
                  }
                  transition-all duration-200
                `}
              >
                <Film className="h-4 w-4 mr-2" />
                Reels
              </Button>
              <Button
                variant={activeTab === 'stats' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('stats')}
                className={`
                  ${
                    activeTab === 'stats'
                      ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white'
                      : 'hover:bg-neutral-700/50'
                  }
                  transition-all duration-200
                `}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Statistics
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'highlights' ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-400/10 rounded-lg">
                      <Film className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p
                        className="text-lg font-bold"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {highlights.length}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Total Highlights
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-400/10 rounded-lg">
                      <Trophy className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p
                        className="text-lg font-bold"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {highlights.filter((h) => h.is_public).length}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Featured
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-400/10 rounded-lg">
                      <Upload className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p
                        className="text-lg font-bold"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {highlights.filter((h) => h.is_public).length}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Public
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-400/10 rounded-lg">
                      <Trophy className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p
                        className="text-lg font-bold"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {highlights.reduce(
                          (total, h) => total + (h.views || 0),
                          0
                        )}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        Total Views
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex items-center gap-4 mb-6">
                {/* Search */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-3 h-4 w-4"
                      style={{ color: 'var(--ash-grey)' }}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search highlights..."
                      className="w-full pl-10 pr-4 py-2 bg-neutral-800/50 border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{ color: 'var(--timberwolf)' }}
                    />
                  </div>
                </div>

                {/* Sport Filter */}
                <select
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value)}
                  className="px-3 py-2 bg-neutral-800/50 border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ color: 'var(--timberwolf)' }}
                >
                  <option value="">All Sports</option>
                  {availableSports.map((sport) => (
                    <option key={sport} value={sport || ''}>
                      {sport}
                    </option>
                  ))}
                </select>

                {/* View Mode */}
                <div className="flex items-center gap-1 bg-neutral-800/50 border border-neutral-600 rounded-xl p-1">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid')}
                    className="p-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('list')}
                    className="p-2"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Highlights Grid/List */}
              <HighlightGrid
                highlights={filteredHighlights}
                showActions={true}
                columns={viewMode === 'grid' ? 3 : 1}
                onDelete={handleDelete}
                onShare={handleShare}
              />
            </>
          ) : activeTab === 'reels' ? (
            /* Reels Tab */
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="p-4 bg-gradient-to-r from-orange-400/10 to-red-400/10 rounded-2xl inline-block">
                  <Film className="h-16 w-16 text-orange-400" />
                </div>
              </div>
              <h3
                className="text-2xl font-bold mb-4"
                style={{ color: 'var(--timberwolf)' }}
              >
                Create Amazing Highlight Reels
              </h3>
              <p
                className="text-lg mb-6 max-w-2xl mx-auto"
                style={{ color: 'var(--ash-grey)' }}
              >
                Transform your individual highlights into professional
                compilation reels perfect for recruitment, season recaps, or
                social media sharing.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
                <div className="p-4 bg-neutral-800/50 rounded-xl">
                  <div className="p-2 bg-blue-400/10 rounded-lg inline-block mb-2">
                    <Target className="h-6 w-6 text-blue-400" />
                  </div>
                  <h4
                    className="font-semibold mb-1"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    Recruitment
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                    Professional reels for scouts
                  </p>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-xl">
                  <div className="p-2 bg-green-400/10 rounded-lg inline-block mb-2">
                    <Trophy className="h-6 w-6 text-green-400" />
                  </div>
                  <h4
                    className="font-semibold mb-1"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    Season Recap
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                    Showcase your best season
                  </p>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-xl">
                  <div className="p-2 bg-purple-400/10 rounded-lg inline-block mb-2">
                    <Zap className="h-6 w-6 text-purple-400" />
                  </div>
                  <h4
                    className="font-semibold mb-1"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    Skills Focus
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                    Highlight specific abilities
                  </p>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-xl">
                  <div className="p-2 bg-orange-400/10 rounded-lg inline-block mb-2">
                    <Star className="h-6 w-6 text-orange-400" />
                  </div>
                  <h4
                    className="font-semibold mb-1"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    Game Highlights
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                    Best moments from matches
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowReelBuilder(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-lg px-8 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Reel
              </Button>
            </div>
          ) : (
            /* Statistics Tab */
            <StatsDashboard userId={user!.id} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function HighlightsPage() {
  return (
    <ProtectedRoute>
      <HighlightsContent />
    </ProtectedRoute>
  );
}
