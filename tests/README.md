# Memphora TypeScript SDK - Production Tests

Comprehensive test suite for the Memphora TypeScript SDK including Vector Search integration tests.

## Test Files

- **`prod-integration.test.ts`** - Full integration test suite (8 test suites, 25+ tests)
- **`quick-test.ts`** - Quick smoke test for rapid verification
- **`run-prod-tests.sh`** - Test runner script

## Running Tests

### Quick Test (Smoke Test)
```bash
cd sdk-js
npm install
npm run build
npx ts-node tests/quick-test.ts
```

### Full Integration Tests
```bash
cd sdk-js
./tests/run-prod-tests.sh
```

Or with custom configuration:
```bash
export MEMPHORA_API_URL="https://memphora-backend-h7h5s5lkza-uc.a.run.app/api/v1"
export MEMPHORA_API_KEY="your-api-key"
npm test
```

## Test Coverage

### 1. Core Memory Operations
- ✅ Store memories
- ✅ Search with semantic similarity
- ✅ Get formatted context
- ✅ Retrieve all memories

### 2. Vector Search Integration
- ✅ Vector search with embeddings
- ✅ Advanced search with filters
- ✅ Similarity scoring
- ✅ Semantic similarity validation

### 3. Memory Management
- ✅ Update memories
- ✅ Delete specific memories
- ✅ Batch store operations

### 4. Advanced Features
- ✅ Merge memories
- ✅ Find contradictions
- ✅ Get statistics

### 5. Conversation Features
- ✅ Record conversations
- ✅ Store conversation messages

### 6. Error Handling
- ✅ Invalid memory IDs
- ✅ Empty queries
- ✅ Network timeouts

### 7. Performance Tests
- ✅ Bulk operations
- ✅ Search performance

### 8. Vector Search Specific
- ✅ Similarity scores
- ✅ Semantic understanding

## Environment Variables

- `MEMPHORA_API_URL` - API endpoint (default: production URL)
- `MEMPHORA_API_KEY` - API key for authentication
- `NODE_ENV` - Environment (test/production)

## Test Configuration

Tests are configured with:
- **Timeout:** 30 seconds per test
- **Auto-cleanup:** Deletes test data after completion
- **Unique User IDs:** Each test run uses a unique user ID

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run SDK Tests
  env:
    MEMPHORA_API_URL: ${{ secrets.MEMPHORA_API_URL }}
    MEMPHORA_API_KEY: ${{ secrets.MEMPHORA_API_KEY }}
  run: |
    cd sdk-js
    npm install
    npm run build
    npm test
```

## Troubleshooting

### Tests timing out
- Increase timeout in `jest.config.js`
- Check API endpoint is accessible
- Verify Vector Search index is deployed

### Vector Search not working
- Ensure index deployment is complete
- Check backend environment variables
- Verify `VERTEX_AI_INDEX_ID` and `VERTEX_AI_DEPLOYMENT_ID` are correct

### Authentication errors
- Verify `MEMPHORA_API_KEY` is set
- Check API key is valid
- Ensure user has proper permissions

## Expected Output

```
🧪 Memphora TypeScript SDK - Production Tests

Configuration:
  API URL: https://memphora-backend-h7h5s5lkza-uc.a.run.app/api/v1
  User ID: test-user-1699999999999
  Timeout: 30000ms

 PASS  tests/prod-integration.test.ts
  Memphora TypeScript SDK - Production Tests
    1. Core Memory Operations
      ✓ should store a memory (1234ms)
      ✓ should search memories with semantic search (3456ms)
      ✓ should get formatted context (567ms)
      ✓ should retrieve all memories (890ms)
    2. Vector Search Integration
      ✓ should perform vector search with embeddings (4567ms)
      ✓ should handle advanced search with filters (2345ms)
    ...

Test Suites: 8 passed, 8 total
Tests:       25 passed, 25 total
Time:        45.678s

✅ All tests passed!
```

## Notes

- Tests use production API endpoint
- Each test run creates a unique user ID
- All test data is automatically cleaned up
- Vector Search tests include 1-2 second delays for indexing
- Performance tests validate response times
