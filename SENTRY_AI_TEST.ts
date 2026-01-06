/**
 * Sentry AI Monitoring - Verification Test
 *
 * Run this code in production to verify AI monitoring is working correctly.
 * Add this temporarily to any component or run in browser console.
 */

import {
  trackSimpleGeneration,
  trackCustomGeneration,
  trackStemSeparation,
  trackSunoAgent,
  trackSunoTool,
  addAIBreadcrumb,
  setAIAttributes,
} from '@/lib/sentryAI';

// ==========================================
// Test 1: Simple Generation (Fastest)
// ==========================================

export async function testSimpleGeneration() {
  console.log('[AI Test] Testing simple generation...');

  try {
    const result = await trackSimpleGeneration(
      'V5',
      'Upbeat electronic dance music with strong bass',
      false,
      async () => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return mock result
        return {
          success: true,
          taskId: 'test-task-' + Date.now(),
          trackIds: ['track-1', 'track-2'],
          clipsReceived: 2,
          creditsUsed: 1,
          duration: 1000,
        };
      }
    );

    console.log('[AI Test] Simple generation successful:', result);
    return result;
  } catch (error) {
    console.error('[AI Test] Simple generation failed:', error);
    throw error;
  }
}

// ==========================================
// Test 2: Custom Generation
// ==========================================

export async function testCustomGeneration() {
  console.log('[AI Test] Testing custom generation...');

  try {
    const result = await trackCustomGeneration(
      'V5',
      'Test Track',
      '[Verse]\nTest lyrics here\n[Chorus]\nMore test lyrics',
      '[Genre: Pop] [Mood: Happy]',
      false,
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
          success: true,
          taskId: 'custom-task-' + Date.now(),
          expectedClips: 2,
          clipsReceived: 2,
          creditsUsed: 2,
        };
      }
    );

    console.log('[AI Test] Custom generation successful:', result);
    return result;
  } catch (error) {
    console.error('[AI Test] Custom generation failed:', error);
    throw error;
  }
}

// ==========================================
// Test 3: Stem Separation
// ==========================================

export async function testStemSeparation() {
  console.log('[AI Test] Testing stem separation...');

  try {
    const result = await trackStemSeparation(
      'V5',
      'test-track-123',
      'vocals',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
          success: true,
          trackIds: ['vocals-stem', 'instrumental-stem'],
          duration: 2000,
        };
      }
    );

    console.log('[AI Test] Stem separation successful:', result);
    return result;
  } catch (error) {
    console.error('[AI Test] Stem separation failed:', error);
    throw error;
  }
}

// ==========================================
// Test 4: Multi-Step Agent Workflow
// ==========================================

export async function testAgentWorkflow() {
  console.log('[AI Test] Testing agent workflow...');

  try {
    const result = await trackSunoAgent(
      'test-production-workflow',
      { goal: 'create full track' },
      async () => {
        // Step 1: Generate base
        console.log('[AI Test] Step 1: Generating base track...');
        const base = await trackSunoTool(
          'generate-base',
          { style: 'electronic' },
          async () => {
            await new Promise(resolve => setTimeout(resolve, 800));
            addAIBreadcrumb('generation', 'Base track generated', {
              step: '1/3',
            });
            return { success: true, trackId: 'base-123' };
          }
        );

        // Step 2: Add vocals
        console.log('[AI Test] Step 2: Adding vocals...');
        const vocals = await trackSunoTool(
          'add-vocals',
          { baseTrackId: base.trackId },
          async () => {
            await new Promise(resolve => setTimeout(resolve, 800));
            addAIBreadcrumb('generation', 'Vocals added', {
              step: '2/3',
            });
            return { success: true, trackId: 'vocals-456' };
          }
        );

        // Step 3: Separate stems
        console.log('[AI Test] Step 3: Separating stems...');
        const stems = await trackSunoTool(
          'separate-stems',
          { trackId: vocals.trackId },
          async () => {
            await new Promise(resolve => setTimeout(resolve, 800));
            addAIBreadcrumb('generation', 'Stems separated', {
              step: '3/3',
            });
            return {
              success: true,
              stemIds: ['vocals', 'drums', 'bass', 'other'],
            };
          }
        );

        return {
          success: true,
          workflow: {
            baseTrackId: base.trackId,
            vocalsTrackId: vocals.trackId,
            stemIds: stems.stemIds,
          },
        };
      }
    );

    console.log('[AI Test] Agent workflow successful:', result);
    return result;
  } catch (error) {
    console.error('[AI Test] Agent workflow failed:', error);
    throw error;
  }
}

// ==========================================
// Test 5: Manual Attributes
// ==========================================

