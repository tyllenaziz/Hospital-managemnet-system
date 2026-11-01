import { APP_DOMAINS } from '../config/appConfig';

const HOSPITAL_CONTEXT_KEY = 'bensmma_hospital_context';

const normalizeCode = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export const slugifyHospitalIdentifier = (value = '') =>
  normalizeCode(
    String(value)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
  );

export const getStoredHospitalContext = () =>
  normalizeCode(window.localStorage?.getItem(HOSPITAL_CONTEXT_KEY) || '');

export const setStoredHospitalContext = (hospitalCode) => {
  const normalized = normalizeCode(hospitalCode);
  if (!normalized) return;
  window.localStorage?.setItem(HOSPITAL_CONTEXT_KEY, normalized);
};

export const clearStoredHospitalContext = () => {
  window.localStorage?.removeItem(HOSPITAL_CONTEXT_KEY);
};

export const resolveHospitalCodeFromHostname = (hostname = window.location.hostname) => {
  const normalizedHost = normalizeCode(hostname);
  const { portalHost, hospitalRootDomain } = APP_DOMAINS;

  if (!normalizedHost || normalizedHost === 'localhost' || normalizedHost === '127.0.0.1') {
    return '';
  }

  if (normalizedHost === portalHost || normalizedHost === hospitalRootDomain) {
    return '';
  }

  if (normalizedHost.endsWith(`.${hospitalRootDomain}`)) {
    const [subdomain] = normalizedHost.split('.');
    return normalizeCode(subdomain);
  }

  return '';
};

export const resolveHospitalCode = (explicitCode = '') => {
  return (
    normalizeCode(explicitCode) ||
    resolveHospitalCodeFromHostname() ||
    getStoredHospitalContext()
  );
};

export const isHospitalSubdomainHost = (hostname = window.location.hostname) =>
  Boolean(resolveHospitalCodeFromHostname(hostname));

export const getTenantAwareLoginPath = (hospitalCode = '') => {
  const resolved = normalizeCode(hospitalCode) || resolveHospitalCode();

  if (isHospitalSubdomainHost()) {
    return '/login';
  }

  return resolved ? `/${resolved}` : '/login';
};
