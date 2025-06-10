import React from 'react';
import Image from 'next/image';
import SectionTitle from './ui/section-title';
export const Partners = () => {
  return (
    <section className="container mt-20">
      <SectionTitle title="Our Partners" />
      <div className="flex flex-wrap md:gap-36 gap-16 justify-center items-center">
        <Image
          alt="Forbes Logo"
          src="/partners/forbes.svg"
          height={100}
          width={100}
          className="opacity-75 w-32 h-32"
        />
        <Image
          alt="AWS Logo"
          src="/partners/aws.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-24 md:h-24"
        />
        <Image
          alt="Locals Logo"
          src="/partners/locals.svg"
          height={100}
          width={100}
          className="opacity-75 w-44 h-44"
        />
        <Image
          alt="Three Logo"
          src="/partners/three.svg"
          height={100}
          width={100}
          className="opacity-75 md:w-24 md:h-24"
        />
      </div>
    </section>
  );
};
