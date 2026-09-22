/**
 * Join class names, dropping falsy values.
 *
 * Deliberately not `clsx` + `tailwind-merge`: components own their own classes
 * and never need to override each other's utilities, so a dependency would buy
 * nothing here.
 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
