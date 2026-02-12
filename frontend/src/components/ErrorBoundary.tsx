import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Log to error tracking service if available
    if (import.meta.env.PROD) {
      // You can add error tracking here (e.g., Sentry, LogRocket, etc.)
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-[#5c5043] mb-4">
              Something went wrong
            </h1>
            <p className="text-[#8b6f47] mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            {this.state.error && import.meta.env.DEV && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-[#8b6f47] mb-2">
                  Error details (dev only)
                </summary>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-48">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="mt-4 px-4 py-2 bg-[#8b6f47] text-white rounded hover:bg-[#6b5637] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

