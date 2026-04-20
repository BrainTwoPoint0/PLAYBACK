'use client';

import { useState } from 'react';
import { Button } from '@braintwopoint0/playback-commons/ui';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  updateBaseProfile,
  updateFootballProfile,
} from '@/lib/profile/actions';
import {
  FOOTBALL_POSITIONS,
  FOOTBALL_POSITION_LABELS,
  FOOTBALL_EXPERIENCE_LEVELS,
  FOOTBALL_EXPERIENCE_LABELS,
  PREFERRED_FOOT_OPTIONS,
} from '@/lib/profile/constants';
import { Edit3, Save, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countries } from 'country-data-list';
import { CircleFlag } from 'react-circle-flags';

// Filtered & sorted country list for the nationality selector
const COUNTRY_OPTIONS = countries.all
  .filter(
    (c: { alpha2: string; emoji?: string; status: string; name: string }) =>
      c.emoji && c.status !== 'deleted' && c.name
  )
  .sort((a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name)
  ) as Array<{ alpha2: string; name: string }>;

// Lookup map: alpha2 → country name
const ALPHA2_TO_NAME: Record<string, string> = {};
for (const c of COUNTRY_OPTIONS) {
  ALPHA2_TO_NAME[c.alpha2] = c.name;
}

export function getCountryName(alpha2: string | null): string | null {
  if (!alpha2) return null;
  return ALPHA2_TO_NAME[alpha2.toUpperCase()] || alpha2;
}

interface ProfileData {
  full_name: string | null;
  bio: string | null;
  social_links: Record<string, string> | null;
  height_cm: number | null;
  weight_kg: number | null;
  date_of_birth: string | null;
  location: string | null;
  nationality: string | null;
}

interface FootballData {
  experience_level: string;
  preferred_foot: string | null;
  primary_position: string | null;
  secondary_positions: string[] | null;
  preferred_jersey_number: number | null;
}

interface ProfileEditFormProps {
  profileData: ProfileData;
  footballData: FootballData;
  onSaved: () => void;
}

type EditSection = 'personal' | 'about' | 'physical' | 'football' | null;

