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
});
