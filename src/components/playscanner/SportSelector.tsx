'use client';

import { Sport, SportSelectorProps } from '@/lib/playscanner/types';
import { motion } from 'framer-motion';

const sports = [
  {
    id: 'padel' as Sport,
    name: 'Padel',
    icon: '🎾',
    description: 'Indoor & outdoor courts',
    enabled: true,
    providers: ['Playtomic', 'MATCHi', 'Padel Mates'],
  },
  {
    id: 'football' as Sport,
    name: 'Football',
    icon: '⚽',
    description: '5v5, 7v7, 11v11 pitches',
    enabled: false,
    providers: ['PowerLeague', 'FC Urban', 'Footy Addicts'],
  },
] as const;

export default function SportSelector({
  selectedSport,
  onSportChange,
}: SportSelectorProps) {
  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-2">
          Choose Your Sport
        </h2>
        <p className="text-neutral-400">
          Select a sport to find and book courts or pitches
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {sports.map((sport, index) => (
          <motion.div
            key={sport.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.1,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={`relative cursor-pointer transition-all duration-200 group ${
              !sport.enabled ? 'cursor-not-allowed' : ''
            }`}
            onClick={() => sport.enabled && onSportChange(sport.id)}
          >
            <div
              className={`border border-neutral-800 rounded-lg p-6 h-full transition-all duration-200 ${
                selectedSport === sport.id && sport.enabled
                  ? 'bg-neutral-900 border-[#00FF88] shadow-lg shadow-[#00FF88]/20'
                  : sport.enabled
                    ? 'bg-neutral-950/50 hover:bg-neutral-900/50 hover:border-neutral-700'
                    : 'bg-neutral-950/30 opacity-50'
              }`}
            >
              {/* Selected indicator */}
              {selectedSport === sport.id && sport.enabled && (
                <div className="absolute top-4 right-4">
                  <div className="bg-[#00FF88] text-black text-xs font-semibold px-2 py-1 rounded-full">
                    Selected
                  </div>
                </div>
              )}

              {/* Coming soon indicator */}
              {!sport.enabled && (
                <div className="absolute top-4 right-4">
                  <div className="bg-neutral-700 text-neutral-300 text-xs font-semibold px-2 py-1 rounded-full">
                    Coming Soon
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-4xl">{sport.icon}</span>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{sport.name}</h3>
                  <p className="text-sm text-neutral-400">
                    {sport.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-neutral-300">
                  Available Providers:
                </p>
                <div className="flex flex-wrap gap-2">
                  {sport.providers.map((provider) => (
                    <span
                      key={provider}
                      className={`text-xs px-2 py-1 rounded border ${
                        sport.enabled
                          ? 'border-neutral-700 text-neutral-300 bg-neutral-800/50'
                          : 'border-neutral-800 text-neutral-500 bg-neutral-900/30'
                      }`}
                    >
                      {provider}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!sports.find((s) => s.id === selectedSport)?.enabled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="text-center p-6 bg-amber-500/10 rounded-lg border border-amber-500/20 max-w-md"
        >
          <p className="text-amber-400 font-medium mb-2">
            {selectedSport === 'football' ? 'Football' : 'This sport'} booking
            is coming soon!
          </p>
          <p className="text-sm text-amber-200/80">
            We&apos;re working on integrating with top providers to bring you
            the best booking experience.
          </p>
        </motion.div>
      )}
    </div>
  );
}
