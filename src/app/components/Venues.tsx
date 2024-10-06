import React from 'react';
import { PinContainer } from './ui/3d-pin';
import Image from 'next/image';
import SectionTitle from './ui/section-title';
export default function Venues() {
  const partners = [
    {
      title: 'PLAYBACK Türkiye',
      href: 'https://g.co/kgs/ZpYZq8G',
      name: 'Etiler Natural Park Halı Saha',
      address:
        'Akatlar Mahallesi, Ebulula Mardin Cd. No:2, 34335 Beşiktaş/İstanbul',
      imageSrc:
        'https://www.gsetiler.com/assets/img/galatasaray-simurg-besiktas-futbol-okulu.jpg',
    },
    {
      title: 'PLAYBACK UK',
      href: 'https://soccerelitefa.com',
      name: 'Soccer Elite FA',
      address: 'Star Meadow Sports Complex, Darland Ave, Gillingham ME7 3AN',
      imageSrc:
        'https://soccerelitefa.com/wp-content/uploads/2020/11/Main-Logo.png',
    },
  ];
  return (
    <section className="container mt-5 w-full mb-14">
      <SectionTitle title="Find Us" />
      <div className="flex flex-wrap items-center justify-center gap-10">
        {partners.map((partner) => (
          <PinContainer
            key={partner.name}
            title={partner.title}
            href={partner.href}
          >
            <div className="flex basis-full flex-col p-4 tracking-tight text-slate-100/50 sm:basis-1/2 w-[20rem] h-[20rem] ">
              <h3 className="max-w-xs !pb-2 !m-0 font-bold  text-base text-slate-100">
                {partner.name}
              </h3>
              <div className="text-base !m-0 !p-0 font-normal">
                <span className="text-slate-500 ">{partner.address}</span>
              </div>
              <img
                className="flex flex-1 w-full rounded-lg mt-4"
                src={partner.imageSrc}
                alt={partner.name}
              />
            </div>
          </PinContainer>
        ))}
      </div>
    </section>
  );
}
