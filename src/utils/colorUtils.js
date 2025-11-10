import { DEFAULT_SOURCES } from '../constants';

// Generate consistent color for each source (source.color or fallback)
export const getSourceColor = (source) => {
  // Fixed palette (explicit classes so Tailwind won't purge them)
  const PALETTE = {
    blue:   { bg: 'bg-blue-100',   border: 'border-blue-600',   text: 'text-blue-800',   hover: 'hover:bg-blue-200' },
    green:  { bg: 'bg-green-100',  border: 'border-green-600',  text: 'text-green-800',  hover: 'hover:bg-green-200' },
    purple: { bg: 'bg-purple-100', border: 'border-purple-600', text: 'text-purple-800', hover: 'hover:bg-purple-200' },
    orange: { bg: 'bg-orange-100', border: 'border-orange-600', text: 'text-orange-800', hover: 'hover:bg-orange-200' },
    pink:   { bg: 'bg-pink-100',   border: 'border-pink-600',   text: 'text-pink-800',   hover: 'hover:bg-pink-200' },
    indigo: { bg: 'bg-indigo-100', border: 'border-indigo-600', text: 'text-indigo-800', hover: 'hover:bg-indigo-200' },
    red:    { bg: 'bg-red-100',    border: 'border-red-600',    text: 'text-red-800',    hover: 'hover:bg-red-200' },
    teal:   { bg: 'bg-teal-100',   border: 'border-teal-600',   text: 'text-teal-800',   hover: 'hover:bg-teal-200' },
  };

  const keys = Object.keys(PALETTE);
  if (!source) return PALETTE.blue; // default fallback

  // Normalize to string name
  const name = typeof source === 'string' ? source : source.name;

  // 1️⃣ Try to find the matching source in DEFAULT_SOURCES
  const matched = DEFAULT_SOURCES.find(
    s => s.name.toLowerCase() === name.toLowerCase()
  );

  // 2️⃣ If that source has a defined color, use it
  if (matched?.color && PALETTE[matched.color]) {
    return PALETTE[matched.color];
  }

  // 3️⃣ Otherwise, fall back to deterministic hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0; // 32-bit int
  }
  const idx = Math.abs(hash) % colorKeys.length;
  return PALETTE[colorKeys[idx]];
};
