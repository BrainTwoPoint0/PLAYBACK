'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
    const { user, signOut } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (user && user.email_confirmed_at) {
            // If already verified, send to dashboard
            router.push('/dashboard')
        }
    }, [user, router])

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--night)' }}>
            <div className="bg-neutral-800/70 backdrop-blur-xl border border-neutral-700/60 rounded-2xl shadow-2xl p-8 space-y-6 max-w-md text-center">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--timberwolf)' }}>Verify your email</h1>
                <p style={{ color: 'var(--ash-grey)' }}>
                    We&apos;ve sent a verification link to <span className="font-semibold" style={{ color: 'var(--timberwolf)' }}>{user?.email}</span>.<br />
                    Please check your inbox (and spam folder) and click the link to activate your account.
                </p>
                <p className="text-sm" style={{ color: 'var(--ash-grey)' }}>
                    You can close this window after verifying. Once done, sign in with your credentials.
                </p>
                <Button
                    onClick={async () => {
                        await signOut()
                        router.push('/auth/login')
                    }}
                    className="w-full font-semibold rounded-xl"
                    style={{ backgroundColor: 'var(--ash-grey)', color: 'var(--night)' }}
                >
                    Back to login
                </Button>
            </div>
        </div>
    )
} 