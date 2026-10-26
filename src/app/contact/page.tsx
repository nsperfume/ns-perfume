import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import { siteConfig } from "@/data/site";
import { CopyableValue } from "@/components/ui/copyable-value";
import { TransferDetails } from "@/components/commerce/transfer-details";
import { BrandIcon } from "@/components/ui/brand-icon";
import {
  LandmarkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TruckIcon,
  UserIcon,
} from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/whatsapp";
import { ContactForm } from "@/components/contact/contact-form";

const ROW_ICONS = {
  name: UserIcon,
  phone: PhoneIcon,
  email: MailIcon,
  location: MapPinIcon,
  bank: LandmarkIcon,
  orders: TruckIcon,
} as const;

const trustPoints = [
  {
    title: "Clear replies",
    body: "Care answers about notes, parcels, and returns in plain language. No scripted upsell.",
  },
  {
    title: "Order status first",
    body: "For delivery questions, track with your order number. Write us if something looks wrong on the map.",
  },
  {
    title: "Business hours",
    body: "Mon to Fri, 9am to 5pm PKT. Messages sent on weekends wait until the next weekday.",
  },
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHero
        title={pageCopy.contact.title}
        description={pageCopy.contact.description}
        image={siteImages.contact}
        alt="Calm desk still life for contacting NS Perfume care"
        objectPosition="center 45%"
      />

      <section className="border-b border-hairline bg-muted/50">
        <div className="container-ns grid gap-8 py-12 md:grid-cols-3 md:gap-10 md:py-16">
          {trustPoints.map((item) => (
            <div key={item.title} className="border-t border-[#e2d6bd] pt-6">
              <h2 className="text-heading-sm text-ink">
                {item.title}
              </h2>
              <p className="mt-2 max-w-md text-body text-taupe">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-canvas section-y">
        <div className="container-ns grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 xl:gap-24">
          <div>
            <p className="mb-3 text-eyebrow text-taupe">
              Care
            </p>
            <h2 className="text-display-md mb-4">How to reach us</h2>
            <p className="mb-6 max-w-[32rem] text-body-lg text-taupe">
              Orders, delivery timing, and bottle questions. Use the form or
              write us directly. For live parcel status, tracking is faster than
              email.
            </p>
            <div className="mb-10 flex flex-col gap-3 sm:flex-row">
              <Button href={whatsappUrl(siteConfig.phone, "Hi NS Perfume, I have a question.")}>
                <BrandIcon name="whatsapp" size={18} />
                Chat on WhatsApp
              </Button>
              <Button href={`tel:${siteConfig.phone}`} variant="secondary">
                <PhoneIcon size={18} />
                Call {siteConfig.phoneDisplay}
              </Button>
            </div>
            <dl className="grid gap-x-10 gap-y-6 border-t border-hairline pt-8 sm:grid-cols-2">
              {(
                [
                  {
                    key: "name",
                    label: "Care contact",
                    node: (
                      <p className="mt-1 text-base font-semibold leading-8 text-ink">
                        {siteConfig.contactName}
                      </p>
                    ),
                  },
                  {
                    key: "phone",
                    label: "Phone, WhatsApp, JazzCash, Easypaisa",
                    node: (
                      <div className="mt-1">
                        <CopyableValue
                          value={siteConfig.phone}
                          display={siteConfig.phoneDisplay}
                          href={`tel:${siteConfig.phone}`}
                          label="Copy phone number"
                        />
                      </div>
                    ),
                  },
                  {
                    key: "email",
                    label: "Email",
                    node: (
                      <div className="mt-1">
                        <CopyableValue
                          value={siteConfig.email}
                          href={`mailto:${siteConfig.email}`}
                          label="Copy email"
                        />
                      </div>
                    ),
                  },
                  {
                    key: "location",
                    label: "Location",
                    node: (
                      <a
                        href={siteConfig.location.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex min-h-8 max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-ink transition-colors hover:text-brass-ink"
                      >
                        <span>{siteConfig.location.label}</span>
                        <span
                          className="text-taupe/50"
                          aria-hidden
                        >
                          ·
                        </span>
                        <span className="text-taupe">
                          {siteConfig.location.detail}
                        </span>
                      </a>
                    ),
                  },
                  {
                    key: "bank",
                    label: "Bank transfer",
                    node: (
                      <div className="mt-1">
                        <TransferDetails showWallets={false} />
                      </div>
                    ),
                  },
                  {
                    key: "orders",
                    label: "Orders",
                    node: (
                      <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1">
                        <Link
                          href="/track-order"
                          className="inline-flex min-h-10 items-center text-base font-semibold text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-brass"
                        >
                          Track your order
                        </Link>
                        <Link
                          href="/shipping-returns"
                          className="inline-flex min-h-10 items-center text-base font-semibold text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-brass"
                        >
                          Shipping and returns
                        </Link>
                      </div>
                    ),
                  },
                ] as const
              ).map((row) => {
                const Icon = ROW_ICONS[row.key];
                return (
                <div
                  key={row.key}
                  className={
                    row.key === "bank" || row.key === "orders"
                      ? "sm:col-span-2"
                      : undefined
                  }
                >
                  <dt className="flex items-center gap-2 text-eyebrow text-taupe">
                    <Icon size={16} className="shrink-0 text-brass-ink" />
                    {row.label}
                  </dt>
                  <dd>{row.node}</dd>
                </div>
                );
              })}
            </dl>
          </div>

          <div className="self-start rounded-2xl border border-hairline bg-paper p-6 sm:p-10 xl:p-12">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
