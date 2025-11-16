/**
 * Error Boundary Components
 *
 * Comprehensive error handling system for React components.
 * Provides graceful error recovery and user-friendly fallback UIs.
 */

export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps, ErrorFallbackProps } from './ErrorBoundary';

export {
  AppErrorFallback,
  GameErrorFallback,
  CardErrorFallback,
  WebSocketErrorFallback,
} from './ErrorFallback';

export { ErrorTrigger } from './ErrorTrigger';
