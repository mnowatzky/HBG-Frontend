// The statistics page. Everything but the charts loads at once. The charts need
// ECharts, which is large, so they load with js/stats-charts.js once their section
// comes near (see watchCharts).

// Rows a leaderboard shows before "Alle anzeigen"
const TOP = 5;
const EMPTY = 'Noch keine Sticker in diesem Zeitraum';

const numberFormat = new Intl.NumberFormat('de-DE');
const dateFormat = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
const monthFormat = new Intl.DateTimeFormat('de-DE', { month: 'long' });
const relativeFormat = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });

const state = {
    // "monat", "jahr" or "insgesamt", from the chips
    period: 'insgesamt',
    // Where "Am weitesten weg" measures from: HOME or the visitor's rounded location
    origin: HOME,
    chartsShown: false,
};

// ---- Formatting

function formatNumber(number) {
    return numberFormat.format(number);
}

function plural(count, one, many) {
    return `${formatNumber(count)} ${count === 1 ? one : many}`;
}

// Whole km, with one decimal below 10 km: "17.992 km", "4,8 km"
function formatKm(km) {
    const digits = km < 10 ? 1 : 0;
    const format = new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    return `${format.format(km)} km`;
}

// "2024-03-31", as that day in the visitor's time zone
function parseDay(text) {
    const [year, month, day] = text.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function isoDay(date) {
    const pad = number => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeAgo(date, now = new Date()) {
    const seconds = (date - now) / 1000;
    const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
    }
    return 'gerade eben';
}

function personLink(name) {
    return `<a href="/karte?name=${encodeURIComponent(name)}">${escapeHtml(name)}</a>`;
}

function peopleLinks(people) {
    return people.map(personLink).join(' & ');
}

// "Oakura, Neuseeland"
function placeName(sticker) {
    return escapeHtml([sticker.city, sticker.country].filter(Boolean).join(', ') || 'unbekanntem Ort');
}

// ---- Zeitraum

// The local days of a Zeitraum as the API's since_day and until_day. offset -1 is
// the one before, like last month.
function periodDays(period, offset = 0, now = new Date()) {
    const year = now.getFullYear();
    const month = now.getMonth();
    if (period === 'monat') {
        return {
            since_day: isoDay(new Date(year, month + offset, 1)),
            until_day: isoDay(new Date(year, month + offset + 1, 1)),
        };
    }
    if (period === 'jahr') {
        return { since_day: `${year + offset}-01-01`, until_day: `${year + offset + 1}-01-01` };
    }
    return {};
}

function periodName(period, now = new Date()) {
    if (period === 'monat') return `im ${monthFormat.format(now)}`;
    if (period === 'jahr') return `in ${now.getFullYear()}`;
    return 'Insgesamt';
}

// ---- Loading

const latestRequest = {};

// Fetches with request() and shows the result, unless a newer request for the same
// part came first, as when someone taps through the chips quickly.
async function update(part, request, show) {
    const id = (latestRequest[part] || 0) + 1;
    latestRequest[part] = id;
    const result = await request();
    if (latestRequest[part] === id) show(result);
}

function showLoadError(error) {
    console.error(error);
    document.getElementById('load_error').style.display = 'block';
}

const BUSY_PARTS = ['cards', 'ranglisten', 'weiteste', 'rekorde', 'wann', 'wo'];

function setBusy(busy) {
    for (const id of BUSY_PARTS) {
        document.getElementById(id).setAttribute('aria-busy', String(busy));
    }
}

// Everything that the chips change
async function loadPeriod() {
    const filters = periodDays(state.period);
    setBusy(true);
    const parts = [loadCards(filters), loadPeople(filters), loadPairs(filters), loadRecords(filters), loadPlaces(filters)];
    if (state.chartsShown && typeof loadCharts === 'function') parts.push(loadCharts(filters));
    const results = await Promise.allSettled(parts);
    setBusy(false);
    results.filter(result => result.status === 'rejected').forEach(result => showLoadError(result.reason));
}

// What the chips don't change
async function loadAlways() {
    const results = await Promise.allSettled([loadLatest(), loadKing(), loadAllTimePeople()]);
    results.filter(result => result.status === 'rejected').forEach(result => showLoadError(result.reason));
}

// ---- The cards at the top

function showSummary(summary) {
    const counts = [summary.stickers, summary.cities, summary.countries, summary.people];
    ['stickercount', 'citycount', 'countrycount', 'namecount'].forEach((id, index) => {
        document.getElementById(id).innerText = counts[index].toString();
        pluralizeDesc(index, counts[index]);
    });
}

function pluralizeDesc(descIdx, count) {
    const singular = ['geklebter Sticker', 'beklebte Stadt', 'erobertes Land', 'Stickerverteiler'];
    const many = ['geklebte Sticker', 'beklebte Städte', 'eroberte Länder', 'Stickerverteiler'];
    const descIds = ['sticker_desc', 'city_desc', 'country_desc', 'name_desc'];
    document.getElementById(descIds[descIdx]).innerText = count === 1 ? singular[descIdx] : many[descIdx];
}

const ARROWS = { up: 'M12 19V5M6 11l6-6 6 6', down: 'M12 5v14M6 13l6 6 6-6' };

// The change from last month on a card, as a pill with an arrow, or nothing with
// diff null. Screen readers get it as a sentence.
function setDiff(id, diff) {
    const element = document.getElementById(id);
    element.hidden = diff === null;
    if (diff === null) return;

    const now = new Date();
    const before = monthFormat.format(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const amount = formatNumber(Math.abs(diff));
    const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
    const icon = direction === 'same' ? '' : `<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none"
        stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="${ARROWS[direction]}"/></svg>`;
    const sentence = { up: `${amount} mehr als im ${before}`, down: `${amount} weniger als im ${before}`, same: `so viele wie im ${before}` }[direction];
    element.className = `diff diff_${direction}`;
    element.innerHTML = `${icon}<span aria-hidden="true">${direction === 'same' ? '±0' : amount}</span>`
        + `<span class="visually_hidden">${sentence}</span>`;
}

function loadCards(filters) {
    const monthly = state.period === 'monat';
    return update('cards', () => Promise.all([
        fetchStats('/summary', filters),
        monthly ? fetchStats('/summary', periodDays('monat', -1)) : null,
    ]), ([summary, before]) => {
        document.querySelectorAll('.time_frame').forEach(element => element.innerText = periodName(state.period));
        showSummary(summary);
        const change = key => before ? summary[key] - before[key] : null;
        setDiff('total_diff', change('stickers'));
        setDiff('city_diff', change('cities'));
        setDiff('country_diff', change('countries'));
        setDiff('name_diff', change('people'));
    });
}

// ---- Leaderboards

// rows: { value, text, people or label, detail }, the largest value first. Equal
// values share a rank.
function renderBoard(id, rows, { all = true } = {}) {
    const board = document.getElementById(id);
    const list = board.querySelector('.ranking');
    const button = board.querySelector('.show_all');
    if (!rows.length) {
        list.innerHTML = `<li class="empty">${EMPTY}</li>`;
        if (button) button.hidden = true;
        return;
    }

    const max = Math.max(...rows.map(row => row.value));
    let rank = 0;
    list.innerHTML = rows.map((row, index) => {
        if (index === 0 || row.value !== rows[index - 1].value) rank = index + 1;
        return rankRow(row, rank, max, index >= TOP);
    }).join('');

    if (button) {
        button.hidden = !all || rows.length <= TOP;
        button.setAttribute('aria-expanded', 'false');
        button.textContent = `Alle anzeigen (${rows.length})`;
    }
}

function rankRow(row, rank, max, hidden) {
    const medal = ['🥇', '🥈', '🥉'][rank - 1];
    const place = medal
        ? `<span aria-hidden="true">${medal}</span><span class="visually_hidden">Platz ${rank}</span>`
        : `${rank}.`;
    const name = row.people ? peopleLinks(row.people) : escapeHtml(row.label);
    const detail = row.detail ? `<span class="rank_detail">${escapeHtml(row.detail)}</span>` : '';
    const search = escapeHtml((row.people || [row.label]).join(' ').toLowerCase());
    return `<li class="rank_row" data-search="${search}" style="--share: ${(row.value / max).toFixed(3)}"${hidden ? ' hidden' : ''}>
        <span class="rank">${place}</span>
        <span class="rank_name">${name}${detail}</span>
        <span class="rank_value">${row.text}</span>
        <span class="rank_bar" aria-hidden="true"></span>
    </li>`;
}

function toggleAll(button) {
    const board = button.closest('.board');
    const rows = board.querySelectorAll('.rank_row');
    const expand = button.getAttribute('aria-expanded') !== 'true';
    rows.forEach((row, index) => row.hidden = !expand && index >= TOP);
    button.setAttribute('aria-expanded', String(expand));
    button.textContent = expand ? 'Weniger anzeigen' : `Alle anzeigen (${rows.length})`;
    if (!expand) board.scrollIntoView({ block: 'nearest' });
}

// Filters "Sticker pro Person" by name, across all of it
function searchNames(query) {
    const board = document.getElementById('board_stickers');
    const button = board.querySelector('.show_all');
    const rows = [...board.querySelectorAll('.rank_row')];
    const search = query.trim().toLowerCase();
    const expanded = button.getAttribute('aria-expanded') === 'true';
    rows.forEach((row, index) => {
        row.hidden = search ? !row.dataset.search.includes(search) : !expanded && index >= TOP;
    });
    button.hidden = Boolean(search) || rows.length <= TOP;
    board.querySelector('.no_match').hidden = !search || rows.some(row => !row.hidden);
}

// Each person by one number of /stats/people, without those at 0
function peopleBy(people, key, text = formatNumber) {
    return people
        .filter(person => person[key] > 0)
        .sort((a, b) => b[key] - a[key] || a.label.localeCompare(b.label, 'de'))
        .map(person => ({ people: [person.label], value: person[key], text: text(person[key]) }));
}

function originParams() {
    return { latitude: state.origin.latitude, longitude: state.origin.longitude };
}

function loadPeople(filters) {
    return update('people', () => fetchStats('/people', { ...filters, ...originParams() }), people => {
        renderBoard('board_stickers', peopleBy(people, 'stickers'));
        searchNames(document.getElementById('name_search').value);
        renderBoard('board_night', peopleBy(people, 'night'));
        renderBoard('board_countries', peopleBy(people, 'countries'));
        renderBoard('board_cities', peopleBy(people, 'cities'));
        renderBoard('board_weekend', peopleBy(people, 'weekend'));
        renderBoard('board_travelled', peopleBy(people, 'travelled_km', formatKm));
        showFarthest(people);
    });
}

function loadPairs(filters) {
    return update('pairs', () => fetchStats('/pairs', { ...filters, limit: 100 }), pairs => {
        renderBoard('board_pairs', pairs.map(pair => ({
            people: pair.labels, value: pair.count, text: formatNumber(pair.count),
        })));
    });
}

// ---- Am weitesten weg

// Every sticker has a person, so the farthest of all is the farthest of someone.
function showFarthest(people) {
    const farthest = people
        .filter(person => person.farthest)
        .sort((a, b) => b.farthest.distance_km - a.farthest.distance_km);
    const top = farthest[0]?.farthest;
    document.getElementById('farthest_sticker').innerHTML = top
        ? `<strong>${formatKm(top.distance_km)}</strong> entfernt in ${placeName(top)}, `
          + `von ${peopleLinks(top.people)} am ${dateFormat.format(new Date(top.date))}`
        : EMPTY;
    renderBoard('board_farthest', farthest.slice(0, TOP).map(person => ({
        people: [person.label],
        value: person.farthest.distance_km,
        text: formatKm(person.farthest.distance_km),
        detail: [person.farthest.city, person.farthest.country].filter(Boolean).join(', '),
    })), { all: false });
}

function currentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('no geolocation'));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, { maximumAge: 600000, timeout: 15000 });
    });
}

