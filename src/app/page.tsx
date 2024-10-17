'use client';
import { ParallaxText } from './components/ParallaxText';
import { Header } from './components/Header';
import { Partners } from './components/Partners';
import { Ambassadors } from './components/Ambassadors';
import { About } from './components/About';
import { SportsList } from './components/SportsList';
import Services from './components/Services';

export default function Home() {
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
      <SportsList />
      {/* <Ambassadors /> */}
    </main>
  );
}
