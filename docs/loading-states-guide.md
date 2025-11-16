# Loading States Implementation Guide

## Overview

This guide documents the comprehensive loading state system implemented for Dr Doomgadget's tavern card game frontend. All async operations now have proper loading indicators, preventing user confusion and improving UX.

## Architecture

### Core Components

1. **useAsyncAction Hook** - Manages async operations with loading states
2. **Spinner Component** - Visual loading indicators
3. **Skeleton Components** - Content placeholders during loading
4. **Enhanced Button** - Built-in loading state support
5. **UI Slice** - Centralized loading state management

## Implementation Details

### 1. useAsyncAction Hook

Location: `client/src/hooks/useAsyncAction.ts`

Custom hook for managing async operations with automatic loading state handling.

**Features:**
- Automatic loading state management
- Error handling and tracking
- Success/error callbacks
- Minimum loading time to prevent spinner flashing
- Request cancellation on unmount

**Usage Example:**

```tsx
import { useAsyncAction } from '../hooks/useAsyncAction';

const MyComponent = () => {
  const { execute, isLoading, error } = useAsyncAction(
    async (id: string) => {
      const response = await apiClient.post('/games', { id });
      return response.data;
    },
    {
      onSuccess: (data) => console.log('Success!', data),
      onError: (error) => console.error('Failed:', error),
      minLoadingTime: 300 // Show spinner for at least 300ms
    }
  );

  return (
    <Button onClick={() => execute('game-123')} isLoading={isLoading}>
      Create Game
    </Button>
  );
};
```

### 2. Spinner Component

Location: `client/src/components/UI/Spinner.tsx`

Multiple spinner variants for different use cases.

**Variants:**

1. **Inline Spinner** - Small spinner for inline use (buttons, etc)
2. **Overlay Spinner** - Spinner with backdrop overlay
3. **Fullscreen Spinner** - Full-screen loading state

**Additional Components:**
- `LoadingDots` - Subtle loading animation
- `PulseSpinner` - Pulsing spinner for card states

**Usage Examples:**

```tsx
// Inline spinner
<Spinner size="sm" variant="inline" />

// Overlay spinner with message
<Spinner variant="overlay" message="Creating game..." />

// Fullscreen loading
<Spinner variant="fullscreen" size="xl" message="Loading..." />

// Loading dots
<LoadingDots className="text-tavern-gold" />

// Pulse spinner
<PulseSpinner size="md" />
```

### 3. Skeleton Components

Location: `client/src/components/UI/Skeleton.tsx`

Content placeholders for loading states.

**Available Skeletons:**

- `Skeleton` - Base skeleton component
- `CardSkeleton` - Tavern card placeholder
- `TavernSkeleton` - Grid of card skeletons
- `PlayerStatsSkeleton` - Player stats placeholder
- `EquipmentSlotSkeleton` - Equipment slot placeholder
- `CombatLogSkeleton` - Combat log placeholder
- `ButtonSkeleton` - Button placeholder
- `TableRowSkeleton` - Table row placeholder
- `GameBoardSkeleton` - Full page loading skeleton

**Usage Examples:**

```tsx
// Base skeleton
<Skeleton variant="rectangular" width="100%" height="200px" />

// Card skeleton
<CardSkeleton />

// Tavern grid skeleton
<TavernSkeleton count={9} />

// Player stats skeleton
<PlayerStatsSkeleton />

// Full page skeleton
{isLoading ? <GameBoardSkeleton /> : <GameBoard />}
```

### 4. Enhanced Button Component

Location: `client/src/components/UI/Button.tsx`

Button component with built-in loading state support.

**New Props:**
- `isLoading?: boolean` - Shows loading spinner
- `loadingText?: string` - Custom loading text (default: "Loading...")

**Features:**
- Automatic spinner display
- Disabled state during loading
- Size-appropriate spinner
- Accessible loading indicators (aria-busy, aria-live)

**Usage Examples:**

```tsx
<Button
  variant="primary"
  size="lg"
  onClick={handleNewGame}
  isLoading={isCreating}
  loadingText="Creating Game..."
>
  New Game
</Button>

<Button
  variant="danger"
  onClick={handleAttack}
  isLoading={isProcessing}
>
  Attack
</Button>
```

### 5. UI Slice Enhancement

Location: `client/src/store/slices/uiSlice.ts`

Centralized loading state management in Zustand store.

**New State:**

```typescript
loadingStates: {
  creatingGame: boolean;
  creatingSession: boolean;
  loadingGameState: boolean;
  connectingSocket: boolean;
  [key: string]: boolean; // Allow dynamic loading keys
}
```

**New Actions:**

