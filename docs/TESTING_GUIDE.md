# Testing Guide - Dr Doomgadget Tavern Card Game

This guide provides comprehensive information on testing strategies, running tests, writing new tests, and understanding test coverage for the Tavern Card Game project.

## Table of Contents

- [Overview](#overview)
- [Test Architecture](#test-architecture)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Goals](#coverage-goals)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The project uses a dual testing framework approach:
- **Backend**: Jest for Node.js/Express testing
- **Frontend**: Vitest for React/TypeScript testing

### Test Statistics

**Backend (Jest)**
- **Total Tests**: 101 passing
- **Coverage**: ~36% overall (Services: 72%, Utils: 100%)
- **Test Files**: 5 test suites

**Frontend (Vitest)**
- **Total Tests**: 73 passing
- **Coverage**: ~41% overall (Store: 100%, Hooks: 91%, UI: 100%)
- **Test Files**: 4 test suites

## Test Architecture

### Backend Structure

```
src/
├── services/
│   └── __tests__/
│       ├── AuthService.test.js
│       ├── GameService.test.js
│       ├── CombatService.test.js
│       └── CardService.test.js
└── utils/
    └── __tests__/
        └── validation.test.js

tests/
└── setup.js           # Global test configuration
```

### Frontend Structure

```
client/src/
├── store/
│   └── __tests__/
│       └── gameSlice.test.ts
├── hooks/
│   └── __tests__/
│       └── useAsyncAction.test.ts
├── components/
│   └── UI/
│       └── __tests__/
│           └── Button.test.tsx
└── tests/
    └── setup.ts       # Global test configuration
```

## Running Tests

### Backend Tests

```bash
# Run all backend tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Generate coverage report
npm run test:coverage
```

### Frontend Tests

```bash
# Navigate to client directory
cd client

# Run all frontend tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Open interactive UI
npm run test:ui

# Generate HTML coverage report
npm run test:coverage
```

### Run All Tests

```bash
# From project root
npm test && cd client && npm test && cd ..
```

## Writing Tests

### Backend Test Example (Jest)

#### Service Test Template

```javascript
const ServiceName = require('../ServiceName');
const Repository = require('../../repositories/Repository');

jest.mock('../../repositories/Repository');

describe('ServiceName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should perform expected action', async () => {
      // Arrange
      const mockData = { id: 1, name: 'Test' };
      Repository.method.mockResolvedValue(mockData);

      // Act
      const result = await ServiceName.methodName(1);

      // Assert
      expect(result).toEqual(mockData);
      expect(Repository.method).toHaveBeenCalledWith(1);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const error = new Error('Database error');
      Repository.method.mockRejectedValue(error);

      // Act & Assert
      await expect(ServiceName.methodName(1)).rejects.toThrow('Database error');
    });
  });
});
```

#### Validation Test Template

```javascript
const validators = require('../validation');
const { ValidationError } = require('../errors');

describe('Validation Utilities', () => {
  describe('requirePositiveInteger', () => {
    it('should accept valid values', () => {
      expect(validators.requirePositiveInteger(5, 'test')).toBe(5);
    });

    it('should reject invalid values', () => {
      expect(() => validators.requirePositiveInteger(0, 'test')).toThrow(ValidationError);
      expect(() => validators.requirePositiveInteger(-1, 'test')).toThrow(ValidationError);
    });
  });
});
```

### Frontend Test Example (Vitest)

#### Store Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createSlice, type Slice } from '../slices/slice';

describe('Slice', () => {
  let store: ReturnType<typeof create<Slice>>;

  beforeEach(() => {
    store = create<Slice>(createSlice);
  });

  it('should initialize with correct values', () => {
    const state = store.getState();
    expect(state.value).toBe(initialValue);
  });

  it('should update state correctly', () => {
    store.getState().action(newValue);
    expect(store.getState().value).toBe(newValue);
  });
});
```

#### Hook Test Template

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCustomHook } from '../useCustomHook';

describe('useCustomHook', () => {
  it('should handle async operations', async () => {
    const mockFn = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useCustomHook(mockFn));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.data).toBe('result');
    });
  });
});
```

#### Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Component } from '../Component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component>Text</Component>);
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('should handle interactions', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Component onClick={handleClick}>Click</Component>);

    await user.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Coverage Goals

### Current Coverage Thresholds

Both backend and frontend are configured with 60% coverage thresholds:

- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 60%
- **Statements**: 60%

### Priority Coverage Areas

**Critical Paths (Target: 80%+)**
- ✅ Authentication & Security (AuthService: 80%)
- ✅ Game Logic (GameService: 66%)
- ✅ Combat System (CombatService: 87%)
- ✅ Input Validation (100%)

**High Value (Target: 70%+)**
- ✅ Card Management (CardService: 67%)
- ✅ State Management (Zustand: 100%)
- ✅ Async Operations (useAsyncAction: 91%)

**Standard Coverage (Target: 60%+)**
- ⚠️ Overall project coverage currently at ~36-41%

### Coverage Reports

**View Backend Coverage**
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

**View Frontend Coverage**
```bash
cd client && npm run test:coverage
# Open coverage/index.html in browser
```

## Best Practices

### General Testing Principles

1. **Follow AAA Pattern**
   - **Arrange**: Set up test data and mocks
   - **Act**: Execute the code being tested
   - **Assert**: Verify expected outcomes

2. **Test Behavior, Not Implementation**
   ```javascript
   // ❌ Bad: Testing implementation details
   it('should call internal method', () => {
     expect(service._privateMethod).toHaveBeenCalled();
   });

   // ✅ Good: Testing behavior
   it('should return correct result', () => {
     expect(service.publicMethod()).toBe(expectedResult);
   });
   ```

3. **Keep Tests Isolated**
   - Each test should run independently
   - Use `beforeEach` to reset state
   - Clear mocks between tests

4. **Write Descriptive Test Names**
   ```javascript
   // ❌ Bad
   it('test 1', () => { /* ... */ });

   // ✅ Good
   it('should create guest player and return JWT token', () => { /* ... */ });
   ```

5. **Test Edge Cases**
   - Null/undefined inputs
   - Empty arrays/objects
   - Boundary values
   - Error scenarios

### Backend-Specific

1. **Mock External Dependencies**
   ```javascript
   jest.mock('../../repositories/Repository');
   jest.mock('../config/redis');
   ```

2. **Use Test Utilities**
   ```javascript
   const mockPlayer = global.testUtils.createMockPlayer({ id: 123 });
   ```

3. **Handle Async Operations Properly**
   ```javascript
   it('should handle async errors', async () => {
     await expect(service.method()).rejects.toThrow('Error');
   });
   ```

### Frontend-Specific

1. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     cleanup();
   });
   ```

2. **Use User Event for Interactions**
   ```typescript
   const user = userEvent.setup();
   await user.click(button);
   ```

3. **Wait for Async Updates**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

## Mocking Strategies

### Backend Mocks

**Database Mocking**
```javascript
// Already configured in tests/setup.js
jest.mock('../src/config/database');
```

**Repository Mocking**
```javascript
jest.mock('../../repositories/CardRepository');

