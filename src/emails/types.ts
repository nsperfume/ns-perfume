import type { ReactElement } from "react";

/** A template ready to render: subject line plus the React Email element. */
export type EmailDefinition = {
  subject: string;
  element: ReactElement;
};
