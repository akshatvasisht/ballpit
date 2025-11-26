const { test, expect } = require('@playwright/test');

test.describe('Ballpit E2E Shareholder Journey', () => {
    test('should complete KYC, claim shares, and cast a vote', async ({ page }) => {
        // Capture console logs from the browser
        page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

        // 1. Navigate to the home page
        await page.goto('/', { waitUntil: 'networkidle' });

        // Wait for heading to be visible
        const heading = page.locator('h1');
        await expect(heading).toBeVisible({ timeout: 20000 });
        await expect(heading).toContainText('Ballpit Voting');

        // 2. Start KYC flow
        const beginVerify = page.locator('text=Begin Verification');
        await expect(beginVerify).toBeVisible({ timeout: 15000 });
        await beginVerify.click({ force: true });

        // 3. Personal Information Page
        await page.waitForURL(/.*verify$/, { timeout: 15000 });
        await expect(page.locator('h1')).toContainText('Personal Information');

        await page.fill('input[name="fullName"]', 'Alice Shareholder');
        await page.fill('input[name="email"]', 'alice@example.com');
        await page.fill('input[name="dob"]', '01/01/1990');
        await page.fill('input[name="address"]', '123 Token Lane, Blockchain City');

        await page.waitForTimeout(500);
        await page.click('button:has-text("Continue")', { force: true });

        // 4. Document Upload Page
        await page.waitForURL(/.*documents.*/, { timeout: 15000 });
        await expect(page.locator('h1')).toContainText('Document Upload');

        // Mock a file upload
        const fileChooserPromise = page.waitForEvent('filechooser');
        const uploadArea = page.locator('text=Drag and drop your document here');
        await uploadArea.click({ force: true });
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
            name: 'id.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('fake-image-data'),
        });

        // Click a document option
        const passportButton = page.getByRole('button', { name: /passport/i });
        await expect(passportButton).toBeVisible();
        await passportButton.click({ force: true });

        // 5. Success Page
        await page.waitForURL(/.*success.*/, { timeout: 15000 });
        await expect(page.locator('h1')).toContainText('Verified!');
        await page.click('text=Continue to wallet setup', { force: true });

        // 6. Wallet Page
        await page.waitForURL(/.*wallet.*/, { timeout: 15000 });
        await expect(page.locator('h1')).toContainText('Connect your wallet');

        // Click a wallet option
        await page.click('text=Phantom', { force: true });

        // Finish wallet setup
        await page.click('text=Finish Setup', { force: true });

        // 7. Dashboard and Claiming Shares
        // Use a more robust check for home page navigation
        await page.waitForURL(url => url.pathname === '/' || url.pathname === '', { timeout: 30000 });

        // Now claim shares if the button is visible
        const claimButton = page.getByRole('button', { name: /Claim Shares/i });
        await expect(claimButton).toBeVisible({ timeout: 15000 });
        await claimButton.click({ force: true });
        // Use a more specific locator for the claim success toast
        await expect(page.locator('text=Shares claimed successfully!')).toBeVisible({ timeout: 10000 });

        // 8. Casting a Vote
        const voteButton = page.getByRole('button', { name: /Cast Vote/i });
        await expect(voteButton).toBeVisible({ timeout: 10000 });
        await voteButton.click({ force: true });
        // Use a more specific locator for the vote success toast
        await expect(page.locator('text=Vote recorded on-chain!')).toBeVisible({ timeout: 10000 });
    });
});
