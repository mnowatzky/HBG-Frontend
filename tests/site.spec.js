// What deploy/apache.conf sets up, and checks that apply to every page.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { sticker, mockStickers } = require('./mock-api');

// Pages that don't need Mapbox, which the tests can't control. The map is checked in karte.spec.js.
const PAGES = ['/sticker', '/stats', '/datenschutz'];

test('/ leads to the map', async ({ request }) => {
    const response = await request.get('/', { maxRedirects: 0 });

    expect(response.status()).toBe(302);
    expect(new URL(response.headers().location, 'http://x').pathname).toBe('/karte');
});

for (const [data, section] of [['names', 'ranglisten'], ['countries', 'wo']]) {
    test(`the old /bar_chart?data=${data} leads to its section of /stats`, async ({ request }) => {
        const response = await request.get(`/bar_chart?data=${data}`, { maxRedirects: 0 });

        expect(response.status()).toBe(302);
        expect(response.headers().location).toMatch(new RegExp(`/stats#${section}$`));
    });
}

test('the old placeholder and the server version are gone', async ({ request }) => {
    expect((await request.get('/index.html')).status()).toBe(404);

    const response = await request.get('/sticker');
    expect(response.headers().server).toBe('Apache');
});

test('pages are sent with the security headers, compressed', async ({ request }) => {
    const response = await request.get('/sticker', { headers: { 'Accept-Encoding': 'br, gzip' } });
    const headers = response.headers();

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('geolocation=(self)');
    expect(headers['content-security-policy-report-only']).toContain("default-src 'self'");
    expect(headers['content-encoding']).toBe('br');
});

for (const path of PAGES) {
    test.describe(path, () => {
        test.beforeEach(async ({ page }) => {
            await mockStickers(page, [sticker(1, 'Timo', 'Hamburg', 'Deutschland', new Date())]);
        });

        test('breaks no rule of the Content-Security-Policy and contacts no one else', async ({ page, baseURL }) => {
            const problems = [];
            page.on('console', message => {
                if (message.text().includes('Content Security Policy')) problems.push(message.text());
            });
            page.on('request', request => {
                const url = request.url();
                if (!url.startsWith(new URL(baseURL).origin) && !/^(data|blob):/.test(url)) {
                    problems.push(`request to ${url}`);
                }
            });

            await page.goto(path, { waitUntil: 'networkidle' });

            expect(problems).toEqual([]);
        });

        test('has no accessibility violations', async ({ page }) => {
            await page.goto(path, { waitUntil: 'networkidle' });

            const results = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
                .analyze();

            expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`)).toEqual([]);
        });
    });
}
