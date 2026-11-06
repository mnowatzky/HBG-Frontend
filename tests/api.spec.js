// The helpers in js/api.js, run on /sticker, which loads them without anything else from outside.
const { test, expect } = require('@playwright/test');
const { STICKERS_URL, sticker, mockStickers } = require('./mock-api');

test('escapeHtml turns names into text', async ({ page }) => {
    await page.goto('/sticker');

    const escaped = await page.evaluate(() => escapeHtml('<img src=x onerror=alert(1)> & "Timo" \'s'));

    // Quotes too, for attributes
    expect(escaped).toBe('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;Timo&quot; &#39;s');
});

test('fetchAllStickers yields each sticker once when one is saved while paging', async ({ page }) => {
    const date = new Date();
    const stickers = [5, 4, 3, 2, 1].map(id => sticker(id, 'Timo', 'Hamburg', 'Deutschland', date));
    await mockStickers(page, stickers);
    // Runs before mockStickers, as Playwright tries the latest route first
    let requests = 0;
    await page.route(STICKERS_URL, route => {
        // After the first page, sticker 6 is saved, so every later sticker moves back by one
        if (requests++ === 1) {
            stickers.unshift(sticker(6, 'Lena', 'Hamburg', 'Deutschland', date));
        }
        return route.fallback();
    });
    await page.goto('/sticker');

    const ids = await page.evaluate(async () => {
        const ids = [];
        for await (const page of fetchAllStickers({ format: 'json' }, 2)) {
            ids.push(...page.map(sticker => sticker.id));
        }
        return ids;
    });

    expect(ids).toEqual([5, 4, 3, 2, 1]);
});
