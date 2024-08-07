'use client';
import { ParallaxText } from './components/ParallaxText';
import Team from './components/team';
import Image from 'next/image';
import Venues from './components/venues';
import { Header } from './components/header';
import { Partners } from './components/partners';

export default function Home() {
  return (
    <main className="overflow-hidden min-h-[90vh]">
      <Header />
      {/* <Venues /> */}
      <Partners />
      <section className="my-20">
        <ParallaxText baseVelocity={3}>Access The Moment</ParallaxText>
        <ParallaxText baseVelocity={-3}>Share The Memories</ParallaxText>
      </section>
      {/* <Team /> */}

    </main>
  );
}
