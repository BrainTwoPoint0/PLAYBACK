"use client"
import { ParallaxText } from "./components/ParallaxText";
import { AnimatedTooltip } from "./components/ui/animated-tooltip";

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
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <section className="container flex justify-center items-center my-10">
        <h2 className="text-3xl font-bold mr-5">Here to Help: </h2>
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
