'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import {
  Plus,
  X,
  Edit2,
  Trash2,
  TrendingUp,
  BarChart3,
  Target,
  Calendar,
  Clock,
  Trophy,
  Award,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StatEntry {
  id?: string;
  sport_id: string;
  sport_name: string;
  stat_type: string;
  value: number;
  unit: string;
  date: string;
  match_id?: string;
  match_name?: string;
  notes?: string;
  created_at?: string;
}

interface StatType {
  id: string;
  name: string;
  unit: string;
  category: string;
  description: string;
}

const footballStats: StatType[] = [
  {
    id: 'goals',
    name: 'Goals',
    unit: 'goals',
    category: 'Scoring',
    description: 'Goals scored',
  },
  {
    id: 'assists',
    name: 'Assists',
    unit: 'assists',
    category: 'Scoring',
    description: 'Assists provided',
  },
  {
    id: 'passes',
    name: 'Passes',
    unit: 'passes',
    category: 'Passing',
    description: 'Total passes completed',
  },
  {
    id: 'pass_accuracy',
    name: 'Pass Accuracy',
    unit: '%',
    category: 'Passing',
    description: 'Pass completion percentage',
  },
  {
    id: 'tackles',
    name: 'Tackles',
    unit: 'tackles',
    category: 'Defending',
    description: 'Successful tackles',
  },
  {
    id: 'interceptions',
    name: 'Interceptions',
    unit: 'interceptions',
    category: 'Defending',
    description: 'Interceptions made',
  },
  {
    id: 'shots',
    name: 'Shots',
    unit: 'shots',
    category: 'Attacking',
    description: 'Total shots taken',
  },
  {
    id: 'shots_on_target',
    name: 'Shots on Target',
    unit: 'shots',
    category: 'Attacking',
    description: 'Shots on target',
  },
  {
    id: 'dribbles',
    name: 'Dribbles',
    unit: 'dribbles',
    category: 'Attacking',
    description: 'Successful dribbles',
  },
  {
    id: 'crosses',
    name: 'Crosses',
    unit: 'crosses',
    category: 'Attacking',
    description: 'Crosses attempted',
  },
  {
    id: 'minutes_played',
    name: 'Minutes Played',
    unit: 'minutes',
    category: 'General',
    description: 'Minutes played',
  },
  {
    id: 'distance_covered',
    name: 'Distance Covered',
    unit: 'km',
    category: 'General',
    description: 'Distance covered',
  },
];

const basketballStats: StatType[] = [
  {
    id: 'points',
    name: 'Points',
    unit: 'points',
    category: 'Scoring',
    description: 'Points scored',
  },
  {
    id: 'rebounds',
    name: 'Rebounds',
    unit: 'rebounds',
    category: 'General',
    description: 'Total rebounds',
  },
  {
    id: 'assists',
    name: 'Assists',
    unit: 'assists',
    category: 'Playmaking',
    description: 'Assists provided',
  },
  {
    id: 'steals',
    name: 'Steals',
    unit: 'steals',
    category: 'Defense',
    description: 'Steals made',
  },
  {
    id: 'blocks',
    name: 'Blocks',
    unit: 'blocks',
    category: 'Defense',
    description: 'Blocks made',
  },
  {
    id: 'field_goal_percentage',
    name: 'FG%',
    unit: '%',
    category: 'Scoring',
    description: 'Field goal percentage',
  },
  {
    id: 'three_point_percentage',
    name: '3P%',
    unit: '%',
    category: 'Scoring',
    description: 'Three-point percentage',
  },
  {
    id: 'free_throw_percentage',
    name: 'FT%',
    unit: '%',
    category: 'Scoring',
    description: 'Free throw percentage',
  },
  {
    id: 'turnovers',
    name: 'Turnovers',
    unit: 'turnovers',
    category: 'General',
    description: 'Turnovers committed',
  },
  {
    id: 'minutes_played',
    name: 'Minutes Played',
    unit: 'minutes',
    category: 'General',
    description: 'Minutes played',
  },
];

const tennisStats: StatType[] = [
  {
    id: 'aces',
    name: 'Aces',
    unit: 'aces',
    category: 'Serving',
    description: 'Aces served',
  },
  {
    id: 'double_faults',
    name: 'Double Faults',
    unit: 'faults',
    category: 'Serving',
    description: 'Double faults',
  },
  {
    id: 'first_serve_percentage',
    name: '1st Serve %',
    unit: '%',
    category: 'Serving',
    description: 'First serve percentage',
  },
  {
    id: 'break_points_converted',
    name: 'Break Points',
    unit: 'points',
    category: 'Returning',
    description: 'Break points converted',
  },
  {
    id: 'winners',
    name: 'Winners',
    unit: 'winners',
    category: 'General',
    description: 'Winners hit',
  },
  {
    id: 'unforced_errors',
    name: 'Unforced Errors',
    unit: 'errors',
    category: 'General',
    description: 'Unforced errors',
  },
  {
    id: 'net_points_won',
    name: 'Net Points Won',
    unit: 'points',
    category: 'General',
    description: 'Net points won',
  },
];

