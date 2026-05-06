function jsonResponse(res, status, payload) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  return jsonResponse(res, 404, {
    error: 'No root endpoint. Use /api/db-proxy or other API routes.'
  });
}
