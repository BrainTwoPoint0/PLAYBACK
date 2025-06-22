'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Plus, X, Edit2 } from 'lucide-react';

interface Sport {
  id: string;
  name: string;
  icon: string;
}

interface UserSport {
  sport_id: string;
  sport_name: string;
  role: string;
  experience_level: string;
  years_experience: number;
  is_primary: boolean;
}

interface SportsSelectorProps {
  selectedSports: UserSport[];
  onSportsChange: (sports: UserSport[]) => void;
  availableSports: Sport[];
}

const defaultSports: Sport[] = [
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 'rugby', name: 'Rugby', icon: '🏉' },
  { id: 'cricket', name: 'Cricket', icon: '🏏' },
  { id: 'hockey', name: 'Hockey', icon: '🏑' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'badminton', name: 'Badminton', icon: '🏸' },
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
  { id: 'golf', name: 'Golf', icon: '⛳' },
  { id: 'swimming', name: 'Swimming', icon: '🏊' },
  { id: 'athletics', name: 'Athletics', icon: '🏃' },
  { id: 'boxing', name: 'Boxing', icon: '🥊' },
  { id: 'martial-arts', name: 'Martial Arts', icon: '🥋' },
  { id: 'cycling', name: 'Cycling', icon: '🚴' },
  { id: 'lacrosse', name: 'Lacrosse', icon: '🥍' },
  { id: 'padel', name: 'Padel', icon: '🎾' },
];

const roles = [
  'Player',
  'Coach',
  'Manager',
  'Staff',
  'Referee',
  'Analyst',
  'Physiotherapist',
  'Trainer',
  'Scout',
  'Administrator',
];

const experienceLevels = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Professional',
  'Elite',
];

