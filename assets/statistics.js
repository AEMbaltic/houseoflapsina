(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let token = '';
  let generation = 0;
  const fmt = new Intl.NumberFormat();
  const dates = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const regions = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
  function breakdown(id, rows, country) {
    const list = $(id);
    list.replaceChildren();
    rows.sort((a, b) => b.pageviews - a.pageviews).slice(0, 5).forEach(row => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = country && regions && /^[A-Z]{2}$/.test(row.name) ? regions.of(row.name) : row.name;
      const value = document.createElement('strong');
      value.textContent = fmt.format(row.pageviews);
      item.append(label, value);
      list.append(item);
    });
    if (!rows.length) list.textContent = 'No visits recorded yet.';
  }
  function chart(data) {
    const chart = $('stats-chart');
    chart.replaceChildren();
    const rows = new Map(data.daily.map(row => [row.date.slice(0, 10), row.pageviews]));
    const maximum = Math.max(1, ...rows.values());
    for (let i = 0; i < data.days; i++) {
      const day = new Date(data.since);
      day.setUTCDate(day.getUTCDate() + i);
      const views = rows.get(day.toISOString().slice(0, 10)) || 0;
      const bar = document.createElement('div');
      bar.className = 'stats-bar';
      bar.tabIndex = 0;
      const description = dates.format(day) + ': ' + fmt.format(views) + ' page views';
      bar.title = description;
      bar.setAttribute('aria-label', description);
      const fill = document.createElement('span');
      fill.style.height = (views / maximum * 100) + '%';
      const caption = document.createElement('small');
      caption.textContent = data.days <= 7 || i === 0 || i === data.days - 1 ? dates.format(day) : '';
      bar.append(fill, caption);
      chart.append(bar);
    }
  }
  async function load() {
    if (!token) return;
    const current = ++generation;
    $('stats-refresh').disabled = true;
    $('stats-status').textContent = 'Loading statistics...';
    $('stats-report').setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('/api/statistics?days=' + $('stats-period').value, {
        headers: { Authorization: 'Bearer ' + token }, cache: 'no-store', signal: AbortSignal.timeout(60000)
      });
      const data = await response.json();
      if (current !== generation) return;
      if (!response.ok) throw new Error(data.error || 'Could not load statistics.');
      $('stats-connect').hidden = true;
      $('stats-report').hidden = false;
      $('stats-visitors').textContent = fmt.format(data.visitors);
      $('stats-views').textContent = fmt.format(data.pageviews);
      chart(data);
      breakdown('stats-sources', data.sources, false);
      breakdown('stats-countries', data.countries, true);
      $('stats-status').textContent = data.pageviews === 0 ? 'No visits recorded for this period yet.' : 'Updated ' + new Date(data.updatedAt).toLocaleTimeString();
    } catch (error) {
      if (current !== generation) return;
      $('stats-report').hidden = true;
      $('stats-connect').hidden = false;
      $('stats-status').textContent = error.message || 'Could not load statistics. Try again.';
    } finally {
      if (current === generation) {
        $('stats-refresh').disabled = false;
        $('stats-report').setAttribute('aria-busy', 'false');
      }
    }
  }
  $('stats-connect').addEventListener('submit', event => {
    event.preventDefault();
    token = $('stats-token').value.trim();
    $('stats-token').value = '';
    load();
  });
  $('stats-period').addEventListener('change', load);
  $('stats-refresh').addEventListener('click', load);
  $('stats-disconnect').addEventListener('click', () => {
    generation++;
    token = '';
    $('stats-report').hidden = true;
    $('stats-connect').hidden = false;
    $('stats-status').textContent = 'Disconnected. Visitor tracking continues.';
  });
})();
