# Sentry Integration Guide

## Overview

The error tracking system is prepared for Sentry integration. This guide walks through the complete setup process to enable production error monitoring.

## Prerequisites

- Sentry account (free tier available at https://sentry.io)
- Project DSN (Data Source Name)
- npm or yarn access

## Installation

### 1. Install Sentry SDK

```bash
npm install @sentry/react
```

### 2. Install Source Maps Plugin (Optional but Recommended)

```bash
npm install --save-dev @sentry/vite-plugin
```

## Configuration

### 1. Initialize Sentry

Update `client/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions
  // We recommend adjusting this value in production
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors

  integrations: [
    new Sentry.BrowserTracing({
      // Performance monitoring
      tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    }),
    new Sentry.Replay({
      // Session replay on errors
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Filter errors
  beforeSend(event, hint) {
    // Don't send errors in development
    if (import.meta.env.DEV) {
      return null;
    }

    // Filter out known non-critical errors
    const error = hint.originalException;
    if (error && error.message) {
      // Ignore network errors
      if (error.message.includes('NetworkError')) {
        return null;
      }
      // Ignore ResizeObserver errors (common browser bug)
      if (error.message.includes('ResizeObserver')) {
        return null;
      }
    }

    return event;
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 2. Add Environment Variables

Create/update `.env.local`:

```env
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

Add to `.env.example`:

```env
# Sentry Configuration
VITE_SENTRY_DSN=your-sentry-dsn-here
```

### 3. Configure Vite for Source Maps

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    // Upload source maps to Sentry (only in production builds)
    process.env.NODE_ENV === 'production' && sentryVitePlugin({
      org: 'your-sentry-org',
      project: 'your-sentry-project',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ].filter(Boolean),

  build: {
    // Generate source maps for production
    sourcemap: true,
  },
});
```

### 4. Update Error Tracking Utility

Update `client/src/utils/errorTracking.ts`:

```typescript
// Add at the top
import * as Sentry from '@sentry/react';

// Update sendToService method
private sendToService(entry: ErrorLogEntry): void {
  if (!window.Sentry) {
    console.warn('Sentry not initialized');
    return;
  }

  // Create error for Sentry
  const sentryError = new Error(entry.error.message);
  sentryError.name = entry.error.name;
  sentryError.stack = entry.error.stack;

  Sentry.captureException(sentryError, {
    level: this.mapLevelToSentryLevel(entry.context.level),
    tags: {
      sessionId: this.sessionId,
      errorLevel: entry.context.level || 'unknown',
    },
    contexts: {
      react: {
        componentStack: entry.context.componentStack,
      },
      game: entry.context.gameState || {},
    },
    extra: {
      ...entry.context.metadata,
      timestamp: entry.timestamp,
      userAgent: entry.userAgent,
      url: entry.url,
    },
    user: entry.context.userId ? {
      id: entry.context.userId,
    } : undefined,
  });
}

// Add helper method
private mapLevelToSentryLevel(level?: string): Sentry.SeverityLevel {
  switch (level) {
    case 'app':
      return 'fatal';
    case 'feature':
      return 'error';
    case 'component':
      return 'warning';
    default:
      return 'error';
  }
}
```

### 5. Wrap App with Sentry Error Boundary

Update `client/src/App.tsx`:

```typescript
import * as Sentry from '@sentry/react';

// Wrap root component with Sentry's error boundary
function App() {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <AppErrorFallback
          error={error}
          resetError={resetError}
        />
      )}
      showDialog={import.meta.env.PROD}
    >
      <ErrorBoundary level="app" fallback={AppErrorFallback}>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
        {import.meta.env.DEV && <ErrorTrigger />}
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  );
}
```

## User Context Tracking

### 1. Set User Context on Login

When a user joins a game:

```typescript
import * as Sentry from '@sentry/react';

