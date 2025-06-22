'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { upsertProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

interface ProfileSetupProps {
  onComplete?: () => void;
}

const sports = [
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'rugby', name: 'Rugby', icon: '🏉' },
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 'lacrosse', name: 'Lacrosse', icon: '🥍' },
  { id: 'padel', name: 'Padel', icon: '🏓' },
];

const userTypes = [
  {
    id: 'player',
    name: 'Player',
    description: 'I play sports competitively or recreationally',
  },
  {
    id: 'coach',
    name: 'Coach',
    description: 'I coach teams or individual athletes',
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'I manage teams or sports organizations',
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'I work in sports administration or support',
  },
  { id: 'scout', name: 'Scout', description: 'I scout and evaluate talent' },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'I analyze performance and data',
  },
];

const levels = [
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
  { id: 'professional', name: 'Professional' },
  { id: 'elite', name: 'Elite' },
];

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    sport: '',
    userType: '',
    level: '',
    experienceYears: '',
  });

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Create profile
      await upsertProfile({
        id: user.id,
        email: user.email!,
        username: formData.username,
        full_name: formData.fullName,
      });

      // Create sport entry
      await supabase.from('user_sports').insert({
        user_id: user.id,
        sport: formData.sport,
        user_type: formData.userType as any,
        level: formData.level as any,
        experience_years: parseInt(formData.experienceYears) || null,
        is_primary: true,
      });

      await refreshProfile();
      onComplete?.();
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--timberwolf)] mb-2">
                Welcome to PLAYBACK
              </h2>
              <p className="text-[var(--ash-grey)]">
                Let&apos;s set up your profile to get started
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[var(--timberwolf)]">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)] placeholder:text-[var(--ash-grey)] focus:border-[var(--timberwolf)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-[var(--timberwolf)]">
                  Username
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => updateFormData('username', e.target.value)}
                  placeholder="Choose a unique username"
                  className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)] placeholder:text-[var(--ash-grey)] focus:border-[var(--timberwolf)]"
                />
                <p className="text-xs text-[var(--ash-grey)]">
                  This will be your profile URL: profile.playbacksports.ai/
                  {formData.username || 'username'}
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--timberwolf)] mb-2">
                What sport do you play?
              </h2>
              <p className="text-[var(--ash-grey)]">
                Select your primary sport
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {sports.map((sport) => (
                <motion.button
                  key={sport.id}
                  onClick={() => updateFormData('sport', sport.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    formData.sport === sport.id
                      ? 'border-[var(--timberwolf)] bg-[var(--timberwolf)]/10'
                      : 'border-[var(--ash-grey)] hover:border-[var(--timberwolf)]'
                  }`}
                >
                  <div className="text-3xl mb-2">{sport.icon}</div>
                  <div className="text-[var(--timberwolf)] font-medium">
                    {sport.name}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--timberwolf)] mb-2">
                What&apos;s your role?
              </h2>
              <p className="text-[var(--ash-grey)]">
                How do you participate in{' '}
                {sports.find((s) => s.id === formData.sport)?.name}?
              </p>
            </div>

            <div className="space-y-3">
              {userTypes.map((type) => (
                <motion.button
                  key={type.id}
                  onClick={() => updateFormData('userType', type.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                    formData.userType === type.id
                      ? 'border-[var(--timberwolf)] bg-[var(--timberwolf)]/10'
                      : 'border-[var(--ash-grey)] hover:border-[var(--timberwolf)]'
                  }`}
                >
                  <div className="text-[var(--timberwolf)] font-medium">
                    {type.name}
                  </div>
                  <div className="text-[var(--ash-grey)] text-sm">
                    {type.description}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--timberwolf)] mb-2">
                Your Experience Level
              </h2>
              <p className="text-[var(--ash-grey)]">
                Help us understand your skill level
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--timberwolf)]">Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => updateFormData('level', value)}
                >
                  <SelectTrigger className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)] focus:border-[var(--timberwolf)]">
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[var(--ash-grey)]">
                    {levels.map((level) => (
                      <SelectItem
                        key={level.id}
                        value={level.id}
                        className="text-[var(--timberwolf)]"
                      >
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="experienceYears"
                  className="text-[var(--timberwolf)]"
                >
                  Years of Experience
                </Label>
                <Input
                  id="experienceYears"
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) =>
                    updateFormData('experienceYears', e.target.value)
                  }
                  placeholder="How many years have you been involved?"
                  className="bg-black border-[var(--ash-grey)] text-[var(--timberwolf)] placeholder:text-[var(--ash-grey)] focus:border-[var(--timberwolf)]"
                />
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-black border border-[var(--timberwolf)] rounded-2xl p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-[var(--ash-grey)] mb-2">
            <span>Step {step} of 4</span>
            <span>{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-[var(--ash-grey)]/20 rounded-full h-2">
            <motion.div
              className="bg-[var(--timberwolf)] h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 && (
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 border border-[var(--ash-grey)] text-[var(--timberwolf)] rounded-lg hover:bg-[var(--ash-grey)]/10 transition-colors"
            >
              Back
            </motion.button>
          )}

          {step < 4 ? (
            <motion.button
              onClick={handleNext}
              disabled={
                !formData.fullName ||
                (step === 2 && !formData.sport) ||
                (step === 3 && !formData.userType)
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="ml-auto px-6 py-2 bg-[var(--timberwolf)] text-black font-semibold rounded-lg hover:bg-[var(--ash-grey)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </motion.button>
          ) : (
            <motion.button
              onClick={handleComplete}
              disabled={loading || !formData.level}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="ml-auto px-6 py-2 bg-[var(--timberwolf)] text-black font-semibold rounded-lg hover:bg-[var(--ash-grey)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Profile...' : 'Complete Setup'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
