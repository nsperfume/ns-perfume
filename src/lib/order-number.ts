/**
 * Short storefront order refs, e.g. NS-7K4Q2M.
 * Six characters from an alphabet without 0/O/1/I/L, easy to read on the phone,
 * and close to 900 million combinations so numbers can't be guessed or enumerated.
 */
const PREFIX = "NS-";
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Web Crypto (not node:crypto) because admin client pages import this module. */
export function generateOrderNumber(): string {
  const limit = 256 - (256 % ALPHABET.length); // rejection sampling avoids modulo bias
  let code = "";
  while (code.length < 6) {
    for (const b of globalThis.crypto.getRandomValues(new Uint8Array(12))) {
      if (b < limit && code.length < 6) code += ALPHABET[b % ALPHABET.length];
    }
  }
  return `${PREFIX}${code}`;
}

/**
 * Display formatting. Legacy `NS772829567` becomes `NS-772829567`.
 * Already hyphenated values pass through.
 */
export function formatOrderNumber(raw: string): string {
  const v = (raw || "").trim();
  if (!v) return v;
  const upper = v.toUpperCase();
  if (upper.startsWith("NS-")) return `NS-${upper.slice(3)}`;
  if (/^NS\d+$/i.test(v)) return `NS-${v.slice(2)}`;
  return v;
}