// About 1 km, which is all the distances need
function roughly(degrees) {
    return Math.round(degrees * 100) / 100;
}

async function measureFrom(origin) {
    const status = document.getElementById('origin_status');
    if (origin === 'home') {
        state.origin = HOME;
        status.textContent = '';
    } else {
        status.textContent = 'Standort wird ermittelt …';
        try {
            const { coords } = await currentPosition();
            state.origin = { latitude: roughly(coords.latitude), longitude: roughly(coords.longitude) };
            status.textContent = 'Gemessen von deinem Standort, auf etwa einen Kilometer gerundet.';
        } catch (error) {
            state.origin = HOME;
            document.querySelector('input[name=origin][value=home]').checked = true;
            status.textContent = error.code === 1
                ? 'Ohne Freigabe des Standorts geht das nicht, gemessen wird von Norderstedt.'
                : 'Der Standort ließ sich nicht ermitteln, gemessen wird von Norderstedt.';
            return;
        }
    }
    document.getElementById('weiteste').setAttribute('aria-busy', 'true');
    try {
        await loadPeople(periodDays(state.period));
    } catch (error) {
        showLoadError(error);
    } finally {
        document.getElementById('weiteste').setAttribute('aria-busy', 'false');
    }
}

// ---- Neuester Sticker and Sticker-König(in) des Monats

