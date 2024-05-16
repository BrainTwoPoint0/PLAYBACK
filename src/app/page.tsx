"use client"
import { ParallaxText } from "./components/ParallaxText";
import { PinContainer } from "./components/ui/3d-pin";
import { AnimatedTooltip } from "./components/ui/animated-tooltip";
import Image from "next/image";
const people = [
  {
    id: 1,
    name: "Karim Fawaz",
    designation: "Founder",
    image:
      "/team/karim.jpeg",
  },
  {
    id: 2,
    name: "Tommaso di Gregorio",
    designation: "Customer Acquisition",
    image:
      "/team/tommaso.jpeg",
  },
  {
    id: 3,
    name: "Louis Gualda",
    designation: "Operations",
    image:
      "/team/louis.jpeg",
  },
  {
    id: 4,
    name: "Yuval Cole",
    designation: "Operations",
    image:
      "/team/yuval.jpeg",
  },
];

const partners = [
  {
    title: "PLAYBACK Türkiye",
    href: "https://g.co/kgs/ZpYZq8G",
    name: "Etiler Natural Park Halı Saha",
    address: "Akatlar Mahallesi, Ebulula Mardin Cd. No:2, 34335 Beşiktaş/İstanbul",
    imageSrc: "https://en.reformsports.com/oxegrebi/2020/10/etiler-natural-park-acik-futbol-shasi-1.jpg"

  },
  {
    title: "PLAYBACK UK",
    href: "https://soccerelitefa.com",
    name: "Soccer Elite FA",
    address: "Star Meadow Sports Complex, Darland Ave, Gillingham ME7 3AN",
    imageSrc: "https://soccerelitefa.com/wp-content/uploads/2020/11/Main-Logo.png"

  },
];
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden">

      <section className="my-6 w-full flex flex-wrap items-center justify-center space-y-10">
        {partners.map((partner) => (
          <PinContainer key={partner.name}
            title={partner.title}
            href={partner.href}
          >
            <div className="flex basis-full flex-col p-4 tracking-tight text-slate-100/50 sm:basis-1/2 w-[20rem] h-[20rem] ">
              <h3 className="max-w-xs !pb-2 !m-0 font-bold  text-base text-slate-100">
                {partner.name}
              </h3>
              <div className="text-base !m-0 !p-0 font-normal">
                <span className="text-slate-500 ">
                  {partner.address}
                </span>
              </div>
              <Image className="flex flex-1 w-full rounded-lg mt-4" src={partner.imageSrc} height={100} width={100} alt={partner.name} />
            </div>
          </PinContainer>
        )
        )
        },
      </section>
      <section className="container flex justify-center items-center my-10">
        <h2 className="text-2xl font-bold mr-3">Here to Help: </h2>
        <div className="flex flex-row items-center justify-center">
          <AnimatedTooltip items={people} />
        </div>

      </section>
      <section>
        <ParallaxText baseVelocity={3}>Access The Moment</ParallaxText>
        <ParallaxText baseVelocity={-3}>Share The Memories</ParallaxText>
      </section>
    </main>
  );
}
