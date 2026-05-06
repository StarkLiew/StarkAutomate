// Database query helper for worker.js
// Uses Vercel-hosted proxy

export async function queryDatabase(sqlQuery, params = []) {
  const response = await fetch(process.env.DB_PROXY_URL || 'https://your-vercel-project.vercel.app/api/db-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-db-api-key': process.env.DB_API_KEY || ''
    },
    body: JSON.stringify({
      query: sqlQuery,
      params: params
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Database error: ${error.details || error.error}`);
  }

  const data = await response.json();
  return data.rows || [];
}
