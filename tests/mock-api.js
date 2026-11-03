// Stands in for HBG-Fast-API: GET /api/stickers with limit, offset and format, like the real one.

function sticker(id, name, city, country, date, latitude = 53.55, longitude = 9.99) {
    return { id, name, city, state: city, country, latitude, longitude, date: date.toISOString() };
}

const STICKERS_URL = url => url.pathname === '/api/stickers';

// Newest first, as the API returns them.
async function mockStickers(page, stickers) {
    await page.route(STICKERS_URL, route => {
        if (route.request().method() !== 'GET') return route.fallback();
        const url = new URL(route.request().url());
        const limit = Number(url.searchParams.get('limit') || 100);
        const offset = Number(url.searchParams.get('offset') || 0);
        const slice = stickers.slice(offset, offset + limit);
        const body = url.searchParams.get('format') === 'geojson'
            ? {
                type: 'FeatureCollection',
                features: slice.map(s => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
                    properties: { id: s.id, name: s.name },
                })),
            }
            : slice;
        return route.fulfill({
            json: body,
            headers: { 'X-Total-Count': String(stickers.length) },
        });
    });
}

module.exports = { STICKERS_URL, sticker, mockStickers };
