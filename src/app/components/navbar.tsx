import localFont from 'next/font/local'
import Link from 'next/link'
import React from 'react'
const PLAYBACKFont = localFont({ src: '../../../public/fonts/playbackfont.ttf' })
export default function NavBar() {
    return (
        <nav className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
            <Link href="/" className="flex font-medium items-center mb-4 md:mb-0">

                <span className={`${PLAYBACKFont.className} text-[var(--ash-grey)] ml-3 text-2xl`}>PLAYBACK</span>
            </Link>
            <nav className="md:mr-auto md:ml-4 md:py-1 md:pl-4 md:border-l md:border-[var(--timberwolf)] flex flex-wrap items-center text-lg justify-center">

                <Link href="/corporateleague" className="mr-5 hover:text-white">The Corporate League</Link>

            </nav>
            <button className="text-[var(--night)] inline-flex items-center bg-[var(--ash-grey)] border-0 py-3 px-6 focus:outline-none hover:bg-[var(--timberwolf)] rounded text-base mt-4 md:mt-0">Get Started
                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4 ml-1" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
            </button>

        </nav>
    )
}
