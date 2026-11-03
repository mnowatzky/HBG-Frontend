// Stands in for HBG-Fast-API: GET /api/stickers with limit, offset and format, and
// /api/stats/summary and /api/stats/counts with since and until, like the real one.

function sticker(id, name, city, country, date, latitude = 53.55, longitude = 9.99) {
    return { id, name, city, state: city, country, latitude, longitude, date: date.toISOString() };
}

const STICKERS_URL = url => url.pathname === '/api/stickers';
const STATS_URL = url => url.pathname.startsWith('/api/stats/');

// The people on a sticker, split like the API splits them
const people = sticker => sticker.name.split('&').map(name => name.trim()).filter(Boolean);

function summary(stickers) {
    const distinct = values => new Set(values.filter(Boolean)).size;
    return {
        stickers: stickers.length,
        people: distinct(stickers.flatMap(people).map(name => name.toLowerCase())),
        cities: distinct(stickers.map(s => s.city)),
        countries: distinct(stickers.map(s => s.country)),
    };
}

// Most first, with the name as key and label
function counts(stickers, by) {
    const tally = new Map();
    for (const key of by === 'person' ? stickers.flatMap(people) : stickers.map(s => s.country)) {
        tally.set(key, (tally.get(key) || 0) + 1);
    }
    return [...tally].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, label: key, count }));
}

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
    await page.route(STATS_URL, route => {
        const url = new URL(route.request().url());
        const since = url.searchParams.get('since');
        const until = url.searchParams.get('until');
        const selected = stickers.filter(s =>
            (!since || new Date(s.date) >= new Date(since)) && (!until || new Date(s.date) < new Date(until)));
        const json = url.pathname === '/api/stats/summary'
            ? summary(selected)
            : counts(selected, url.searchParams.get('by'));
        return route.fulfill({ json });
    });
}

module.exports = { STICKERS_URL, STATS_URL, sticker, mockStickers };
