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
        "relative isolate -mt-[var(--chrome-height)] overflow-hidden border-b border-hairline",
        className,
      )}
    >
      <div className="relative min-h-[17rem] w-full sm:min-h-[20rem] md:min-h-[22rem] lg:min-h-[24rem] xl:min-h-[26rem]">
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
          className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20"
          aria-hidden
        />
        <div className="container-ns relative z-10 flex min-h-[17rem] flex-col justify-end pb-8 pt-[calc(var(--chrome-height)+1.5rem)] sm:min-h-[20rem] sm:pb-10 md:min-h-[22rem] lg:min-h-[24rem] lg:pb-12 xl:min-h-[26rem]">
          <h1 className="text-display-lg max-w-2xl text-paper">{title}</h1>
          {description ? (
            <p className="measure mt-4 max-w-xl font-serif text-[1.0625rem] font-medium leading-relaxed text-white/95 sm:text-[1.2rem] sm:leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
