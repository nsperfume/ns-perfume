import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { policies } from "@/data/site";

type Props = { params: Promise<{ slug: string }> };

const slugs = Object.keys(policies);

export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) return { title: "Policy" };
  return {
    title: policy.title,
    description: `${policy.title} for NS Perfume customers.`,
    alternates: { canonical: `/policies/${slug}` },
  };
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <section className="bg-canvas section-y">
      <div className="container-ns max-w-[48rem]">
        <h1 className="mb-12 text-display-xl">{policy.title}</h1>
        <div className="flex flex-col gap-10">
          {policy.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-heading-sm mb-3">{section.heading}</h2>
              <p className="text-body-lg text-taupe">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
