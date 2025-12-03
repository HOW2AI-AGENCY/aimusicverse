# Sprint 2: Testing & Validation - Test Plan

**Sprint**: 002 from IMPROVEMENT_SPRINT_PLAN_2025-12-03.md  
**Period**: December 4-5, 2025 (2 days)  
**Story Points**: 13 SP  
**Status**: ⏳ In Progress  
**Priority**: P0 (Critical)

## 📋 Executive Summary

This test plan covers validation of:
1. **Versioning System** - Track version management and primary version logic
2. **Telegram Share Functions** - Native and fallback sharing mechanisms  
3. **Download Functions** - Native and browser fallback downloads
4. **Regression Testing** - Existing functionality preservation
5. **Bug Fixes** - Issues discovered during testing

---

## 🎯 Test Objectives

### Primary Goals
- ✅ Verify version counting is correct (no duplicates)
- ✅ Confirm primary version logic works properly
- ✅ Validate Telegram share/download functions
- ✅ Ensure no regressions in existing features
- ✅ Maintain performance benchmarks

### Success Criteria
- All P0 test scenarios pass
- No critical bugs discovered
- No performance degradation
- User acceptance approved

---

## 📊 Test Coverage Matrix

| Feature Area | Test Type | Priority | Status | Owner |
|-------------|-----------|----------|--------|-------|
| Versioning System | Manual + Automated | P0 | ⏳ Pending | QA Engineer |
| Telegram Share | Manual (Real Devices) | P0 | ⏳ Pending | Mobile QA |
| Download Functions | Manual (Real Devices) | P1 | ⏳ Pending | Mobile QA |
| Regression Tests | Automated | P0 | ⏳ Pending | QA Engineer |
| Performance Tests | Automated | P1 | ⏳ Pending | DevOps |

---

## 🧪 Test Scenarios

### T2.1: Versioning System Testing

**Story Points**: 3  
**Priority**: P0  
**Owner**: QA Engineer

#### Prerequisites
- Access to staging/development environment
- Test user account with permissions
- Browser DevTools enabled

#### Test Scenarios

##### Scenario 1: Create Track with Multiple Versions
**Steps**:
1. Login to application
2. Create new track (Version A)
3. Create version from existing track (Version B)
4. Navigate to track versions tab
5. Verify version count displays "2"

**Expected Result**:
- ✅ Version count shows exactly 2 versions
- ✅ No duplicate versions displayed
- ✅ Both versions have unique IDs

**Automated Check**:
```sql
-- Verify version count query
SELECT COUNT(*) as version_count, is_primary
FROM track_versions 
WHERE track_id = '<test_track_id>'
GROUP BY is_primary;

-- Expected: 1 row with is_primary=true, 1 row with is_primary=false
```

##### Scenario 2: Switch Primary Version
**Steps**:
1. Navigate to versions tab of track with 2+ versions
2. Click "Set as Primary" on non-primary version
3. Verify UI updates optimistically
4. Refresh page
5. Verify primary version persisted

**Expected Result**:
- ✅ Primary badge moves to selected version
- ✅ Optimistic UI update immediate (<100ms)
- ✅ Database updated correctly
- ✅ Changelog entry created

**Automated Check**:
```sql
-- Verify only one primary version
SELECT COUNT(*) FROM track_versions 
WHERE track_id = '<test_track_id>' AND is_primary = true;

-- Expected: 1

-- Verify changelog entry
SELECT * FROM track_change_log 
WHERE track_id = '<test_track_id>' 
AND change_type = 'master_changed'
ORDER BY created_at DESC LIMIT 1;

-- Expected: 1 row with recent timestamp
```

##### Scenario 3: Play Default Version
**Steps**:
1. Navigate to track with multiple versions
2. Click play button (not in versions tab)
3. Verify primary version plays

**Expected Result**:
- ✅ Primary version audio plays
- ✅ Correct audio URL loaded
- ✅ Player shows correct version metadata

##### Scenario 4: Version Changelog Tracking
**Steps**:
1. Perform version operations:
   - Create new version
   - Switch primary version
   - Update version metadata
2. Navigate to changelog tab
3. Verify all changes logged

**Expected Result**:
- ✅ All operations have changelog entries
- ✅ Entries show correct timestamps
- ✅ User attribution correct
- ✅ Change type badges correct

#### Automated Test Script

```typescript
// tests/e2e/versioning.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Track Versioning', () => {
  test('should show correct version count', async ({ page }) => {
    await page.goto('/library');
    
    // Find track with multiple versions
    const trackRow = page.locator('[data-testid="track-row"]').first();
    await trackRow.click();
    
    // Check version count
    const versionCount = await page.locator('[data-testid="version-count"]').textContent();
    expect(parseInt(versionCount || '0')).toBeGreaterThan(0);
  });
  
  test('should switch primary version', async ({ page }) => {
    // ... test implementation
  });
});
```

---

### T2.2: Telegram Share Functions Testing

**Story Points**: 4  
**Priority**: P0  
**Owner**: Mobile QA