CardRepository.findById.mockResolvedValue(mockCard);
CardRepository.create.mockRejectedValue(new Error('Duplicate'));
```

**Redis Mocking**
```javascript
// Already configured in tests/setup.js
// Returns null for all Redis operations
```

### Frontend Mocks

**Socket.IO Mocking**
```typescript
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));
```

**API Mocking**
```typescript
vi.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.post.mockResolvedValue({ data: mockResponse });
```

## Troubleshooting

### Common Issues

**Backend: UUID ES Module Error**
- **Solution**: Already handled in `tests/setup.js` with UUID mock

**Backend: Database Connection Errors**
- **Solution**: Database is mocked in `tests/setup.js`

**Frontend: Coverage Dependency Missing**
- **Solution**: Run `npm install -D @vitest/coverage-v8`

**Frontend: Component Not Rendering**
- **Check**: Imports are correct and providers are wrapped if needed
- **Solution**: Use custom render with providers if required

**Tests Hanging**
- **Check**: All async operations properly awaited
- **Solution**: Add `timeout` to test or use `done` callback

### Debugging Tests

**Backend**
```bash
# Run specific test file
npx jest src/services/__tests__/AuthService.test.js

# Run with verbose output
npx jest --verbose

# Run single test
npx jest -t "should create guest player"
```

**Frontend**
```bash
# Run specific test file
npx vitest src/store/__tests__/gameSlice.test.ts

# Run with UI
npx vitest --ui

# Run single test
npx vitest -t "should initialize with correct values"
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://testingjavascript.com/)

## Continuous Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Backend Tests
  run: npm test

- name: Frontend Tests
  run: cd client && npm test
```

## Coverage Improvement Plan

To reach 60% overall coverage:

1. **Add Controller Tests** (currently 0% coverage)
2. **Add Middleware Tests** (currently 0% coverage)
3. **Add Repository Tests** (currently ~6% coverage)
4. **Add Error Handler Tests** (frontend currently 0%)
5. **Add WebSocket Handler Tests** (currently 0%)

Focus on high-value, frequently-used code paths first.
