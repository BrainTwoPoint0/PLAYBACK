import localFont from 'next/font/local'
import React from 'react'
const BrainTwoPoint0Regular = localFont({ src: '../../../public/fonts/AvertaStd-Regular.ttf' })
const BrainTwoPoint0Black = localFont({ src: '../../../public/fonts/AvertaStd-Black.ttf' })
const BrainTwoPoint0Semibold = localFont({ src: '../../../public/fonts/AvertaStd-Semibold.ttf' })
const BrainTwoPoint0Thin = localFont({ src: '../../../public/fonts/AvertaStd-Thin.ttf' })

export default function Footer() {
    return (
        <footer className='container mx-auto flex p-5 items-center justify-end border-t border-[var(--timberwolf)]'>
            <div>
                <h2 className='text-lg'>by <span className={`${BrainTwoPoint0Semibold.className}`}>BRAIN<span className={`${BrainTwoPoint0Thin.className}`}>2.0</span></span></h2>
            </div>
        </footer>
    )
}
