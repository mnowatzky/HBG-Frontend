// The charts of "Wann wird geklebt?", drawn with ECharts from js/vendor/. stats.js
// loads both once the section comes near, then calls loadCharts().

// --main-color. Below 3:1 against white, so only where a table or labels back it up.
const LIGHT_BLUE = '#55b6ff';
// --number-color, 4.9:1 against white: for marks without a label
const BLUE = '#0070c9';
// Days with more stickers are darker. One hue, light to dark.
const CALENDAR_STEPS = ['#a6d4fa', '#5fb0f0', '#1f86d6', '#0058a3'];
const INK = '#3c4043';
const MUTED = '#5f6368';
const LINES = '#e3e5e8';
const EMPTY_CELL = '#f1f3f5';

const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MONTHS = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(new Date(2024, month, 1)));
const SHORT_MONTHS = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(new Date(2024, month, 1)));

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const charts = {};

// The chart in the element, made on first use and resized with it
function chartIn(id) {
    if (!charts[id]) {
        const element = document.getElementById(id);
        charts[id] = echarts.init(element, null, { renderer: 'svg' });
        new ResizeObserver(() => charts[id].resize()).observe(element);
    }
    return charts[id];
}

function draw(id, description, option) {
    chartIn(id).setOption({
        animation: !reducedMotion,
        aria: { enabled: true, label: { description } },
        textStyle: { fontFamily: 'Oswald, sans-serif', color: INK, fontSize: 13 },
        ...option,
        // After option, so that a chart's own tooltip adds to these instead of replacing them
        tooltip: {
            confine: true,
            textStyle: { fontFamily: 'Oswald, sans-serif', color: INK },
            ...option.tooltip,
        },
    }, true);
}

// A chart with nothing to show says so instead.
function drawEmpty(id) {
    draw(id, EMPTY, {
        title: { text: EMPTY, left: 'center', top: 'middle', textStyle: { color: MUTED, fontWeight: 'normal', fontSize: 15 } },
    });
}

