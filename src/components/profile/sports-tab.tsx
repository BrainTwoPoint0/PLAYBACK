'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Trophy,
  Plus,
  Edit3,
  Trash2,
  Search,
  Footprints,
  Hand,
  User,
  Target,
  Star,
  Filter,
  X,
  CheckCircle,
  Check,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface SportSelection {
  sport_id: string; // Changed from number to string for UUID
  sport_name: string;
  role: 'player' | 'coach' | 'scout' | 'fan';
  positions: string[];
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
}

interface SportData {
  id: string;
  name: string;
  description: string | null;
  sport_category: string | null;
  common_positions: string[] | null;
}

interface SportsTabProps {
  profile: any;
  onUpdate: (updates: any) => void;
  onMarkChanged: () => void;
  fixedRole?: 'player' | 'coach' | 'scout' | 'fan';
}

const FOOT_SPORTS = ['Football', 'Soccer', 'American Football'];
const HAND_SPORTS = [
  'Tennis',
  'Padel',
  'Boxing',
  'Baseball',
  'Basketball',
  'Volleyball',
  'Table Tennis',
];

function SportCard({
  sport,
  onEdit,
  onRemove,
}: {
  sport: SportSelection;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'player':
        return 'bg-green-400/10 text-green-400 border-green-400/30';
      case 'coach':
        return 'bg-blue-400/10 text-blue-400 border-blue-400/30';
      case 'scout':
        return 'bg-purple-400/10 text-purple-400 border-purple-400/30';
      case 'fan':
        return 'bg-orange-400/10 text-orange-400 border-orange-400/30';
      default:
        return 'bg-neutral-400/10 text-neutral-400 border-neutral-400/30';
    }
  };

  return (
    <Card
      className="bg-neutral-800/50 border-neutral-700 overflow-hidden"
      style={{
        backgroundColor: 'rgba(185, 186, 163, 0.05)',
        borderColor: 'rgba(185, 186, 163, 0.2)',
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <CardTitle
                className="text-lg"
                style={{ color: 'var(--timberwolf)' }}
              >
                {sport.sport_name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`capitalize text-xs ${getRoleBadgeColor(sport.role)}`}
              >
                {sport.role}
              </Badge>
              <Badge
                variant="outline"
                className="capitalize text-xs bg-neutral-400/10 text-neutral-400 border-neutral-400/30"
              >
                {sport.experience_level}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 hover:opacity-80"
              style={{ color: 'var(--ash-grey)' }}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-neutral-400 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Positions Section - Similar to Veo */}
      {sport.positions.length > 0 && sport.role === 'player' && (
        <CardContent className="pt-0 pb-4">
          <div className="space-y-2">
            <p
              className="text-xs font-medium"
              style={{ color: 'var(--ash-grey)' }}
            >
              Positions
            </p>
            <div className="flex flex-wrap gap-2">
              {sport.positions.map((position, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full border border-green-400/20"
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--timberwolf)' }}
                  >
                    {position}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function AddSportDialog({
  open,
  onOpenChange,
  allSports,
  userSports,
  onAddSport,
  fixedRole,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allSports: SportData[];
  userSports: SportSelection[];
  onAddSport: (sport: SportSelection) => void;
  fixedRole?: 'player' | 'coach' | 'scout' | 'fan';
}) {
  const [selectedSport, setSelectedSport] = useState<SportData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    role: (fixedRole || 'player') as SportSelection['role'],
    positions: [] as string[],
    experience_level: 'beginner' as SportSelection['experience_level'],
  });

  const userSportIds = userSports.map((s) => s.sport_id);
  const availableSports = allSports.filter(
    (sport) => !userSportIds.includes(sport.id)
  );

  const categories = [
    'all',
    ...new Set(
      availableSports
        .map((s) => s.sport_category)
        .filter((cat): cat is string => Boolean(cat))
    ),
  ];

  const filteredSports = availableSports.filter((sport) => {
    const matchesSearch = sport.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || sport.sport_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddSport = () => {
    if (!selectedSport) return;

    const newSport: SportSelection = {
      sport_id: selectedSport.id, // Keep as string UUID, don't parseInt
      sport_name: selectedSport.name,
      role: formData.role,
      positions:
        formData.role === 'player' && selectedSport.sport_category === 'team'
          ? formData.positions
          : [],
      experience_level: formData.experience_level,
    };

    onAddSport(newSport);
    onOpenChange(false);

    // Reset form
    setSelectedSport(null);
    setFormData({
      role: 'player',
      positions: [],
      experience_level: 'beginner',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--night)', color: 'var(--timberwolf)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--timberwolf)' }}>
            Add Sport to Your Profile
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--ash-grey)' }}>
            Select a sport and provide your details
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {!selectedSport ? (
            <>
              {/* Search and Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search sports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-neutral-400" />
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === 'all'
                            ? 'All Categories'
                            : category.charAt(0).toUpperCase() +
                              category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSports.length === 0 ? (
                  <div className="col-span-2 text-center py-12">
                    <Trophy className="h-12 w-12 mx-auto mb-3 text-neutral-600" />
                    <p style={{ color: 'var(--ash-grey)' }}>
                      {searchQuery || selectedCategory !== 'all'
                        ? 'No sports found matching your criteria'
                        : 'You have added all available sports!'}
                    </p>
                  </div>
                ) : (
                  filteredSports.map((sport) => (
                    <Card
                      key={sport.id}
                      className="cursor-pointer transition-all hover:border-green-400/50"
                      style={{
                        backgroundColor: 'rgba(185, 186, 163, 0.05)',
                        borderColor: 'rgba(185, 186, 163, 0.2)',
                      }}
                      onClick={() => setSelectedSport(sport)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle
                              className="text-base"
                              style={{ color: 'var(--timberwolf)' }}
                            >
                              {sport.name}
                            </CardTitle>
                            {sport.description && (
                              <CardDescription className="text-xs mt-1">
                                {sport.description}
                              </CardDescription>
                            )}
                          </div>
                          {sport.sport_category && (
                            <Badge variant="outline" className="text-xs">
                              {sport.sport_category}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Selected Sport Details */}
              <div className="space-y-4">
                <Card
                  className="border-green-400/50"
                  style={{ backgroundColor: 'rgba(185, 186, 163, 0.05)' }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-400" />
                          {selectedSport.name}
                        </CardTitle>
                        {selectedSport.description && (
                          <CardDescription>
                            {selectedSport.description}
                          </CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSport(null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Change
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Role - only show if not fixed */}
                  {!fixedRole && (
                    <div className="space-y-2">
                      <Label>Your Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            role: value as SportSelection['role'],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="player">Player</SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="scout">Scout</SelectItem>
                          <SelectItem value="fan">Fan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Positions (team sports + player role only) */}
                  {selectedSport.sport_category === 'team' &&
                    formData.role === 'player' &&
                    selectedSport.common_positions && (
                      <div className="space-y-2">
                        <Label>Positions (select all that apply)</Label>
                        <div
                          className="grid grid-cols-2 gap-3 p-4 rounded-lg border"
                          style={{
                            borderColor: 'rgba(185, 186, 163, 0.2)',
                            backgroundColor: 'rgba(185, 186, 163, 0.02)',
                          }}
                        >
                          {selectedSport.common_positions.map((position) => (
                            <div
                              key={position}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`pos-${position}`}
                                checked={formData.positions.includes(position)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      positions: [
                                        ...formData.positions,
                                        position,
                                      ],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      positions: formData.positions.filter(
                                        (p) => p !== position
                                      ),
                                    });
                                  }
                                }}
                                className="border-neutral-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                              />
                              <label
                                htmlFor={`pos-${position}`}
                                className="text-sm cursor-pointer"
                                style={{ color: 'var(--timberwolf)' }}
                              >
                                {position}
                              </label>
                            </div>
                          ))}
                        </div>
                        {formData.positions.length > 0 && (
                          <p
                            className="text-xs"
                            style={{ color: 'var(--ash-grey)' }}
                          >
                            {formData.positions.length} position
                            {formData.positions.length !== 1 ? 's' : ''}{' '}
                            selected
                          </p>
                        )}
                      </div>
                    )}

                  {/* Experience Level */}
                  <div className="space-y-2">
                    <Label>Experience Level</Label>
                    <Select
                      value={formData.experience_level}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          experience_level:
                            value as SportSelection['experience_level'],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="professional">
                          Professional
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {selectedSport && (
            <Button
              onClick={handleAddSport}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Add Sport
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditSportDialog({
  open,
  onOpenChange,
  sport,
  sportData,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sport: SportSelection;
  sportData: SportData;
  onSave: (updates: Partial<SportSelection>) => void;
}) {
  const [formData, setFormData] = useState({
    role: sport.role,
    positions: sport.positions || [],
    experience_level: sport.experience_level,
  });

  const handleSave = () => {
    onSave({
      role: formData.role,
      positions:
        formData.role === 'player' && sportData.sport_category === 'team'
          ? formData.positions
          : [],
      experience_level: formData.experience_level,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ backgroundColor: 'var(--night)', color: 'var(--timberwolf)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--timberwolf)' }}>
            Edit {sportData.name}
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--ash-grey)' }}>
            Update your details for this sport
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role */}
          <div className="space-y-2">
            <Label>Your Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  role: value as SportSelection['role'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="player">Player</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
                <SelectItem value="scout">Scout</SelectItem>
                <SelectItem value="fan">Fan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Positions */}
          {sportData.sport_category === 'team' &&
            formData.role === 'player' &&
            sportData.common_positions && (
              <div className="space-y-2">
                <Label>Positions (select all that apply)</Label>
                <div
                  className="grid grid-cols-2 gap-3 p-4 rounded-lg border"
                  style={{
                    borderColor: 'rgba(185, 186, 163, 0.2)',
                    backgroundColor: 'rgba(185, 186, 163, 0.02)',
                  }}
                >
                  {sportData.common_positions.map((position) => (
                    <div key={position} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-pos-${position}`}
                        checked={formData.positions.includes(position)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              positions: [...formData.positions, position],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              positions: formData.positions.filter(
                                (p) => p !== position
                              ),
                            });
                          }
                        }}
                        className="border-neutral-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor={`edit-pos-${position}`}
                        className="text-sm cursor-pointer"
                        style={{ color: 'var(--timberwolf)' }}
                      >
                        {position}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.positions.length > 0 && (
                  <p className="text-xs" style={{ color: 'var(--ash-grey)' }}>
                    {formData.positions.length} position
                    {formData.positions.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

          {/* Experience Level */}
          <div className="space-y-2">
            <Label>Experience Level</Label>
            <Select
              value={formData.experience_level}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  experience_level: value as SportSelection['experience_level'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SportsTab({
  profile,
  onUpdate,
  onMarkChanged,
  fixedRole,
}: SportsTabProps) {
  const [userSports, setUserSports] = useState<SportSelection[]>([]);
  const [allSports, setAllSports] = useState<SportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSportIndex, setEditingSportIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    loadUserSports();
    loadAllSports();
  }, [profile]);

  const loadUserSports = async () => {
    try {
      const sports = profile?.user_sports || [];
      setUserSports(
        sports.map((sport: any) => ({
          sport_id: sport.sport_id || sport.sport?.id,
          sport_name: sport.sport?.name || 'Unknown Sport',
          role: sport.role || 'player',
          positions: sport.positions || [],
          experience_level: sport.experience_level || 'beginner',
        }))
      );
    } catch (error) {
      console.error('Failed to load user sports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllSports = async () => {
    try {
      const response = await fetch('/api/sports');
      if (response.ok) {
        const data = await response.json();
        setAllSports(data.sports || []);
      }
    } catch (error) {
      console.error('Failed to load sports:', error);
    }
  };

  const handleAddSport = (newSport: SportSelection) => {
    const updatedSports = [...userSports, newSport];
    setUserSports(updatedSports);
    onUpdate({ user_sports: updatedSports });
    onMarkChanged();
  };

  const handleUpdateSport = (
    index: number,
    updates: Partial<SportSelection>
  ) => {
    const updatedSports = userSports.map((sport, i) =>
      i === index ? { ...sport, ...updates } : sport
    );
    setUserSports(updatedSports);
    onUpdate({ user_sports: updatedSports });
    onMarkChanged();
  };

  const handleRemoveSport = (index: number) => {
    const updatedSports = userSports.filter((_, i) => i !== index);
    setUserSports(updatedSports);
    onUpdate({ user_sports: updatedSports });
    onMarkChanged();
  };

  const getSportData = (sportId: string): SportData | undefined => {
    return allSports.find((s) => s.id === sportId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const editingSport =
    editingSportIndex !== null ? userSports[editingSportIndex] : null;
  const editingSportData = editingSport
    ? getSportData(editingSport.sport_id)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-yellow-400/10 rounded-xl">
            <Trophy className="h-6 w-6 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Sports & Athletic Profile
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
          Build your comprehensive athletic profile with sports, positions, and
          experience levels
        </p>
      </div>

      {/* Add Sport Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--timberwolf)' }}
          >
            Your Sports
          </h3>
          <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
            {userSports.length} sport{userSports.length !== 1 ? 's' : ''} added
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Sport
        </Button>
      </div>

      {/* Sports Grid */}
      {userSports.length === 0 ? (
        <Card
          className="text-center py-12"
          style={{
            backgroundColor: 'rgba(185, 186, 163, 0.05)',
            borderColor: 'rgba(185, 186, 163, 0.2)',
          }}
        >
          <CardContent>
            <Trophy
              className="h-16 w-16 mx-auto mb-4"
              style={{ color: 'var(--ash-grey)', opacity: 0.5 }}
            />
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: 'var(--timberwolf)' }}
            >
              No Sports Added Yet
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--ash-grey)' }}>
              Add your first sport to start building your athletic profile
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Sport
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userSports.map((sport, index) => (
            <SportCard
              key={index}
              sport={sport}
              onEdit={() => setEditingSportIndex(index)}
              onRemove={() => handleRemoveSport(index)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddSportDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        allSports={allSports}
        userSports={userSports}
        onAddSport={handleAddSport}
        fixedRole={fixedRole}
      />

      {editingSport && editingSportData && (
        <EditSportDialog
          open={editingSportIndex !== null}
          onOpenChange={(open) => !open && setEditingSportIndex(null)}
          sport={editingSport}
          sportData={editingSportData}
          onSave={(updates) => handleUpdateSport(editingSportIndex!, updates)}
        />
      )}
    </div>
  );
}
