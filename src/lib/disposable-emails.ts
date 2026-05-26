/**
 * Disposable / temporary email domain blocklist.
 *
 * Curated from the most-used services for credit farming and signup spam.
 * Not exhaustive — it's a filter, not a wall. Real defense at launch is
 * Supabase email confirmation (so bogus addresses can't receive the link).
 */
const DISPOSABLE_DOMAINS = new Set<string>([
  // 10-minute style
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "sharklasers.com",
  "grr.la",
  // mailinator family
  "mailinator.com",
  "mailinator.net",
  "mailinator2.com",
  "binkmail.com",
  // tempmail family
  "tempmail.com",
  "temp-mail.org",
  "tempmail.net",
  "tempmailaddress.com",
  "tmpmail.org",
  // throwaway / anon
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "yopmail.com",
  "dispostable.com",
  "fakemail.net",
  "fakeinbox.com",
  "getairmail.com",
  "mintemail.com",
  "mohmal.com",
  "spamgourmet.com",
  "maildrop.cc",
  "moakt.com",
  "harakirimail.com",
  "burnermail.io",
  // more aggressive farmers use these
  "emailondeck.com",
  "emaildrop.io",
  "inboxbear.com",
  "snapmail.cc",
  "spam4.me",
  "mytrashmail.com",
  "wegwerfmail.de",
  "spam.la",
  "drdrb.net",
  "incognitomail.com",
  "spambox.us",
  "tempr.email",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return true; // malformed → reject
  return DISPOSABLE_DOMAINS.has(domain);
}
