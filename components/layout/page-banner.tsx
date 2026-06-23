import Image from "next/image";

/**
 * Page header banner with a relevant background image. The banner carries its
 * own dark brand gradient, so it looks identical in light and dark mode (the
 * day/night toggle never touches it) and never sits behind page data — the
 * details below render exactly as before.
 */
export function PageBanner({
  image,
  title,
  subtitle,
  alt = "",
}: {
  image: string;
  title: string;
  subtitle?: string;
  alt?: string;
}) {
  return (
    <div className="relative isolate overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
      <Image
        src={image}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      {/* Brand gradient — keeps text legible and the look theme-independent */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to right, rgba(8,33,40,0.94) 0%, rgba(11,93,94,0.78) 50%, rgba(11,93,94,0.42) 100%)",
        }}
      />
      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-xl text-sm text-white/80 sm:text-base">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
