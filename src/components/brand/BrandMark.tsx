type BrandMarkProps = {
  className?: string;
  size?: number;
};

/**
 * Shared Sniply brand mark (green rounded square + white S).
 * Served from `/brand/sniply-mark.svg` for a single visual source of truth.
 */
export function BrandMark({ className, size = 36 }: BrandMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset
    <img
      src="/brand/sniply-mark.svg"
      alt=""
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      decoding="async"
    />
  );
}