- `setLoadingState(key: string, value: boolean)` - Set specific loading state
- `clearAllLoadingStates()` - Clear all loading states
- `isAnyLoading()` - Check if any operation is loading

**Usage Examples:**

```tsx
import { useUIActions, useUI } from '../../store';

const MyComponent = () => {
  const ui = useUI();
  const { setLoadingState, clearAllLoadingStates } = useUIActions();

  const handleAction = async () => {
    setLoadingState('myAction', true);
    try {
      await performAction();
    } finally {
      setLoadingState('myAction', false);
    }
  };

  return (
    <div>
      {ui.loadingStates.myAction && <Spinner />}
      <Button onClick={handleAction}>Perform Action</Button>
    </div>
  );
};
```

## Implementation by Feature

### Game Creation (LobbyScreen)

**File:** `client/src/components/Board/LobbyScreen.tsx`

**Loading States:**
- Button shows "Creating Game..." text
- Button is disabled during creation
- Spinner appears in button

**Code:**

```tsx
const [isCreating, setIsCreating] = useState(false);

const handleNewGame = async () => {
  try {
    setIsCreating(true);
    // Create guest session
    await apiClient.post(API_ENDPOINTS.AUTH.GUEST);
    // Create game
    await apiClient.post(API_ENDPOINTS.GAMES.CREATE);
  } catch (error) {
    console.error('Failed to create game:', error);
  } finally {
    setIsCreating(false);
  }
};

return (
  <Button
    variant="primary"
    size="lg"
    onClick={handleNewGame}
    isLoading={isCreating}
    loadingText="Creating Game..."
  >
    New Game
  </Button>
);
```

### Combat Actions (GameBoard)

**File:** `client/src/components/Board/GameBoard.tsx`

**Loading States:**
- Attack button shows spinner during combat
- Processing overlay appears on entire board
- Clear button is disabled during combat
- Cards cannot be selected during combat

**Code:**

```tsx
const combat = useCombat();

return (
  <div className="relative">
    {/* Processing overlay */}
    {combat.isProcessing && (
      <div className="absolute inset-0 bg-black bg-opacity-30 z-10">
        <Spinner size="lg" variant="inline" message="Processing combat..." />
      </div>
    )}

    <button
      onClick={handleAttack}
      disabled={combat.isProcessing}
    >
      {combat.isProcessing ? (
        <>
          <Spinner size="sm" variant="inline" color="white" />
          <span>Attacking...</span>
        </>
      ) : (
        <span>⚔️ Attack</span>
      )}
    </button>
  </div>
);
```

### WebSocket Actions

**File:** `client/src/hooks/useGameActions.ts`

**Loading States:**
- Sets `isProcessing` state before emitting
- Validates no action is in progress
- Shows warning if action attempted during processing

**Code:**

```tsx
const attackTavernCard = useCallback((targetCardId: string) => {
  // Check if already processing
  if (isProcessing) {
    logger.warn('Cannot attack: Action already in progress');
    return;
  }

  // Validate inputs...

  // Set processing state before emitting
  setProcessing(true);
  emit('attack', { gameId, targetCardId });
}, [emit, gameId, isProcessing, setProcessing]);
```

**File:** `client/src/hooks/useSocketHandlers.ts`

**Loading States:**
- Clears `isProcessing` when combat_result received
- Clears all loading states on error
- Ensures clean state on socket errors

**Code:**

```tsx
socket.on('combat_result', (data: any) => {
  // Clear processing state
  combatActions.setProcessing(false);

  // Update game state...
});

socket.on('error', (error: { message: string }) => {
  // Clear any pending processing states on error
  combatActions.setProcessing(false);
  uiActions.clearAllLoadingStates();

  // Show error notification...
});
```

## Best Practices

### 1. Minimum Loading Time

Prevent spinner flashing for fast operations:

```tsx
const { execute, isLoading } = useAsyncAction(
  async () => {
    // Fast operation
  },
  { minLoadingTime: 300 } // Only show spinner if operation takes >300ms
);
```

### 2. Error Handling

Always clear loading states in error handlers:

```tsx
const handleAction = async () => {
  setLoading(true);
  try {
    await performAction();
  } catch (error) {
    console.error(error);
    // Error notification...
  } finally {
    setLoading(false); // Always clear loading state
  }
};
```

### 3. Accessible Loading Indicators

Use ARIA attributes for screen readers:

```tsx
<button
  disabled={isLoading}
  aria-busy={isLoading}
  aria-live="polite"
>
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

### 4. Visual Feedback

Provide clear visual feedback for all states:

```tsx
// Loading state
{isLoading && <Spinner />}

// Error state
{error && <ErrorMessage error={error} />}

// Empty state
{!isLoading && !data && <EmptyState />}

