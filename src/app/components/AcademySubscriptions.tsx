import Link from "next/link";
import { HoverEffect } from "./ui/card-hover-effect";
import SectionTitle from "./ui/section-title";

export function AcademySubscriptions() {
    return (
        <div className="max-w-5xl mx-auto px-8">
            <SectionTitle title="PLAYBACK Academy Services" />
            <HoverEffect items={projects} />
            <Link href="https://billing.stripe.com/p/login/cN29D13rV5X84UgdQQ">
                <button
                    className="bg-gradient-to-br border border-neutral-400/[0.5] relative group/btn from-[var(--night)] to-[var(--night)] block bg-[var(--night)] w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]">
                    Billing Management &rarr;
                    <BottomGradient />
                </button>
            </Link>

            <div className="bg-gradient-to-r from-transparent via-neutral-700 to-transparent my-8 h-[1px] w-full" />
        </div>
    );
}
export const projects = [
    {
        title: "Soccer Elite FA",
        description:
            "With venue coverage at Star Meadow Sports Complex, SEFA players now have access to the PLAYBACK services.",
        link: "https://buy.stripe.com/14keYz1AS5WQ0QU5km",
        logoUrl: "/partners/soccerelite.svg",
    },
    {
        title: "Hollands & Blair",
        description:
            "Select Hollands & Blair teams are able to utilize the PLAYBACK infrastructure to access their match footage at Star Meadow Sports Complex.",
        link: "https://buy.stripe.com/9AQdUv4N484Y0QU5kn",
        logoUrl: "/partners/hb.png",

    },
    {
        title: "Coming Soon",
        description:
            "The PLAYBACK team is continuously working on onboarding new venues and academies. If you would like to be part of the PLAYBACK ecosystem, REACH OUT!",
        link: "/contact",
        logoUrl: "/branding/PB-icon.png",

    },

];

const BottomGradient = () => {
    return (
        <>
            <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-[var(--timberwolf)] to-transparent" />
            <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-[var(--timberwolf)] to-transparent" />
        </>
    );
};