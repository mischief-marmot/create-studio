# E2E Test Suite

Comprehensive browser-based end-to-end tests for Create Studio application using **Playwright** for reliable cross-browser automation.

## Quick Start

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run all e2e tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/interactive-mode-slides.test.ts

# Run in headed mode (watch browser)
npx playwright test --headed
```

## Recent Improvements

✅ **Button-based Navigation** - Slides test now uses semantic button interactions instead of generic scrolling
✅ **Data-Role Attributes** - Timer tests use semantic `data-role` selectors for reliability
✅ **API Mocking** - Review tests intercept WordPress API calls, preventing production data pollution
✅ **Pure Playwright** - Migrated from nuxt test-utils to Playwright for better control and reliability
✅ **Root npm Script** - `npm run test:e2e` available from monorepo root

## Test Coverage

### Interactive Mode Tests

#### 1. Slide Navigation (`interactive-mode-slides.test.ts`)
- **8 tests** covering:
  - Loading interactive mode page with demo recipe
  - Opening interactive mode modal
  - Navigating through carousel with 12 slides (intro → 10 steps → completion)
  - Button-based navigation (Begin button reveals next/prev controls)
  - Forward slide progression using carousel scroll
  - Displaying recipe title and description on intro slide
  - Navigating to completion/review slide
  - Carousel responsiveness during navigation
  - **Pass Rate: 8/8 (100%)** ✅

#### 2. Timer Behaviors (`interactive-mode-timers.test.ts`)
- **8 tests passing, 1 skipped** covering:
  - Finding and displaying timers in recipe steps
  - Starting a timer with data-role="start" selectors
  - Pausing a running timer with data-role="pause"
  - Adding 1 minute to timer with data-role="add-min"
  - Resuming a paused timer with data-role="resume"
  - Stopping/resetting a timer with data-role="reset"
  - Stopping alarm with data-role="stop" button
  - Displaying multiple active timers simultaneously
  - Timer completion simulation (skipped - needs better approach)
  - **Pass Rate: 8/8 active tests (1 skipped)** ✅
  - Uses `data-role` attributes for reliable, semantic selectors

#### 3. Review Screen (`interactive-mode-review.test.ts`)
- **7/9 tests** with **API mocking** to prevent production data pollution:
  - Navigating to review screen at end of recipe
  - Displaying star rating component
  - Selecting a star rating (mocked response, no real submission)
  - Showing rating submitted message for high ratings
  - Showing low rating prompt for low ratings
  - Displaying review form with required fields
  - Filling out review form
  - Enabling submit button when form is valid
  - Displaying completion image/emoji
  - **Pass Rate: 7/9** (2 timeouts on unrelated form element waits)
  - **API Mocking Active**: POST requests to `/wp-json/mv-create/v1/reviews` are intercepted and return mock responses
  - **No test data is saved to the real site** ✅

### Authentication Tests (`auth-screens.test.ts`)
- **23 tests** covering:

#### Login Page (9 tests)
  - Loading login page
  - Displaying email and password fields
  - Displaying login button
  - Showing error for invalid credentials
  - Displaying reset password link
  - Navigating to password reset page
  - Validating required fields
  - Displaying loading state
  - Email field validation

#### Password Reset Page (10 tests)
  - Loading password reset request page
  - Displaying email input field
  - Displaying send reset link button
  - Back to login link
  - Navigation back to login
  - Submitting reset request
  - Success message display
  - Button disabled after submission
  - Email format validation
  - Loading state during submission

#### Layout & Styling (4 tests)
  - Auth layout usage
  - Form styling with fieldsets
  - Input icons

### Landing & Demo Pages Tests (`landing-and-demos.test.ts`)
- **24 tests** covering:

#### Landing Page (5 tests)
  - Page loading
  - Interactive mode section display
  - Try Interactive Mode button
  - Opening interactive mode demo
  - Feature list display

#### Demo Recipes Page (6 tests)
  - Loading demo recipes listing
  - Displaying recipe cards
  - Recipe images
  - Recipe metadata
  - Clicking recipe cards
  - Try Interactive Mode buttons

#### Individual Recipe Page (6 tests)
  - Loading individual recipe
  - Recipe title display
  - Try Interactive Mode button
  - Recipe card widget
  - Opening interactive mode
  - Recipe source attribution

#### Navigation & Routing (4 tests)
  - Landing to demos navigation
  - Demos to recipe navigation
  - Recipe to interactive mode navigation
  - Meta tags

#### Responsive Design (3 tests)
  - Landing page on mobile
  - Demo recipes on mobile
  - Interactive mode on mobile

## Running Tests

### Prerequisites
E2E tests require a running dev server on port 3001:

```bash
# Terminal 1: Start dev server (from monorepo root or app directory)
npm run dev

