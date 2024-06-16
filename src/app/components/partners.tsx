import React from 'react'
import Image from 'next/image'
export const Partners = () => {
    return (
        <section className='container my-5'>
            <h2 className='text-2xl md:text-4xl font-bold mb-5'>Our Partners:</h2>
            <div className='flex flex-wrap space-x-5 justify-center'>
                <Image alt="SE FA Logo" src="/partners/soccerelite.svg" height={100} width={100} className='opacity-75 md:w-28' />
                <Image alt="Forbes Logo" src="/partners/forbes.svg" height={100} width={100} className='opacity-75 md:w-28' />
                {/* <Image alt="FC Urban Logo" src="/partners/fcurban.svg" height={100} width={100} className='opacity-75 md:w-28' /> */}
                <Image alt="Galatasaray Logo" src="/partners/galatasaray.svg" height={100} width={100} className='opacity-75 md:w-28' />
            </div>
        </section>
    )
}
