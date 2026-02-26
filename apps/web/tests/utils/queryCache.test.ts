import { QueryCache } from '../../src/utils/queryCache';

describe('QueryCache', () => {
  let cache: QueryCache;

  beforeEach(() => {
    cache = new QueryCache(1000); // 1 second TTL for testing
  });

  describe('Basic Operations', () => {
    it('should store and retrieve cached data', () => {
      const data = { id: 1, name: 'Test' };
      cache.set('test-key', data);

      const retrieved = cache.get<typeof data>('test-key');
      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should overwrite existing keys', () => {
      cache.set('key', 'value1');
      cache.set('key', 'value2');

      const result = cache.get<string>('key');
      expect(result).toBe('value2');
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should return null for expired entries', async () => {
      cache.set('key', 'value', 100); // 100ms TTL

      // Should be available immediately
      expect(cache.get('key')).toBe('value');

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      expect(cache.get('key')).toBeNull();
    });

    it('should use custom TTL when provided', async () => {
      cache.set('short-ttl', 'value', 50);
      cache.set('long-ttl', 'value', 200);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cache.get('short-ttl')).toBeNull();
      expect(cache.get('long-ttl')).toBe('value');
    });

    it('should use default TTL when not specified', async () => {
      cache.set('key', 'value');

      // Should still be valid after 500ms (default is 1000ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(cache.get('key')).toBe('value');

      // Should be expired after 1100ms
      await new Promise(resolve => setTimeout(resolve, 600));
      expect(cache.get('key')).toBeNull();
    });
  });

  describe('Invalidation', () => {
    it('should invalidate specific keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.invalidate('key1');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should invalidate keys matching string pattern', () => {
      cache.set('weekly-stats-2024-01', 'data1');
      cache.set('weekly-stats-2024-02', 'data2');
      cache.set('daily-stats-2024-01', 'data3');

      cache.invalidatePattern('weekly-stats-');

      expect(cache.get('weekly-stats-2024-01')).toBeNull();
      expect(cache.get('weekly-stats-2024-02')).toBeNull();
      expect(cache.get('daily-stats-2024-01')).toBe('data3');
    });

    it('should invalidate keys matching regex pattern', () => {
      cache.set('weekly-stats-current', 'data1');
      cache.set('daily-stats-current', 'data2');
      cache.set('urgent-tasks-current', 'data3');
      cache.set('other-data', 'data4');

      cache.invalidatePattern(/^(weekly-stats|daily-stats|urgent-tasks)-/);

      expect(cache.get('weekly-stats-current')).toBeNull();
      expect(cache.get('daily-stats-current')).toBeNull();
      expect(cache.get('urgent-tasks-current')).toBeNull();
      expect(cache.get('other-data')).toBe('data4');
    });

    it('should handle special regex characters in string patterns', () => {
      cache.set('key.with.dots', 'value1');
      cache.set('key-with-dashes', 'value2');

      cache.invalidatePattern('key.with.dots');

      expect(cache.get('key.with.dots')).toBeNull();
      expect(cache.get('key-with-dashes')).toBe('value2');
    });
  });

  describe('Clear', () => {
    it('should clear all cached data', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });

    it('should update statistics after invalidation', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.invalidate('key1');

      const stats = cache.getStats();
      expect(stats.size).toBe(1);
      expect(stats.keys).toEqual(['key2']);
    });
  });

  describe('Complex Data Types', () => {
    it('should cache arrays', () => {
      const data = [1, 2, 3, 4, 5];
      cache.set('array', data);

      const retrieved = cache.get<number[]>('array');
      expect(retrieved).toEqual(data);
    });

    it('should cache objects with nested properties', () => {
      const data = {
        user: { id: 1, name: 'Test' },
        tasks: [{ id: 1, title: 'Task 1' }],
        metadata: { count: 10 },
      };

      cache.set('complex', data);

      const retrieved = cache.get<typeof data>('complex');
      expect(retrieved).toEqual(data);
    });

    it('should cache null and undefined values', () => {
      cache.set('null-value', null);
      cache.set('undefined-value', undefined);

      // Note: null is a valid cached value
      expect(cache.get('null-value')).toBeNull();
      
      // undefined is also cached (different from key not existing)
      const result = cache.get('undefined-value');
      expect(result).toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should handle large number of cache entries', () => {
      const count = 1000;

      for (let i = 0; i < count; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      const stats = cache.getStats();
      expect(stats.size).toBe(count);

      // Verify random samples
      expect(cache.get('key-0')).toBe('value-0');
      expect(cache.get('key-500')).toBe('value-500');
      expect(cache.get('key-999')).toBe('value-999');
    });

    it('should efficiently invalidate patterns with many entries', () => {
      // Add 100 entries with different prefixes
      for (let i = 0; i < 100; i++) {
        cache.set(`weekly-${i}`, `value-${i}`);
        cache.set(`daily-${i}`, `value-${i}`);
      }

      const startTime = performance.now();
      cache.invalidatePattern(/^weekly-/);
      const endTime = performance.now();

      // Should be fast (<10ms even with 200 entries)
      expect(endTime - startTime).toBeLessThan(10);

      // Verify invalidation
      expect(cache.get('weekly-0')).toBeNull();
      expect(cache.get('daily-0')).toBe('value-0');
    });
  });
});
