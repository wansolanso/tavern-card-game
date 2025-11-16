/**
 * SECURITY INTEGRATION TEST: DoS Protection via JSON Payload Size Limit
 *
 * These tests validate that the Express app correctly rejects oversized
 * JSON payloads to prevent Denial of Service attacks (CWE-770).
 *
 * NOTE: These are integration tests that require the full Express app.
 */

const request = require('supertest');
const app = require('../../src/app');

describe('DoS Protection - JSON Payload Size Limit', () => {
  describe('✅ NORMAL PAYLOADS (Should Accept)', () => {
    it('should accept small JSON payload (< 1KB)', async () => {
      const smallPayload = {
        name: 'Test User',
        data: 'a'.repeat(500) // 500 bytes
      };

      const response = await request(app)
        .post('/api/v1/auth/guest')
        .send(smallPayload);

      // Should NOT be rejected due to size
      // (May be 404 or other error, but NOT 413 Payload Too Large)
      expect(response.status).not.toBe(413);
    });

    it('should accept medium JSON payload (< 50KB)', async () => {
      const mediumPayload = {
        description: 'x'.repeat(40000) // 40KB
      };

      const response = await request(app)
        .post('/api/v1/auth/guest')
        .send(mediumPayload);

      expect(response.status).not.toBe(413);
    });

    it('should accept payload at the edge of limit (99KB)', async () => {
      const edgeCasePayload = {
        data: 'a'.repeat(99000) // 99KB
      };

      const response = await request(app)
        .post('/api/v1/auth/guest')
        .send(edgeCasePayload);

      expect(response.status).not.toBe(413);
    });
  });

  describe('❌ DOS ATTACK PAYLOADS (Should Reject)', () => {
    it('should REJECT oversized JSON payload (> 100KB)', async () => {
      const attackPayload = {
        malicious: 'x'.repeat(150000) // 150KB - EXCEEDS LIMIT
      };

      const response = await request(app)
        .post('/api/v1/auth/guest')
        .send(attackPayload)
        .expect(413); // 413 Payload Too Large

      expect(response.body).toHaveProperty('error');
    });

    it('should REJECT extremely large JSON payload (1MB)', async () => {
      const massivePayload = {
        data: 'x'.repeat(1000000) // 1MB
      };

      const response = await request(app)
        .post('/api/v1/games')
        .send(massivePayload)
        .expect(413);
    });

    it('should REJECT deeply nested JSON bomb', async () => {
      // JSON bomb attack: deeply nested objects
      let jsonBomb = 'x';
      for (let i = 0; i < 10000; i++) {
        jsonBomb = `{"a":${jsonBomb}}`;
      }

      const response = await request(app)
        .post('/api/v1/games')
        .set('Content-Type', 'application/json')
        .send(jsonBomb)
        .expect(413);
    });

    it('should REJECT large array payload', async () => {
      const largeArray = {
        items: Array(100000).fill({ data: 'x'.repeat(100) }) // Large array
      };

      const response = await request(app)
        .post('/api/v1/games')
        .send(largeArray)
        .expect(413);
    });
  });

  describe('🛡️ URLENCODED PAYLOAD PROTECTION', () => {
    it('should REJECT oversized urlencoded payload', async () => {
      const largeFormData = 'field=' + 'x'.repeat(150000);

      const response = await request(app)
        .post('/api/v1/auth/guest')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(largeFormData)
        .expect(413);
    });

    it('should REJECT excessive parameters (> 1000)', async () => {
      let excessiveParams = '';
      for (let i = 0; i < 1500; i++) {
        excessiveParams += `param${i}=value&`;
      }

      const response = await request(app)
        .post('/api/v1/games')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(excessiveParams)
        .expect(413);
    });

    it('should accept normal urlencoded payload', async () => {
      const normalFormData = 'name=test&value=123';

      const response = await request(app)
        .post('/api/v1/auth/guest')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(normalFormData);

      expect(response.status).not.toBe(413);
    });
  });

  describe('⚡ PERFORMANCE & EDGE CASES', () => {
    it('should handle empty payloads', async () => {
      const response = await request(app)
        .post('/api/v1/auth/guest')
        .send({});

      expect(response.status).not.toBe(413);
    });

    it('should handle null payload', async () => {
      const response = await request(app)
        .post('/api/v1/auth/guest')
        .set('Content-Type', 'application/json')
        .send('null');

      // Should reject because strict: true only allows objects/arrays
      expect(response.status).toBe(400);
    });

    it('should reject primitive values (strict mode)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/guest')
        .set('Content-Type', 'application/json')
        .send('"just a string"');

      // strict: true rejects primitives
      expect(response.status).toBe(400);
    });

    it('should accept valid JSON array', async () => {
      const response = await request(app)
        .post('/api/v1/auth/guest')
        .set('Content-Type', 'application/json')
        .send('[{"test": "data"}]');

      // Should NOT be rejected due to strict mode (arrays allowed)
      expect(response.status).not.toBe(400);
    });
  });

  describe('📊 RESPONSE VALIDATION', () => {
    it('should return proper error message for oversized payload', async () => {
      const largePayload = {
        data: 'x'.repeat(200000)
      };

      const response = await request(app)
        .post('/api/v1/games')
        .send(largePayload);

      expect(response.status).toBe(413);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/payload|large|size/i);
    });

    it('should include proper headers in rejection', async () => {
      const largePayload = {
        data: 'x'.repeat(200000)
      };

      const response = await request(app)
        .post('/api/v1/games')
        .send(largePayload);

      expect(response.status).toBe(413);
      expect(response.headers).toHaveProperty('content-type');
    });
  });

  describe('🔒 SECURITY HEADERS', () => {
    it('should have Helmet security headers enabled', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .send();

      // Helmet should set these headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});

/**
 * MANUAL TEST SCENARIOS (For Load Testing)
 *
 * To test DoS protection under load, run these manual tests:
 *
 * 1. Concurrent Large Payloads:
 *    ```bash
 *    ab -n 100 -c 10 -p large_payload.json -T application/json \
 *       http://localhost:3000/api/v1/games
 *    ```
 *
 * 2. Memory Exhaustion Test:
 *    ```bash
 *    # Send 1000 requests with 90KB payloads
 *    for i in {1..1000}; do
 *      curl -X POST http://localhost:3000/api/v1/games \
 *        -H "Content-Type: application/json" \
 *        -d '{"data":"'$(head -c 90000 < /dev/zero | tr '\0' 'x')'"}' &
 *    done
 *    ```
 *
 * 3. Slowloris Attack Simulation:
 *    ```bash
 *    slowhttptest -c 1000 -B -g -o slowloris_test \
 *      -i 10 -r 200 -s 8192 -u http://localhost:3000
 *    ```
 *
 * Expected Results:
 * - Server should reject all oversized payloads with 413
 * - Memory usage should remain stable
 * - Server should not crash or become unresponsive
 * - Response time should remain consistent
 */
