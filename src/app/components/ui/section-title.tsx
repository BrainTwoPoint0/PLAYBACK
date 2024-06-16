import React from 'react'

export default function SectionTitle({ title }: { title: string }) {
    return (
        <h2 className='text-2xl md:text-4xl font-bold mb-10 text-center'>{title}</h2>
    )
}
