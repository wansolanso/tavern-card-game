# Error Code Reference

This document provides a comprehensive reference for all standardized error codes in the Dr Doomgadget application.

## Error Code Format

All error codes follow this format: `CATEGORY_NNN`

- **CATEGORY**: Indicates the source/type of error (AUTH, GAME, CARD, COMBAT, etc.)
- **NNN**: Three-digit sequential number within that category

Each error includes:
- **Code**: Unique identifier (e.g., `AUTH_001`)
- **Message**: User-friendly brief description
- **Action**: Actionable guidance for the user
- **HTTP Status**: Status code for backend errors

---

## Authentication Errors (AUTH_xxx)

### AUTH_001: Authentication required
- **Message**: Authentication required
- **Action**: Please provide a valid session token in cookies or Authorization header
- **HTTP Status**: 401
- **Cause**: No authentication token provided in request
- **Resolution**: Create a new guest session or provide valid session token

### AUTH_002: Invalid session token
- **Message**: Invalid session token
- **Action**: Your session is invalid. Please create a new guest session
- **HTTP Status**: 401
- **Cause**: Session token format is invalid or signature verification failed
- **Resolution**: Create a new guest session

### AUTH_003: Session has expired
- **Message**: Session has expired
- **Action**: Your session expired after 24 hours. Please create a new guest session
- **HTTP Status**: 401
- **Cause**: Session token exceeded 24-hour TTL
- **Resolution**: Create a new guest session

### AUTH_004: Session not found
- **Message**: Session not found
- **Action**: Your session could not be found. Please create a new guest session
- **HTTP Status**: 401
- **Cause**: Session does not exist in database or cache
- **Resolution**: Create a new guest session

### AUTH_005: Invalid authentication token format
- **Message**: Invalid authentication token format
- **Action**: The token format is invalid. Please create a new guest session
- **HTTP Status**: 401
- **Cause**: JWT signature verification failed
- **Resolution**: Create a new guest session

---

## Game Errors (GAME_xxx)

### GAME_001: Game not found
- **Message**: Game not found
- **Action**: The game does not exist or has been deleted. Please create a new game
- **HTTP Status**: 404
- **Cause**: Game ID does not exist in database
- **Resolution**: Create a new game

### GAME_002: Invalid game phase for this action
- **Message**: Invalid game phase for this action
- **Action**: This action cannot be performed in the current game phase
- **HTTP Status**: 400
- **Cause**: Attempted action is not allowed in current phase (tavern/combat/boss/defeat)
- **Resolution**: Wait for appropriate game phase or perform different action

### GAME_003: Player has been defeated
- **Message**: Player has been defeated
- **Action**: Your HP reached zero. Please start a new game
- **HTTP Status**: 400
- **Cause**: Player HP dropped to 0 or below
- **Resolution**: Start a new game

### GAME_004: Failed to create game
- **Message**: Failed to create game
- **Action**: An error occurred while creating the game. Please try again
- **HTTP Status**: 500
- **Cause**: Database error or tavern initialization failed
- **Resolution**: Retry game creation

### GAME_005: Failed to load game state
- **Message**: Failed to load game state
- **Action**: Could not retrieve game data. Please refresh or start a new game
- **HTTP Status**: 500
- **Cause**: Database query failed or game state corrupted
- **Resolution**: Refresh page or create new game

---

## Card Errors (CARD_xxx)

### CARD_001: Card not found
- **Message**: Card not found
- **Action**: The requested card does not exist or has been removed
- **HTTP Status**: 404
- **Cause**: Card ID does not exist in database
- **Resolution**: Select a different card

### CARD_002: Invalid equipment slot type
- **Message**: Invalid equipment slot type
- **Action**: Please select a valid slot: hp, shield, special, passive, or normal
- **HTTP Status**: 400
- **Cause**: Slot type is not one of the valid options
- **Resolution**: Use valid slot type (hp, shield, special, passive, normal)

### CARD_003: Equipment slot is full
- **Message**: Equipment slot is full
- **Action**: Unequip a card from this slot or upgrade the slot capacity
- **HTTP Status**: 409
- **Cause**: Slot has reached its current capacity limit
- **Resolution**: Unequip existing card or upgrade slot capacity

### CARD_004: Card is not in your hand
- **Message**: Card is not in your hand
- **Action**: You can only equip cards from your hand
- **HTTP Status**: 400
- **Cause**: Attempted to equip a card that is not in player's hand
- **Resolution**: Acquire card to hand first, then equip

### CARD_005: Card is not equipped
- **Message**: Card is not equipped
- **Action**: The card must be equipped before you can unequip it
- **HTTP Status**: 400
- **Cause**: Attempted to unequip a card that is not currently equipped
- **Resolution**: Only attempt to unequip cards that are equipped

### CARD_006: Failed to generate random cards
- **Message**: Failed to generate random cards
- **Action**: Not enough cards available. Please try again later
- **HTTP Status**: 500
- **Cause**: Insufficient cards in database to fulfill random selection
- **Resolution**: Add more cards to database or reduce tavern size