// In your auth/game join logic
const handleJoinGame = (playerId: string, playerName: string) => {
  // Set user context for Sentry
  Sentry.setUser({
    id: playerId,
    username: playerName,
  });

  // Rest of your join logic
};
```

### 2. Clear User Context on Logout

```typescript
const handleLeaveGame = () => {
  // Clear user context
  Sentry.setUser(null);

  // Rest of your leave logic
};
```

### 3. Add Game Context to Errors

In error boundaries and error tracking:

```typescript
trackError(error, {
  level: 'feature',
  gameState: {
    phase: game.phase,
    turn: game.turn,
    playerHp: player.hp,
    tavernCardCount: game.tavernCards.length,
  },
  metadata: {
    action: 'attack',
    targetId: target.id,
  },
});
```

## Performance Monitoring

### 1. Custom Transactions

Track game-specific operations:

```typescript
import * as Sentry from '@sentry/react';

// Track game actions
const handleAttackCard = async (targetId: string) => {
  const transaction = Sentry.startTransaction({
    name: 'attack_card',
    op: 'game.action',
  });

  try {
    await attackTavernCard(targetId);
    transaction.setStatus('ok');
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
};
```

### 2. Component Performance

Track slow components:

```typescript
import { withProfiler } from '@sentry/react';

// Wrap expensive components
export default withProfiler(GameBoard, {
  name: 'GameBoard',
  includeUpdates: true,
});
```

## Session Replay

Session Replay captures video-like reproductions of user sessions.

### 1. Enable in Sentry Init

Already configured in the main.tsx setup above.

### 2. Privacy Settings

Update privacy settings as needed:

```typescript
new Sentry.Replay({
  maskAllText: true,     // Mask all text content
  blockAllMedia: true,   // Block all images/video
  maskAllInputs: true,   // Mask form inputs
})
```

### 3. Manual Session Control

```typescript
// Start a new session
Sentry.getCurrentHub().getClient()?.getIntegration(Sentry.Replay)?.start();

// Stop recording
Sentry.getCurrentHub().getClient()?.getIntegration(Sentry.Replay)?.stop();
```

## Release Tracking

### 1. Set Release in Build

Update `package.json` scripts:

```json
{
  "scripts": {
    "build": "VITE_SENTRY_RELEASE=$(git rev-parse --short HEAD) vite build"
  }
}
```

### 2. Configure Release in Sentry Init

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  // ... rest of config
});
```

### 3. Create Release in Sentry

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Create release
sentry-cli releases new $(git rev-parse --short HEAD)

# Upload source maps
sentry-cli releases files $(git rev-parse --short HEAD) upload-sourcemaps ./dist

# Finalize release
sentry-cli releases finalize $(git rev-parse --short HEAD)
```

## Testing Sentry Integration

### 1. Test Error Capture

Add a test button (dev only):

```typescript
const TestSentryButton = () => {
  const handleTest = () => {
    throw new Error('Test Sentry error');
  };

  return (
    <button onClick={handleTest}>
      Test Sentry
    </button>
  );
};
```

### 2. Test Custom Event

```typescript
Sentry.captureMessage('Test message from Dr Doomgadget', 'info');
```

### 3. Test Transaction

```typescript
const transaction = Sentry.startTransaction({
  name: 'test_transaction',
  op: 'test',
});

setTimeout(() => {
  transaction.finish();
}, 1000);
```

### 4. Verify in Sentry Dashboard

1. Go to sentry.io
2. Navigate to your project
3. Check "Issues" for captured errors
4. Check "Performance" for transactions
5. Check "Replays" for session recordings

## Production Best Practices

### 1. Sample Rates

Adjust sample rates for production:

```typescript
Sentry.init({
  // ... other config

  // Performance: Sample 10% of transactions
  tracesSampleRate: 0.1,

  // Replay: Record 1% of all sessions
  replaysSessionSampleRate: 0.01,

  // Replay: Record 100% of sessions with errors
  replaysOnErrorSampleRate: 1.0,
});
```

### 2. Error Filtering

Filter noisy errors:

```typescript
beforeSend(event, hint) {
  const error = hint.originalException;

  // Ignore specific errors
  const ignoredErrors = [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Network request failed',
  ];

  if (error?.message && ignoredErrors.some(msg =>
    error.message.includes(msg)
  )) {
    return null;
  }

  return event;
}
```

### 3. PII (Personally Identifiable Information)

Strip sensitive data:

```typescript
beforeSend(event) {
  // Remove sensitive headers
  if (event.request?.headers) {
    delete event.request.headers['Authorization'];
    delete event.request.headers['Cookie'];
  }

  // Remove query strings with tokens
  if (event.request?.url) {
    event.request.url = event.request.url.split('?')[0];
  }

  return event;
}
```

### 4. Breadcrumbs

Capture useful breadcrumbs:

```typescript
// Add custom breadcrumb
Sentry.addBreadcrumb({
  category: 'game',
  message: 'Player attacked card',
  level: 'info',
  data: {
    cardId: targetId,
    damage: damageDealt,
  },
});
```

## Alerts and Notifications

### 1. Set Up Alerts in Sentry

1. Go to Project Settings > Alerts
2. Create alert rule:
   - **Name**: Critical Error Rate
   - **Trigger**: Error count > 10 in 1 hour
   - **Action**: Email team

### 2. Slack Integration

1. Go to Organization Settings > Integrations
2. Install Slack integration
3. Configure channel for error notifications

### 3. Discord Integration (Alternative)

Use webhooks for Discord notifications:

```typescript
// In your error tracking utility
private async notifyDiscord(error: ErrorLogEntry): Promise<void> {
  if (!import.meta.env.VITE_DISCORD_WEBHOOK_URL) return;

  await fetch(import.meta.env.VITE_DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: '🚨 Error in Dr Doomgadget',
      embeds: [{
        title: error.error.name,
        description: error.error.message,
        color: 0xff0000,
        fields: [
          { name: 'Level', value: error.context.level || 'unknown' },
          { name: 'Session', value: error.context.sessionId || 'unknown' },
        ],
      }],
    }),
  });
}
```

## Monitoring Dashboard

### Key Metrics to Track

1. **Error Rate**: Errors per session
2. **User Impact**: % of users affected
3. **Error Types**: Most common error messages
4. **Component Failures**: Which components fail most
5. **Browser Distribution**: Error rates by browser
6. **Performance**: Transaction durations

### Custom Dashboard

Create a custom dashboard in Sentry with:

- Error frequency over time
- Error distribution by level (app/feature/component)
- Top error messages
- User sessions with errors
- Performance metrics

## Troubleshooting

### Issue: Source Maps Not Uploading

**Check:**
1. Sentry auth token configured
2. Source maps generated (`sourcemap: true` in vite.config.ts)
3. Sentry CLI installed
4. Correct org/project names

**Solution:**
```bash
# Test upload manually
sentry-cli releases files RELEASE upload-sourcemaps ./dist
```

### Issue: Too Many Errors

**Solutions:**
1. Increase sample rate filtering
2. Add more specific error filters
3. Ignore third-party errors
4. Fix underlying bugs

### Issue: Missing Context

**Solutions:**
1. Ensure user context set on auth
2. Add more breadcrumbs
3. Include game state in error tracking
4. Use custom tags

## Cost Management

### Free Tier Limits

Sentry free tier includes:
- 5,000 errors/month
- 10,000 performance units/month
- 50 session replays/month

### Optimize Usage

1. **Sample intelligently**: Lower sample rates in production
2. **Filter aggressively**: Ignore non-critical errors
3. **Limit breadcrumbs**: Only track important events
4. **Cap replays**: Only record error sessions
5. **Monitor quota**: Set up quota alerts

## Migration Checklist

- [ ] Sentry account created
- [ ] npm packages installed
- [ ] Environment variables configured
- [ ] Sentry initialized in main.tsx
- [ ] Error tracking updated
- [ ] Source maps configured
- [ ] User context tracking added
- [ ] Performance monitoring enabled
- [ ] Session replay configured (optional)
- [ ] Tested in development
- [ ] Deployed to production
- [ ] Verified in Sentry dashboard
- [ ] Alerts configured
- [ ] Team notified

## Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Error Boundaries](https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/)
- [Performance Monitoring](https://docs.sentry.io/platforms/javascript/guides/react/performance/)
- [Session Replay](https://docs.sentry.io/platforms/javascript/guides/react/session-replay/)
- [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)

## Support

For issues or questions:
1. Check Sentry documentation
2. Review error logs in sessionStorage
3. Test with ErrorTrigger tool
4. Contact Sentry support (paid tiers)

---

Once Sentry is integrated, you'll have professional error monitoring with detailed insights into production issues, helping maintain a high-quality user experience in the Dr Doomgadget tavern card game.