export function ProfileEditForm({
  profileData,
  footballData,
  onSaved,
}: ProfileEditFormProps) {
  const [editSection, setEditSection] = useState<EditSection>(null);

  return (
    <>
      {/* Editable sections list */}
      <div className="space-y-3">
        <EditableSection
          title="Personal"
          description={
            [
              profileData.full_name || null,
              getCountryName(profileData.nationality) || null,
            ]
              .filter(Boolean)
              .join(' • ') || 'Add name, nationality'
          }
          onEdit={() => setEditSection('personal')}
        />
        <EditableSection
          title="About"
          description={profileData.bio || 'Add a bio'}
          onEdit={() => setEditSection('about')}
        />
        <EditableSection
          title="Physical Info"
          description={
            [
              profileData.height_cm ? `${profileData.height_cm}cm` : null,
              profileData.weight_kg ? `${profileData.weight_kg}kg` : null,
              profileData.date_of_birth || null,
            ]
              .filter(Boolean)
              .join(' • ') || 'Add height, weight, date of birth'
          }
          onEdit={() => setEditSection('physical')}
        />
        <EditableSection
          title="Football Details"
          description={
            [
              footballData.primary_position,
              footballData.preferred_foot,
              footballData.experience_level?.replace(/_/g, ' '),
            ]
              .filter(Boolean)
              .join(' • ') || 'Edit football details'
          }
          onEdit={() => setEditSection('football')}
        />
      </div>

      {/* Edit dialogs */}
      <Dialog
        open={editSection === 'personal'}
        onOpenChange={(open) => !open && setEditSection(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Personal Info</DialogTitle>
          </DialogHeader>
          <PersonalEditor
            initial={profileData}
            onSave={() => {
              setEditSection(null);
              onSaved();
            }}
            onCancel={() => setEditSection(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editSection === 'about'}
        onOpenChange={(open) => !open && setEditSection(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit About</DialogTitle>
          </DialogHeader>
          <AboutEditor
            initial={profileData}
            onSave={() => {
              setEditSection(null);
              onSaved();
            }}
            onCancel={() => setEditSection(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editSection === 'physical'}
        onOpenChange={(open) => !open && setEditSection(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Physical Info</DialogTitle>
          </DialogHeader>
          <PhysicalEditor
            initial={profileData}
            onSave={() => {
              setEditSection(null);
              onSaved();
            }}
            onCancel={() => setEditSection(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editSection === 'football'}
        onOpenChange={(open) => !open && setEditSection(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Football Details</DialogTitle>
          </DialogHeader>
          <FootballEditor
            initial={footballData}
            onSave={() => {
              setEditSection(null);
              onSaved();
            }}
            onCancel={() => setEditSection(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Sub-editors ---

function EditableSection({
  title,
  description,
  onEdit,
}: {
  title: string;
  description: string;
  onEdit: () => void;
}) {
  return (
    <button
      onClick={onEdit}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/30 hover:border-neutral-600 transition-colors text-left group"
    >
      <div className="min-w-0">
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--timberwolf)' }}
        >
          {title}
        </p>
        <p
          className="text-xs truncate mt-0.5"
          style={{ color: 'var(--ash-grey)' }}
        >
          {description}
        </p>
      </div>
      <Edit3 className="h-4 w-4 flex-shrink-0 ml-3 text-neutral-600 group-hover:text-green-400 transition-colors" />
    </button>
  );
}

function PersonalEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: ProfileData;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(initial.full_name || '');
  const [nationality, setNationality] = useState(initial.nationality || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await updateBaseProfile({
      full_name: fullName.trim() || null,
      nationality: nationality.trim() || null,
    });

    setSaving(false);
    if (result.success) {
      onSave();
    } else {
      setError(result.error || 'Failed to save');
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-2">
        <Label>Full Name</Label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={100}
          className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
          placeholder="Your full name"
        />
      </div>
      <div className="space-y-2">
        <Label>Nationality</Label>
        <NationalitySelector value={nationality} onChange={setNationality} />
      </div>
      <EditorFooter saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

function AboutEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: ProfileData;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [bio, setBio] = useState(initial.bio || '');
  const [instagram, setInstagram] = useState(
    initial.social_links?.instagram || ''
  );
  const [twitter, setTwitter] = useState(initial.social_links?.twitter || '');
  const [linkedin, setLinkedin] = useState(
    initial.social_links?.linkedin || ''
  );
  const [location, setLocation] = useState(initial.location || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await updateBaseProfile({
      bio: bio || null,
      location: location || null,
      social_links: {
        instagram: instagram || '',
        twitter: twitter || '',
        linkedin: linkedin || '',
      },
    });

    setSaving(false);
    if (result.success) {
      onSave();
    } else {
      setError(result.error || 'Failed to save');
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-2">
        <Label>Bio</Label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={3}
          className="flex w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 resize-none"
          placeholder="Tell people about yourself..."
        />
        <p className="text-xs text-right" style={{ color: 'var(--ash-grey)' }}>
          {bio.length}/500
        </p>
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
          placeholder="e.g. London, UK"
        />
      </div>
      <div className="space-y-2">
        <Label>Social Links</Label>
        <div className="space-y-2">
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            placeholder="Instagram username"
          />
          <input
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            placeholder="Twitter/X username"
          />
          <input
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            placeholder="LinkedIn username"
          />
        </div>
      </div>
      <EditorFooter saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

function PhysicalEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: ProfileData;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [height, setHeight] = useState(initial.height_cm?.toString() || '');
  const [weight, setWeight] = useState(initial.weight_kg?.toString() || '');
  const [dob, setDob] = useState(initial.date_of_birth || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await updateBaseProfile({
      height_cm: height ? parseFloat(height) : null,
      weight_kg: weight ? parseFloat(weight) : null,
      date_of_birth: dob || null,
    });

    setSaving(false);
    if (result.success) {
      onSave();
    } else {
      setError(result.error || 'Failed to save');
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Height (cm)</Label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            min={100}
            max={250}
            className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            placeholder="180"
          />
        </div>
        <div className="space-y-2">
          <Label>Weight (kg)</Label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min={30}
            max={200}
            className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            placeholder="75"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Date of Birth</Label>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="flex h-10 w-full rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] focus:outline-none focus:ring-1 focus:ring-zinc-300"
        />
      </div>
      <EditorFooter saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

function FootballEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: FootballData;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [experienceLevel, setExperienceLevel] = useState(
    initial.experience_level || ''
  );
  const [preferredFoot, setPreferredFoot] = useState(
    initial.preferred_foot || ''
  );
  const [primaryPosition, setPrimaryPosition] = useState(
    initial.primary_position || ''
  );
  const [secondaryPositions, setSecondaryPositions] = useState<string[]>(
    initial.secondary_positions || []
  );
  const [jerseyNumber, setJerseyNumber] = useState(
    initial.preferred_jersey_number?.toString() || ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSecondary = (pos: string) => {
    if (pos === primaryPosition) return;
    setSecondaryPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await updateFootballProfile({
      experience_level: experienceLevel,
      preferred_foot: preferredFoot,
      primary_position: primaryPosition,
      secondary_positions: secondaryPositions,
      preferred_jersey_number: jerseyNumber ? parseInt(jerseyNumber, 10) : null,
    });

    setSaving(false);
    if (result.success) {
      onSave();
    } else {
      setError(result.error || 'Failed to save');
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-2">
        <Label>Experience Level</Label>
        <Select value={experienceLevel} onValueChange={setExperienceLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {FOOTBALL_EXPERIENCE_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {FOOTBALL_EXPERIENCE_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Preferred Foot</Label>
        <RadioGroup
          value={preferredFoot}
          onValueChange={setPreferredFoot}
          className="flex gap-4"
        >
          {PREFERRED_FOOT_OPTIONS.map((foot) => (
            <div key={foot} className="flex items-center gap-2">
              <RadioGroupItem value={foot} id={`edit-foot-${foot}`} />
              <Label
                htmlFor={`edit-foot-${foot}`}
                className="font-normal cursor-pointer"
              >
                {foot.charAt(0).toUpperCase() + foot.slice(1)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Primary Position</Label>
        <Select
          value={primaryPosition}
          onValueChange={(val) => {
            setPrimaryPosition(val);
            setSecondaryPositions((prev) => prev.filter((p) => p !== val));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            {FOOTBALL_POSITIONS.map((pos) => (
              <SelectItem key={pos} value={pos}>
                {pos} - {FOOTBALL_POSITION_LABELS[pos]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Secondary Positions</Label>
        <div className="flex flex-wrap gap-2">
          {FOOTBALL_POSITIONS.filter((p) => p !== primaryPosition).map(
            (pos) => {
              const isSelected = secondaryPositions.includes(pos);
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => toggleSecondary(pos)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    isSelected
                      ? 'bg-green-400/20 border-green-400/50 text-green-400'
                      : 'bg-neutral-800/50 border-neutral-700/50 hover:border-neutral-600'
                  }`}
                  style={!isSelected ? { color: 'var(--ash-grey)' } : {}}
                >
                  {pos}
                </button>
              );
            }
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Jersey Number</Label>
        <input
          type="number"
          min={1}
          max={99}
          value={jerseyNumber}
          onChange={(e) => setJerseyNumber(e.target.value)}
          placeholder="e.g. 10"
          className="flex h-10 w-24 rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        />
      </div>

      <EditorFooter saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

function NationalitySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedCountry = COUNTRY_OPTIONS.find(
    (c) => c.alpha2 === value?.toUpperCase()
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className="flex h-10 w-full items-center justify-between rounded-md bg-zinc-800 text-white px-3 py-2 text-sm shadow-[0px_0px_1px_1px_var(--neutral-700)] focus:outline-none focus:ring-1 focus:ring-zinc-300"
        >
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
                <CircleFlag
                  countryCode={selectedCountry.alpha2.toLowerCase()}
                  height={20}
                />
              </div>
              <span>{selectedCountry.name}</span>
            </div>
          ) : (
            <span className="text-zinc-500">Select nationality</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={10}
        className="z-[60] w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList
            className="max-h-[200px] overflow-y-auto"
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRY_OPTIONS.map((country) => (
                <CommandItem
                  key={country.alpha2}
                  value={country.name}
                  onSelect={() => {
                    onChange(country.alpha2 === value ? '' : country.alpha2);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
                    <CircleFlag
                      countryCode={country.alpha2.toLowerCase()}
                      height={20}
                    />
                  </div>
                  <span className="flex-1">{country.name}</span>
                  {value === country.alpha2 && (
                    <Check className="h-4 w-4 shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function EditorFooter({
  saving,
  onCancel,
  onSave,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        style={{ color: 'var(--ash-grey)' }}
      >
        Cancel
      </Button>
      <Button
        size="sm"
        disabled={saving}
        onClick={onSave}
        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
      >
        {saving ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <Save className="h-4 w-4 mr-1" />
            Save
          </>
        )}
      </Button>
    </div>
  );
}
