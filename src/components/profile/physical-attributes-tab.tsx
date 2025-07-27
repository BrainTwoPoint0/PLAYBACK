'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ruler, Weight, Info, TrendingUp, User } from 'lucide-react';

interface PhysicalAttributesTabProps {
  profile: any;
  onUpdate: (updates: any) => void;
  onMarkChanged: () => void;
}

export function PhysicalAttributesTab({
  profile,
  onUpdate,
  onMarkChanged,
}: PhysicalAttributesTabProps) {
  const [formData, setFormData] = useState({
    height_cm: profile?.height_cm?.toString() || '',
    weight_kg: profile?.weight_kg?.toString() || '',
  });

  // Update form data when profile changes
  React.useEffect(() => {
    setFormData({
      height_cm: profile?.height_cm?.toString() || '',
      weight_kg: profile?.weight_kg?.toString() || '',
    });
  }, [profile?.height_cm, profile?.weight_kg]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Convert to proper types for database
    const updates: any = {};
    const numValue = value === '' ? null : parseInt(value);
    updates[field] = numValue;

    onUpdate(updates);
    onMarkChanged();
  };

  const convertHeightToFeetInches = (cm: number): string => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };

  const convertWeightToPounds = (kg: number): string => {
    return `${Math.round(kg * 2.20462)} lbs`;
  };

  const getBMICategory = (
    height: number,
    weight: number
  ): { category: string; color: string } => {
    const bmi = weight / (height / 100) ** 2;

    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-400' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-400' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-400' };
    return { category: 'Obese', color: 'text-red-400' };
  };

  const height = parseInt(formData.height_cm) || 0;
  const weight = parseInt(formData.weight_kg) || 0;
  const showBMI = height > 0 && weight > 0;
  const bmiData = showBMI ? getBMICategory(height, weight) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-purple-400/10 rounded-xl">
            <TrendingUp className="h-6 w-6 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Physical Attributes
          </h2>
        </div>
        <p className="text-sm text-neutral-400">
          Add your physical measurements to complete your athletic profile
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Height */}
        <div className="space-y-3">
          <Label
            htmlFor="height"
            className="font-medium text-white flex items-center gap-2"
          >
            <Ruler className="h-4 w-4 text-purple-400" />
            Height
          </Label>
          <div className="relative">
            <Input
              id="height"
              type="number"
              value={formData.height_cm}
              onChange={(e) => handleInputChange('height_cm', e.target.value)}
              className="bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl h-12 pr-12"
              style={{
                color: 'var(--timberwolf)',
                borderColor: 'var(--ash-grey)',
              }}
              placeholder="175"
              min="100"
              max="250"
            />
            <span className="absolute right-3 top-3 text-sm text-neutral-400">
              cm
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Your height in centimeters</span>
            {height > 0 && (
              <span className="text-green-400">
                {convertHeightToFeetInches(height)}
              </span>
            )}
          </div>
        </div>

        {/* Weight */}
        <div className="space-y-3">
          <Label
            htmlFor="weight"
            className="font-medium text-white flex items-center gap-2"
          >
            <Weight className="h-4 w-4 text-purple-400" />
            Weight
          </Label>
          <div className="relative">
            <Input
              id="weight"
              type="number"
              value={formData.weight_kg}
              onChange={(e) => handleInputChange('weight_kg', e.target.value)}
              className="bg-neutral-700/50 border-neutral-600 placeholder:text-neutral-400 rounded-xl h-12 pr-12"
              style={{
                color: 'var(--timberwolf)',
                borderColor: 'var(--ash-grey)',
              }}
              placeholder="70"
              min="30"
              max="200"
            />
            <span className="absolute right-3 top-3 text-sm text-neutral-400">
              kg
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Your weight in kilograms</span>
            {weight > 0 && (
              <span className="text-green-400">
                {convertWeightToPounds(weight)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BMI Indicator */}
      {showBMI && bmiData && (
        <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-400/10 rounded-xl">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Health Metrics</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-neutral-700/30 rounded-lg">
              <p className="text-2xl font-bold text-white mb-1">
                {(weight / (height / 100) ** 2).toFixed(1)}
              </p>
              <p className="text-sm text-neutral-400">BMI</p>
            </div>
            <div className="text-center p-4 bg-neutral-700/30 rounded-lg">
              <p className={`text-lg font-semibold mb-1 ${bmiData.color}`}>
                {bmiData.category}
              </p>
              <p className="text-sm text-neutral-400">Category</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-400/10 border border-blue-400/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium">Health Note</p>
                <p className="text-blue-300">
                  BMI is a general indicator and may not reflect athletic body
                  composition. Consult with sports professionals for
                  personalized guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-neutral-800/40 to-neutral-700/30 backdrop-blur-xl border border-neutral-700/50 rounded-xl p-6">
        <h4
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--timberwolf)' }}
        >
          <div className="p-1 bg-purple-400/10 rounded-lg">
            <Info className="h-4 w-4 text-purple-400" />
          </div>
          Physical Attributes Tips
        </h4>
        <ul className="text-sm space-y-2" style={{ color: 'var(--ash-grey)' }}>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              Accurate measurements help scouts assess position suitability
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              Preferred foot information is crucial for tactical positioning
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              These fields are optional but increase profile completeness
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5 text-xs">●</span>
            <span>
              Update measurements regularly as you develop athletically
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
