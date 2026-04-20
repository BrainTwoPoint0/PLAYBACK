'use client';

import { useState } from 'react';
import { Button } from '@braintwopoint0/playback-commons/ui';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LoadingSpinner } from '@/components/ui/loading';
import { createPlayerVariant } from '@/lib/profile/actions';
import {
  FOOTBALL_POSITIONS,
  FOOTBALL_POSITION_LABELS,
  FOOTBALL_EXPERIENCE_LEVELS,
  FOOTBALL_EXPERIENCE_LABELS,
  PREFERRED_FOOT_OPTIONS,
  type FootballPosition,
} from '@/lib/profile/constants';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface PlayerProfileFormProps {
  onSuccess: (variantId: string) => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3;

export function PlayerProfileForm({
  onSuccess,
  onCancel,
}: PlayerProfileFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [experienceLevel, setExperienceLevel] = useState('');
  const [preferredFoot, setPreferredFoot] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [primaryPosition, setPrimaryPosition] = useState('');
  const [secondaryPositions, setSecondaryPositions] = useState<string[]>([]);

  const toggleSecondaryPosition = (pos: string) => {
    if (pos === primaryPosition) return;
    setSecondaryPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  };

  const canProceed = (s: Step): boolean => {
    switch (s) {
      case 1:
        return !!experienceLevel && !!preferredFoot;
      case 2:
        return !!primaryPosition;
      case 3:
        return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const result = await createPlayerVariant({
      experience_level: experienceLevel,
      preferred_foot: preferredFoot,
      primary_position: primaryPosition,
      secondary_positions:
        secondaryPositions.length > 0 ? secondaryPositions : undefined,
      preferred_jersey_number: jerseyNumber ? parseInt(jerseyNumber, 10) : null,
    });

    setLoading(false);

    if (result.success && result.data) {
      onSuccess(result.data.variantId);
    } else {
      setError(result.error || 'Something went wrong');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              s === step
                ? 'w-8 bg-green-400'
                : s < step
                  ? 'w-2 bg-green-400/50'
                  : 'w-2 bg-neutral-700'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h3
              className="text-base font-semibold mb-1"
              style={{ color: 'var(--timberwolf)' }}
            >
              Basic Information
            </h3>
            <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              Tell us about your playing background.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Experience Level</Label>
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select your level" />
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
                  <RadioGroupItem value={foot} id={`foot-${foot}`} />
                  <Label
                    htmlFor={`foot-${foot}`}
                    className="font-normal cursor-pointer"
                  >
                    {foot.charAt(0).toUpperCase() + foot.slice(1)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>
              Jersey Number{' '}
              <span style={{ color: 'var(--ash-grey)' }}>(optional)</span>
            </Label>
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
        </div>
      )}

      {/* Step 2: Positions */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h3
              className="text-base font-semibold mb-1"
              style={{ color: 'var(--timberwolf)' }}
            >
              Playing Positions
            </h3>
            <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              Select your primary position and any secondary ones.
            </p>
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
            <Label>
              Secondary Positions{' '}
              <span style={{ color: 'var(--ash-grey)' }}>(optional)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {FOOTBALL_POSITIONS.filter((p) => p !== primaryPosition).map(
                (pos) => {
                  const isSelected = secondaryPositions.includes(pos);
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => toggleSecondaryPosition(pos)}
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
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h3
              className="text-base font-semibold mb-1"
              style={{ color: 'var(--timberwolf)' }}
            >
              Review & Create
            </h3>
            <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
              Check your details before creating your player profile.
            </p>
          </div>

          <div className="space-y-3">
            <SummaryRow
              label="Experience"
              value={
                FOOTBALL_EXPERIENCE_LABELS[
                  experienceLevel as keyof typeof FOOTBALL_EXPERIENCE_LABELS
                ] || experienceLevel
              }
            />
            <SummaryRow
              label="Preferred Foot"
              value={
                preferredFoot.charAt(0).toUpperCase() + preferredFoot.slice(1)
              }
            />
            <SummaryRow
              label="Primary Position"
              value={`${primaryPosition} - ${FOOTBALL_POSITION_LABELS[primaryPosition as FootballPosition] || primaryPosition}`}
            />
            {secondaryPositions.length > 0 && (
              <SummaryRow
                label="Secondary"
                value={secondaryPositions.join(', ')}
              />
            )}
            {jerseyNumber && (
              <SummaryRow label="Jersey Number" value={`#${jerseyNumber}`} />
            )}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            step === 1 ? onCancel() : setStep((step - 1) as Step)
          }
          style={{ color: 'var(--ash-grey)' }}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>

        {step < 3 ? (
          <Button
            size="sm"
            disabled={!canProceed(step)}
            onClick={() => setStep((step + 1) as Step)}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={loading}
            onClick={handleSubmit}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Create Profile
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-800/30 border border-neutral-700/30">
      <span className="text-sm" style={{ color: 'var(--ash-grey)' }}>
        {label}
      </span>
      <span
        className="text-sm font-medium"
        style={{ color: 'var(--timberwolf)' }}
      >
        {value}
      </span>
    </div>
  );
}
