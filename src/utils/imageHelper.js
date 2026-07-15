const BASE_URL = 'http://127.0.0.1:5000';

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // Ensure we don't duplicate slashes
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