#### Test Devices Required
- ✅ iPhone (iOS 16+) with Telegram 8.0+
- ✅ Android (Android 11+) with Telegram 8.0+
- ✅ Desktop (macOS/Windows) with Telegram Desktop
- ✅ Web browsers (Chrome, Safari, Firefox)

#### Test Scenarios

##### Scenario 1: Native Share URL (Telegram 8.0+)
**Steps**:
1. Open app in Telegram Mini App
2. Navigate to track
3. Click share button
4. Select "Share to Telegram"
5. Verify native share sheet opens

**Expected Result**:
- ✅ Native share sheet appears
- ✅ Track metadata pre-filled
- ✅ Cover image shows
- ✅ Share completes successfully

**Test Devices**: iPhone (iOS 16+), Android (11+)

##### Scenario 2: Fallback Share (Telegram <8.0)
**Steps**:
1. Open app in older Telegram version
2. Navigate to track
3. Click share button
4. Verify fallback mechanism used

**Expected Result**:
- ✅ openTelegramLink fallback triggers
- ✅ Share link copied to clipboard
- ✅ Toast notification shown
- ✅ Deep link valid

**Test Devices**: Telegram Desktop, older mobile versions

##### Scenario 3: Share to Story
**Steps**:
1. Open app in Telegram 8.0+
2. Navigate to track
3. Click "Share to Story"
4. Verify story creation

**Expected Result**:
- ✅ Story composer opens
- ✅ Track cover as background
- ✅ Music sticker attached
- ✅ Story publishes successfully

**Note**: Story feature availability varies by platform

##### Scenario 4: Deep Link Navigation
**Steps**:
1. Share track to chat
2. Click shared link from another account
3. Verify app opens to correct track

**Expected Result**:
- ✅ App opens in Mini App context
- ✅ Navigates to correct track
- ✅ Track details load
- ✅ Play button works

##### Scenario 5: Share to Chat/Group/Channel
**Steps**:
1. Share track to personal chat
2. Share track to group
3. Share track to channel (if admin)
4. Verify all shares successful

**Expected Result**:
- ✅ Track preview shows in chat
- ✅ Cover thumbnail displays
- ✅ Title and metadata visible
- ✅ Links clickable

#### Platform-Specific Checks

**iOS Specific**:
- ✅ Haptic feedback on share button
- ✅ Safe area insets respected
- ✅ Dark mode colors correct

**Android Specific**:
- ✅ Material design guidelines followed
- ✅ Back button behavior correct
- ✅ Share sheet native appearance

**Desktop Specific**:
- ✅ Right-click context menu
- ✅ Keyboard shortcuts (Ctrl+S)
- ✅ Multi-window handling

---

### T2.3: Download Functions Testing

**Story Points**: 3  
**Priority**: P1  
**Owner**: Mobile QA

#### Test Scenarios

##### Scenario 1: Native Download (Telegram 8.0+)
**Steps**:
1. Open track in Telegram 8.0+
2. Click download button
3. Verify native download API used

**Expected Result**:
- ✅ Native download dialog appears
- ✅ File downloads to device
- ✅ File playable after download
- ✅ Progress indicator shows

##### Scenario 2: Browser Fallback Download
**Steps**:
1. Open app in older Telegram or browser
2. Click download button
3. Verify browser download used

**Expected Result**:
- ✅ Browser download initiates
- ✅ File saves with correct name
- ✅ MIME type correct (audio/mpeg)
- ✅ Success toast shown

##### Scenario 3: Error Handling - Missing Audio URL
**Steps**:
1. Attempt to download track without audio_url
2. Verify graceful error handling

**Expected Result**:
- ✅ Error toast displayed
- ✅ User-friendly message
- ✅ No app crash
- ✅ Action logged for debugging

##### Scenario 4: CORS Issues
**Steps**:
1. Attempt download with CORS-restricted URL
2. Verify fallback mechanism

**Expected Result**:
- ✅ CORS error detected
- ✅ Fallback method attempted
- ✅ User informed of issue
- ✅ Support contact provided

##### Scenario 5: Slow Network
**Steps**:
1. Enable network throttling (Slow 3G)
2. Attempt track download
3. Verify progress indication

**Expected Result**:
- ✅ Loading indicator shows
- ✅ Progress bar updates
- ✅ Download completes successfully
- ✅ Timeout handled (if applicable)

---

### T2.4: Regression Testing

**Story Points**: 2  
**Priority**: P0  
**Owner**: QA Engineer

#### Critical Paths to Verify

##### 1. Library Functionality
- [ ] Track list loads correctly
- [ ] Filters work (All, Public, Private)
- [ ] Search functionality works
- [ ] Sorting options work
- [ ] Pagination works

##### 2. Player Functionality
- [ ] Play/pause works
- [ ] Seek/scrub works
- [ ] Volume control works
- [ ] Next/previous track works
- [ ] Repeat/shuffle modes work

##### 3. Generation Functionality
- [ ] Generate form loads
- [ ] All input fields work
- [ ] Validation works
- [ ] API calls succeed
- [ ] Task queue updates

##### 4. Authentication
- [ ] Login works (Telegram OAuth)
- [ ] Session persists
- [ ] Logout works
- [ ] Protected routes secured

