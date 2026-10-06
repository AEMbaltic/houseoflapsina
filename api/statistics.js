'use strict';

const PROJECT = 'prj_9PivTnFOZBPR2au936y9seTpweVe';
const TEAM = 'team_a5vltYobdYv87nzFVHuxVGAV';

module.exports = async function statistics(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const days = Number(req.query.days || 7);
  if (![1, 7, 28].includes(days)) return res.status(400).json({ error: 'Choose today, 7 days, or 28 days.' });
  const auth = req.headers.authorization || '';
  if (!/^Bearer [A-Za-z0-9_-]{16,512}$/.test(auth)) {
    return res.status(401).json({ error: 'Connect a Vercel access token to view private statistics.' });
  }
  const until = new Date();
  const since = new Date(until);
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days + 1);
  async function query(by) {
    const params = new URLSearchParams({ projectId: PROJECT, teamId: TEAM, by,
      since: since.toISOString(), until: until.toISOString(), limit: '100',
      filter: "environment eq 'production' and (requestPath eq '/' or requestPath eq '/index.html')" });
    const response = await fetch('https://api.vercel.com/v1/query/web-analytics/visits/aggregate?' + params,
      { headers: { Authorization: auth }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) {
      const error = new Error('Analytics request failed');
      error.status = response.status;
      throw error;
    }
    const body = await response.json();
    if (!Array.isArray(body.data)) throw new Error('Invalid analytics response');
    return body.data;
  }
  try {
    // Separate aggregate gives the provider's visitor total, not a sum of daily uniques.
    const totals = await query('environment');
    const daily = await query('day');
    const sources = await query('referrerHostname');
    const countries = await query('country');
    const number = value => Number.isFinite(value) && value >= 0 ? value : 0;
    const total = totals.find(row => row.environment === 'production') || totals[0] || {};
    res.status(200).json({
      days, since: since.toISOString(), until: until.toISOString(), updatedAt: new Date().toISOString(),
      visitors: number(total.visitors), pageviews: number(total.pageviews),
      daily: daily.map(row => ({ date: row.timestamp, visitors: number(row.visitors), pageviews: number(row.pageviews) })),
      sources: sources.map(row => ({ name: row.referrerHostname || 'Direct / unknown', pageviews: number(row.pageviews) })),
      countries: countries.map(row => ({ name: row.country || 'Unknown', pageviews: number(row.pageviews) }))
    });
  } catch (error) {
    const unauthorized = error.status === 401 || error.status === 403;
    res.status(unauthorized ? 401 : 502).json({ error: unauthorized
      ? 'This token cannot read the gallery statistics. Check its scope or expiration.'
      : 'Statistics are temporarily unavailable. Please try again shortly.' });
  }
};