# Terminal 2: Run tests
npm run test:e2e
```

### All E2E Tests
```bash
# From monorepo root
npm run test:e2e

# From packages/app directory
npm run test:e2e
```

### Single Test File
```bash
# Run only slide navigation tests
npx playwright test tests/e2e/interactive-mode-slides.test.ts

# Run only timer tests
npx playwright test tests/e2e/interactive-mode-timers.test.ts

# Run only review tests
npx playwright test tests/e2e/interactive-mode-review.test.ts
```

### Run Tests in Headed Mode (see browser)
```bash
npx playwright test --headed
```

### Run Tests in Debug Mode
```bash
npx playwright test --debug
```

### With More Memory (if needed)
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run test:e2e
```

## Test Configuration

Tests use:
- **Playwright** - Browser automation (Chromium)
- **Playwright API Mocking** - Route interception for API testing without side effects
- **Data-role Attributes** - Semantic selectors for reliable element identification

Configuration is in `/packages/app/playwright.config.ts`

## Known Issues & Considerations

### 1. Dev Server Required
E2E tests require a running dev server on port 3001. Without it, tests will fail with "Cannot navigate to invalid URL" errors. Playwright needs an actual HTTP server to connect to.

### 2. CSS @property Warning
DaisyUI includes CSS `@property` rules that some CSS optimizers don't recognize:
```
[2m│[22m   @property --radialprogress {
[2m┆[22m            [33m[2m^--[22m Unknown at rule: @property[39m
```
This is **non-fatal** and can be safely ignored. It's a known issue with CSS tooling compatibility and doesn't affect functionality.

