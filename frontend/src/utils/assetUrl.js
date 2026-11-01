import { API_ORIGIN } from '../config/appConfig';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

export const resolveAssetUrl = (assetPath = '') => {
  if (!assetPath) {
    return '';
  }

  if (
    ABSOLUTE_URL_PATTERN.test(assetPath) ||
    assetPath.startsWith('data:') ||
    assetPath.startsWith('blob:')
  ) {
    return assetPath;
  }

  if (assetPath.startsWith('//')) {
    return `${window.location.protocol}${assetPath}`;
  }

  if (!API_ORIGIN) {
    return assetPath;
  }

  return assetPath.startsWith('/')
    ? `${API_ORIGIN}${assetPath}`
    : `${API_ORIGIN}/${assetPath}`;
};
