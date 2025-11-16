/**
 * N+1 Query Optimization Test Script
 *
 * Tests the optimized query patterns to verify query count reduction.
 *
 * Usage:
 *   ENABLE_QUERY_LOGGING=true node scripts/test-n1-optimization.js
 *
 * Expected Results:
 *   - Card catalog loading: 2 queries (was 51)
 *   - Game state loading: 5 queries (was 28)
 *   - Tavern card loading: 2 queries (was 10)
 */

const { getQueryStats, resetQueryCounter } = require('../src/config/database');
const CardRepository = require('../src/repositories/CardRepository');
const GameRepository = require('../src/repositories/GameRepository');
const GameService = require('../src/services/GameService');

// Enable query logging, make Redis optional for testing
process.env.ENABLE_QUERY_LOGGING = 'true';
process.env.REDIS_OPTIONAL = 'true';
process.env.NODE_ENV = 'test';

async function runTests() {
  console.log('\n========================================');
  console.log('N+1 Query Optimization Test Suite');
  console.log('========================================\n');

  try {
    // Test 1: Card Catalog Loading
    console.log('[Test 1] Card Catalog Loading');
    console.log('Expected: 2 queries (cards + abilities)');
    console.log('Before optimization: ~51 queries\n');

    resetQueryCounter();
    const allCards = await CardRepository.getAllCards();
    const test1Stats = getQueryStats();

    console.log(`Result: ${test1Stats.count} queries`);
    console.log(`Total time: ${test1Stats.totalTime}ms`);
    console.log(`Cards loaded: ${allCards.length}`);
    console.log(`Improvement: ${((1 - test1Stats.count / 51) * 100).toFixed(1)}% reduction`);
    console.log(test1Stats.count <= 2 ? '✓ PASS' : '✗ FAIL - Expected ≤2 queries');
    console.log('');

    // Test 2: Random Cards (Tavern Initialization)
    console.log('[Test 2] Random Cards Loading (9 cards)');
    console.log('Expected: 2 queries (cards + abilities)');
    console.log('Before optimization: ~10 queries\n');

    resetQueryCounter();
    const randomCards = await CardRepository.getRandomCards(9);
    const test2Stats = getQueryStats();

    console.log(`Result: ${test2Stats.count} queries`);
    console.log(`Total time: ${test2Stats.totalTime}ms`);
    console.log(`Cards loaded: ${randomCards.length}`);
    console.log(`Improvement: ${((1 - test2Stats.count / 10) * 100).toFixed(1)}% reduction`);
    console.log(test2Stats.count <= 2 ? '✓ PASS' : '✗ FAIL - Expected ≤2 queries');
    console.log('');

    // Test 3: Single Card Loading
    console.log('[Test 3] Single Card Loading');
    console.log('Expected: 2 queries (card + abilities)');
    console.log('Before optimization: 2 queries\n');

    resetQueryCounter();
    const singleCard = await CardRepository.findById(allCards[0].id);
    const test3Stats = getQueryStats();

    console.log(`Result: ${test3Stats.count} queries`);
    console.log(`Total time: ${test3Stats.totalTime}ms`);
    console.log(`Card: ${singleCard.name}`);
    console.log(`Abilities: ${Object.keys(singleCard.abilities || {}).length} types`);
    console.log(test3Stats.count <= 2 ? '✓ PASS' : '✗ FAIL - Expected ≤2 queries');
    console.log('');

    // Test 4: Cards by Rarity
    console.log('[Test 4] Cards by Rarity (common)');
    console.log('Expected: 2 queries (cards + abilities)');
    console.log('Before optimization: ~20+ queries\n');

    resetQueryCounter();
    const commonCards = await CardRepository.getCardsByRarity('common');
    const test4Stats = getQueryStats();

    console.log(`Result: ${test4Stats.count} queries`);
    console.log(`Total time: ${test4Stats.totalTime}ms`);
    console.log(`Cards loaded: ${commonCards.length}`);
    console.log(`Improvement: ${((1 - test4Stats.count / (commonCards.length + 1)) * 100).toFixed(1)}% reduction`);
    console.log(test4Stats.count <= 2 ? '✓ PASS' : '✗ FAIL - Expected ≤2 queries');
    console.log('');

    // Test 5: Game State Loading (requires an actual game)
    console.log('[Test 5] Game State Loading');
    console.log('Expected: ~5 queries (game + 3 card types + 1 bulk abilities + slot upgrades)');
    console.log('Before optimization: ~28 queries\n');

    // Create a test game first
    console.log('Creating test game...');
    resetQueryCounter();
    const testGame = await GameService.createGame(1);
    const gameCreationStats = getQueryStats();

    console.log(`Game creation: ${gameCreationStats.count} queries`);
    console.log('');

    // Now load the game state
    resetQueryCounter();
    const loadedGame = await GameService.getGame(testGame.id);
    const test5Stats = getQueryStats();

    console.log(`Result: ${test5Stats.count} queries`);
    console.log(`Total time: ${test5Stats.totalTime}ms`);
    console.log(`Hand cards: ${loadedGame.hand.length}`);
    console.log(`Tavern cards: ${loadedGame.tavern.length}`);
    console.log(`Equipped slots: ${Object.keys(loadedGame.equipped).length}`);

    // Count cards with abilities
    const tavernCardsWithAbilities = loadedGame.tavern.filter(c => c.abilities).length;
    console.log(`Tavern cards with abilities: ${tavernCardsWithAbilities}/${loadedGame.tavern.length}`);

    console.log(`Improvement: ${((1 - test5Stats.count / 28) * 100).toFixed(1)}% reduction`);
    console.log(test5Stats.count <= 6 ? '✓ PASS' : '✗ FAIL - Expected ≤6 queries');
    console.log('');

    // Summary
    console.log('========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Test 1 (Card Catalog): ${test1Stats.count} queries - ${test1Stats.count <= 2 ? 'PASS' : 'FAIL'}`);
    console.log(`Test 2 (Random Cards): ${test2Stats.count} queries - ${test2Stats.count <= 2 ? 'PASS' : 'FAIL'}`);
    console.log(`Test 3 (Single Card): ${test3Stats.count} queries - ${test3Stats.count <= 2 ? 'PASS' : 'FAIL'}`);
    console.log(`Test 4 (Cards by Rarity): ${test4Stats.count} queries - ${test4Stats.count <= 2 ? 'PASS' : 'FAIL'}`);
    console.log(`Test 5 (Game State): ${test5Stats.count} queries - ${test5Stats.count <= 6 ? 'PASS' : 'FAIL'}`);
    console.log('');

    const allPassed = test1Stats.count <= 2 && test2Stats.count <= 2 &&
                      test3Stats.count <= 2 && test4Stats.count <= 2 &&
                      test5Stats.count <= 6;

    if (allPassed) {
      console.log('✓ ALL TESTS PASSED - N+1 optimizations working correctly!');
    } else {
      console.log('✗ SOME TESTS FAILED - Review query patterns');
    }
    console.log('');

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
