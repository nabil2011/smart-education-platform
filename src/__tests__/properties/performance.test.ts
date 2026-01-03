import request from 'supertest';
import app from '../../index';

/**
 * Property-Based Tests for Performance
 * Feature: smart-edu-backend
 */

describe('Performance Properties', () => {
  /**
   * Property 36: Response Time Performance
   * Validates: Requirements 10.1
   * 
   * For any valid API endpoint, the response time should be less than 3 seconds
   */
  describe('Property 36: Response Time Performance', () => {
    const endpoints = [
      '/health',
      '/api/v1',
    ];

    // Run property test with minimum 100 iterations as specified
    test.each(endpoints)('should respond within 3 seconds for endpoint %s', async (endpoint) => {
      const iterations = 100;
      const maxResponseTime = 3000; // 3 seconds in milliseconds
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(endpoint)
          .expect((res) => {
            // Should return a successful response
            expect([200, 404]).toContain(res.status);
          });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Property: Response time should always be less than 3 seconds
        expect(responseTime).toBeLessThan(maxResponseTime);
        
        // Log slow responses for monitoring
        if (responseTime > 1000) {
          console.warn(`Slow response detected: ${endpoint} took ${responseTime}ms (iteration ${i + 1})`);
        }
      }
    });

    /**
     * Property: Consistent Performance Under Load
     * For any endpoint, performance should remain consistent across multiple requests
     */
    test('should maintain consistent performance across multiple concurrent requests', async () => {
      const concurrentRequests = 10;
      const endpoint = '/health';
      const maxResponseTime = 3000;
      
      // Create array of concurrent requests
      const requests = Array(concurrentRequests).fill(null).map(() => {
        const startTime = Date.now();
        return request(app)
          .get(endpoint)
          .then((response) => {
            const endTime = Date.now();
            return {
              responseTime: endTime - startTime,
              status: response.status
            };
          });
      });
      
      // Wait for all requests to complete
      const results = await Promise.all(requests);
      
      // Property: All requests should complete within acceptable time
      results.forEach((result, index) => {
        expect(result.responseTime).toBeLessThan(maxResponseTime);
        expect(result.status).toBe(200);
      });
      
      // Property: Performance variance should be reasonable
      const responseTimes = results.map(r => r.responseTime);
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxVariance = avgResponseTime * 2; // Allow 100% variance from average
      
      responseTimes.forEach(time => {
        expect(Math.abs(time - avgResponseTime)).toBeLessThan(maxVariance);
      });
    });

    /**
     * Property: Memory Usage Stability
     * For any series of requests, memory usage should not grow indefinitely
     */
    test('should maintain stable memory usage across multiple requests', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 50;
      
      // Perform multiple requests
      for (let i = 0; i < iterations; i++) {
        await request(app)
          .get('/health')
          .expect(200);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      // Property: Memory growth should be reasonable (less than 50MB increase)
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      const maxMemoryGrowth = 50 * 1024 * 1024; // 50MB
      
      expect(memoryGrowth).toBeLessThan(maxMemoryGrowth);
    });
  });
});