import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Newsletter preferences",
  description: "Your NS Perfume newsletter subscription has been updated.",
  robots: { index: false },
};

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ invalid?: string }>;
}) {
  const { invalid } = await searchParams;
  return (
    <section className="bg-canvas section-y">
      <div className="container-ns max-w-lg">
        <p className="mb-2 text-eyebrow text-taupe">
          Newsletter
        </p>
        <h1 className="text-display-lg text-balance text-ink">
          {invalid ? "This link has expired" : "You are unsubscribed"}
        </h1>
        <p className="mt-4 text-body-lg text-taupe">
          {invalid
            ? "We could not find a subscription for this link. If you still receive our newsletter, reply to any issue and we will remove you by hand."
            : "You will not receive the newsletter again. Order and account emails still arrive as normal."}
        </p>
        <div className="mt-8">
          <Button href="/products">Back to the shop</Button>
        </div>
      </div>
    </section>
  );
}
