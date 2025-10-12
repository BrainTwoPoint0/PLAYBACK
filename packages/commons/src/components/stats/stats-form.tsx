'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { LoadingSpinner } from '../ui/loading';
import {
  createStatistic,
  STATISTIC_CATEGORIES,
  type CreateStatisticData,
  type StatisticCategory,
} from '../../lib/stats/utils';
import {
  BarChart3,
  Trophy,
  Star,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
} from 'lucide-react';

interface StatsFormProps {
  userId: string;
  userSports?: any[];
  onSuccess?: (statistic: any) => void;
  onCancel?: () => void;
}

export function StatsForm({
  userId,
  userSports = [],
  onSuccess,
  onCancel,
}: StatsFormProps) {
  const [formData, setFormData] = useState({
    sport_id: '',
    sport_name: '',
    season: new Date().getFullYear().toString(),
    stat_type: '',
    stat_name: '',
    value: '',
    unit: '',
    description: '',
    date_recorded: new Date().toISOString().split('T')[0],
    is_personal_best: false,
  });

  const [availableCategories, setAvailableCategories] = useState<
    StatisticCategory[]
  >([]);
  const [selectedCategory, setSelectedCategory] =
    useState<StatisticCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update available categories when sport changes
  useEffect(() => {
    if (formData.sport_name) {
      const categories = STATISTIC_CATEGORIES[formData.sport_name] || [];
      setAvailableCategories(categories);

      // Reset selections when sport changes
      setSelectedCategory(null);
      setFormData((prev) => ({
        ...prev,
        stat_type: '',
        stat_name: '',
        unit: '',
      }));
    } else {
      setAvailableCategories([]);
      setSelectedCategory(null);
    }
  }, [formData.sport_name]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle sport selection
  const handleSportChange = (sportId: string) => {
    const selectedSport = userSports.find((s) => s.sport?.id === sportId);
    setFormData((prev) => ({
      ...prev,
      sport_id: sportId,
      sport_name: selectedSport?.sport?.name || '',
    }));
  };

  // Handle category selection
  const handleCategoryChange = (categoryType: string) => {
    const category = availableCategories.find((c) => c.type === categoryType);
    setSelectedCategory(category || null);
    setFormData((prev) => ({
      ...prev,
      stat_type: categoryType,
      stat_name: '',
      unit: '',
    }));
  };

  // Handle stat selection
  const handleStatChange = (statName: string) => {
    const stat = selectedCategory?.stats.find((s) => s.name === statName);
    setFormData((prev) => ({
      ...prev,
      stat_name: statName,
      unit: stat?.unit || '',
    }));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.stat_name.trim()) {
      setError('Please select a statistic type');
      return;
    }

    if (!formData.value.trim() || isNaN(Number(formData.value))) {
      setError('Please enter a valid numeric value');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const statisticData: CreateStatisticData = {
        sport_id: formData.sport_id || undefined,
        stat_type: formData.stat_type,
        value: Number(formData.value),
        unit: formData.unit || undefined,
        description: formData.description.trim() || undefined,
        date_recorded: formData.date_recorded,
      };

      const result = await createStatistic(userId, statisticData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        if (onSuccess && result.data) {
          onSuccess(result.data);
        }

        // Reset form
        setFormData({
          sport_id: '',
          sport_name: '',
          season: new Date().getFullYear().toString(),
          stat_type: '',
          stat_name: '',
          value: '',
          unit: '',
          description: '',
          date_recorded: new Date().toISOString().split('T')[0],
          is_personal_best: false,
        });
        setSelectedCategory(null);

        // Hide success message after delay
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to save statistic'
      );
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = formData.stat_name && formData.value && !saving;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-blue-400/10 rounded-xl">
            <BarChart3 className="h-6 w-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            Add Statistic
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          Track your athletic performance and achievements
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl p-6 space-y-6">
          {/* Sport Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="sport"
                className="text-sm font-medium"
                style={{ color: 'var(--ash-grey)' }}
              >
                Sport
              </Label>
              <select
                id="sport"
                value={formData.sport_id}
                onChange={(e) => handleSportChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-neutral-800/50 border border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ color: 'var(--timberwolf)' }}
              >
                <option value="">Select sport</option>
                {userSports.map((userSport) => (
                  <option key={userSport.sport?.id} value={userSport.sport?.id}>
                    {userSport.sport?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label
                htmlFor="season"
                className="text-sm font-medium"
                style={{ color: 'var(--ash-grey)' }}
              >
                Season
              </Label>
              <Input
                id="season"
                type="text"
                value={formData.season}
                onChange={(e) => handleFieldChange('season', e.target.value)}
                className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                style={{ color: 'var(--timberwolf)' }}
                placeholder="2024"
              />
            </div>
          </div>

          {/* Category Selection */}
          {availableCategories.length > 0 && (
            <div>
              <Label
                className="text-sm font-medium"
                style={{ color: 'var(--ash-grey)' }}
              >
                Category
              </Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableCategories.map((category) => (
                  <button
                    key={category.type}
                    type="button"
                    onClick={() => handleCategoryChange(category.type)}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      formData.stat_type === category.type
                        ? 'border-blue-400 bg-blue-400/10'
                        : 'border-neutral-600 hover:border-neutral-500 bg-neutral-800/30'
                    }`}
                  >
                    <h4
                      className="font-medium"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      {category.name}
                    </h4>
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      {category.stats.length} statistics available
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stat Selection */}
          {selectedCategory && (
            <div>
              <Label
                className="text-sm font-medium"
                style={{ color: 'var(--ash-grey)' }}
              >
                Statistic
              </Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {selectedCategory.stats.map((stat) => (
                  <button
                    key={stat.name}
                    type="button"
                    onClick={() => handleStatChange(stat.name)}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      formData.stat_name === stat.name
                        ? 'border-green-400 bg-green-400/10'
                        : 'border-neutral-600 hover:border-neutral-500 bg-neutral-800/30'
                    }`}
                  >
                    <h4
                      className="font-medium"
                      style={{ color: 'var(--timberwolf)' }}
                    >
                      {stat.name} {stat.unit && `(${stat.unit})`}
                    </h4>
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--ash-grey)' }}
                    >
                      {stat.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Value and Date */}
          {formData.stat_name && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="value"
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Value *
                </Label>
                <div className="mt-1 flex">
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => handleFieldChange('value', e.target.value)}
                    className="bg-neutral-800/50 border-neutral-600 rounded-l-xl rounded-r-none"
                    style={{ color: 'var(--timberwolf)' }}
                    placeholder="0"
                    required
                  />
                  {formData.unit && (
                    <div className="px-3 py-2 bg-neutral-700/50 border border-l-0 border-neutral-600 rounded-r-xl flex items-center">
                      <span
                        className="text-sm"
                        style={{ color: 'var(--ash-grey)' }}
                      >
                        {formData.unit}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="date"
                  className="text-sm font-medium"
                  style={{ color: 'var(--ash-grey)' }}
                >
                  Date Recorded
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date_recorded}
                  onChange={(e) =>
                    handleFieldChange('date_recorded', e.target.value)
                  }
                  className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl"
                  style={{ color: 'var(--timberwolf)' }}
                  required
                />
              </div>
            </div>
          )}

          {/* Description */}
          {formData.stat_name && (
            <div>
              <Label
                htmlFor="description"
                className="text-sm font-medium"
                style={{ color: 'var(--ash-grey)' }}
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleFieldChange('description', e.target.value)
                }
                className="mt-1 bg-neutral-800/50 border-neutral-600 rounded-xl resize-none"
                style={{ color: 'var(--timberwolf)' }}
                placeholder="Additional context about this statistic..."
                rows={3}
                maxLength={250}
              />
            </div>
          )}

          {/* Personal Best */}
          {formData.stat_name && (
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_personal_best}
                  onChange={(e) =>
                    handleFieldChange('is_personal_best', e.target.checked)
                  }
                  className="w-4 h-4 text-blue-400 border-neutral-600 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span
                    className="text-sm"
                    style={{ color: 'var(--ash-grey)' }}
                  >
                    This is a personal best
                  </span>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Statistic saved successfully!</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              className="border-neutral-600 hover:bg-neutral-800"
              style={{ color: 'var(--ash-grey)' }}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Statistic
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
