const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || '/api'
);

export const API_ORIGIN = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;

export const APP_DOMAINS = {
  portalHost: (import.meta.env.VITE_PORTAL_HOST || 'online.vijomedix.nexvijo.com').toLowerCase(),
  hospitalRootDomain: (import.meta.env.VITE_HOSPITAL_ROOT_DOMAIN || 'nexvijo.com').toLowerCase(),
};

export const isElectronRuntime = () => window.location.protocol === 'file:';
