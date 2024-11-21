import React from 'react';
import Image from 'next/image';
import SectionTitle from './ui/section-title';
export const Partners = () => {
  return (
    <section className="container mt-20">
      <SectionTitle title="Our Partners" />
      <div className="flex flex-wrap gap-10 justify-center">
        <Image
          alt="Maestros Academy UAE Logo"
          src="/partners/maestros.png"
          height={100}
          width={100}
          className="opacity-75 md:w-28"
        />
        <Image
          alt="Forbes Logo"
          src="/partners/forbes.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-28"
        />
        <Image
          alt="Maidstone United Logo"
          src="/partners/maidstone.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-28"
        />
        <Image
          alt="Soccer Elite FA Logo"
          src="/partners/soccerelite.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-28"
        />
        <Image
          alt="Galatasaray Logo"
          src="/partners/galatasaray.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-28"
        />
        <Image
          alt="Star Meadow Logo"
          src="/partners/smsc.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-28"
        />
        <Image
          alt="Hollands & Blair Logo"
          src="/partners/hb.png"
          height={100}
          width={100}
          className="opacity-75 md:w-28"
        />
      </div>
    </section>
  );
};