function loadLatest() {
    return update('latest', () => fetchStats('/latest'), ({ stickers: [newest, before], distance_km }) => {
        const element = document.getElementById('latest');
        if (!newest) {
            element.textContent = 'Noch kein Sticker';
            return;
        }
        element.innerHTML = `${peopleLinks(newest.people)} in ${placeName(newest)}, ${timeAgo(new Date(newest.date))}.`
            + (before ? ` <strong>${formatKm(distance_km)}</strong> vom vorletzten Sticker, `
                + `von ${peopleLinks(before.people)} in ${placeName(before)}.` : '');
    });
}

function loadKing() {
    const month = periodName('monat');
    return update('king', () => fetchStats('/counts', { ...periodDays('monat'), by: 'person', limit: 10 }), counts => {
        const element = document.getElementById('king');
        if (!counts.length) {
            element.textContent = `${month[0].toUpperCase()}${month.slice(1)} noch kein Sticker`;
            return;
        }
        const kings = counts.filter(count => count.count === counts[0].count);
        element.innerHTML = `${peopleLinks(kings.map(king => king.label))} mit `
            + `<strong>${formatNumber(counts[0].count)}</strong> ${counts[0].count === 1 ? 'Sticker' : 'Stickern'} ${month}`;
    });
}

// ---- Rekorde

