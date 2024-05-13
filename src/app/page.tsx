import Image from "next/image";
import { ParallaxText } from "./components/ParallaxText";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div className="">
        <ParallaxText baseVelocity={3}>Access The Moment</ParallaxText>
        <ParallaxText baseVelocity={-3}>Share The Memories</ParallaxText>
      </div>
    </main>
  );
}
