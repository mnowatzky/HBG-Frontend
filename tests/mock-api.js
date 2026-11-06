// Stands in for HBG-Fast-API: GET /api/stickers with limit, offset and format, and
// /api/stats/… with the filters since, until, since_day, until_day and name, like the
// real one.

const COUNTRY_CODES = { Deutschland: 'DE', Österreich: 'AT', Dänemark: 'DK', Neuseeland: 'NZ', Japan: 'JP' };

function sticker(id, name, city, country, date, latitude = 53.55, longitude = 9.99, timezone = 'Europe/Berlin') {
    return {
        id, name, city, state: city, country, country_code: COUNTRY_CODES[country] ?? '',
        latitude, longitude, timezone, date: date.toISOString(),
        people: name.split('&').map(person => person.trim()).filter(Boolean),
    };
}

const STICKERS_URL = url => url.pathname === '/api/stickers';
const STATS_URL = url => url.pathname.startsWith('/api/stats/');

// The people on a sticker, each once, like the API
function people(sticker) {
    const seen = new Set();
    return sticker.people.filter(person => !seen.has(person.toLowerCase()) && seen.add(person.toLowerCase()));
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// The day, month, weekday and hour on the clocks where the sticker was placed
function local(sticker) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: sticker.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', hourCycle: 'h23', weekday: 'short',
    }).formatToParts(new Date(sticker.date)).map(part => [part.type, part.value]));
    return {
        day: `${parts.year}-${parts.month}-${parts.day}`,
        month: `${parts.year}-${parts.month}`,
        weekday: String(WEEKDAYS.indexOf(parts.weekday) + 1),
        hour: parts.hour,
    };
}

function isNight(sticker) {
    const hour = Number(local(sticker).hour);
    return hour >= 22 || hour < 6;
}

// Haversine with the mean Earth radius, like the API
function distanceKm(a, b) {
    const radians = degrees => degrees * Math.PI / 180;
    const h = Math.sin(radians(b.latitude - a.latitude) / 2) ** 2
        + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(radians(b.longitude - a.longitude) / 2) ** 2;
    return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(h)));
}

const round = km => Math.round(km * 10) / 10;
const newestFirst = (a, b) => b.date.localeCompare(a.date) || b.id - a.id;
const oldestFirst = (a, b) => -newestFirst(a, b);

function filtered(stickers, params) {
    const since = params.get('since');
    const until = params.get('until');
    const sinceDay = params.get('since_day');
    const untilDay = params.get('until_day');
    const name = params.get('name')?.toLowerCase();
    return stickers.filter(s =>
        (!since || new Date(s.date) >= new Date(since)) && (!until || new Date(s.date) < new Date(until))
        && (!sinceDay || local(s).day >= sinceDay) && (!untilDay || local(s).day < untilDay)
        && (!name || people(s).some(person => person.toLowerCase() === name)));
}

function summary(stickers) {
    const distinct = values => new Set(values.filter(Boolean)).size;
    return {
        stickers: stickers.length,
        people: distinct(stickers.flatMap(people).map(name => name.toLowerCase())),
        cities: distinct(stickers.map(s => s.city)),
        countries: distinct(stickers.map(s => s.country_code)),
    };
}