##### 5. Performance Benchmarks
- [ ] Initial load time <3s
- [ ] Track list render <500ms
- [ ] Player controls <100ms latency
- [ ] Search results <300ms

#### Automated Regression Tests

```typescript
// tests/e2e/regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Regression Tests', () => {
  test('library loads correctly', async ({ page }) => {
    await page.goto('/library');
    await expect(page.locator('[data-testid="track-list"]')).toBeVisible();
  });
  
  test('player controls work', async ({ page }) => {
    await page.goto('/library');
    const playButton = page.locator('[data-testid="play-button"]').first();
    await playButton.click();
    await expect(page.locator('[data-testid="player"]')).toBeVisible();
  });
  
  test('generation form loads', async ({ page }) => {
    await page.goto('/generate');
    await expect(page.locator('[data-testid="generate-form"]')).toBeVisible();
  });
});
```

---

### T2.5: Bug Fixes

**Story Points**: 1  
**Priority**: P0  
**Owner**: Developer

#### Bug Tracking Template

```markdown
## Bug #[NUMBER]
**Title**: [Short description]
**Severity**: Critical | High | Medium | Low
**Priority**: P0 | P1 | P2 | P3
**Found in**: [Test scenario]
**Reported by**: [Name]
**Date**: [YYYY-MM-DD]

### Description
[Detailed description of the bug]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- OS: [e.g., iOS 16]
- Browser: [e.g., Telegram Mini App]
- Version: [e.g., 1.0.0]

### Screenshots/Logs
[Attach relevant screenshots or console logs]

### Fix
[Description of the fix implemented]

### Verification
[How the fix was verified]
```

---

## 📈 Test Metrics

### Coverage Goals
- **Code Coverage**: 80%+ for new code
- **Feature Coverage**: 100% of P0 features
- **Browser Coverage**: Chrome, Safari, Firefox
- **Device Coverage**: iOS, Android, Desktop

### Performance Targets
- **Initial Load**: <3s on 3G
- **Time to Interactive**: <5s
- **First Contentful Paint**: <2s
- **Lighthouse Score**: >90 (mobile)

### Quality Gates
- ✅ Zero P0 bugs remaining
- ✅ All automated tests passing
- ✅ Manual test scenarios completed
- ✅ Performance benchmarks met

---

## 🛠️ Test Tools

### Manual Testing
- **Browsers**: Chrome DevTools, Safari Web Inspector, Firefox Developer Tools
- **Mobile**: Real iOS/Android devices, Telegram app
- **Network**: Chrome DevTools throttling, Proxyman

### Automated Testing
- **E2E**: Playwright, Cypress (if configured)
- **Unit**: Vitest, Jest
- **Performance**: Lighthouse CI
- **Visual**: Percy, Chromatic (if configured)

### Monitoring
- **Logs**: Supabase logs, Browser console
- **Errors**: Sentry (if configured)
- **Analytics**: PostHog, Google Analytics (if configured)

---

## 📝 Test Execution Schedule

### Day 1: Setup & Core Testing
- **09:00-10:00**: Environment setup, test data preparation
- **10:00-12:00**: T2.1 Versioning tests
- **12:00-13:00**: Lunch break
- **13:00-15:00**: T2.2 Share function tests (Part 1)
- **15:00-17:00**: T2.4 Regression tests

### Day 2: Mobile Testing & Validation
- **09:00-11:00**: T2.2 Share function tests (Part 2)
- **11:00-13:00**: T2.3 Download function tests
- **13:00-14:00**: Lunch break
- **14:00-16:00**: T2.5 Bug fixes
- **16:00-17:00**: Final validation & sign-off

---

## ✅ Deliverables

### Test Reports
1. **Test Execution Report**
   - Test scenarios executed
   - Pass/fail status
   - Bugs discovered
   - Recommendations

2. **Bug Report**
   - Critical bugs (if any)
   - Medium/low priority issues
   - Known limitations
   - Workarounds

3. **Performance Report**
   - Lighthouse scores
   - Load time metrics
   - Comparison with baseline

### Documentation Updates
- Updated troubleshooting guide
- Known issues documentation
- Release notes draft

---

## 🚦 Sign-Off Criteria

### Required Approvals
- [ ] QA Lead sign-off
- [ ] Product Owner sign-off
- [ ] Tech Lead review

### Exit Criteria
- [ ] All P0 test scenarios passed
- [ ] All critical bugs fixed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Stakeholder approval obtained

---

## 📞 Escalation Path

**Level 1**: Test failures, minor issues  
→ Report to QA Lead

**Level 2**: Critical bugs, blockers  
→ Escalate to Tech Lead + Product Owner

**Level 3**: Production incidents, data loss risk  
→ Emergency escalation to CTO

---

## 🔄 Next Steps After Sprint 2

Upon successful completion:
1. Deploy to staging environment
2. User acceptance testing (UAT)
3. Performance monitoring setup
4. Sprint 3 kickoff (Telegram Bot Enhancement)

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-03  
**Status**: Active Testing  
**Contact**: QA Team
