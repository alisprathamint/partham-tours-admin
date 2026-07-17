const getBaseUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = window.location.hostname;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  let configUrl = import.meta.env.VITE_API_BASE_URL || '';

  if (configUrl && (isLocalHost || (!configUrl.includes('localhost') && !configUrl.includes('127.0.0.1')))) {
    return configUrl;
  }

  if (hostname.includes('.devtunnels.ms')) {
    const tunnelMatch = hostname.match(/-(\d+)\.inc1\.devtunnels\.ms$/);
    if (tunnelMatch) {
      return `${protocol}//${hostname.replace(`-${tunnelMatch[1]}.inc1.devtunnels.ms`, '-5000.inc1.devtunnels.ms')}`;
    }
  }

  if (!isLocalHost && !hostname.includes('vercel.app')) {
    return `${protocol}//${hostname}:5000`;
  }

  return 'http://127.0.0.1:5000';
};

const BASE_URL = getBaseUrl();

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // Ensure we don't duplicate slashes
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
