'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { LoadingSpinner } from '@/components/ui/loading'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: string
    redirectTo?: string
}

export function ProtectedRoute({
    children,
    requiredRole,
    redirectTo = '/auth/login'
}: ProtectedRouteProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push(redirectTo)
                return
            }

            // Check role if required
            if (requiredRole && user.user_metadata?.role !== requiredRole) {
                router.push('/unauthorized')
                return
            }
        }
    }, [user, loading, router, requiredRole, redirectTo])

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" className="mb-4" />
                    <p className="text-muted-foreground">Checking authentication...</p>
                </div>
            </div>
        )
    }

    // Don't render anything if not authenticated (redirect will happen)
    if (!user) {
        return null
    }

    // Don't render if role check fails
    if (requiredRole && user.user_metadata?.role !== requiredRole) {
        return null
    }

    return <>{children}</>
}

// Higher-order component version
export function withAuth<P extends object>(
    Component: React.ComponentType<P>,
    requiredRole?: string
) {
    return function AuthenticatedComponent(props: P) {
        return (
            <ProtectedRoute requiredRole={requiredRole}>
                <Component {...props} />
            </ProtectedRoute>
        )
    }
} 