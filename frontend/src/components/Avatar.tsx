import React from 'react';

/** Props for displaying a user or club avatar. */
interface AvatarProps {
  avatar?: string | null;
  size?: number; // pixel size
}

/**
 * Circular avatar image with fallback emoji. Accepts a direct image URL.
 * Backwards compatible: if a raw base64 string is passed, prefixes a data URI.
 */
export default function Avatar({ avatar, size = 32 }: AvatarProps) {
  const dimension = { width: size, height: size } as React.CSSProperties;

  const computeSrc = (val?: string | null) => {
    if (!val) return '';
    // If already a URL or data/blob URI, use as-is
    if (/^(data:|https?:|blob:|\/)/i.test(val)) return val;
    // Fallback for legacy plain base64 payloads
    return `data:image/png;base64,${val}`;
  };

  const [errored, setErrored] = React.useState(false);
  const src = computeSrc(avatar);

  return (
    <div
      style={dimension}
      className="rounded-full overflow-hidden flex items-center justify-center bg-orange-100"
    >
      {src && !errored ? (
        <img
          src={src}
          alt="avatar"
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="text-lg">👤</span>
      )}
    </div>
  );
}
