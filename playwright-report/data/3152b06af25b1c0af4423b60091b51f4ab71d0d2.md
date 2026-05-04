# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> should display login page and allow user to login
- Location: tests/e2e/auth.spec.ts:5:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:5174/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication Flow', () => {
  4  | 
  5  |   test('should display login page and allow user to login', async ({ page }) => {
  6  |     // Navigate to login
> 7  |     await page.goto('/login');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  8  |     
  9  |     // Expect the URL to contain /login
  10 |     await expect(page).toHaveURL(/.*login/);
  11 |     
  12 |     // Fill the email and password fields
  13 |     await page.getByPlaceholder('you@example.com').fill('testuser@example.com');
  14 |     await page.getByPlaceholder('••••••••').fill('password123');
  15 |     
  16 |     // Check if there is a login button (looking for "Sign In")
  17 |     const loginButton = page.getByRole('button', { name: /sign in/i });
  18 |     await expect(loginButton).toBeVisible();
  19 |     
  20 |     // Click the login button
  21 |     await loginButton.click();
  22 |     
  23 |     // Since this is an automation test on a potentially live/dev env, 
  24 |     // it may fail if user does not exist. We assert that some error appears OR it navigates to dashboard.
  25 |     // For a fully automated test, you'd usually mock the API or have a seeded DB.
  26 |     // Here we'll just check that an API call was made or loading state appears.
  27 |   });
  28 | 
  29 |   test('should display registration form', async ({ page }) => {
  30 |     await page.goto('/signup');
  31 |     await expect(page).toHaveURL(/.*signup/);
  32 |     
  33 |     // Registration usually has name, email, password
  34 |     await page.getByPlaceholder('Your full name').fill('Automation Test');
  35 |     await page.getByPlaceholder('you@example.com').fill(`test_${Date.now()}@example.com`);
  36 |     
  37 |     // There are two password fields in signup (password and confirm password)
  38 |     // We fill both
  39 |     const passInputs = page.getByPlaceholder('••••••••');
  40 |     await passInputs.first().fill('password123');
  41 |     await passInputs.nth(1).fill('password123');
  42 |     
  43 |     // Accept terms
  44 |     await page.locator('input[type="checkbox"]').check();
  45 |     
  46 |     const signupButton = page.getByRole('button', { name: /send verification code/i });
  47 |     await expect(signupButton).toBeVisible();
  48 |     await signupButton.click();
  49 |   });
  50 | 
  51 |   test('should display forgot password functionality', async ({ page }) => {
  52 |     await page.goto('/login');
  53 |     
  54 |     // Find the forgot password link
  55 |     const forgotLink = page.getByRole('button', { name: /forgot password/i });
  56 |     await expect(forgotLink).toBeVisible();
  57 |     await forgotLink.click();
  58 |     
  59 |     // Expect email input to be visible
  60 |     const emailInput = page.getByPlaceholder('you@example.com');
  61 |     await expect(emailInput).toBeVisible();
  62 |     
  63 |     await emailInput.fill('testuser@example.com');
  64 |     
  65 |     const resetBtn = page.getByRole('button', { name: /send reset code/i });
  66 |     await expect(resetBtn).toBeVisible();
  67 |     await resetBtn.click();
  68 |   });
  69 | 
  70 | });
  71 | 
```