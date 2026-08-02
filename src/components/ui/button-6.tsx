"use client";

/**
 * Reference demos for the slide button (rounded-md primary / secondary).
 */
import { Button } from "@/components/ui/button";

export function Component() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Shop Amber Noir</Button>
      <Button variant="secondary">Bestsellers</Button>
    </div>
  );
}

export default Component;
