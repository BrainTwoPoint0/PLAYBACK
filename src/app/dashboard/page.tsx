'use client'

import { useAuth } from '@/lib/auth/context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { User, Mail, Calendar, Trophy, LogOut } from 'lucide-react'

function DashboardContent() {
    const { user, signOut, loading } = useAuth()

    const handleSignOut = async () => {
        await signOut()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Welcome to your Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your PLAYBACK profile and sports journey
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="flex items-center gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>

                {/* User Info Card */}
                <div className="bg-card border rounded-lg p-6 mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                            {user?.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="Profile"
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <User className="h-8 w-8 text-primary-foreground" />
                            )}
                        </div>

                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-foreground">
                                {user?.user_metadata?.full_name || 'Athlete'}
                            </h2>
                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <Mail className="h-4 w-4" />
                                <span>{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <Calendar className="h-4 w-4" />
                                <span>Joined {new Date(user?.created_at || '').toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-medium text-foreground mb-2">Account Status</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Email Verified:</span>
                                <span className={user?.email_confirmed_at ? 'text-green-600' : 'text-orange-600'}>
                                    {user?.email_confirmed_at ? 'Yes' : 'Pending'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Profile Setup:</span>
                                <span className="text-orange-600">Incomplete</span>
                            </div>
                            <div className="flex justify-between">
                                <span>User Role:</span>
                                <span className="capitalize">{user?.user_metadata?.role || 'Not set'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <User className="h-6 w-6 text-blue-500" />
                            <h3 className="font-semibold">Complete Profile</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                            Add your sports information, bio, and profile details
                        </p>
                        <Button className="w-full" disabled>
                            Coming Soon
                        </Button>
                    </div>

                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                            <h3 className="font-semibold">Upload Highlights</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                            Share your best moments and achievements
                        </p>
                        <Button className="w-full" disabled>
                            Coming Soon
                        </Button>
                    </div>

                    <div className="bg-card border rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Mail className="h-6 w-6 text-green-500" />
                            <h3 className="font-semibold">Connect</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                            Find and connect with other athletes and coaches
                        </p>
                        <Button className="w-full" disabled>
                            Coming Soon
                        </Button>
                    </div>
                </div>

                {/* Development Info */}
                <div className="bg-muted border rounded-lg p-6">
                    <h3 className="font-semibold text-foreground mb-3">🚧 Development Status</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        Authentication system is working! The profile features and social network are coming next in Phase 2.
                    </p>

                    <div className="bg-background p-4 rounded border">
                        <h4 className="font-medium mb-2">User Debug Info:</h4>
                        <pre className="text-xs text-muted-foreground overflow-auto">
                            {JSON.stringify({
                                id: user?.id,
                                email: user?.email,
                                created_at: user?.created_at,
                                email_confirmed_at: user?.email_confirmed_at,
                                user_metadata: user?.user_metadata
                            }, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    )
} 