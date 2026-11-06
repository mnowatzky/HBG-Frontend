// Where the browser reaches the sticker API. The web server forwards this path
// to the API (see deploy/apache.conf). If the API lives on its own domain instead,
// put its URL here and add this site to STICKER_CORS_ORIGINS in the API's .env.
const API_BASE_URL = '/api';

// The place in Norderstedt that the statistics measure "von Norderstedt" from.
// HBG-Fast-API has the same point as HOME in src/stats.py.
const HOME = { latitude: 53.67549805330424, longitude: 9.980945457552263 };

async function fetchApi(path, params) {
    const response = await fetch(`${API_BASE_URL}${path}?${new URLSearchParams(params)}`);

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    return response;
}

async function fetchStickers(params) {
    const response = await fetchApi('/stickers', params);

    const body = await response.json();
    return {
        stickers: params.format === 'geojson' ? body.features : body,
        total: Number(response.headers.get('X-Total-Count'))
    };
}

// Yields all stickers page by page, newest first. Up to 5000 come in one request.
async function* fetchAllStickers(params, limit = 5000) {
    const seen = new Set();
    let offset = 0;

    while (true) {
        const { stickers } = await fetchStickers({ ...params, limit, offset });

        // A sticker saved while paging pushes the last one onto the next page.
        yield stickers.filter(sticker => {
            const id = sticker.id ?? sticker.properties.id;
            const isNew = !seen.has(id);
            seen.add(id);
            return isNew;
        });

        if (stickers.length < limit) break; // last page

        offset += stickers.length;
    }
}

// The statistics, computed by the API, like /summary, /counts or /people.
// Takes the filters of /stickers, like since_day and until_day as dates.
async function fetchStats(path, params = {}) {
    return (await fetchApi(`/stats${path}`, params)).json();
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Names are free text from anyone, so they must not be inserted into HTML as they are.
// Quotes are escaped too, so the result is safe in element text and in quoted attributes.
function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, character => HTML_ESCAPES[character]);
}