// People, countries and cities most first, times in order, with the name as key and label
function counts(stickers, by) {
    const keys = {
        person: s => people(s),
        country: s => [s.country],
        city: s => [s.city],
        month: s => [local(s).month],
        weekday: s => [local(s).weekday],
        hour: s => [local(s).hour],
        day: s => [local(s).day],
    }[by];
    const tally = new Map();
    for (const key of stickers.flatMap(keys).filter(Boolean)) {
        tally.set(key, (tally.get(key) || 0) + 1);
    }
    const order = ['person', 'country', 'city'].includes(by)
        ? (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
        : (a, b) => a[0].localeCompare(b[0]);
    return [...tally].sort(order).map(([key, count]) => ({ key, label: key, count }));
}

function personStats(stickers, place) {
    const byKey = new Map();
    for (const s of [...stickers].sort(oldestFirst)) {
        for (const person of people(s)) {
            const key = person.toLowerCase();
            if (!byKey.has(key)) byKey.set(key, { key, label: person, stickers: [] });
            byKey.get(key).stickers.push(s);
        }
    }
    return [...byKey.values()].map(({ key, label, stickers: own }) => {
        const farthest = place && own.reduce((a, b) => (distanceKm(place, b) > distanceKm(place, a) ? b : a));
        return {
            key,
            label,
            stickers: own.length,
            countries: new Set(own.map(s => s.country_code).filter(Boolean)).size,
            cities: new Set(own.map(s => s.city).filter(Boolean)).size,
            night: own.filter(isNight).length,
            weekend: own.filter(s => Number(local(s).weekday) >= 6).length,
            travelled_km: round(own.slice(1).reduce((sum, s, index) => sum + distanceKm(own[index], s), 0)),
            first: own[0].date,
            last: own[own.length - 1].date,
            farthest: place ? { ...farthest, distance_km: round(distanceKm(place, farthest)) } : null,
        };
    }).sort((a, b) => b.stickers - a.stickers || a.key.localeCompare(b.key));
}

function pairs(stickers) {
    const tally = new Map();
    for (const s of stickers) {
        const names = people(s).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        names.forEach((first, index) => names.slice(index + 1).forEach(second => {
            const id = `${first.toLowerCase()}|${second.toLowerCase()}`;
            const pair = tally.get(id) ?? { keys: [first.toLowerCase(), second.toLowerCase()], labels: [first, second], count: 0 };
            pair.count += 1;
            tally.set(id, pair);
        }));
    }
    return [...tally.values()].sort((a, b) => b.count - a.count || a.keys.join().localeCompare(b.keys.join()));
}

const HOME = { latitude: 53.67549805330424, longitude: 9.980945457552263 };

function records(stickers) {
    const days = counts(stickers, 'day');
    const recordDay = days.reduce((a, b) => (b.count > a.count ? b : a), days[0]);
    let streak = null;
    let run = null;
    for (const { key } of days) {
        const next = run && new Date(Date.parse(run.end) + 86400000).toISOString().slice(0, 10);
        run = next === key ? { ...run, end: key, days: run.days + 1 } : { start: key, end: key, days: 1 };
        if (!streak || run.days > streak.days) streak = run;
    }
    const extreme = compare => [...stickers].sort((a, b) => compare(a, b) || a.id - b.id)[0] ?? null;
    return {
        record_day: recordDay ? { day: recordDay.key, count: recordDay.count } : null,
        longest_streak: streak,
        north: extreme((a, b) => b.latitude - a.latitude),
        south: extreme((a, b) => a.latitude - b.latitude),
        east: extreme((a, b) => b.longitude - a.longitude),
        west: extreme((a, b) => a.longitude - b.longitude),
        home_share: {
            ...HOME, radius_km: 25, total: stickers.length,
            within: stickers.filter(s => distanceKm(HOME, s) <= 25).length,
        },
    };
}

function latest(stickers) {
    const [newest, before] = [...stickers].sort(newestFirst);
    return {
        stickers: [newest, before].filter(Boolean),
        distance_km: before ? round(distanceKm(newest, before)) : null,
    };
}

function stats(stickers, url) {
    const params = url.searchParams;
    const selected = filtered(stickers, params);
    const limit = Number(params.get('limit')) || undefined;
    const place = params.has('latitude')
        ? { latitude: Number(params.get('latitude')), longitude: Number(params.get('longitude')) }
        : null;
    switch (url.pathname.replace('/api/stats/', '')) {
        case 'summary': return summary(selected);
        case 'counts': return counts(selected, params.get('by')).slice(0, limit);
        case 'people': return personStats(selected, place);
        case 'pairs': return pairs(selected).slice(0, limit);
        case 'records': return records(selected);
        case 'latest': return latest(stickers);
        default: throw new Error(`no mock for ${url.pathname}`);
    }
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
    await page.route(STATS_URL, route => route.fulfill({ json: stats(stickers, new URL(route.request().url())) }));
}

module.exports = { STICKERS_URL, STATS_URL, HOME, sticker, mockStickers };
