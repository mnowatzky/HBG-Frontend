const { test, expect } = require('@playwright/test');
const { STICKERS_URL } = require('./mock-api');

const HAMBURG = { latitude: 53.5511, longitude: 9.9937 };

test.use({ geolocation: HAMBURG, permissions: ['geolocation'] });

// Records the stickers the page sends and answers with the given status.
async function mockSave(page, status = 201) {
    const saved = [];
    await page.route(STICKERS_URL, route => {
        if (route.request().method() !== 'POST') return route.fallback();
        saved.push(route.request().postDataJSON());
        return route.fulfill({ status, json: {} });
    });
    return saved;
}

// Counts how often the page asks the browser for the position.
async function countLocationRequests(page) {
    await page.addInitScript(() => {
        window.locationRequests = { getCurrentPosition: 0, watchPosition: 0 };
        for (const name of Object.keys(window.locationRequests)) {
            const original = navigator.geolocation[name].bind(navigator.geolocation);
            navigator.geolocation[name] = (...args) => {
                window.locationRequests[name]++;
                return original(...args);
            };
        }
    });
}

async function saveSticker(page, name) {
    await page.goto('/sticker');
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Sticker speichern' }).click();
}

test('saves the name and the position, and leaves the address to the API', async ({ page }) => {
    const saved = await mockSave(page);

    await saveSticker(page, 'Timo & Lena');

    await expect(page.getByText('Sticker gespeichert!')).toBeVisible();
    expect(saved).toEqual([{ ...HAMBURG, name: 'Timo & Lena' }]);
});

test('saves with the position it already has, without waiting for a new one', async ({ page }) => {
    const saved = await mockSave(page);
    await countLocationRequests(page);
    await page.goto('/sticker');
    await page.waitForFunction(() => latestPosition !== null);

    await page.getByLabel('Name').fill('Timo');
    await page.getByRole('button', { name: 'Sticker speichern' }).click();

    await expect(page.getByText('Sticker gespeichert!')).toBeVisible();
    expect(saved).toEqual([{ ...HAMBURG, name: 'Timo' }]);
    expect(await page.evaluate(() => window.locationRequests.getCurrentPosition)).toBe(0);
});

test('says so when the API cannot save the sticker', async ({ page }) => {
    await mockSave(page, 500);

    await saveSticker(page, 'Timo');

    await expect(page.getByText('Sticker konnte nicht gespeichert werden!')).toBeVisible();
});

test('asks for a name first', async ({ page }) => {
    const saved = await mockSave(page);

    await saveSticker(page, '   ');

    await expect(page.getByText('Bitte gib einen Namen ein!')).toBeVisible();
    expect(saved).toEqual([]);
});

test('says so when the API limits the rate', async ({ page }) => {
    await mockSave(page, 429);

    await saveSticker(page, 'Timo');

    await expect(page.getByText('Zu viele Sticker auf einmal')).toBeVisible();
});

test.describe('without permission for the location', () => {
    test.use({ permissions: [] });

    test('asks for it', async ({ page }) => {
        const saved = await mockSave(page);

        await saveSticker(page, 'Timo');

        await expect(page.getByText('Bitte erlaube den Zugriff auf deinen Standort')).toBeVisible();
        expect(saved).toEqual([]);
    });

    test('does not ask for it before the click', async ({ page }) => {
        await countLocationRequests(page);
        await page.goto('/sticker');
        await page.getByLabel('Name').fill('Timo');
        await page.evaluate(() => navigator.permissions.query({ name: 'geolocation' }));

        expect(await page.evaluate(() => window.locationRequests)).toEqual({ getCurrentPosition: 0, watchPosition: 0 });
    });
});
