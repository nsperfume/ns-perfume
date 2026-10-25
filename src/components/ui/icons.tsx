/**
 * Static line icons (Lucide geometry) for the storefront chrome. Replaces the
 * animated icon set, which shipped a full motion runtime on every page.
 */
import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "color"> & {
  size?: number;
  color?: string;
  /** Accepted for drop-in compatibility with the old animated icons; ignored. */
  isAnimated?: boolean;
};

function make(name: string, children: ReactNode) {
  function Icon({ size = 20, color = "currentColor", strokeWidth = 1.75, isAnimated: _a, ...rest }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...rest}
      >
        {children}
      </svg>
    );
  }
  Icon.displayName = name;
  return Icon;
}

export const ChevronDownIcon = make("ChevronDownIcon", <path d="m6 9 6 6 6-6" />);
export const HeartIcon = make(
  "HeartIcon",
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
);
export const MenuIcon = make(
  "MenuIcon",
  <>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </>,
);
export const SearchIcon = make(
  "SearchIcon",
  <>
    <circle cx="11" cy="11" r="7.5" />
    <path d="m20.5 20.5-4.2-4.2" />
  </>,
);
export const ShoppingBagIcon = make(
  "ShoppingBagIcon",
  <>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </>,
);
export const UserIcon = make(
  "UserIcon",
  <>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>,
);
export const XIcon = make(
  "XIcon",
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
);
