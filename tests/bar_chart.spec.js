// Chart.js comes from jsDelivr, so these only check what the page asks the API for.
const { test, expect } = require('@playwright/test');
const { STATS_URL } = require('./mock-api');

for (const [data, by] of [['names', 'person'], ['countries', 'country']]) {
    test(`?data=${data} asks for the stickers per ${by}`, async ({ page }) => {
        await page.route(STATS_URL, route => route.fulfill({ json: [] }));
        const request = page.waitForRequest(request => STATS_URL(new URL(request.url())));

        await page.goto(`/bar_chart?data=${data}`);

        const url = new URL((await request).url());
        expect(url.pathname).toBe('/api/stats/counts');
        expect(url.searchParams.get('by')).toBe(by);
    });
}

test('says so when the API is down', async ({ page }) => {
    await page.route(STATS_URL, route => route.fulfill({ status: 502 }));

    await page.goto('/bar_chart?data=names');

    await expect(page.getByText('Sticker konnten nicht geladen werden')).toBeVisible();
});
