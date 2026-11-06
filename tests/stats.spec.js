const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { STATS_URL, HOME, sticker, mockStickers } = require('./mock-api');

const now = new Date();
const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12);
const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 12);
const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1, 12);
// Noon in Berlin on a day last January, wherever the tests run
const day = number => new Date(Date.UTC(now.getFullYear() - 1, 0, number, 11));

const stickers = [
    sticker(6, 'Timo & Lena', 'Hamburg', 'Deutschland', thisMonth),
    sticker(5, 'Timo', 'Wien', 'Österreich', thisMonth, 48.21, 16.37),
    sticker(4, 'Timo', 'Hamburg', 'Deutschland', lastMonth),
    sticker(3, 'Malte', 'Berlin', 'Deutschland', lastMonth, 52.52, 13.40),
    sticker(2, 'Ana', 'Kopenhagen', 'Dänemark', lastMonth, 55.68, 12.57),
    // Same month last year, which must not count as this month
    sticker(1, 'Jonas', 'Bremen', 'Deutschland', lastYear, 53.08, 8.80),
];

// Picks a Zeitraum or where to measure from, as a visitor taps the chip.
function chip(page, name) {
    return page.locator('.chip', { hasText: new RegExp(`^${name}$`) });
}

function rows(page, board) {
    return page.locator(`#${board} .rank_row:visible`);
}

