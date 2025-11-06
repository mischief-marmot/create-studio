# E2E Test Suite

Comprehensive browser-based end-to-end tests for Create Studio application.

## Test Coverage

### Interactive Mode Tests

#### 1. Slide Navigation (`interactive-mode-slides.test.ts`)
- **6 tests** covering:
  - Loading interactive mode page with demo recipe
  - Opening interactive mode modal
  - Navigating through slides in carousel
  - Slide navigation with swipe gestures
  - Displaying recipe title and description
  - Navigating to completion/review slide

#### 2. Timer Behaviors (`interactive-mode-timers.test.ts`)
- **9 tests** covering:
  - Finding and displaying timers in recipe steps
  - Starting a timer
  - Pausing a running timer
  - Adding 1 minute to a timer
  - Resuming a paused timer
  - Stopping/resetting a timer
  - Timer alarming state when complete
  - Stopping alarm with STOP button
  - Displaying multiple active timers simultaneously

#### 3. Review Screen (`interactive-mode-review.test.ts`)
- **9 tests** covering:
  - Navigating to review screen at end of recipe
  - Displaying star rating component
  - Selecting a star rating
  - Showing rating submitted message for high ratings
  - Showing low rating prompt for low ratings
  - Displaying review form with required fields
  - Filling out review form
  - Enabling submit button when form is valid
  - Displaying completion image/emoji

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
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm run test:e2e
```

### All E2E Tests
```bash
npm run test:e2e
```

### Single Test File
```bash
npm run test:e2e -- tests/e2e/auth-screens.test.ts
```

### With More Memory (if needed)
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run test:e2e
```

### Run Tests in Watch Mode
```bash
npm run test:e2e -- --watch
```

## Test Configuration

Tests use:
- **Vitest** - Test runner
- **@nuxt/test-utils** - Nuxt-specific test utilities
- **Playwright** - Browser automation (Chromium)
- **Happy DOM** - DOM environment

Configuration is in `/packages/app/vitest.config.ts`

## Known Issues & Considerations

### 1. Dev Server Required
E2E tests require a running dev server on port 3001. Without it, tests will fail with "Cannot navigate to invalid URL" errors. The browser automation (Playwright) needs an actual HTTP server to connect to.

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

### 5. Test Isolation
Tests run in browser contexts and may have timing dependencies. Some tests include `waitForTimeout()` to allow for:
- Widget SDK loading
- Animations completing
- Network requests resolving

### 6. Widget Loading
The Interactive Mode tests interact with widgets loaded via external SDK. Tests include appropriate wait times for:
- SDK initialization (5000ms)
- Modal/iframe loading (2000ms)
- State changes (500-1000ms)

## Test Demo Recipe

Most interactive mode tests use the demo recipe:
- **URL**: `/demo/raspberry-swirl-pineapple-mango-margaritas`
- **Creation Key**: `thesweetestoccasion.com-50`
- **Direct Interactive**: `/creations/thesweetestoccasion.com-50/interactive`

## Test Patterns

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
Tests use direct scroll manipulation for reliable carousel navigation:
```typescript
await carousel.first().evaluate((el) => {
  el.scrollLeft = el.scrollWidth // Scroll to end
})
```

### Timer Interactions
Timer tests navigate through slides to find timers dynamically, as timer availability varies by recipe.

## Future Improvements

1. **Mock API Responses** - For more predictable test data
2. **Visual Regression Testing** - Screenshot comparison
3. **Performance Metrics** - Measure load times, interaction delays
4. **Accessibility Testing** - ARIA attributes, keyboard navigation
5. **Cross-browser Testing** - Firefox, Safari, WebKit
6. **Test Data Factories** - Generate consistent test data
7. **Parallelization** - Run tests in parallel when memory allows

## Debugging

### Run Tests with UI
```bash
npm run test:ui
```

### Run Single Test
```bash
npm run test:e2e -- tests/e2e/auth-screens.test.ts -t "loads login page"
```

### Playwright Debug Mode
```bash
PWDEBUG=1 npm run test:e2e
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
