const { test, expect } = require('@playwright/test');
const { STICKERS_URL, sticker, mockStickers } = require('./mock-api');

const now = new Date();
const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12);
const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 12);
const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1, 12);

const stickers = [
    sticker(6, 'Timo & Lena', 'Hamburg', 'Deutschland', thisMonth),
    sticker(5, 'Timo', 'Wien', 'Österreich', thisMonth),
    sticker(4, 'Timo', 'Hamburg', 'Deutschland', lastMonth),
    sticker(3, 'Malte', 'Berlin', 'Deutschland', lastMonth),
    sticker(2, 'Ana', 'Kopenhagen', 'Dänemark', lastMonth),
    // Same month last year, which must not count as this month
    sticker(1, 'Jonas', 'Bremen', 'Deutschland', lastYear),
];

test.beforeEach(async ({ page }) => {
    await mockStickers(page, stickers);
    await page.goto('/stats');
});

test('shows the totals', async ({ page }) => {
    await expect(page.locator('#stickercount')).toHaveText('6');
    await expect(page.locator('#citycount')).toHaveText('5');
    await expect(page.locator('#countrycount')).toHaveText('3');
    // Timo, Lena, Malte, Ana, Jonas
    await expect(page.locator('#namecount')).toHaveText('5');
});

test('shows this month and the change from last month', async ({ page }) => {
    await expect(page.locator('#stickercount')).toHaveText('6');

    const monthly = page.getByRole('switch', { name: 'Dieser Monat' });
    await expect(monthly).not.toBeChecked();
    await page.locator('.switch').click();
    await expect(monthly).toBeChecked();

    const month = now.toLocaleString('de', { month: 'long' });
    await expect(page.locator('.time_frame').first()).toHaveText(`im ${month}`);
    await expect(page.locator('#stickercount')).toHaveText('2');
    await expect(page.locator('#total_diff')).toHaveText('-1');
    await expect(page.locator('#citycount')).toHaveText('2');
    await expect(page.locator('#city_diff')).toHaveText('-1');
    await expect(page.locator('#countrycount')).toHaveText('2');
    // Germany and Austria against Germany and Denmark
    await expect(page.locator('#country_diff')).toHaveText('0');
    // Timo and Lena against Timo, Malte and Ana
    await expect(page.locator('#namecount')).toHaveText('2');
    await expect(page.locator('#name_diff')).toHaveText('-1');
});

test.describe('when the API is down', () => {
    test.beforeEach(async ({ page }) => {
        await page.route(STICKERS_URL, route => route.fulfill({ status: 502 }));
        await page.goto('/stats');
    });

    test('says so', async ({ page }) => {
        await expect(page.getByRole('alert')).toHaveText('Sticker konnten nicht geladen werden');
    });
});
