import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="bg-canvas section-y">
      <div className="container-ns max-w-xl text-center">
        <h1 className="mb-5 text-display-xl">Page not found</h1>
        <p className="mb-10 text-body-lg text-taupe">
          We could not find that page. It may have moved. Try our
          bestsellers or browse every perfume.
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