export default function SportsSelector({
  selectedSports,
  onSportsChange,
  availableSports = defaultSports,
}: SportsSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newSport, setNewSport] = useState<Partial<UserSport>>({
    sport_id: '',
    role: '',
    experience_level: '',
    years_experience: 0,
    is_primary: false,
  });

  const handleAddSport = () => {
    if (!newSport.sport_id || !newSport.role || !newSport.experience_level) {
      return;
    }

    const sport = availableSports.find((s) => s.id === newSport.sport_id);
    if (!sport) return;

    const sportData: UserSport = {
      sport_id: newSport.sport_id,
      sport_name: sport.name,
      role: newSport.role,
      experience_level: newSport.experience_level,
      years_experience: newSport.years_experience || 0,
      is_primary: newSport.is_primary || false,
    };

    // If this is the first sport, make it primary
    if (selectedSports.length === 0) {
      sportData.is_primary = true;
    }

    // If this sport is marked as primary, unmark others
    if (sportData.is_primary) {
      const updatedSports = selectedSports.map((s) => ({
        ...s,
        is_primary: false,
      }));
      onSportsChange([...updatedSports, sportData]);
    } else {
      onSportsChange([...selectedSports, sportData]);
    }

    setNewSport({
      sport_id: '',
      role: '',
      experience_level: '',
      years_experience: 0,
      is_primary: false,
    });
    setIsAdding(false);
  };

  const handleUpdateSport = () => {
    if (
      editingIndex === null ||
      !newSport.sport_id ||
      !newSport.role ||
      !newSport.experience_level
    ) {
      return;
    }

    const sport = availableSports.find((s) => s.id === newSport.sport_id);
    if (!sport) return;

    const updatedSports = [...selectedSports];
    updatedSports[editingIndex] = {
      sport_id: newSport.sport_id,
      sport_name: sport.name,
      role: newSport.role,
      experience_level: newSport.experience_level,
      years_experience: newSport.years_experience || 0,
      is_primary: newSport.is_primary || false,
    };

    // If this sport is marked as primary, unmark others
    if (updatedSports[editingIndex].is_primary) {
      updatedSports.forEach((s, i) => {
        if (i !== editingIndex) s.is_primary = false;
      });
    }

    onSportsChange(updatedSports);
    setEditingIndex(null);
    setNewSport({
      sport_id: '',
      role: '',
      experience_level: '',
      years_experience: 0,
      is_primary: false,
    });
  };

  const handleRemoveSport = (index: number) => {
    const updatedSports = selectedSports.filter((_, i) => i !== index);

    // If we removed the primary sport and there are other sports, make the first one primary
    if (selectedSports[index].is_primary && updatedSports.length > 0) {
      updatedSports[0].is_primary = true;
    }

    onSportsChange(updatedSports);
  };

  const handleEditSport = (index: number) => {
    const sport = selectedSports[index];
    setNewSport({
      sport_id: sport.sport_id,
      role: sport.role,
      experience_level: sport.experience_level,
      years_experience: sport.years_experience,
      is_primary: sport.is_primary,
    });
    setEditingIndex(index);
  };

  const handleSetPrimary = (index: number) => {
    const updatedSports = selectedSports.map((sport, i) => ({
      ...sport,
      is_primary: i === index,
    }));
    onSportsChange(updatedSports);
  };

  const availableSportOptions = availableSports.filter(
    (sport) =>
      !selectedSports.some((selected) => selected.sport_id === sport.id) ||
      editingIndex !== null
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sports & Roles</span>
          {!isAdding && editingIndex === null && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sport</span>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Sports */}
        {selectedSports.map((sport, index) => (
          <div
            key={`${sport.sport_id}-${index}`}
            className="flex items-center justify-between p-4 border border-[var(--timberwolf)] rounded-lg bg-[var(--ash-grey)]/5"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {availableSports.find((s) => s.id === sport.sport_id)?.icon}
              </span>
              <div>
                <div className="font-medium text-[var(--timberwolf)]">
                  {sport.sport_name}
                </div>
                <div className="text-sm text-[var(--ash-grey)]">
                  {sport.role} • {sport.experience_level} •{' '}
                  {sport.years_experience} years
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {sport.is_primary && (
                <Badge variant="default" className="text-xs">
                  Primary
                </Badge>
              )}
              {!sport.is_primary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSetPrimary(index)}
                  className="text-xs"
                >
                  Set Primary
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditSport(index)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSport(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Add/Edit Form */}
        {(isAdding || editingIndex !== null) && (
          <div className="p-4 border border-[var(--timberwolf)] rounded-lg bg-[var(--ash-grey)]/5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sport" className="text-[var(--timberwolf)]">
                  Sport
                </Label>
                <Select
                  value={newSport.sport_id}
                  onValueChange={(value) =>
                    setNewSport({ ...newSport, sport_id: value })
                  }
                >
                  <SelectTrigger className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)]">
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[var(--timberwolf)]">
                    {availableSportOptions.map((sport) => (
                      <SelectItem
                        key={sport.id}
                        value={sport.id}
                        className="text-[var(--timberwolf)]"
                      >
                        <span className="flex items-center space-x-2">
                          <span>{sport.icon}</span>
                          <span>{sport.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role" className="text-[var(--timberwolf)]">
                  Role
                </Label>
                <Select
                  value={newSport.role}
                  onValueChange={(value) =>
                    setNewSport({ ...newSport, role: value })
                  }
                >
                  <SelectTrigger className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)]">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[var(--timberwolf)]">
                    {roles.map((role) => (
                      <SelectItem
                        key={role}
                        value={role}
                        className="text-[var(--timberwolf)]"
                      >
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="experience"
                  className="text-[var(--timberwolf)]"
                >
                  Experience Level
                </Label>
                <Select
                  value={newSport.experience_level}
                  onValueChange={(value) =>
                    setNewSport({ ...newSport, experience_level: value })
                  }
                >
                  <SelectTrigger className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)]">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[var(--timberwolf)]">
                    {experienceLevels.map((level) => (
                      <SelectItem
                        key={level}
                        value={level}
                        className="text-[var(--timberwolf)]"
                      >
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="years" className="text-[var(--timberwolf)]">
                  Years of Experience
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={newSport.years_experience}
                  onChange={(e) =>
                    setNewSport({
                      ...newSport,
                      years_experience: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)]"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-primary"
                checked={newSport.is_primary}
                onChange={(e) =>
                  setNewSport({ ...newSport, is_primary: e.target.checked })
                }
                className="rounded border-[var(--timberwolf)]"
              />
              <Label htmlFor="is-primary" className="text-[var(--timberwolf)]">
                Set as primary sport
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={
                  editingIndex !== null ? handleUpdateSport : handleAddSport
                }
                disabled={
                  !newSport.sport_id ||
                  !newSport.role ||
                  !newSport.experience_level
                }
              >
                {editingIndex !== null ? 'Update Sport' : 'Add Sport'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setEditingIndex(null);
                  setNewSport({
                    sport_id: '',
                    role: '',
                    experience_level: '',
                    years_experience: 0,
                    is_primary: false,
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {selectedSports.length === 0 && !isAdding && (
          <div className="text-center py-8 text-[var(--ash-grey)]">
            <p>
              No sports added yet. Click &ldquo;Add Sport&rdquo; to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