function table(id, headers, rows) {
    document.getElementById(id).innerHTML = !rows.length ? `<p class="empty">${EMPTY}</p>` : `<table>
        <thead><tr>${headers.map(header => `<th scope="col">${header}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(([name, value]) => `<tr><th scope="row">${name}</th><td>${formatNumber(value)}</td></tr>`).join('')}</tbody>
    </table>`;
}

const valueAxis = {
    type: 'value',
    minInterval: 1,
    splitLine: { lineStyle: { color: LINES } },
    axisLabel: { color: MUTED, formatter: value => formatNumber(value) },
};

function categoryAxis(data, extra = {}) {
    return {
        type: 'category',
        data,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: LINES } },
        axisLabel: { color: MUTED },
        ...extra,
    };
}

// ---- Uhrzeit: a clock with an hour per slice, midnight at the top

function isNight(hour) {
    return hour >= 22 || hour < 6;
}

function showHours(counts) {
    const byHour = Array.from({ length: 24 }, (_, hour) => counts.find(count => Number(count.key) === hour)?.count ?? 0);
    table('hour_table', ['Uhrzeit', 'Sticker'], byHour.map((count, hour) => [`${hour} bis ${hour + 1} Uhr`, count]));
    if (!counts.length) return drawEmpty('hour_chart');

    const night = byHour.reduce((sum, count, hour) => sum + (isNight(hour) ? count : 0), 0);
    const total = byHour.reduce((sum, count) => sum + count, 0);
    const busiest = byHour.indexOf(Math.max(...byHour));
    const slice = (name, color, keep) => ({
        name,
        type: 'bar',
        coordinateSystem: 'polar',
        stack: 'hours',
        data: byHour.map((count, hour) => (keep(hour) ? count : 0)),
        itemStyle: { color, borderRadius: 3 },
    });
    draw('hour_chart', `Die meisten Sticker zwischen ${busiest} und ${busiest + 1} Uhr. `
        + `${Math.round(night / total * 100)} % in der Nacht, zwischen 22 und 6 Uhr.`, {
        legend: { bottom: 0, selectedMode: false, itemWidth: 14, itemHeight: 14, textStyle: { color: INK } },
        polar: { radius: ['14%', '74%'], center: ['50%', '46%'] },
        angleAxis: {
            type: 'category',
            data: byHour.map((_, hour) => String(hour)),
            startAngle: 90,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: LINES } },
            axisLabel: { color: MUTED, interval: 2 },
            splitLine: { show: false },
        },
        radiusAxis: { axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: LINES } } },
        tooltip: {
            trigger: 'item',
            formatter: item => `${item.name} bis ${Number(item.name) + 1} Uhr: ${plural(item.value, 'Sticker', 'Sticker')}`,
        },
        series: [
            slice('Tag', LIGHT_BLUE, hour => !isNight(hour)),
            slice('Nacht (22 bis 6 Uhr)', BLUE, isNight),
        ],
    });
}

// ---- Wochentage

function showWeekdays(counts) {
    const byDay = WEEKDAYS.map((_, index) => counts.find(count => Number(count.key) === index + 1)?.count ?? 0);
    table('weekday_table', ['Wochentag', 'Sticker'], WEEKDAYS.map((day, index) => [day, byDay[index]]));
    if (!counts.length) return drawEmpty('weekday_chart');

    const busiest = WEEKDAYS[byDay.indexOf(Math.max(...byDay))];
    draw('weekday_chart', `Die meisten Sticker am ${busiest}.`, {
        grid: { left: 8, right: 8, top: 24, bottom: 8 },
        xAxis: categoryAxis(WEEKDAYS.map(day => day.slice(0, 2))),
        yAxis: { ...valueAxis, show: false },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ([item]) => `${WEEKDAYS[item.dataIndex]}: ${plural(item.value, 'Sticker', 'Sticker')}` },
        series: [{
            type: 'bar',
            data: byDay,
            barMaxWidth: 40,
            itemStyle: { color: BLUE, borderRadius: [4, 4, 0, 0] },
            label: { show: true, position: 'top', color: INK, formatter: item => formatNumber(item.value) },
        }],
    });
}

// ---- Sticker pro Monat, and in total

// Every month from the first to the last with stickers, also those without
function everyMonth(counts) {
    if (!counts.length) return [];
    const byMonth = new Map(counts.map(count => [count.key, count.count]));
    const [firstYear, firstMonth] = counts[0].key.split('-').map(Number);
    const [lastYear, lastMonth] = counts[counts.length - 1].key.split('-').map(Number);
    const months = [];
    for (let year = firstYear, month = firstMonth; year < lastYear || (year === lastYear && month <= lastMonth);) {
        const key = `${year}-${String(month).padStart(2, '0')}`;
        months.push([key, byMonth.get(key) ?? 0]);
        [year, month] = month === 12 ? [year + 1, 1] : [year, month + 1];
    }
    return months;
}

function monthName(key, short = false) {
    const [year, month] = key.split('-').map(Number);
    return `${(short ? SHORT_MONTHS : MONTHS)[month - 1]} ${year}`;
}

function showMonths(counts) {
    // A month is a single bar, so the month view leaves these charts out.
    if (state.period === 'monat') return;
    const months = everyMonth(counts);
    table('month_table', ['Monat', 'Sticker'], months.map(([key, count]) => [monthName(key), count]).reverse());
    if (!months.length) {
        drawEmpty('month_chart');
        drawEmpty('total_chart');
        return;
    }

    const keys = months.map(([key]) => key);
    // Over two years, one label a year; otherwise one a month
    const yearly = keys.length > 24;
    const axis = categoryAxis(keys, {
        axisLabel: {
            color: MUTED,
            interval: yearly ? (index, key) => key.endsWith('-01') : 'auto',
            formatter: key => (yearly ? key.slice(0, 4) : monthName(key, true)),
        },
    });
    const grid = { left: 8, right: 16, top: 16, bottom: 8 };
    const busiest = months.reduce((a, b) => (b[1] > a[1] ? b : a));

    draw('month_chart', `Die meisten Sticker im ${monthName(busiest[0])}: ${formatNumber(busiest[1])}.`, {
        grid,
        xAxis: axis,
        yAxis: valueAxis,
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: ([item]) => `${monthName(item.name)}: ${plural(item.value, 'Sticker', 'Sticker')}` },
        series: [{ type: 'bar', data: months.map(([, count]) => count), barMaxWidth: 24, itemStyle: { color: BLUE, borderRadius: [2, 2, 0, 0] } }],
    });

    let sum = 0;
    const totals = months.map(([, count]) => (sum += count));
    draw('total_chart', `Bis ${monthName(keys[keys.length - 1])} ${plural(sum, 'Sticker', 'Sticker')}.`, {
        grid,
        xAxis: { ...axis, boundaryGap: false },
        yAxis: valueAxis,
        tooltip: { trigger: 'axis', formatter: ([item]) => `Bis Ende ${monthName(item.name)}: ${plural(item.value, 'Sticker', 'Sticker')}` },
        series: [{ type: 'line', data: totals, showSymbol: false, symbolSize: 8, lineStyle: { width: 2, color: BLUE }, itemStyle: { color: BLUE } }],
    });
}

// ---- Kalender: one small month each, like a wall calendar, or only this month

let dayCounts = [];

const PIECES = [{ min: 1, max: 1, label: '1' }, { min: 2, max: 3, label: '2–3' }, { min: 4, max: 9, label: '4–9' }, { min: 10, label: '10+' }];

function legend() {
    return {
        type: 'piecewise',
        pieces: PIECES,
        inRange: { color: CALENDAR_STEPS },
        // Days without stickers in the month view
        outOfRange: { color: EMPTY_CELL },
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        itemWidth: 14,
        itemHeight: 14,
        textStyle: { color: INK },
        selectedMode: false,
    };
}

function showYears(counts) {
    dayCounts = counts;
    const monthly = state.period === 'monat';
    document.querySelector('.year_pick').hidden = monthly;
    document.getElementById('calendar_desc').textContent = `Sticker an jedem Tag des ${monthly ? 'Monats' : 'Jahres'}`;
    if (monthly) return showThisMonth();

    const select = document.getElementById('calendar_year');
    const years = [...new Set(counts.map(count => count.key.slice(0, 4)))].sort().reverse();
    const chosen = years.includes(select.value) ? select.value : years[0];
    select.innerHTML = years.map(year => `<option>${year}</option>`).join('');
    select.disabled = !years.length;
    if (chosen) select.value = chosen;
    showCalendar(chosen);
}

function showCalendar(year) {
    const element = document.getElementById('calendar_chart');
    const days = dayCounts.filter(count => count.key.startsWith(`${year}-`)).map(count => [count.key, count.count]);
    table('calendar_table', ['Tag', 'Sticker'], days.map(([day, count]) => [dateFormat.format(parseDay(day)), count]));
    if (!days.length) {
        element.style.height = '';
        chartIn('calendar_chart').resize();
        return drawEmpty('calendar_chart');
    }

    // Three months a row on phones, four on tablets, six on wide screens
    const width = element.clientWidth;
    const columns = width >= 900 ? 6 : width >= 520 ? 4 : 3;
    const slot = width / columns;
    // A month is up to six weeks wide and seven days tall.
    const cell = Math.max(8, Math.min(20, Math.floor((slot - 10) / 6)));
    const rowHeight = cell * 7 + 34;
    const legendHeight = 40;
    element.style.height = `${Math.ceil(12 / columns) * rowHeight + legendHeight}px`;
    chartIn('calendar_chart').resize();

    const calendars = MONTHS.map((_, month) => ({
        range: `${year}-${String(month + 1).padStart(2, '0')}`,
        orient: 'horizontal',
        left: Math.round((month % columns) * slot + 4),
        top: Math.floor(month / columns) * rowHeight + 22,
        cellSize: cell,
        dayLabel: { show: false, firstDay: 1 },
        monthLabel: { nameMap: SHORT_MONTHS, position: 'start', align: 'left', margin: 6, color: INK, fontSize: 12 },
        yearLabel: { show: false },
        splitLine: { show: false },
        itemStyle: { color: EMPTY_CELL, borderColor: '#fff', borderWidth: 2 },
    }));
    const max = Math.max(...days.map(([, count]) => count));
    const busiest = days.find(([, count]) => count === max);

    draw('calendar_chart', `${plural(days.length, 'Tag', 'Tage')} mit Stickern in ${year}, `
        + `die meisten am ${dateFormat.format(parseDay(busiest[0]))}: ${formatNumber(max)}.`, {
        calendar: calendars,
        visualMap: legend(),
        tooltip: {
            trigger: 'item',
            formatter: item => `${dateFormat.format(parseDay(item.value[0]))}: ${plural(item.value[1], 'Sticker', 'Sticker')}`,
        },
        series: calendars.map((_, month) => ({
            type: 'heatmap',
            coordinateSystem: 'calendar',
            calendarIndex: month,
            data: days.filter(([day]) => Number(day.slice(5, 7)) === month + 1),
        })),
    });
}

// This month as one large calendar: a column a weekday, a row a week, the day in
// each cell.
function showThisMonth() {
    const element = document.getElementById('calendar_chart');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const counts = new Map(dayCounts.map(count => [count.key, count.count]));
    const length = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length }, (_, index) => {
        const day = `${key}-${String(index + 1).padStart(2, '0')}`;
        const count = counts.get(day) ?? 0;
        // White on the two darkest blues
        return { value: [day, count], label: { color: count >= 4 ? '#fff' : INK } };
    });
    const stickered = days.filter(day => day.value[1] > 0).map(day => day.value);
    table('calendar_table', ['Tag', 'Sticker'], stickered.map(([day, count]) => [dateFormat.format(parseDay(day)), count]));

    const width = element.clientWidth;
    const cell = Math.max(28, Math.min(56, Math.floor((width - 16) / 7)));
    // Monday first
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const weeks = Math.ceil((offset + length) / 7);
    const top = 30;
    element.style.height = `${top + weeks * cell + 56}px`;
    chartIn('calendar_chart').resize();

    const busiest = stickered.reduce((a, b) => (b[1] > a[1] ? b : a), stickered[0]);
    draw('calendar_chart', busiest
        ? `${plural(stickered.length, 'Tag', 'Tage')} mit Stickern im ${MONTHS[month]}, `
          + `die meisten am ${dateFormat.format(parseDay(busiest[0]))}: ${formatNumber(busiest[1])}.`
        : `Noch keine Sticker im ${MONTHS[month]}.`, {
        calendar: {
            range: key,
            orient: 'vertical',
            left: Math.round((width - 7 * cell) / 2),
            top,
            cellSize: cell,
            dayLabel: { firstDay: 1, nameMap: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], position: 'start', margin: 8, color: MUTED },
            monthLabel: { show: false },
            yearLabel: { show: false },
            splitLine: { show: false },
            itemStyle: { color: EMPTY_CELL, borderColor: '#fff', borderWidth: 3 },
        },
        visualMap: legend(),
        tooltip: {
            trigger: 'item',
            formatter: item => `${dateFormat.format(parseDay(item.value[0]))}: ${plural(item.value[1], 'Sticker', 'Sticker')}`,
        },
        series: [{
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: days,
            label: { show: true, formatter: item => String(Number(item.value[0].slice(8))), fontSize: 13 },
        }],
    });
}

document.getElementById('calendar_year').addEventListener('change', event => showCalendar(event.target.value));

let calendarWidth = 0;
new ResizeObserver(([entry]) => {
    // Lays the months out again when the width changes, as when a phone turns.
    if (Math.abs(entry.contentRect.width - calendarWidth) < 1) return;
    calendarWidth = entry.contentRect.width;
    if (state.period === 'monat') showThisMonth();
    else if (dayCounts.length) showCalendar(document.getElementById('calendar_year').value);
}).observe(document.getElementById('calendar_chart'));

// ---- Loading

function loadCharts(filters) {
    const counts = by => () => fetchStats('/counts', { ...filters, by });
    const monthly = state.period === 'monat';
    for (const id of ['month_chart', 'total_chart']) {
        document.getElementById(id).closest('.chart_box').hidden = monthly;
    }
    return Promise.all([
        update('hours', counts('hour'), showHours),
        update('weekdays', counts('weekday'), showWeekdays),
        monthly ? null : update('months', counts('month'), showMonths),
        update('days', counts('day'), showYears),
    ]);
}
