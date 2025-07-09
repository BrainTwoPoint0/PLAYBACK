'use client';

import { useState, useEffect } from 'react';
import { useAuth, useProfile } from '@/lib/auth/context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SimpleHighlightForm } from '@/components/highlights/simple-highlight-form';
import { HighlightGrid } from '@/components/highlights/highlight-grid';
import {
  getUserHighlights,
  deleteHighlight,
  type Highlight,
} from '@/lib/highlights/utils';
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
} from 'lucide-react';
import { ProfileHeader } from '@/components/profile/profile-header';
import { useRouter } from 'next/navigation';

function HighlightsContent() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState('');

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

          <SimpleHighlightForm
            userId={user!.id}
            userSports={profile.data?.user_sports || []}
            onSuccess={handleHighlightCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--night)' }}>
      <div className="container mx-auto px-4 py-8">
        <ProfileHeader
          title="My Highlights"
          description="Manage and showcase your athletic highlights"
          backTo="/dashboard"
          backLabel="Back to Dashboard"
          gradient="from-purple-400 to-pink-400"
          action={{
            label: 'Add Highlight',
            onClick: () => setShowForm(true),
            className:
              'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white',
          }}
          mobileActionLabel="Add"
        />

        {/* Highlights Content */}
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
                <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
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
                <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
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
                <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
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
                  {highlights.reduce((total, h) => total + (h.views || 0), 0)}
                </p>
                <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
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
          <Select
            value={filterSport || 'all'}
            onValueChange={(value) =>
              setFilterSport(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Sports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {availableSports.map((sport) => (
                <SelectItem key={sport} value={sport || 'unknown'}>
                  {sport}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
