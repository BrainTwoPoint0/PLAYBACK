'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
}

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo)
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined })
    }

    render() {
        if (this.state.hasError) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback
            return (
                <FallbackComponent error={this.state.error} resetError={this.resetError} />
            )
        }

        return this.props.children
    }
}

function DefaultErrorFallback({
    error,
    resetError
}: {
    error?: Error
    resetError: () => void
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md w-full mx-auto p-6">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Oops! Something went wrong
                    </h1>
                    <p className="text-muted-foreground mb-4">
                        We encountered an unexpected error. This has been logged and our team will look into it.
                    </p>
                    {error && (
                        <details className="text-left mb-4 p-4 bg-muted rounded-lg">
                            <summary className="cursor-pointer text-sm font-medium">
                                Error Details
                            </summary>
                            <pre className="mt-2 text-xs text-muted-foreground overflow-auto">
                                {error.message}
                            </pre>
                        </details>
                    )}
                    <button
                        onClick={resetError}
                        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    )
} 