---

## Combat Errors (COMBAT_xxx)

### COMBAT_001: Invalid combat target
- **Message**: Invalid combat target
- **Action**: Please select a valid enemy card from the tavern
- **HTTP Status**: 400
- **Cause**: Target is not a valid combat target
- **Resolution**: Select a card from the tavern

### COMBAT_002: Target card not found in tavern
- **Message**: Target card not found in tavern
- **Action**: The target card is no longer in the tavern. Please select another target
- **HTTP Status**: 400
- **Cause**: Target card ID does not exist in tavern (may have been defeated)
- **Resolution**: Select a different tavern card

### COMBAT_003: No attack power available
- **Message**: No attack power available
- **Action**: Equip cards in your HP slot to gain attack power before attacking
- **HTTP Status**: 400
- **Cause**: Player has no cards equipped in HP slot (attack = 0)
- **Resolution**: Equip cards with HP to gain attack power

### COMBAT_004: Combat already in progress
- **Message**: Combat already in progress
- **Action**: Wait for the current combat to finish before attacking again
- **HTTP Status**: 409
- **Cause**: Previous combat action is still processing
- **Resolution**: Wait for combat to complete

### COMBAT_005: Combat action failed
- **Message**: Combat action failed
- **Action**: An error occurred during combat. Please try again
- **HTTP Status**: 500
- **Cause**: Unexpected error during combat processing
- **Resolution**: Retry combat action

---

## Validation Errors (VALIDATION_xxx)

### VALIDATION_001: Invalid input provided
- **Message**: Invalid input provided
- **Action**: Please check your input and try again
- **HTTP Status**: 400

### VALIDATION_002: Required field is missing
- **Message**: Required field is missing
- **Action**: Please provide all required fields
- **HTTP Status**: 400

### VALIDATION_003: Invalid data type
- **Message**: Invalid data type
- **Action**: The provided data type does not match the expected format
- **HTTP Status**: 400

### VALIDATION_004: Invalid ID format
- **Message**: Invalid ID format
- **Action**: IDs must be positive integers
- **HTTP Status**: 400

### VALIDATION_005: Expected array but received different type
- **Message**: Expected array but received different type
- **Action**: The parameter must be an array
- **HTTP Status**: 400

### VALIDATION_006: Invalid string value
- **Message**: Invalid string value
- **Action**: The parameter must be a non-empty string
- **HTTP Status**: 400

### VALIDATION_007: Value is out of valid range
- **Message**: Value is out of valid range
- **Action**: Please provide a value within the acceptable range
- **HTTP Status**: 400

---

## Rate Limiting Errors (RATE_xxx)

### RATE_001: Too many requests
- **Message**: Too many requests
- **Action**: You have exceeded the rate limit. Please wait a moment before trying again
- **HTTP Status**: 429
- **Cause**: Request rate exceeded configured limit
- **Resolution**: Wait before making additional requests

### RATE_002: Too many game creation requests
- **Message**: Too many game creation requests
- **Action**: Please wait before creating another game
- **HTTP Status**: 429

### RATE_003: Too many session creation requests
- **Message**: Too many session creation requests
- **Action**: Please wait before creating another session
- **HTTP Status**: 429

---

## Database Errors (DB_xxx)

### DB_001: Database connection failed
- **Message**: Database connection failed
- **Action**: Unable to connect to database. Please try again later
- **HTTP Status**: 503

### DB_002: Database query failed
- **Message**: Database query failed
- **Action**: An error occurred while accessing the database. Please try again
- **HTTP Status**: 500

### DB_003: Database transaction failed
- **Message**: Database transaction failed
- **Action**: The operation could not be completed. Please try again
- **HTTP Status**: 500

### DB_004: Database constraint violated
- **Message**: Database constraint violated
- **Action**: The operation violates data integrity rules. Please check your input
- **HTTP Status**: 409

---

## Cache Errors (CACHE_xxx)

### CACHE_001: Cache service unavailable
- **Message**: Cache service unavailable
- **Action**: Redis cache is temporarily unavailable. The application will continue without caching
- **HTTP Status**: 503
- **Note**: Non-critical error, application continues without cache

### CACHE_002: Failed to read from cache
- **Message**: Failed to read from cache
- **Action**: Cache read failed. Data will be fetched from database
- **HTTP Status**: 500
- **Note**: Automatically falls back to database

### CACHE_003: Failed to write to cache
- **Message**: Failed to write to cache
- **Action**: Cache write failed. The operation will continue without caching
- **HTTP Status**: 500
- **Note**: Operation continues successfully without cache

---

## Server Errors (SERVER_xxx)

### SERVER_001: Internal server error
- **Message**: Internal server error
- **Action**: An unexpected error occurred. Please try again or contact support
- **HTTP Status**: 500

### SERVER_002: Service temporarily unavailable
- **Message**: Service temporarily unavailable
- **Action**: The service is temporarily down. Please try again later
- **HTTP Status**: 503