function loadRecords(filters) {
    return update('records', () => fetchStats('/records', filters), records => {
        const { record_day: day, longest_streak: streak, home_share: home } = records;
        document.getElementById('record_day').innerHTML = day
            ? `<strong>${formatNumber(day.count)}</strong> Sticker am ${dateFormat.format(parseDay(day.day))}`
            : EMPTY;
        document.getElementById('streak').innerHTML = !streak ? EMPTY : streak.days === 1
            ? `<strong>1</strong> Tag, am ${dateFormat.format(parseDay(streak.start))}`
            : `<strong>${formatNumber(streak.days)}</strong> Tage, `
              + dateFormat.formatRange(parseDay(streak.start), parseDay(streak.end));

        const share = home.total ? home.within / home.total : 0;
        document.getElementById('home_share').innerHTML = !home.total ? EMPTY
            : `<strong>${Math.round(share * 100)} %</strong> ${formatNumber(home.within)} von ${plural(home.total, 'Sticker', 'Stickern')}`
              + `<span class="meter" aria-hidden="true"><span style="--share: ${share.toFixed(3)}"></span></span>`;

        const ends = [['north', 'Norden'], ['south', 'Süden'], ['east', 'Osten'], ['west', 'Westen']];
        document.getElementById('compass').innerHTML = records.north
            ? ends.map(([key, name]) => `<dt>${name}</dt><dd>${placeName(records[key])}, von ${peopleLinks(records[key].people)}</dd>`).join('')
            : `<dt>Alle Richtungen</dt><dd>${EMPTY}</dd>`;
    });
}

