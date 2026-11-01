const defaultAllowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://online.vijomedix.nexvijo.com",
  "https://online.vijomedix.nexvijo.com"
]);

const extraOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

extraOrigins.forEach((origin) => defaultAllowedOrigins.add(origin));

const isHospitalSubdomain = (hostname) =>
  hostname.endsWith(".vijomedix.com") ||
  hostname.endsWith(".vijomedix.nexvijo.com") ||
  hostname.endsWith(".vijomedix.localhost");

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (defaultAllowedOrigins.has(origin)) return true;

  try {
    const url = new URL(origin);
    return isHospitalSubdomain(url.hostname.toLowerCase());
  } catch (err) {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
};

module.exports = {
  corsOptions
};