### SERVER_003: Request timeout
- **Message**: Request timeout
- **Action**: The request took too long to process. Please try again
- **HTTP Status**: 504

---

## Resource Errors (RESOURCE_xxx)

### RESOURCE_001: Resource not found
- **Message**: Resource not found
- **Action**: The requested resource does not exist
- **HTTP Status**: 404

### RESOURCE_002: Resource already exists
- **Message**: Resource already exists
- **Action**: A resource with this identifier already exists
- **HTTP Status**: 409

### RESOURCE_003: Resource conflict
- **Message**: Resource conflict
- **Action**: The operation conflicts with the current state of the resource
- **HTTP Status**: 409

---

## Frontend-Only Errors

### NETWORK_001: No internet connection
- **Message**: No internet connection
- **Action**: Please check your network connection and try again
- **Severity**: Warning

### NETWORK_002: Request timed out
- **Message**: Request timed out
- **Action**: The server is taking too long to respond. Please try again
- **Severity**: Warning

### NETWORK_003: Network request failed
- **Message**: Network request failed
- **Action**: Unable to reach the server. Please check your connection
- **Severity**: Warning

### WEBSOCKET_001: Connection lost
- **Message**: Connection lost
- **Action**: Attempting to reconnect...
- **Severity**: Warning

### WEBSOCKET_002: Unable to connect to game server
- **Message**: Unable to connect to game server
- **Action**: Please refresh the page or try again later
- **Severity**: Error

### WEBSOCKET_003: Reconnecting to server
- **Message**: Reconnecting to server
- **Action**: Please wait while we restore your connection
- **Severity**: Info

### WEBSOCKET_004: Connection failed after multiple attempts
- **Message**: Connection failed after multiple attempts
- **Action**: Please refresh the page to reconnect
- **Severity**: Critical

### UI_001: Invalid input
- **Message**: Invalid input
- **Action**: Please check your input and try again
- **Severity**: Error

### UI_002: Component error
- **Message**: Component error
- **Action**: An error occurred. Please refresh the page
- **Severity**: Error

### UI_003: Failed to render component
- **Message**: Failed to render component
- **Action**: Please refresh the page. If the issue persists, clear your browser cache
- **Severity**: Error

### STATE_001: Failed to sync game state
- **Message**: Failed to sync game state
- **Action**: Please refresh the page to reload the latest game state
- **Severity**: Error

### STATE_002: Game state corrupted
- **Message**: Game state corrupted
- **Action**: Local game state is corrupted. Please refresh to reload from server
- **Severity**: Critical

### UNKNOWN_001: An unexpected error occurred
- **Message**: An unexpected error occurred
- **Action**: Please try again. If the problem persists, refresh the page
- **Severity**: Error

---

## Error Severity Levels

Errors are classified by severity:

- **INFO**: Informational messages, no action needed
- **WARNING**: Recoverable issues, operation may continue
- **ERROR**: Operation failed, user action required
- **CRITICAL**: Critical failure, requires session refresh or page reload

---

## Common Resolution Patterns

### For Authentication Errors (AUTH_xxx)
1. Create a new guest session via POST `/api/auth/guest`
2. Session tokens are valid for 24 hours

### For Game Errors (GAME_xxx)
1. Create a new game via POST `/api/games`
2. Refresh page to reload current game state

### For Card/Combat Errors (CARD_xxx, COMBAT_xxx)
1. Verify current game state
2. Ensure cards are in correct location (hand/equipped/tavern)
3. Check slot capacity and upgrade if needed

### For Network/WebSocket Errors
1. Check internet connectivity
2. Refresh page to re-establish connection
3. Wait for automatic reconnection (exponential backoff)

---

## Developer Notes

### Backend Error Handling
```javascript
// Use standardized error responses
const { sendErrorResponse } = require('../utils/errorResponse');

// In controller/middleware
sendErrorResponse(res, 'AUTH_MISSING_TOKEN');

// In service (throw enhanced error)
const { createEnhancedError } = require('../utils/errorResponse');
throw createEnhancedError('CARD_SLOT_FULL', { slot: 'hp' });
```

### Frontend Error Handling
```typescript
// Parse backend errors
import { parseBackendError } from '../utils/errorHandler';
const errorDef = parseBackendError(error);

// Display error message
import { ErrorMessage } from '../components/UI/ErrorMessage';
<ErrorMessage code={errorDef.code} message={errorDef.message} action={errorDef.action} />
```

### Testing Error Responses
```bash
# Test authentication error
curl -X GET http://localhost:3000/api/games/1

# Test invalid game ID
curl -X GET http://localhost:3000/api/games/99999 -H "Authorization: Bearer <token>"

# Test combat with no attack power
# (equip no cards, then attempt attack)
```

---

## Change Log

**2025-01-16**: Initial error standardization implementation
- Created comprehensive error code system
- Implemented backend error constants and helpers
- Implemented frontend error parsing and display
- Updated all services and middleware to use standardized errors
