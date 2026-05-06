export default async function handler(req, res) {
  res.status(404).json({
    error: 'No root endpoint. Use /api/db-proxy or other API routes.'
  });
}
