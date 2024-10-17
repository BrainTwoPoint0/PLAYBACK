'use client';
import { ParallaxText } from './components/ParallaxText';
import { Header } from './components/Header';
import { Partners } from './components/Partners';
import { About } from './components/About';
import { SportsList } from './components/SportsList';
import Services from './components/Services';
import { FlipWords } from './components/ui/flip-words';
import Image from 'next/image';

export default function Home() {
  const words = ['PLAYERS', 'AGENTS', 'CLUBS', 'ACADEMIES', 'SCHOLARSHIPS', 'LEAGUES', 'TOURNAMENTS'];
  return (
    <main className="overflow-hidden">
      <Header />
      <About />
      <div className="mt-20">
        <ParallaxText baseVelocity={-3}>Access The Moment</ParallaxText>
        <ParallaxText baseVelocity={3}>Unlock your Potential</ParallaxText>
      </div>
      <Partners />
      <Services />
      <section className="md:container mt-36 text-xs md:text-4xl flex items-center md:justify-evenly justify-center">
        <Image className='md:w-1/2 w-2/5' width={500} height={500} src={'/branding/PLAYBACK-Text.png'} alt='PLAYBACK Logo' />
        <div className="md:w-2/5 w-1/2 pl-2 md:pl-0">
          AN ECOSYSTEM <br />
          TO POWER<FlipWords words={words} />
        </div>
      </section>
      <SportsList />
    </main>
  );
}
