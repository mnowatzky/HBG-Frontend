// Where the browser reaches the sticker API. The web server forwards this path
// to the API (see deploy/apache.conf). If the API lives on its own domain instead,
// put its URL here and add this site to STICKER_CORS_ORIGINS in the API's .env.
const API_BASE_URL = '/api';

async function fetchStickers(params) {
    const response = await fetch(`${API_BASE_URL}/stickers?${new URLSearchParams(params)}`);

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    const body = await response.json();
    return {
        stickers: params.format === 'geojson' ? body.features : body,
        total: Number(response.headers.get('X-Total-Count'))
    };
}

// Yields all stickers page by page, newest first.
async function* fetchAllStickers(params, limit = 500) {
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

// Names are free text from anyone, so they must not be inserted into HTML as they are.
function escapeHtml(text) {
    const element = document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
}
