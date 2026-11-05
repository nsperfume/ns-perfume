import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="bg-canvas section-y">
      <div className="container-ns max-w-xl text-center">
        <h1 className="mb-5 text-display-xl">Page not found</h1>
        <p className="mb-10 text-body-lg text-taupe">
          We could not find that page. It may have moved. Browse every perfume,
          or answer a few questions to find your scent.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button href="/products">Shop all perfumes</Button>
          <Button href="/find-your-scent" variant="secondary">
            Find your scent
          </Button>
        </div>
      </div>
    </section>
  );
}