// Success state
{data && <Content data={data} />}
```

### 5. Prevent Multiple Submissions

Disable interactive elements during loading:

```tsx
<Button
  onClick={handleSubmit}
  disabled={isLoading || isProcessing}
  isLoading={isLoading}
>
  Submit
</Button>
```

## Testing Loading States

### Manual Testing Checklist

- [ ] Game creation shows "Creating Game..." loading text
- [ ] Game creation button is disabled during creation
- [ ] Attack button shows spinner during combat
- [ ] Attack button is disabled during combat
- [ ] Processing overlay appears during combat
- [ ] Cards cannot be selected during combat
- [ ] Loading states clear after successful operations
- [ ] Loading states clear after failed operations
- [ ] Error notifications appear for failed operations
- [ ] No loading states persist after operations complete
- [ ] Rapid clicks don't trigger multiple actions
- [ ] Loading spinners don't flash for fast operations

### Automated Testing

```tsx
// Example test for loading states
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LobbyScreen } from './LobbyScreen';

describe('LobbyScreen Loading States', () => {
  it('shows loading state during game creation', async () => {
    render(<LobbyScreen />);

    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);

    // Loading state should appear
    expect(screen.getByText('Creating Game...')).toBeInTheDocument();
    expect(newGameButton).toBeDisabled();

    // Loading state should clear after completion
    await waitFor(() => {
      expect(screen.queryByText('Creating Game...')).not.toBeInTheDocument();
    });
  });
});
```

## Performance Considerations

### 1. Delay Spinner Display

Only show spinner if operation takes longer than threshold:

```tsx
const [showSpinner, setShowSpinner] = useState(false);

useEffect(() => {
  let timeout: NodeJS.Timeout;

  if (isLoading) {
    // Only show spinner if loading takes >200ms
    timeout = setTimeout(() => setShowSpinner(true), 200);
  } else {
    setShowSpinner(false);
  }

  return () => clearTimeout(timeout);
}, [isLoading]);

return showSpinner ? <Spinner /> : null;
```

### 2. Skeleton Screens vs Spinners

Use skeleton screens for initial page loads:

```tsx
{isLoadingTavern ? (
  <TavernSkeleton count={9} />
) : (
  <TavernGrid cards={tavernCards} />
)}
```

Use spinners for user-triggered actions:

```tsx
<Button isLoading={isCreating} loadingText="Creating...">
  Create
</Button>
```

## Future Enhancements

### 1. Optimistic UI Updates

Show immediate feedback before server confirmation:

```tsx
const handleCardSelect = (cardId: string) => {
  // Optimistic update
  selectCard(cardId);

  // Send to server
  emit('selectCard', { cardId });

  // Rollback handled in socket error handler
};
```

### 2. Progressive Loading

Show loading progress for multi-step operations:

```tsx
const [loadingSteps, setLoadingSteps] = useState({
  session: false,
  game: false,
  cards: false,
  complete: false
});

// Show: "Creating session... ✓ Creating game... ✓ Loading cards..."
```

### 3. Retry Mechanisms

Add retry buttons for failed operations:

```tsx
{error && (
  <div>
    <ErrorMessage error={error} />
    <Button onClick={retry} isLoading={isRetrying}>
      Retry
    </Button>
  </div>
)}
```

## Troubleshooting

### Loading State Stuck

**Symptom:** Loading spinner never clears

**Solution:** Ensure loading state is cleared in error handlers:

```tsx
try {
  await performAction();
} catch (error) {
  // Handle error
} finally {
  setLoading(false); // Always clear
}
```

### Multiple Actions Triggered

**Symptom:** Action fires multiple times from rapid clicks

**Solution:** Disable button during loading:

```tsx
<Button
  onClick={handleAction}
  disabled={isLoading}
  isLoading={isLoading}
>
  Action
</Button>
```

### Spinner Flashing

**Symptom:** Spinner appears briefly for fast operations

**Solution:** Use minimum loading time:

```tsx
const { execute, isLoading } = useAsyncAction(
  performAction,
  { minLoadingTime: 300 }
);
```

## Summary

This implementation provides comprehensive loading state management across all async operations in the Dr Doomgadget frontend:

- ✅ Game creation has loading states
- ✅ Combat actions have loading states
- ✅ WebSocket emissions have loading states
- ✅ Error states clear loading indicators
- ✅ Visual feedback for all user actions
- ✅ Accessible loading indicators
- ✅ Performance optimized (no flashing spinners)
- ✅ Prevents multiple submissions
- ✅ Centralized state management
- ✅ Reusable components and hooks

All async operations now provide clear visual feedback, improving user experience and preventing confusion during loading states.