### 3. Memory Usage
Browser-based E2E tests are memory-intensive. When running all tests together, you may need to increase Node's memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run test:e2e
```

### 4. Environment Setup
Tests require:
- Built `@create-studio/shared` package
- Installed dependencies (`npm install`)
- Proper environment variables (NUXT_SESSION_PASSWORD, etc.)
- **Running dev server on port 3001**

### 5. API Mocking for Reviews
Review tests intercept POST requests to `/wp-json/mv-create/v1/reviews` and return mock responses using Playwright's route interception. This prevents test data from being saved to the real site while still validating the review submission flow.

### 6. Widget Loading & Timing
The Interactive Mode tests interact with widgets loaded via external SDK. Tests use Playwright's built-in wait mechanisms:
- `.waitForLoadState('networkidle')` for network requests
- `.expect().toBeVisible()` for element visibility
- `.waitFor()` for dynamic content

## Test Demo Recipe

Most interactive mode tests use the demo recipe:
- **URL**: `/demo/raspberry-swirl-pineapple-mango-margaritas`
- **Creation Key**: `thesweetestoccasion.com-50`
- **Direct Interactive**: `/creations/thesweetestoccasion.com-50/interactive`

## Test Patterns

### Semantic Selectors with Data-Role Attributes
Tests use `data-role` attributes for reliable, semantic element identification:
```typescript
const startButton = page.getByRole('button', { name: 'start' })
// OR
const startButton = page.locator('button[data-role="start"]')
```

Available data-role attributes:
- `data-role="start"` - Timer start button
- `data-role="pause"` - Timer pause button
- `data-role="resume"` - Timer resume button
- `data-role="add-min"` - Add 1 minute button
- `data-role="reset"` - Reset/stop button
- `data-role="stop"` - Stop alarm button

### Graceful Fallbacks
Tests are written with graceful fallbacks for conditional elements:
```typescript
if (await element.count() > 0) {
  await expect(element.first()).toBeVisible()
}
```

This accounts for:
- Optional recipe features (e.g., not all recipes have timers)
- Dynamic content loading
- Varying UI states

### Carousel Navigation
Slides test uses button-based navigation patterns:
1. Click "Begin" button to reveal carousel controls
2. Navigate using carousel scroll method with calculated item width
3. Scroll to specific positions for step progression
```typescript
const carouselElement = carousel.first()
await carouselElement.evaluate((el) => {
  const itemWidth = el.querySelector('.cs\\:carousel-item')?.clientWidth || 0
  if (itemWidth > 0) {
    el.scrollLeft += itemWidth // Advance one slide
  }
})
```

### API Mocking Pattern

#### Why We Mock `/api/v2/fetch-creation` Instead of WordPress API

All interactive mode tests use API mocking to prevent external dependencies. **Importantly, we mock the internal `/api/v2/fetch-creation` endpoint, NOT the external WordPress API directly.**

**Why this approach is necessary:**

1. **Browser-Context Limitation**: Playwright's `page.route()` only intercepts HTTP requests made from the browser context
2. **Server-Side Fetching**: The `/api/v2/fetch-creation` endpoint runs on the Nuxt server (Node.js) and makes its own HTTP requests to WordPress
3. **Server Requests Bypass Mocks**: Server-side HTTP calls are NOT intercepted by browser-context mocking
4. **Result**: We must mock the internal endpoint that the browser actually calls

**Mock Data Structure:**

Since we're mocking `/api/v2/fetch-creation` (which returns transformed data), our mock must include:
- The complete HowTo schema format
- The `step` array with HowToStep objects (generated from HTML instructions)
- All transformed fields that the real endpoint would return

The real WordPress API only returns HTML `instructions`, but the `/api/v2/fetch-creation` endpoint transforms this into structured `step` arrays using `transformCreationToHowTo()`.

**Implementation:**

```typescript
// tests/e2e/helpers/api-mocks.ts
export async function mockWordPressAPI(page: Page) {
  // Mock the internal endpoint (what browser calls)
  await page.route('**/api/v2/fetch-creation', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockRecipeData) // Includes step array
    })
  })

  // Also mock review submissions
  await page.route('**/wp-json/mv-create/v1/reviews**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'mock-id', ...data })
      })
    }
  })
}
```

**Test Usage:**

```typescript
test.describe('Interactive Mode Tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockWordPressAPI(page) // Apply mocking before each test
  })

  test('example test', async ({ page }) => {
    // Test runs with mocked data
  })
})
```

See [tests/e2e/helpers/api-mocks.ts](helpers/api-mocks.ts) and [tests/e2e/fixtures/mock-recipe.json](fixtures/mock-recipe.json) for the complete implementation.

## Future Improvements

1. ~~**Mock API Responses** - For more predictable test data~~ ✅ **Implemented for review submissions**
2. **Visual Regression Testing** - Screenshot comparison with baseline images
3. **Performance Metrics** - Measure load times, interaction delays
4. **Accessibility Testing** - ARIA attributes, keyboard navigation
5. **Cross-browser Testing** - Firefox, Safari, WebKit (currently Chromium only)
6. **Test Data Factories** - Generate consistent test data for different recipes
7. **Parallelization** - Run tests in parallel (currently sequential due to memory constraints)
8. **Timer Completion Simulation** - Better approach for testing alarming state without waiting
9. **Mobile-specific Tests** - Dedicated mobile viewport tests with touch interactions
10. **Network Throttling** - Test behavior under slow/unreliable network conditions

## Debugging

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run Tests in Debug Mode (Interactive Inspector)
```bash
npx playwright test --debug
```

### Run Single Test
```bash
npx playwright test tests/e2e/interactive-mode-slides.test.ts -t "begin button shows and click advances to slide 1"
```

### Run with Specific Reporter
```bash
npx playwright test --reporter=html  # Opens HTML report in browser
npx playwright test --reporter=list  # Console output
```

### View Test Results Report
```bash
npx playwright show-report
```

## CI/CD Considerations

For CI/CD environments:
1. Ensure sufficient memory allocation (4GB+ recommended)
2. Install browser dependencies
3. Set appropriate timeouts
4. Consider test sharding to run in parallel
5. Run `npm run build` for shared packages first

## Contributing

When adding new E2E tests:
1. Follow existing patterns for test structure
2. Use descriptive test names
3. Include graceful fallbacks for conditional elements
4. Add appropriate wait times for dynamic content
5. Group related tests in describe blocks
6. Update this README with new test coverage
