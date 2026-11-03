// The map itself comes from Mapbox and needs the network; these only check the page around it.
const { test, expect } = require('@playwright/test');
const { STICKERS_URL } = require('./mock-api');

test('loads Mapbox despite the integrity checks', async ({ page }) => {
    const problems = [];
    page.on('console', message => {
        if (/integrity|Content Security Policy/.test(message.text())) problems.push(message.text());
    });
    await page.route(STICKERS_URL, route => route.fulfill({ json: { type: 'FeatureCollection', features: [] } }));

    await page.goto('/karte');

    await expect.poll(() => page.evaluate(() => typeof mapboxgl === 'object' && typeof MapboxGeocoder)).toBe('function');
    expect(problems).toEqual([]);
});

test('says so when the API is down', async ({ page }) => {
    await page.route(STICKERS_URL, route => route.fulfill({ status: 502 }));

    await page.goto('/karte');

    await expect(page.getByRole('alert')).toHaveText('Sticker konnten nicht geladen werden');
});
