"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminFieldLabel, adminFieldClass } from "@/components/admin/form-section";
import { AdminFieldError } from "@/components/admin/form-validation";
import { Select } from "@/components/admin/select";
import { formatOrderNumber } from "@/lib/order-number";
import {
  COURIERS,
  OTHER_COURIER,
  isValidTrackingUrl,
  normalizeTrackingUrl,
  orderStatusLabel,
} from "@/lib/admin-order-ui";

export type OrderStatusTarget = {
  orderNumber: string;
  email: string;
  status: string;
  discountCode?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

/** Body for PATCH /api/orders/[orderNumber]. Tracking is only sent when shipping. */
export type OrderStatusChange = {
  status: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

type Fields = { courier: string; otherCourier: string; trackingNumber: string; trackingUrl: string };
type Errors = Partial<Record<keyof Fields, string>>;

const COURIER_OPTIONS = [...COURIERS, OTHER_COURIER].map((c) => ({ value: c, label: c }));

function fieldsFrom(order: OrderStatusTarget | null): Fields {
  const saved = (order?.carrier || "").trim();
  const known = COURIERS.find((c) => c.toLowerCase() === saved.toLowerCase());
  return {
    courier: known ?? (saved ? OTHER_COURIER : ""),
    otherCourier: known ? "" : saved,
    trackingNumber: order?.trackingNumber || "",
    trackingUrl: order?.trackingUrl || "",
  };
}

function check(f: Fields): Errors {
  const e: Errors = {};
  if (!f.courier) e.courier = "Choose the courier";
  if (f.courier === OTHER_COURIER) {
    if (!f.otherCourier.trim()) e.otherCourier = "Enter the courier name";
    else if (f.otherCourier.trim().length > 80) e.otherCourier = "Keep the courier name under 80 characters";
  }
  const tn = f.trackingNumber.trim();
  if (!tn) e.trackingNumber = "Enter the tracking number";
  else if (tn.length > 120) e.trackingNumber = "Keep the tracking number under 120 characters";
  const url = normalizeTrackingUrl(f.trackingUrl);
  if (url.length > 500) e.trackingUrl = "This link is too long";
  else if (!isValidTrackingUrl(url)) e.trackingUrl = "Enter a link like tcs.com.pk/track";
  return e;
}

function describe(order: OrderStatusTarget, next: string) {
  const ref = formatOrderNumber(order.orderNumber);
  const to = order.email ? ` at ${order.email}` : "";
  switch (next) {
    case "confirmed":
      return `${ref} will be marked confirmed. The customer will be emailed${to} that the order is being packed.`;
    case "shipped":
      return `${ref} will be marked shipped. The customer will be emailed${to} with the courier and tracking number below.`;
    case "delivered":
      return `${ref} will be marked delivered. The customer will be emailed${to} that the parcel has arrived.`;
    case "cancelled":
      return `${ref} will be cancelled and the customer will be emailed${to}.${
        order.discountCode ? ` One use of ${order.discountCode} goes back to the coupon.` : ""
      } This cannot be undone.`;
    default:
      return `${ref} will be marked ${orderStatusLabel(next).toLowerCase()}. The customer is not emailed for this change.`;
  }
}

/**
 * Every order status change goes through here: it says the customer will be
 * emailed, and when shipping it collects the courier and tracking number so
 * the shipped email carries them (saved in the same request as the status).
 */
export function OrderStatusDialog({
  order,
  nextStatus,
  saving,
  onClose,
  onConfirm,
}: {
  order: OrderStatusTarget | null;
  nextStatus: string | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (change: OrderStatusChange) => void | Promise<void>;
}) {
  const open = Boolean(order && nextStatus);
  const shipping = nextStatus === "shipped";
  const [fields, setFields] = useState<Fields>(() => fieldsFrom(order));
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);

  // Start from the saved tracking details each time the dialog opens.
  const key = open ? `${order?.orderNumber}:${nextStatus}` : "";
  useEffect(() => {
    if (!key) return;
    setFields(fieldsFrom(order));
    setErrors({});
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function update(patch: Partial<Fields>) {
    const next = { ...fields, ...patch };
    setFields(next);
    if (tried) setErrors(check(next));
  }

  async function confirm() {
    if (!order || !nextStatus || saving) return;
    if (!shipping) {
      await onConfirm({ status: nextStatus });
      return;
    }
    setTried(true);
    const found = check(fields);
    setErrors(found);
    const first = (["courier", "otherCourier", "trackingNumber", "trackingUrl"] as const).find(
      (k) => found[k],
    );
    if (first) {
      requestAnimationFrame(() => {
        const el =
          first === "courier"
            ? document.querySelector<HTMLElement>("#order-status-courier")
            : document.querySelector<HTMLElement>(`#order-status-${first}`);
        el?.focus();
      });
      return;
    }
    const trackingUrl = normalizeTrackingUrl(fields.trackingUrl);
    if (trackingUrl !== fields.trackingUrl) setFields((f) => ({ ...f, trackingUrl }));
    await onConfirm({
      status: nextStatus,
      carrier: (fields.courier === OTHER_COURIER ? fields.otherCourier : fields.courier).trim(),
      trackingNumber: fields.trackingNumber.trim(),
      trackingUrl,
    });
  }

  const label = nextStatus ? orderStatusLabel(nextStatus).toLowerCase() : "";
  const cancelling = nextStatus === "cancelled";

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !saving) onClose();
      }}
      title={
        cancelling
          ? "Cancel this order?"
          : `Mark ${order ? formatOrderNumber(order.orderNumber) : "order"} as ${label}?`
      }
      description={order && nextStatus ? describe(order, nextStatus) : ""}
      confirmLabel={cancelling ? "Cancel order" : `Mark as ${label}`}
      cancelLabel={cancelling ? "Keep order" : "Cancel"}
      tone={cancelling ? "danger" : "default"}
      loading={saving}
      onConfirm={confirm}
    >
      {shipping ? (
        <div className="space-y-4 border-t border-admin-line pt-5">
          <div
            data-field="courier"
            className={errors.courier ? "[&_[role=combobox]]:border-admin-danger!" : undefined}
          >
            <AdminFieldLabel htmlFor="order-status-courier" required>
              Courier
            </AdminFieldLabel>
            <Select
              id="order-status-courier"
              aria-label="Courier"
              placeholder="Choose the courier"
              value={fields.courier}
              onValueChange={(courier) => update({ courier })}
              options={COURIER_OPTIONS}
              disabled={saving}
            />
            <AdminFieldError message={errors.courier} />
          </div>
          {fields.courier === OTHER_COURIER ? (
            <div>
              <AdminFieldLabel htmlFor="order-status-otherCourier" required>
                Courier name
              </AdminFieldLabel>
              <input
                id="order-status-otherCourier"
                className={adminFieldClass}
                value={fields.otherCourier}
                maxLength={80}
                disabled={saving}
                aria-invalid={errors.otherCourier ? true : undefined}
                onChange={(e) => update({ otherCourier: e.target.value })}
              />
              <AdminFieldError message={errors.otherCourier} />
            </div>
          ) : null}
          <div>
            <AdminFieldLabel htmlFor="order-status-trackingNumber" required>
              Tracking number
            </AdminFieldLabel>
            <input
              id="order-status-trackingNumber"
              className={`${adminFieldClass} font-sans tabular-nums`}
              value={fields.trackingNumber}
              maxLength={120}
              disabled={saving}
              autoComplete="off"
              aria-invalid={errors.trackingNumber ? true : undefined}
              onChange={(e) => update({ trackingNumber: e.target.value })}
            />
            <AdminFieldError message={errors.trackingNumber} />
          </div>
          <div>
            <AdminFieldLabel htmlFor="order-status-trackingUrl">
              Tracking link (optional)
            </AdminFieldLabel>
            <input
              id="order-status-trackingUrl"
              className={adminFieldClass}
              value={fields.trackingUrl}
              maxLength={500}
              inputMode="url"
              autoComplete="off"
              disabled={saving}
              placeholder="tcs.com.pk/track"
              aria-invalid={errors.trackingUrl ? true : undefined}
              onChange={(e) => update({ trackingUrl: e.target.value })}
              onBlur={() => {
                const trackingUrl = normalizeTrackingUrl(fields.trackingUrl);
                if (trackingUrl !== fields.trackingUrl) update({ trackingUrl });
              }}
            />
            <AdminFieldError message={errors.trackingUrl} />
          </div>
        </div>
      ) : null}
    </ConfirmDialog>
  );
}

export default OrderStatusDialog;