export async function testManualAttributes() {
  console.log('[AI Test] Testing manual attributes...');

  try {
    const result = await trackCustomGeneration(
      'V5',
      'Attribute Test',
      'Test lyrics',
      'Test style',
      false,
      async () => {
        // Set custom attributes mid-execution
        setAIAttributes({
          'suno.test.custom_field': 'custom_value',
          'suno.test.step': 'processing',
          'suno.test.timestamp': Date.now(),
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Update attributes
        setAIAttributes({
          'suno.test.step': 'completed',
        });

        return { success: true, taskId: 'attr-test-' + Date.now() };
      }
    );

    console.log('[AI Test] Manual attributes test successful:', result);
    return result;
  } catch (error) {
    console.error('[AI Test] Manual attributes test failed:', error);
    throw error;
  }
}

// ==========================================
// Test 6: Error Handling
// ==========================================

export async function testErrorHandling() {
  console.log('[AI Test] Testing error handling...');

  try {
    const result = await trackSimpleGeneration(
      'V5',
      'This should fail',
      false,
      async () => {
        addAIBreadcrumb('generation', 'Starting failing generation');

        await new Promise(resolve => setTimeout(resolve, 500));

        addAIBreadcrumb('error', 'Simulating API failure', {
          phase: 'api_call',
        });

        // Simulate failure
        throw new Error('Simulated API error');
      }
    );

    console.log('[AI Test] Error handling test failed (should have thrown)');
    return result;
  } catch (error) {
    console.log('[AI Test] Error caught correctly (expected):', error);
    return { success: false, error: String(error) };
  }
}

// ==========================================
// Run All Tests
// ==========================================

export async function runAllAITests() {
  console.log('='.repeat(50));
  console.log('[AI Test] Starting all AI monitoring tests...');
  console.log('='.repeat(50));

  const results = {
    simpleGeneration: false,
    customGeneration: false,
    stemSeparation: false,
    agentWorkflow: false,
    manualAttributes: false,
    errorHandling: false,
  };

  try {
    // Test 1: Simple Generation
    await testSimpleGeneration();
    results.simpleGeneration = true;
    console.log('✅ Test 1 passed\n');

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Custom Generation
    await testCustomGeneration();
    results.customGeneration = true;
    console.log('✅ Test 2 passed\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Stem Separation
    await testStemSeparation();
    results.stemSeparation = true;
    console.log('✅ Test 3 passed\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Agent Workflow
    await testAgentWorkflow();
    results.agentWorkflow = true;
    console.log('✅ Test 4 passed\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 5: Manual Attributes
    await testManualAttributes();
    results.manualAttributes = true;
    console.log('✅ Test 5 passed\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 6: Error Handling
    await testErrorHandling();
    results.errorHandling = true;
    console.log('✅ Test 6 passed\n');

  } catch (error) {
    console.error('[AI Test] Test suite failed:', error);
  }

  console.log('='.repeat(50));
  console.log('[AI Test] Test Results:');
  console.log(JSON.stringify(results, null, 2));
  console.log('='.repeat(50));

  console.log('\n[AI Test] Check Sentry Dashboard:');
  console.log('1. Go to Traces');
  console.log('2. Filter by operation: gen_ai.request');
  console.log('3. Look for spans with provider: suno');
  console.log('4. Check AI Spans tab for detailed metrics');

  return results;
}

// ==========================================
// Quick Individual Test (Console)
// ==========================================

/**
 * Quick test to run in browser console
 * Copy and paste this into your browser console in production mode:
 */
export function consoleTestInstructions() {
  return `
// Quick AI Monitoring Test - Run in Browser Console

// Import the test functions (already available if component is mounted)
import { trackSimpleGeneration, addAIBreadcrumb } from '@/lib/sentryAI';

// Run a simple test
trackSimpleGeneration('V5', 'Console test prompt', false, async () => {
  console.log('Testing AI monitoring...');
  await new Promise(r => setTimeout(r, 1000));
  return { success: true, taskId: 'console-test-' + Date.now() };
}).then(result => {
  console.log('✅ AI monitoring test passed!', result);
  addAIBreadcrumb('generation', 'Console test completed');
}).catch(error => {
  console.error('❌ AI monitoring test failed:', error);
});

// Expected output:
// - Browser console shows success message
// - Sentry Dashboard > Traces shows gen_ai.request spans
// - AI Spans tab shows Suno-specific attributes
`;
}

// Export all tests
export const AITests = {
  testSimpleGeneration,
  testCustomGeneration,
  testStemSeparation,
  testAgentWorkflow,
  testManualAttributes,
  testErrorHandling,
  runAllAITests,
  consoleTestInstructions,
};
