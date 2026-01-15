/**
 * ErrorBoundary Component
 * Captures React rendering errors and displays a user-friendly fallback
 */

import { Component, ReactNode, ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode
  /** Optional custom fallback UI */
  fallback?: ReactNode
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 *
 * Renders a fallback UI instead of crashing the entire app when an error occurs.
 * Follows the "Soft Organic" design system - no red colors, warm and friendly messaging.
 *
 * @example
 * ```tsx
 * <ErrorBoundary onError={(error) => logError(error)}>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <RiskyComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error.message)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)

    this.props.onError?.(error, errorInfo)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback - warm, friendly UI following design system
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <span style={styles.emoji}>🌱</span>
            <h1 style={styles.title}>Oups, un petit souci</h1>
            <p style={styles.message}>
              Quelque chose d'inattendu s'est produit. Pas d'inquiétude, tes données sont en
              sécurité.
            </p>
            <button style={styles.button} onClick={this.handleReload}>
              Recharger l'application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Inline styles following design system tokens
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: '#FDFCFB', // neutral-50
    fontFamily: "'Source Sans 3', system-ui, sans-serif",
  },
  content: {
    textAlign: 'center' as const,
    maxWidth: '400px',
    padding: '32px',
    backgroundColor: '#FFFFFF', // neutral-0
    borderRadius: '24px', // radius-xl
    boxShadow: '0 4px 16px rgba(28, 25, 23, 0.08)', // shadow-medium
  },
  emoji: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  title: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontSize: '24px', // text-2xl
    fontWeight: 600,
    color: '#292524', // neutral-800
    margin: '0 0 12px 0',
  },
  message: {
    fontSize: '16px', // text-base
    color: '#57534E', // neutral-600
    lineHeight: 1.5,
    margin: '0 0 24px 0',
  },
  button: {
    backgroundColor: '#F27D16', // primary-500
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px', // radius-md
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
}

export default ErrorBoundary
export type { ErrorBoundaryProps }
