import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="bg-canvas section-y">
      <div className="container-ns max-w-xl text-center">
        <h1 className="text-display-lg mb-4">Page not found</h1>
        <p className="mb-8 text-body text-taupe">
          That path does not exist. Return to bestsellers or the full shop
          catalog.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button href="/collections/bestsellers">Bestsellers</Button>
          <Button href="/products" variant="secondary">
            Shop all
          </Button>
        </div>
      </div>
    </section>
  );
}
