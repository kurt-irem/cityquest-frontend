import { test, expect } from '@playwright/test'

// Registers a fresh user, then logs in and verifies redirect to Home.
test('user can register and login', async ({ page }) => {
  const username = `e2e_user_${Date.now()}`
  const password = 'e2e_password'

  // Go to login page
  await page.goto('/login')

  // Fill credentials
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password').fill(password)

  // Click Register and expect success message
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page.getByText('Successfully registered!')).toBeVisible()

  // Click Login and expect redirect to home
  await page.getByRole('button', { name: 'Login' }).click()
  await page.waitForURL('**/home')

  // Home marker asserts
  await expect(page.getByText('Your Achievements')).toBeVisible()
})
