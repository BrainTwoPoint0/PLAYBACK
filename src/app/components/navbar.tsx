import React from 'react'
import { PLAYBACKFont } from '../layout'
export default function NavBar() {
    return (
        <header className="">
            <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
                <a className="flex title-font font-medium items-center mb-4 md:mb-0">

                    <span className={`${PLAYBACKFont.className} text-[var(--ash-grey)] ml-3 text-xl`}>PLAYBACK</span>
                </a>
                <nav className="md:mr-auto md:ml-4 md:py-1 md:pl-4 md:border-l md:border-gray-400	flex flex-wrap items-center text-base justify-center">
                    <a className="mr-5 hover:text-white">About Us</a>
                    <a className="mr-5 hover:text-white">Partners</a>
                    <a className="mr-5 hover:text-white">The Corporate League</a>

                </nav>
                <button className="text-[var(--night)] inline-flex items-center bg-[var(--ash-grey)] border-0 py-1 px-3 focus:outline-none hover:bg-[var(--timberwolf)] rounded text-base mt-4 md:mt-0">Get Started
                    <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" className="w-4 h-4 ml-1" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>
        </header>
    )
}
