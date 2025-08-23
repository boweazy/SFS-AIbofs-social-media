const { test, expect } = require('@playwright/test');

test.describe('SmartFlow SocialScale', () => {
  
  test('homepage loads with SocialScale features', async ({ page }) => {
    await page.goto('/');
    
    // Check basic page structure
    await expect(page).toHaveTitle(/Smart Flow Systems/);
    
    // Check trust logos section
    await expect(page.locator('.logos')).toBeVisible();
    await expect(page.locator('.logos img')).toHaveCount(5);
    
    // Check contact choices
    await expect(page.locator('.contact-choices')).toBeVisible();
    await expect(page.locator('.contact-choices .btn')).toHaveCount(3);
    
    // Check FAQ section
    await expect(page.locator('#faq')).toBeVisible();
    await expect(page.locator('#faq details')).toHaveCount(3);
  });
  
  test('booking page functionality', async ({ page }) => {
    await page.goto('/book');
    
    await expect(page).toHaveTitle(/Book a Call/);
    await expect(page.locator('#book-form')).toBeVisible();
    
    // Fill form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="_replyto"]', 'test@example.com');
    await page.fill('input[name="date"]', '2024-12-01');
    await page.fill('input[name="time"]', '14:00');
    
    // Test ICS export (without submitting)
    await page.click('#icsBtn');
    // Note: In real test, you'd verify download started
  });
  
  test('shop page cart functionality', async ({ page }) => {
    await page.goto('/shop');
    
    await expect(page).toHaveTitle(/Shop/);
    await expect(page.locator('#products')).toBeVisible();
    await expect(page.locator('.cart')).toBeVisible();
    
    // Add item to cart
    await page.click('[data-add="tpl-basic"]');
    
    // Verify cart updated
    await expect(page.locator('#cartList li')).toHaveCount(1);
    
    // Clear cart
    await page.click('#clearCart');
    await expect(page.locator('#cartList')).toContainText('Empty');
  });
  
  test('bots page demos', async ({ page }) => {
    await page.goto('/bots');
    
    await expect(page).toHaveTitle(/Bots/);
    
    // Test smart replies demo
    await page.fill('#thread', 'This is a test social media thread about AI');
    await page.click('#genReplies');
    
    // Wait for replies to generate
    await page.waitForSelector('#replies li', { timeout: 5000 });
    await expect(page.locator('#replies li')).toHaveCount(3);
    
    // Test best-time API
    await page.click('#fetchTimes');
    await page.waitForSelector('#times li', { timeout: 5000 });
    await expect(page.locator('#times li')).toHaveCountGreaterThan(0);
  });
  
  test('navigation between pages', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation links
    await page.click('a[href="book.html"]');
    await expect(page).toHaveURL(/\/book/);
    
    await page.click('.brand');
    await expect(page).toHaveURL(/\/$/);
    
    await page.click('a[href="shop.html"]');
    await expect(page).toHaveURL(/\/shop/);
    
    await page.click('a[href="bots.html"]');
    await expect(page).toHaveURL(/\/bots/);
  });
  
});