// Neuling and Veteran are about everyone since the start, whatever the Zeitraum.
function loadAllTimePeople() {
    return update('all_time_people', () => fetchStats('/people'), people => {
        if (!people.length) {
            document.getElementById('newcomer').textContent = 'Noch niemand';
            document.getElementById('veteran').textContent = 'Noch niemand';
            return;
        }
        // The API's dates are all ISO in UTC, so they sort as text.
        const newcomer = people.reduce((a, b) => (b.first > a.first ? b : a));
        const span = person => new Date(person.last) - new Date(person.first);
        const veteran = people.reduce((a, b) => (span(b) > span(a) ? b : a));
        document.getElementById('newcomer').innerHTML = `${personLink(newcomer.label)}, `
            + `erster Sticker am ${dateFormat.format(new Date(newcomer.first))}`;
        const years = Math.floor(span(veteran) / (365.25 * 86400000));
        const days = Math.round(span(veteran) / 86400000);
        document.getElementById('veteran').innerHTML = `${personLink(veteran.label)}, `
            + `<strong>${years >= 1 ? plural(years, 'Jahr', 'Jahre') : plural(days, 'Tag', 'Tage')}</strong> dabei, `
            + dateFormat.formatRange(new Date(veteran.first), new Date(veteran.last));
    });
}

// ---- Wo wird geklebt?

function loadPlaces(filters) {
    const byCount = counts => counts.map(count => ({ label: count.label, value: count.count, text: formatNumber(count.count) }));
    return Promise.all([
        update('cities', () => fetchStats('/counts', { ...filters, by: 'city' }), counts => renderBoard('board_city_counts', byCount(counts))),
        update('countries', () => fetchStats('/counts', { ...filters, by: 'country' }), counts => renderBoard('board_country_counts', byCount(counts))),
    ]);
}

// ---- Wann wird geklebt? (the charts)

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Could not load ${src}`));
        document.head.append(script);
    });
}

let chartScripts;

async function showCharts() {
    const status = document.getElementById('charts_status');
    status.textContent = 'Diagramme laden …';
    try {
        chartScripts ??= loadScript('js/vendor/echarts/echarts.min.js').then(() => loadScript('js/stats-charts.js'));
        await chartScripts;
        await loadCharts(periodDays(state.period));
        status.textContent = '';
    } catch (error) {
        console.error(error);
        status.textContent = 'Die Diagramme konnten nicht geladen werden.';
    }
}

// Loads the charts once their section is less than a screen away.
function watchCharts() {
    const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        state.chartsShown = true;
        showCharts();
    }, { rootMargin: '300px 0px' });
    observer.observe(document.getElementById('wann'));
}

// ---- Back to the top

// The button shows once the logo is out of sight, and takes the focus to the chips.
function watchScrolling() {
    const button = document.getElementById('to_top');
    new IntersectionObserver(([entry]) => {
        button.hidden = entry.isIntersecting;
    }).observe(document.querySelector('.logo_heading'));
    button.addEventListener('click', () => {
        const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
        document.querySelector('input[name=period]:checked').focus({ preventScroll: true });
    });
}

// ---- The section links show where you are

// The current section is the last one whose top has passed below the sticky bar,
// or the last of all at the end of the page.
function watchSections() {
    const links = [...document.querySelectorAll('.jump a')];
    const bar = document.querySelector('.stats_bar');
    let scheduled = false;
    const mark = () => {
        scheduled = false;
        const line = bar.getBoundingClientRect().bottom + 24;
        const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
        const passed = links.filter(link => document.querySelector(link.hash).getBoundingClientRect().top <= line);
        const current = atEnd ? links[links.length - 1] : passed[passed.length - 1];
        links.forEach(link => (link === current ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current')));
    };
    addEventListener('scroll', () => {
        if (!scheduled) requestAnimationFrame(mark);
        scheduled = true;
    }, { passive: true });
    addEventListener('resize', mark);
    mark();
}

// ---- Start

document.querySelectorAll('input[name=period]').forEach(input => input.addEventListener('change', () => {
    state.period = input.value;
    loadPeriod();
}));
document.querySelectorAll('input[name=origin]').forEach(input => input.addEventListener('change', () => {
    measureFrom(input.value);
}));
document.querySelectorAll('.show_all').forEach(button => button.addEventListener('click', () => toggleAll(button)));
document.getElementById('name_search').addEventListener('input', event => searchNames(event.target.value));

// A reload keeps a checked chip in some browsers.
state.period = document.querySelector('input[name=period]:checked').value;
document.querySelector('input[name=origin][value=home]').checked = true;

loadPeriod();
loadAlways();
watchCharts();
watchScrolling();
watchSections();
