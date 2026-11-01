const { createHmac, timingSafeEqual } = require('node:crypto');
const safeEqual = (left, right) => { const a = Buffer.from(String(left || '')); const b = Buffer.from(String(right || '')); return a.length === b.length && timingSafeEqual(a, b); };
module.exports = (req, res, next) => {
  const apiKey = process.env.VIJO_MANAGEMENT_API_KEY || process.env.MANAGEMENT_API_KEY;
  const apiSecret = process.env.VIJO_MANAGEMENT_API_SECRET || process.env.MANAGEMENT_API_SECRET;
  if (!apiKey && !apiSecret) return res.status(503).json({ success: false, error: { code: 'SERVICE_AUTH_NOT_CONFIGURED', message: 'Management service authentication is not configured.' } });
  const authorization = req.get('authorization') || '';
  const provided = req.get('x-management-key') || (authorization.startsWith('Bearer ') ? authorization.slice(7) : '');
  const keyValid = apiKey && safeEqual(provided, apiKey);
  const timestamp = req.get('x-management-timestamp'); const time = Number(timestamp); const timely = Number.isFinite(time) && Math.abs(Date.now() - time) <= 300000;
  const expected = apiSecret && timely ? createHmac('sha256', apiSecret).update(`${timestamp}\n${req.method}\n${req.originalUrl}`).digest('hex') : '';
  const signatureValid = apiSecret && timely && safeEqual(req.get('x-management-signature'), expected);
  const authenticated = apiKey && apiSecret ? keyValid && signatureValid : keyValid || signatureValid;
  if (!authenticated) {
    console.warn(JSON.stringify({ level: 'warn', event: 'management_service_auth_failed', requestId: req.get('x-request-id'), method: req.method, route: req.originalUrl.split('?')[0], keyConfigured: Boolean(apiKey), secretConfigured: Boolean(apiSecret), keyValid: Boolean(keyValid), signatureValid: Boolean(signatureValid), timestampValid: timely }));
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid management service credentials.' } });
  }
  next();
};
