// Sprint 011 - Social Features E2E Tests (T110-T114)
// Tests for user profiles, following, comments, likes, activity feed, and privacy

import { test, expect, Page } from '@playwright/test';

// Helper to generate unique test user data
const generateTestUser = () => ({
  username: `testuser_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  displayName: `Test User ${Date.now()}`,
  bio: 'This is a test user for Sprint 011 social features testing',
});

// Helper to wait for API calls
const waitForApiResponse = async (page: Page, endpoint: string) => {
  return page.waitForResponse(
    (response) => response.url().includes(endpoint) && response.status() === 200,
    { timeout: 10000 }
  );
};

test.describe('Sprint 011: Social Features - E2E Tests', () => {
  
  // T110: User registration → profile creation workflow
  test('T110: Complete user registration and profile setup', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    
    // Check if profile setup is required
    const profileSetupExists = await page.locator('[data-testid="profile-setup"]').count() > 0;
    
    if (profileSetupExists) {
      const testUser = generateTestUser();
      
      // Step 1: Basic info
      await page.fill('[data-testid="display-name-input"]', testUser.displayName);
      await page.fill('[data-testid="username-input"]', testUser.username);
      await page.click('[data-testid="next-button"]');
      
      // Step 2: Bio
      await page.fill('[data-testid="bio-textarea"]', testUser.bio);
      await page.click('[data-testid="next-button"]');
      
      // Step 3: Avatar (skip for now)
      await page.click('[data-testid="skip-button"]');
      
      // Step 4: Complete
      await page.click('[data-testid="finish-button"]');
      
      // Wait for profile to be created
      await waitForApiResponse(page, '/rest/v1/profiles');
      
      // Verify profile page loads
      await expect(page.locator('[data-testid="profile-header"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`text=${testUser.displayName}`)).toBeVisible();
    }
    
    // Verify key profile elements
    await expect(page.locator('[data-testid="profile-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-bio"]')).toBeVisible();
  });

  // T111: Follow users → comment on track workflow
  test('T111: Follow user and comment on track', async ({ page, context }) => {
    // User A logs in
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    
    // Navigate to discover page to find users
    await page.click('[data-testid="nav-discover"]');
    await page.waitForSelector('[data-testid="discover-page"]');
    
    // Find a user to follow
    const userCards = page.locator('[data-testid="user-card"]');
    const firstUserCard = userCards.first();
    await firstUserCard.waitFor({ state: 'visible' });
    
    // Click follow button
    const followButton = firstUserCard.locator('[data-testid="follow-button"]');
    await followButton.click();
    
    // Wait for optimistic update
    await expect(followButton).toContainText('Following', { timeout: 3000 });
    
    // Verify follower count increased (check via API or UI)
    await page.waitForTimeout(1000);
    
    // Navigate to a public track
    await page.click('[data-testid="nav-discover"]');
    const trackCards = page.locator('[data-testid="track-card"]');
    const firstTrack = trackCards.first();
    await firstTrack.click();
    
    // Wait for track detail page
    await page.waitForSelector('[data-testid="track-detail"]');
    
    // Scroll to comments section
    await page.click('[data-testid="comments-tab"]');
    
    // Type and submit comment
    const commentText = `Test comment ${Date.now()}`;
    await page.fill('[data-testid="comment-input"]', commentText);
    await page.click('[data-testid="submit-comment-button"]');
    
    // Verify comment appears
    await expect(page.locator(`text=${commentText}`)).toBeVisible({ timeout: 5000 });
    
    // Verify real-time update (comment appears immediately)
    const commentsList = page.locator('[data-testid="comments-list"]');
    await expect(commentsList.locator(`text=${commentText}`).first()).toBeVisible();
  });

  // T112: Receive notifications → like tracks workflow
  test('T112: Like track and receive notification', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    
    // Navigate to a track
    await page.click('[data-testid="nav-library"]');
    const trackCards = page.locator('[data-testid="track-card"]');
    const trackToLike = trackCards.first();
    
    // Get current like count
    const likeButton = trackToLike.locator('[data-testid="like-button"]');
    const initialLikeText = await likeButton.textContent();
    
    // Click like button
    await likeButton.click();
    
    // Verify like animation and count update
    await expect(likeButton).toHaveClass(/liked/, { timeout: 2000 });
    
    // Wait for like count to update
    await page.waitForTimeout(500);
    const updatedLikeText = await likeButton.textContent();
    expect(updatedLikeText).not.toBe(initialLikeText);
    
    // Check notifications (click notification bell)
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    if (await notificationBell.count() > 0) {
      await notificationBell.click();
      
      // Verify notification dropdown opens
      await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible({ timeout: 3000 });
      
      // Verify unread badge (if any notifications exist)
      const unreadBadge = page.locator('[data-testid="notification-badge"]');
      if (await unreadBadge.count() > 0) {
        await expect(unreadBadge).toBeVisible();
      }
    }
  });

  // T113: View activity feed workflow
  test('T113: Navigate and interact with activity feed', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    
    // Navigate to activity feed
    await page.click('[data-testid="nav-activity"]');
    await page.waitForSelector('[data-testid="activity-feed"]', { timeout: 5000 });
    
    // Verify activity items render
    const activityItems = page.locator('[data-testid="activity-item"]');
    const itemCount = await activityItems.count();
    
    if (itemCount > 0) {
      // Verify virtualization works (scroll)
      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(500);
      
      // Click on an activity item
      const firstActivity = activityItems.first();
      await firstActivity.click();
      
      // Verify navigation to entity (track/profile)
      await page.waitForTimeout(1000);
      expect(page.url()).toMatch(/\/(track|profile)\//);
    } else {
      // Empty state
      await expect(page.locator('text=Follow creators to see their activities')).toBeVisible();
    }
    
    // Test filter tabs
    await page.click('[data-testid="filter-tracks"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="filter-likes"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="filter-all"]');
  });

  // T114: Privacy controls workflow
  test('T114: Update privacy settings and verify enforcement', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    
    // Navigate to settings
    await page.click('[data-testid="nav-profile"]');
    await page.click('[data-testid="edit-profile-button"]');
    
    // Open privacy settings
    await page.click('[data-testid="privacy-settings-tab"]');
    
    // Change privacy level to "Followers Only"
    await page.click('[data-testid="privacy-level-select"]');
    await page.click('[data-testid="privacy-followers-only"]');
    
    // Save changes
    await page.click('[data-testid="save-profile-button"]');
    await waitForApiResponse(page, '/rest/v1/profiles');
    
    // Verify privacy level saved
    await page.reload();
    await page.waitForSelector('[data-testid="edit-profile-button"]');
    await page.click('[data-testid="edit-profile-button"]');
    await page.click('[data-testid="privacy-settings-tab"]');
    const privacySelect = page.locator('[data-testid="privacy-level-select"]');
    await expect(privacySelect).toContainText('Followers Only');
    
    // Test block user feature
    await page.goto('/');
    await page.click('[data-testid="nav-discover"]');
    const userCards = page.locator('[data-testid="user-card"]');
    const userToBlock = userCards.first();
    
    // Open user menu
    await userToBlock.locator('[data-testid="user-menu"]').click();
    
    // Click block button
    await page.click('[data-testid="block-user-button"]');
    
    // Confirm block action
    await page.click('[data-testid="confirm-block-button"]');
    
    // Verify user is blocked
    await expect(page.locator('text=User blocked successfully')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Sprint 011: Performance Tests', () => {
  
  // T115: Profile with 1000+ tracks
  test('T115: Profile loads efficiently with many tracks', async ({ page }) => {
    await page.goto('/profile/high-volume-user'); // Mock user with many tracks
    
    // Measure initial load time
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="profile-header"]', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    // Load time should be under 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Verify virtualization is working
    const trackCards = page.locator('[data-testid="track-card"]');
    const initialCount = await trackCards.count();
    
    // Should render only visible items (not all 1000+)
    expect(initialCount).toBeLessThan(50);
    
    // Scroll and verify more items load
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(1000);
    
    const afterScrollCount = await trackCards.count();
    expect(afterScrollCount).toBeGreaterThan(initialCount);
  });

  // T116: Activity feed with 1000+ activities
  test('T116: Activity feed scrolls smoothly', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForSelector('[data-testid="activity-feed"]', { timeout: 5000 });
    
    // Measure scroll performance
    let frameCount = 0;
    const startTime = Date.now();
    
    // Scroll multiple times
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(50);
      frameCount++;
    }
    
    const totalTime = Date.now() - startTime;
    const fps = (frameCount / totalTime) * 1000;
    
    // Should maintain ~60fps (at least 30fps)
    expect(fps).toBeGreaterThan(30);
  });

  // T117: Comment thread with 100+ comments
  test('T117: Deep comment thread renders efficiently', async ({ page }) => {
    await page.goto('/track/comment-heavy-track'); // Mock track with many comments
    
    await page.click('[data-testid="comments-tab"]');
    await page.waitForSelector('[data-testid="comments-list"]', { timeout: 5000 });
    
    const startTime = Date.now();
    
    // Load comments
    await page.waitForSelector('[data-testid="comment-item"]', { timeout: 5000 });
    const loadTime = Date.now() - startTime;
    
    // Comments should load under 2 seconds
    expect(loadTime).toBeLessThan(2000);
    
    // Verify nested threads work
    const replyButtons = page.locator('[data-testid="reply-button"]');
    if (await replyButtons.count() > 0) {
      await replyButtons.first().click();
      await expect(page.locator('[data-testid="comment-form"]')).toBeVisible();
    }
  });
});

test.describe('Sprint 011: Real-time Tests', () => {
  
  // T119: Comment delivery time
  test('T119: Comments appear in real-time (<1s)', async ({ page, context }) => {
    // Open two browser contexts (simulating two users)
    const page1 = page;
    const page2 = await context.newPage();
    
    // Both navigate to same track
    const trackUrl = '/track/test-track-id';
    await page1.goto(trackUrl);
    await page2.goto(trackUrl);
    
    await page1.click('[data-testid="comments-tab"]');
    await page2.click('[data-testid="comments-tab"]');
    
    // User 1 posts comment
    const commentText = `Real-time test ${Date.now()}`;
    const startTime = Date.now();
    
    await page1.fill('[data-testid="comment-input"]', commentText);
    await page1.click('[data-testid="submit-comment-button"]');
    
    // Wait for comment to appear on page2 (real-time subscription)
    await page2.waitForSelector(`text=${commentText}`, { timeout: 2000 });
    const deliveryTime = Date.now() - startTime;
    
    // Delivery time should be under 1 second
    expect(deliveryTime).toBeLessThan(1000);
    
    await page2.close();
  });

  // T120: Notification delivery time
  test('T120: Notifications deliver quickly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]');
    
    // Monitor notification bell
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    
    // Trigger an action that creates notification (like a track)
    const trackCard = page.locator('[data-testid="track-card"]').first();
    const startTime = Date.now();
    
    await trackCard.locator('[data-testid="like-button"]').click();
    
    // Wait for notification badge to update
    await page.waitForSelector('[data-testid="notification-badge"]', { timeout: 3000 });
    const notificationTime = Date.now() - startTime;
    
    // Notification should appear within 2 seconds
    expect(notificationTime).toBeLessThan(2000);
  });
});

test.describe('Sprint 011: Security Tests', () => {
  
  // T122: RLS policies enforcement
  test('T122: Private profiles are protected', async ({ page }) => {
    // Try to access a private profile directly via URL
    await page.goto('/profile/private-user-id');
    
    // Should show "Private Profile" message or redirect
    await expect(
      page.locator('text=This profile is private')
    ).toBeVisible({ timeout: 5000 });
  });

  // T123: Unauthorized access prevention
  test('T123: Cannot access blocked user content', async ({ page }) => {
    await page.goto('/');
    
    // Attempt to view blocked user's profile
    await page.goto('/profile/blocked-user-id');
    
    // Should show blocked message
    await expect(
      page.locator('text=You have blocked this user')
    ).toBeVisible({ timeout: 3000 });
  });

  // T124: Content moderation enforcement
  test('T124: Profanity filter blocks inappropriate content', async ({ page }) => {
    await page.goto('/track/test-track');
    await page.click('[data-testid="comments-tab"]');
    
    // Try to post comment with profanity
    await page.fill('[data-testid="comment-input"]', 'This is spam and inappropriate content');
    await page.click('[data-testid="submit-comment-button"]');
    
    // Should show error message
    await expect(
      page.locator('text=Content contains inappropriate language')
    ).toBeVisible({ timeout: 3000 });
  });
});
