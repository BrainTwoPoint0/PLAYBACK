'use client';

import dynamic from 'next/dynamic';

const CardHolderAnimation = dynamic(
  () =>
    import('@playback/commons/components/ui/card-holder-animation').then(
      (mod) => ({ default: mod.CardHolderAnimation })
    ),
  { ssr: false }
);

export default function CardDemoPage() {
  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          Card Holder Animation Demo
        </h1>
        <p className="text-gray-400 mb-8">
          Drag the card around to see the physics animation!
        </p>

        <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-800">
          <CardHolderAnimation />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-gray-900 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">
              Interactive Features
            </h2>
            <ul className="space-y-2 text-gray-400">
              <li>• Click and drag the card to move it around</li>
              <li>• Release to see the elastic physics animation</li>
              <li>• The lanyard band follows realistic rope physics</li>
              <li>• Hover to see cursor change to grab/grabbing</li>
            </ul>
          </div>

          <div className="p-6 bg-gray-900 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-3">
              Technical Details
            </h2>
            <ul className="space-y-2 text-gray-400">
              <li>• Built with React Three Fiber & Three.js</li>
              <li>• Physics powered by Rapier</li>
              <li>• TypeScript for type safety</li>
              <li>• Fully responsive and reusable component</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
