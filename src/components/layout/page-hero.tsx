import Image from "next/image";
import { cn } from "@/lib/cn";

type PageHeroProps = {
  title: string;
  description?: string;
  image: string;
  alt: string;
  priority?: boolean;
  /** CSS object-position — use to keep bottles fully framed */
  objectPosition?: string;
  className?: string;
};

/**
 * Tall catalog / collection band so product photography is not cropped short.
 * Pulls under fixed chrome so heroes stay full-bleed edge to edge.
 */
export function PageHero({
  title,
  description,
  image,
  alt,
  priority = true,
  objectPosition = "center 45%",
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative isolate -mt-chrome-height overflow-hidden border-b border-hairline",
        className,
      )}
    >
      <div className="relative min-h-[18rem] w-full sm:min-h-[21rem] md:min-h-[23rem] lg:min-h-[26rem] 2xl:min-h-[28rem]">
        <Image
          src={image}
          alt={alt}
          fill
          priority={priority}
          quality={80}
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition }}
        />
        <div
          className="absolute inset-0 bg-linear-to-r from-black/75 via-black/50 to-black/20"
          aria-hidden
        />
        <div className="container-ns relative z-10 flex min-h-[18rem] flex-col justify-end pb-9 pt-[calc(var(--spacing-chrome-height)+1.5rem)] sm:min-h-[21rem] sm:pb-12 md:min-h-[23rem] lg:min-h-[26rem] lg:pb-14 2xl:min-h-[28rem]">
          <h1 className="max-w-[44rem] text-display-lg text-balance text-paper">{title}</h1>
          {description ? (
            <p className="mt-4 line-clamp-3 max-w-[38rem] text-body text-white/90 sm:mt-5 sm:line-clamp-4 sm:text-body-lg md:line-clamp-none">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
