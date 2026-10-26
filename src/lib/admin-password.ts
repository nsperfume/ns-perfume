/**
 * Client-side copy of the admin password basics (length, letters and a number) so
 * forms can answer instantly. The server (lib/auth adminPasswordProblem) also
 * rejects names, email names and common words.
 */
export const PASSWORD_HINT = "At least 10 characters with letters and a number. Avoid your name.";

export function clientPasswordProblem(password: string) {
  if (!password) return "Enter a new password";
  if (password.length < 10) return "Use at least 10 characters.";
  if (password.length > 128) return "Use 128 characters or fewer.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return "Use letters and at least one number.";
  return null;
}
