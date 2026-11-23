/* eslint-disable @next/next/no-img-element */
type Props = { src: string | null | undefined; alt: string; className?: string };

export function Poster({ src, alt, className = "" }: Props) {
  if (!src) {
    return (
      <div className={`flex aspect-[2/3] items-center justify-center bg-card text-3xl text-muted ${className}`}>
        🎭
      </div>
    );
  }
  return (
    <img src={src} alt={alt} loading="lazy" className={`aspect-[2/3] w-full object-cover ${className}`} />
  );
}