const getStatsForSport = (sportName: string): StatType[] => {
  switch (sportName.toLowerCase()) {
    case 'football':
    case 'soccer':
      return footballStats;
    case 'basketball':
      return basketballStats;
    case 'tennis':
      return tennisStats;
    default:
      return footballStats; // Default to football stats
  }
};

interface StatsTrackerProps {
  stats: StatEntry[];
  onStatsChange: (stats: StatEntry[]) => void;
  availableSports: any[];
}

export default function StatsTracker({
  stats,
  onStatsChange,
  availableSports,
}: StatsTrackerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newStat, setNewStat] = useState<Partial<StatEntry>>({
    sport_id: '',
    sport_name: '',
    stat_type: '',
    value: 0,
    unit: '',
    date: new Date().toISOString().split('T')[0],
    match_id: '',
    match_name: '',
    notes: '',
  });

  const handleAddStat = () => {
    if (
      !newStat.sport_id ||
      !newStat.stat_type ||
      newStat.value === undefined
    ) {
      return;
    }

    const sport = availableSports.find((s) => s.id === newStat.sport_id);
    if (!sport) return;

    const statTypes = getStatsForSport(sport.name);
    const selectedStatType = statTypes.find(
      (st) => st.id === newStat.stat_type
    );
    if (!selectedStatType) return;

    const statData: StatEntry = {
      sport_id: newStat.sport_id,
      sport_name: sport.name,
      stat_type: newStat.stat_type,
      value: newStat.value,
      unit: selectedStatType.unit,
      date: newStat.date || new Date().toISOString().split('T')[0],
      match_id: newStat.match_id || '',
      match_name: newStat.match_name || '',
      notes: newStat.notes || '',
    };

    onStatsChange([...stats, statData]);

    setNewStat({
      sport_id: '',
      sport_name: '',
      stat_type: '',
      value: 0,
      unit: '',
      date: new Date().toISOString().split('T')[0],
      match_id: '',
      match_name: '',
      notes: '',
    });
    setIsAdding(false);
  };

  const handleUpdateStat = () => {
    if (
      editingIndex === null ||
      !newStat.sport_id ||
      !newStat.stat_type ||
      newStat.value === undefined
    ) {
      return;
    }

    const sport = availableSports.find((s) => s.id === newStat.sport_id);
    if (!sport) return;

    const statTypes = getStatsForSport(sport.name);
    const selectedStatType = statTypes.find(
      (st) => st.id === newStat.stat_type
    );
    if (!selectedStatType) return;

    const updatedStats = [...stats];
    updatedStats[editingIndex] = {
      ...updatedStats[editingIndex],
      sport_id: newStat.sport_id,
      sport_name: sport.name,
      stat_type: newStat.stat_type,
      value: newStat.value,
      unit: selectedStatType.unit,
      date: newStat.date || new Date().toISOString().split('T')[0],
      match_id: newStat.match_id || '',
      match_name: newStat.match_name || '',
      notes: newStat.notes || '',
    };

    onStatsChange(updatedStats);
    setEditingIndex(null);
    setNewStat({
      sport_id: '',
      sport_name: '',
      stat_type: '',
      value: 0,
      unit: '',
      date: new Date().toISOString().split('T')[0],
      match_id: '',
      match_name: '',
      notes: '',
    });
  };

  const handleRemoveStat = (index: number) => {
    onStatsChange(stats.filter((_, i) => i !== index));
  };

  const handleEditStat = (index: number) => {
    const stat = stats[index];
    setNewStat({
      sport_id: stat.sport_id,
      sport_name: stat.sport_name,
      stat_type: stat.stat_type,
      value: stat.value,
      unit: stat.unit,
      date: stat.date,
      match_id: stat.match_id,
      match_name: stat.match_name,
      notes: stat.notes,
    });
    setEditingIndex(index);
  };

  const getStatTypesForSport = () => {
    if (!newStat.sport_id) return [];
    const sport = availableSports.find((s) => s.id === newStat.sport_id);
    if (!sport) return [];
    return getStatsForSport(sport.name);
  };

  const getStatTypeName = (statTypeId: string, sportName: string) => {
    const statTypes = getStatsForSport(sportName);
    const statType = statTypes.find((st) => st.id === statTypeId);
    return statType?.name || statTypeId;
  };

  const getStatTypeCategory = (statTypeId: string, sportName: string) => {
    const statTypes = getStatsForSport(sportName);
    const statType = statTypes.find((st) => st.id === statTypeId);
    return statType?.category || 'General';
  };

  const getStatTypeDescription = (statTypeId: string, sportName: string) => {
    const statTypes = getStatsForSport(sportName);
    const statType = statTypes.find((st) => st.id === statTypeId);
    return statType?.description || '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Scoring: 'bg-red-500/20 text-red-400 border-red-500/30',
      Attacking: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      Defending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Passing: 'bg-green-500/20 text-green-400 border-green-500/30',
      Playmaking: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      Serving: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      Returning: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      General: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[category as keyof typeof colors] || colors.General;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Statistics Tracker</span>
          </span>
          {!isAdding && editingIndex === null && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stat</span>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-[var(--ash-grey)]/5 border border-[var(--timberwolf)] rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-[var(--ash-grey)]" />
                  <span className="text-sm text-[var(--ash-grey)]">
                    {stat.sport_name}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditStat(index)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStat(index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[var(--timberwolf)] text-lg">
                  {stat.value} {stat.unit}
                </h3>
                <p className="text-sm text-[var(--timberwolf)]">
                  {getStatTypeName(stat.stat_type, stat.sport_name)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={`text-xs ${getCategoryColor(getStatTypeCategory(stat.stat_type, stat.sport_name))}`}
                >
                  {getStatTypeCategory(stat.stat_type, stat.sport_name)}
                </Badge>
                <div className="flex items-center space-x-1 text-xs text-[var(--ash-grey)]">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(stat.date)}</span>
                </div>
              </div>

              {stat.match_name && (
                <div className="text-xs text-[var(--ash-grey)]">
                  <span className="font-medium">Match:</span> {stat.match_name}
                </div>
              )}

              {stat.notes && (
                <div className="text-xs text-[var(--ash-grey)]">
                  <span className="font-medium">Notes:</span> {stat.notes}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editingIndex !== null) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border border-[var(--timberwolf)] rounded-lg bg-[var(--ash-grey)]/5 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sport" className="text-[var(--timberwolf)]">
                  Sport
                </Label>
                <Select
                  value={newStat.sport_id}
                  onValueChange={(value) => {
                    setNewStat({ ...newStat, sport_id: value, stat_type: '' });
                  }}
                >
                  <SelectTrigger className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)]">
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[var(--timberwolf)]">
                    {availableSports.map((sport) => (
                      <SelectItem
                        key={sport.id}
                        value={sport.id}
                        className="text-[var(--timberwolf)]"
                      >
                        {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stat_type" className="text-[var(--timberwolf)]">
                  Stat Type
                </Label>
                <Select
                  value={newStat.stat_type}
                  onValueChange={(value) =>
                    setNewStat({ ...newStat, stat_type: value })
                  }
                  disabled={!newStat.sport_id}
                >
                  <SelectTrigger className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)]">
                    <SelectValue placeholder="Select stat type" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[var(--timberwolf)]">
                    {getStatTypesForSport().map((statType) => (
                      <SelectItem
                        key={statType.id}
                        value={statType.id}
                        className="text-[var(--timberwolf)]"
                      >
                        <div className="flex flex-col">
                          <span>{statType.name}</span>
                          <span className="text-xs text-[var(--ash-grey)]">
                            {statType.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="value" className="text-[var(--timberwolf)]">
                  Value
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={newStat.value}
                  onChange={(e) =>
                    setNewStat({
                      ...newStat,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)]"
                />
              </div>

              <div>
                <Label htmlFor="date" className="text-[var(--timberwolf)]">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newStat.date}
                  onChange={(e) =>
                    setNewStat({ ...newStat, date: e.target.value })
                  }
                  className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)]"
                />
              </div>

              <div>
                <Label
                  htmlFor="match_name"
                  className="text-[var(--timberwolf)]"
                >
                  Match Name (optional)
                </Label>
                <Input
                  id="match_name"
                  value={newStat.match_name}
                  onChange={(e) =>
                    setNewStat({ ...newStat, match_name: e.target.value })
                  }
                  placeholder="e.g., vs Team A"
                  className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)]"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-[var(--timberwolf)]">
                  Notes (optional)
                </Label>
                <Input
                  id="notes"
                  value={newStat.notes}
                  onChange={(e) =>
                    setNewStat({ ...newStat, notes: e.target.value })
                  }
                  placeholder="Additional notes"
                  className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={
                  editingIndex !== null ? handleUpdateStat : handleAddStat
                }
                disabled={
                  !newStat.sport_id ||
                  !newStat.stat_type ||
                  newStat.value === undefined
                }
              >
                {editingIndex !== null ? 'Update Stat' : 'Add Stat'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setEditingIndex(null);
                  setNewStat({
                    sport_id: '',
                    sport_name: '',
                    stat_type: '',
                    value: 0,
                    unit: '',
                    date: new Date().toISOString().split('T')[0],
                    match_id: '',
                    match_name: '',
                    notes: '',
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {stats.length === 0 && !isAdding && (
          <div className="text-center py-12 text-[var(--ash-grey)]">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No statistics yet</p>
            <p>
              Start tracking your performance to see your progress over time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
