# Error Handling Guide

## Overview

The Dr Doomgadget tavern card game implements a comprehensive error handling system using React Error Boundaries. This system provides graceful error recovery, user-friendly fallback UIs, and detailed error tracking for debugging and monitoring.

## Architecture

### Error Boundary Hierarchy

The application uses a three-tier error boundary strategy:

1. **App-Level Boundary** (`level: "app"`)
   - Catches catastrophic application errors
   - Prevents white screen of death
   - Provides full-page fallback UI with reload option
   - Location: Wraps entire `App` component

2. **Feature-Level Boundaries** (`level: "feature"`)
   - Isolates errors to specific game features
   - Prevents game board errors from breaking entire app
   - Provides "Return to Lobby" recovery option
   - Locations:
     - GameBoard component (tavern phase)
     - Boss fight component (boss phase)

3. **Component-Level Boundaries** (`level: "component"`)
   - Prevents individual component failures from cascading
   - Shows placeholder UI for failed components
   - Isolates errors with `isolate: true` flag
   - Location: Each TavernCard in the tavern grid

### Component Structure

```
client/src/components/ErrorBoundary/
├── ErrorBoundary.tsx       # Main error boundary class component
├── ErrorFallback.tsx       # Fallback UI components (App, Game, Card, WebSocket)
├── ErrorTrigger.tsx        # Dev-only testing tool
└── index.ts                # Clean exports
```

## Components

### ErrorBoundary

The main error boundary component that catches React errors.

**Props:**

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
  level?: 'app' | 'feature' | 'component';
  isolate?: boolean;
}
```

**Usage:**

```tsx
<ErrorBoundary level="feature" fallback={GameErrorFallback}>
  <GameBoard />
</ErrorBoundary>
```

**Features:**
- Automatic error logging via logger utility
- Error tracking integration (Sentry-ready)
- Error reset functionality
- Auto-reset on `resetKeys` change
- Development vs production error details

### Fallback Components

#### AppErrorFallback

Full-screen error display for app-level failures.

**Features:**
- Tavern-themed error message
- Try Again and Reload Page buttons
- Developer information in dev mode
- User-friendly messaging

#### GameErrorFallback

Game board error display.

**Features:**
- Game-specific error messaging
- Retry and Return to Lobby options
- Clears session storage on lobby return
- Compact design to fit within game UI

#### CardErrorFallback

Minimal placeholder for failed card components.

**Features:**
- Matches TavernCard dimensions (160px × 200px)
- Shows error icon and message
- Retry button in dev mode
- Prevents breaking tavern grid layout

#### WebSocketErrorFallback

Connection error notification (positioned top-right).

**Features:**
- Non-intrusive toast-style notification
- Reconnect and Dismiss buttons
- Auto-reload on reconnect
- Connection status messaging

### ErrorTrigger (Dev Tool)

Development-only component for testing error boundaries.

**Features:**
- Trigger different error types:
  - Render errors
  - Null reference errors
  - Type errors
  - Async errors (not caught by boundaries)
- View error logs in UI
- Export error logs as JSON
- Clear error logs
- Expandable panel (bottom-right corner)

**Usage:**

```tsx
// Already integrated in App.tsx
{import.meta.env.DEV && <ErrorTrigger />}
```

## Error Tracking

### Error Tracking Utility

Location: `client/src/utils/errorTracking.ts`

**Functions:**

```typescript
// Track an error
trackError(error: Error, context?: ErrorContext): void

// Get error logs
getErrorLogs(): ErrorLogEntry[]

// Get error summary
getErrorSummary(): { sessionId: string; errorCount: number; lastError?: string }

// Clear logs
clearErrorLogs(): void

// Export logs as JSON
exportErrorLogs(): string

