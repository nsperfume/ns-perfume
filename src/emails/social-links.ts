import type { SocialLink } from "@/lib/social";

/** Filled in by renderEmail before each render, because templates are plain synchronous components. */
let links: readonly SocialLink[] = [];

export const setEmailSocialLinks = (next: readonly SocialLink[]) => {
  links = next;
};

export const emailSocialLinks = () => links;