test.describe('with a few stickers', () => {
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

        await chip(page, 'Monat').click();

        await expect(page.getByRole('radio', { name: 'Monat' })).toBeChecked();
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
        await expect(rows(page, 'board_stickers')).toHaveText([/Timo\s*2/, /Lena\s*1/]);
    });

    test('asks for a Zeitraum by the local days', async ({ page }) => {
        const request = page.waitForRequest(request => new URL(request.url()).pathname === '/api/stats/people'
            && new URL(request.url()).searchParams.has('since_day'));

        await chip(page, 'Jahr').click();

        const params = new URL((await request).url()).searchParams;
        expect(params.get('since_day')).toBe(`${now.getFullYear()}-01-01`);
        expect(params.get('until_day')).toBe(`${now.getFullYear() + 1}-01-01`);
        await expect(page.locator('.time_frame').first()).toHaveText(`in ${now.getFullYear()}`);
    });

    test('shows the chips and all section links without scrolling sideways', async ({ page }) => {
        const bar = page.locator('.stats_bar');

        const { scrollWidth, clientWidth } = await bar.evaluate(element => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));

        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
        for (const link of await bar.getByRole('link').all()) await expect(link).toBeInViewport({ ratio: 1 });
    });

    test('lays out the totals two by two on phones and in one row on wide screens', async ({ page }, testInfo) => {
        await expect(page.locator('#stickercount')).toHaveText('6');

        const tops = await page.locator('.card').evaluateAll(cards => cards.map(card => Math.round(card.getBoundingClientRect().top)));

        expect(new Set(tops).size).toBe(testInfo.project.name === 'mobile' ? 2 : 1);
    });

    test('offers a way back to the top once scrolled down', async ({ page }) => {
        const button = page.getByRole('button', { name: 'Nach oben' });
        await expect(button).toBeHidden();

        await page.locator('#rekorde').scrollIntoViewIfNeeded();
        await expect(button).toBeVisible();
        await button.click();

        await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
        await expect(button).toBeHidden();
        await expect(page.getByRole('radio', { name: 'Insgesamt' })).toBeFocused();
    });

    test('links each name to the map of that person', async ({ page }) => {
        const timo = page.locator('#board_stickers').getByRole('link', { name: 'Timo' });

        await expect(timo).toHaveAttribute('href', '/karte?name=Timo');
    });

    test('shows the newest sticker and the king of the month', async ({ page }) => {
        await expect(page.locator('#latest')).toContainText('Timo & Lena in Hamburg, Deutschland');
        await expect(page.locator('#latest')).toContainText('vom vorletzten Sticker, von Timo in Wien, Österreich');
        await expect(page.locator('#king')).toHaveText(/^Timo mit 2 Stickern im /);
    });

    test('measures from Norderstedt', async ({ page }) => {
        await expect(page.locator('#farthest_sticker')).toContainText('entfernt in Wien, Österreich, von Timo');
        await expect(rows(page, 'board_farthest').first()).toContainText(/Timo\s*Wien, Österreich/);
    });

    test('shows the records', async ({ page }) => {
        await expect(page.locator('#record_day')).toContainText('3 Sticker am');
        await expect(page.locator('#streak')).toContainText('1 Tag');
        // Hamburg twice; Bremen is 100 km away
        await expect(page.locator('#home_share')).toContainText('33 % 2 von 6 Stickern');
        await expect(page.locator('#compass')).toContainText('NordenKopenhagen, Dänemark, von Ana');
        // Lena's first sticker is this month's, the others have older ones
        await expect(page.locator('#newcomer')).toContainText('Lena');
    });

    test('loads the charts only when they come near', async ({ page }) => {
        const charts = [];
        page.on('request', request => {
            if (request.url().includes('echarts')) charts.push(request.url());
        });
        await expect(page.locator('#stickercount')).toHaveText('6');
        expect(charts).toEqual([]);

        await page.locator('#wann').scrollIntoViewIfNeeded();

        await expect(page.locator('#hour_chart svg')).toBeVisible();
        await expect(page.locator('#calendar_chart svg')).toBeVisible();
        expect(charts).toHaveLength(1);
        // Each chart's own tooltip keeps the defaults, so that it stays on a phone's screen.
        for (const id of ['hour_chart', 'weekday_chart', 'month_chart', 'total_chart', 'calendar_chart']) {
            const tooltip = await page.evaluate(id => echarts.getInstanceByDom(document.getElementById(id)).getOption().tooltip[0], id);
            expect(tooltip, id).toMatchObject({ confine: true, textStyle: { fontFamily: 'Oswald, sans-serif' } });
        }
        await expect(page.locator('#hour_table tbody tr')).toHaveCount(24);
        await expect(page.locator('#weekday_table tbody tr')).toHaveCount(7);
        await expect(page.locator('#calendar_year option')).toHaveText([String(now.getFullYear()), String(now.getFullYear() - 1)].filter(
            year => stickers.some(s => s.date.startsWith(year)),
        ));
    });

    test('has no accessibility violations with everything loaded', async ({ page }) => {
        await page.locator('#wo').scrollIntoViewIfNeeded();
        await expect(page.locator('#calendar_chart svg')).toBeVisible();
        await page.locator('#wann details').evaluateAll(details => details.forEach(d => d.open = true));

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();

        expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`)).toEqual([]);
    });
});

test.describe('with many people', () => {
    const many = [
        ...['Ana', 'Ben', 'Cem', 'Dana', 'Emil', 'Fiona'].map((name, index) => sticker(index + 1, name, 'Hamburg', 'Deutschland', day(index + 1))),
        sticker(7, 'Ana & Ben', 'Hamburg', 'Deutschland', day(7)),
        // 23:30 in Berlin
        sticker(8, 'Ana', 'Hamburg', 'Deutschland', new Date(Date.UTC(now.getFullYear() - 1, 0, 8, 22, 30))),
        // 13:00 in New Zealand
        sticker(9, 'Gerd', 'Oakura', 'Neuseeland', new Date(Date.UTC(now.getFullYear() - 1, 0, 9, 0)), -39.1, 173.98, 'Pacific/Auckland'),
    ];

    test.beforeEach(async ({ page }) => {
        await mockStickers(page, many);
        await page.goto('/stats');
    });

    test('show the top 5 and the rest on request', async ({ page }) => {
        await expect(rows(page, 'board_stickers')).toHaveCount(5);
        await expect(rows(page, 'board_stickers').first()).toContainText(/Ana\s*3/);

        await page.locator('#board_stickers .show_all').click();

        await expect(rows(page, 'board_stickers')).toHaveCount(7);
        await expect(page.locator('#board_stickers .show_all')).toHaveText('Weniger anzeigen');
    });

    test('share a rank when equal', async ({ page }) => {
        // Ben has 2, everyone else 1 except Ana.
        await expect(rows(page, 'board_stickers').nth(2)).toContainText(/Platz 3\s*\S+\s*1/);
        await expect(rows(page, 'board_stickers').nth(3)).toContainText(/Platz 3/);
    });

    test('find a name among all', async ({ page }) => {
        await page.getByRole('searchbox', { name: 'Name suchen' }).fill('ger');

        await expect(rows(page, 'board_stickers')).toHaveCount(1);
        await expect(rows(page, 'board_stickers')).toContainText('Gerd');

        await page.getByRole('searchbox', { name: 'Name suchen' }).fill('xyz');

        await expect(rows(page, 'board_stickers')).toHaveCount(0);
        await expect(page.getByText('Niemand mit diesem Namen')).toBeVisible();
    });

    test('count the nights, pairs and the farthest', async ({ page }) => {
        await expect(rows(page, 'board_night')).toHaveText([/Ana\s*1/]);
        await expect(rows(page, 'board_pairs')).toHaveText([/Ana & Ben\s*1/]);
        await expect(rows(page, 'board_farthest')).toHaveCount(5);
        await expect(page.locator('#farthest_sticker')).toContainText('Oakura, Neuseeland, von Gerd');
    });
});

test.describe('from where I am', () => {
    test.use({ geolocation: { latitude: 48.1372, longitude: 11.5761 }, permissions: ['geolocation'] });

    test('measures from my location, rounded to about 1 km', async ({ page }) => {
        await mockStickers(page, stickers);
        await page.goto('/stats');
        await expect(page.locator('#farthest_sticker')).toContainText('Wien');
        const request = page.waitForRequest(request => new URL(request.url()).pathname === '/api/stats/people'
            && new URL(request.url()).searchParams.get('latitude') !== String(HOME.latitude));

        await chip(page, 'von mir').click();

        const params = new URL((await request).url()).searchParams;
        expect([params.get('latitude'), params.get('longitude')]).toEqual(['48.14', '11.58']);
        await expect(page.getByRole('status').first()).toHaveText(/Gemessen von deinem Standort/);
        // From Munich, Copenhagen is farther than Vienna.
        await expect(page.locator('#farthest_sticker')).toContainText('Kopenhagen, Dänemark, von Ana');
    });
});

test.describe('without the location', () => {
    test.use({ permissions: [] });

    test('stays with Norderstedt and says why', async ({ page, context }) => {
        await context.clearPermissions();
        await mockStickers(page, stickers);
        await page.goto('/stats');

        await chip(page, 'von mir').click();

        await expect(page.locator('#origin_status')).toHaveText(/gemessen wird von Norderstedt/);
        await expect(page.getByRole('radio', { name: 'von Norderstedt' })).toBeChecked();
    });
});

test('shows names with quotes as text, also in attributes', async ({ page }) => {
    const name = `x" data-injected="1' onmouseover='alert(1)`;
    await mockStickers(page, [sticker(1, name, 'Hamburg', 'Deutschland', lastYear)]);
    await page.goto('/stats');

    const row = page.locator('#board_stickers .rank_row');

    await expect(row.getByRole('link')).toHaveText(name);
    await expect(row).toHaveAttribute('data-search', name.toLowerCase());
    await expect(page.locator('[data-injected], [onmouseover]')).toHaveCount(0);
});

test('says when a Zeitraum has no stickers', async ({ page }) => {
    await mockStickers(page, [sticker(1, 'Jonas', 'Bremen', 'Deutschland', lastYear, 53.08, 8.80)]);
    await page.goto('/stats');
    await expect(page.locator('#stickercount')).toHaveText('1');

    await chip(page, 'Monat').click();

    await expect(page.locator('#board_stickers .empty')).toHaveText('Noch keine Sticker in diesem Zeitraum');
    await expect(page.locator('#record_day')).toHaveText('Noch keine Sticker in diesem Zeitraum');
    await expect(page.locator('#king')).toHaveText(/ noch kein Sticker$/);
});

test.describe('when the API is down', () => {
    test.beforeEach(async ({ page }) => {
        await page.route(STATS_URL, route => route.fulfill({ status: 502 }));
        await page.goto('/stats');
    });

    test('says so', async ({ page }) => {
        await expect(page.getByRole('alert')).toHaveText('Sticker konnten nicht geladen werden');
    });
});
