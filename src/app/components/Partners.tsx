import React from 'react';
import Image from 'next/image';
import SectionTitle from './ui/section-title';
export const Partners = () => {
  return (
    <section className="container mt-20">
      <SectionTitle title="Our Partners" />
      <div className="flex flex-wrap gap-10 justify-center items-center">
        <Image
          alt="Soccer Elite FA Logo"
          src="/partners/soccerelite.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-24 md:h-24"
        />
        <Image
          alt="Maestros Academy UAE Logo"
          src="/partners/maestros.png"
          height={100}
          width={100}
          className="opacity-75 md:w-24 md:h-24"
        />
        <Image
          alt="Forbes Logo"
          src="/partners/forbes.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-28 md:h-28"
        />
        <Image
          alt="City Group Logo"
          src="/partners/city.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-32 md:h-32"
        />
        <Image
          alt="GOALS Logo"
          src="/partners/goals-logo.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-32 md:h-32"
        />
        <Image
          alt="DAFL Logo"
          src="/partners/dafl.png"
          height={100}
          width={100}
          className="opacity-75 md:w-24 md:h-24"
        />
        <Image
          alt="Atomics Logo"
          src="/partners/atomics.png"
          height={100}
          width={100}
          className="opacity-75 md:w-28 md:h-24"
        />
        <Image
          alt="Three Logo"
          src="/partners/three.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-24 md:h-24"
        />
        <Image
          alt="Complete Football Academy Logo"
          src="/partners/cfa.png"
          height={100}
          width={100}
          className="opacity-75 md:w-24 md:h-24"
        />
        <Image
          alt="Star Meadow Logo"
          src="/partners/smsc.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-32 md:h-32"
        />
        <Image
          alt="Hollands & Blair Logo"
          src="/partners/hb.png"
          height={100}
          width={100}
          className="opacity-75 md:w-28 md:h-28"
        />
        <Image
          alt="Maidstone United Logo"
          src="/partners/maidstone.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-28 md:h-28"
        />
      </div>
    </section>
  );
};
