import SectionTitle from './ui/section-title';
import Image from 'next/image';
export default function Press() {
  return (
    <section className="container mt-36">
      <SectionTitle title="Recognised by:" />
      <div className="flex flex-wrap gap-x-10 md:gap-x-64 justify-center items-center">
        <Image
          alt="WebSummit Logo"
          src="/media/websummit.png"
          height={100}
          width={100}
          className="opacity-75 md:w-32 md:h-32"
        />
        <Image
          alt="StartUp Awards Logo"
          src="/media/startup-awards.png"
          height={100}
          width={100}
          className="opacity-75 md:w-32 md:h-32"
        />
        <Image
          alt="UmmaHub Logo"
          src="/media/ummahub.png"
          height={100}
          width={100}
          className="opacity-75 md:w-32 md:h-32"
        />
      </div>
    </section>
  );
}