// Log summary to console (dev only)
logErrorSummary(): void
```

**Context Data:**

```typescript
interface ErrorContext {
  level?: 'app' | 'feature' | 'component';
  errorInfo?: ErrorInfo;
  componentStack?: string;
  userId?: string;
  sessionId?: string;
  gameState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

**Storage:**
- Errors stored in `sessionStorage` under `error_tracking_logs`
- Summary stored under `error_tracking_summary`
- Maximum 100 error logs kept in storage
- Automatic cleanup on overflow

### Logger Integration

The existing logger utility has been extended with error boundary support.

**New Methods:**

```typescript
// Log error boundary errors
logger.logErrorBoundary(error, errorInfo, level): void

// Get error boundary logs
logger.getErrorBoundaryLogs(): unknown[]

// Clear error boundary logs
logger.clearErrorBoundaryLogs(): void
```

**Storage:**
- Error boundary logs stored under `error_boundary_logs`
- Maximum 30 logs kept
- Includes component stack traces

## Testing Error Boundaries

### Using ErrorTrigger (Development)

1. Start the development server
2. Look for "Error Testing" button (bottom-right corner)
3. Click to expand the testing panel
4. Trigger different error types:
   - **Render Error**: Standard React render error
   - **Null Reference**: Accessing property on null
   - **Type Error**: Invalid method call
   - **Async Error**: Unhandled promise rejection (not caught)

5. View error logs in the panel
6. Export logs for review
7. Clear logs when done

### Manual Testing Scenarios

#### Scenario 1: Card Rendering Error

**Setup:**
1. Modify `TavernCard.tsx` to throw an error
2. Add: `if (card.id === '1') throw new Error('Test card error');`

**Expected Result:**
- Only the affected card shows CardErrorFallback
- Other cards render normally
- Tavern grid layout remains intact
- Error logged to sessionStorage

**Recovery:**
- Remove the error code
- Component re-renders on hot reload

#### Scenario 2: GameBoard Error

**Setup:**
1. Modify `GameBoard.tsx` to throw an error
2. Add: `throw new Error('Test game board error');` in component

**Expected Result:**
- GameErrorFallback displays
- Header and notifications still work
- "Retry" and "Return to Lobby" buttons available
- Error logged with feature-level context

**Recovery:**
- Click "Retry" to re-render GameBoard
- Click "Return to Lobby" to reload app

#### Scenario 3: App-Level Error

**Setup:**
1. Modify `App.tsx` or `SocketProvider` to throw
2. Add error in component initialization

**Expected Result:**
- AppErrorFallback displays full-screen
- Tavern-themed error page
- "Try Again" and "Reload Page" options
- Error logged with app-level context

**Recovery:**
- Click "Try Again" to reset error boundary
- Click "Reload Page" to refresh browser

### Automated Testing

Create test files for error boundaries:

```typescript
// Example test
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('ErrorBoundary catches errors and shows fallback', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Production Considerations

### Error Reporting

The error tracking system is prepared for Sentry integration:

**Setup Sentry (when ready):**

1. Install Sentry SDK:
```bash
npm install @sentry/react
```

2. Initialize Sentry in `main.tsx`:
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

3. Error tracking utility will automatically send errors to Sentry in production

**Current Behavior:**
- Development: Errors logged to console and sessionStorage
- Production: Errors stored in sessionStorage, ready for Sentry

### User Experience

**Development Mode:**
- Detailed error messages
- Component stack traces visible
- "Show Details" buttons
- ErrorTrigger tool available

**Production Mode:**
- User-friendly error messages
- No technical details exposed
- Clear recovery actions
- Minimal error information

### Performance Impact

**Minimal Overhead:**
- Error boundaries only activate on errors
- No performance impact during normal operation
- Lightweight fallback components
- Efficient error logging

**Memory Management:**
- Error logs limited to 100 entries
- Automatic cleanup on overflow
- SessionStorage used (cleared on tab close)
- No memory leaks from error state

## Best Practices

### When to Add Error Boundaries

**DO wrap:**
- Entire application (app-level)
- Major features and routes (feature-level)
- Components that render user data (component-level)
- Third-party component integrations
- Components with complex state logic

**DON'T wrap:**
- Event handlers (use try-catch instead)
- Async code (use .catch() or try-catch)
- Server-side rendering
- Error boundaries themselves

### Error Boundary Placement

**Good:**
```tsx
<ErrorBoundary level="feature">
  <ComplexFeature />
</ErrorBoundary>
```

**Better:**
```tsx
<ErrorBoundary level="feature" fallback={CustomFallback}>
  <ComplexFeature />
</ErrorBoundary>
```

**Best:**
```tsx
<ErrorBoundary
  level="feature"
  fallback={CustomFallback}
  onError={(error, errorInfo) => {
    // Custom error handling
    analytics.trackError(error);
  }}
>
  <ComplexFeature />
</ErrorBoundary>
```

### Error Recovery Strategies

1. **Retry Pattern**: Allow users to retry failed operations
2. **Fallback UI**: Show meaningful placeholder content
3. **Graceful Degradation**: Disable failed features, keep app functional
4. **Clear Actions**: Provide obvious next steps for users
5. **State Reset**: Clear error state on successful recovery

### Logging Best Practices

```typescript
// Good: Specific error context
trackError(error, {
  level: 'component',
  metadata: {
    cardId: card.id,
    action: 'render',
  },
});

// Better: Include game state for debugging
trackError(error, {
  level: 'feature',
  gameState: {
    phase: game.phase,
    turn: game.turn,
  },
  metadata: {
    action: 'attack',
    targetId: target.id,
  },
});
```

## Troubleshooting

### Error Boundary Not Catching Errors

**Possible Causes:**
1. Error in event handler (use try-catch)
2. Async error (use .catch() or try-catch)
3. Error in error boundary itself
4. Error during server-side rendering

**Solutions:**
- Wrap async code in try-catch
- Use error boundary above the error source
- Check error boundary implementation
- Add error logging to identify source

### Errors Not Being Logged

**Check:**
1. SessionStorage available and not full
2. Logger configuration correct
3. Error tracking utility imported
4. Browser console for tracking errors

### Fallback UI Not Displaying

**Check:**
1. Fallback component exported correctly
2. Error boundary `fallback` prop set
3. Error boundary wrapping component
4. No errors in fallback component itself

## Migration Guide

### Adding Error Boundaries to Existing Components

1. **Identify Critical Components**
   - User-facing features
   - Data rendering components
   - Third-party integrations

2. **Choose Appropriate Level**
   - App-level for root components
   - Feature-level for major sections
   - Component-level for lists/grids

3. **Import Error Boundary**
```typescript
import { ErrorBoundary, GameErrorFallback } from '@/components/ErrorBoundary';
```

4. **Wrap Component**
```tsx
<ErrorBoundary level="feature" fallback={GameErrorFallback}>
  <YourComponent />
</ErrorBoundary>
```

5. **Test Error Scenarios**
   - Use ErrorTrigger in dev
   - Manually trigger errors
   - Verify fallback UI
   - Check error logging

## Future Enhancements

### Planned Features

1. **Sentry Integration**
   - Automatic error reporting
   - User context tracking
   - Performance monitoring
   - Release tracking

2. **Error Analytics**
   - Error frequency tracking
   - Common error patterns
   - User impact analysis
   - Error trends over time

3. **Enhanced Recovery**
   - Automatic retry with backoff
   - Partial state recovery
   - Optimistic UI updates
   - Error prediction

4. **Custom Error Pages**
   - Phase-specific error pages
   - Contextual help content
   - In-app support links
   - Error code reference

## Summary

The error boundary implementation provides:

- **Comprehensive Coverage**: App, feature, and component levels
- **Graceful Degradation**: User-friendly fallback UIs
- **Developer Experience**: Testing tools and detailed logging
- **Production Ready**: Sentry integration prepared
- **Zero Breaking Changes**: Existing components work unchanged
- **Type Safety**: Full TypeScript support

All critical component trees are now protected, ensuring users never see a white screen of death and always have clear recovery options.
