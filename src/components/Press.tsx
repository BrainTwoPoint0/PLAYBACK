import SectionTitle from './ui/section-title';
import Image from 'next/image';
export default function Press() {
  return (
    <section className="container mt-36">
      <SectionTitle title="Global Recognition" />
      <div className="flex flex-wrap gap-16 md:gap-40 justify-center items-center">
        <Image
          alt="WebSummit Logo"
          src="/media/websummit.png"
          height={100}
          width={100}
          className="w-32 h-32"
        />
        <Image
          alt="Great British Entrepreneur Awards Logo"
          src="/media/GBEA.svg"
          height={100}
          width={100}
          className="w-40 h-40"
        />
        <Image
          alt="World Football Summit Logo"
          src="/media/wfs.png"
          height={100}
          width={100}
          className="w-28 h-20"
        />

        <Image
          alt="StartUp Awards Logo"
          src="/media/startup-awards.png"
          height={100}
          width={100}
          className="w-32 h-32"
        />
        <Image
          alt="UmmaHub Logo"
          src="/media/ummahub.png"
          height={100}
          width={100}
          className="w-32 h-32"
        />
      </div>
    </section>
  );
}
