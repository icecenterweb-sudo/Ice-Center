/**
 * Shared form validation class helper.
 * Zero dependencies, works with Tailwind v4 and inline error highlighting.
 */

/** Classes appended to a form control when it currently has a validation error. */
export const FIELD_ERROR_CLASS =
    'border-red-400 bg-red-50 text-red-700 font-bold ring-1 ring-red-300 focus:ring-red-100';

/** Append error styling to an input's existing base className when `hasError`. */
export function fieldClass(base: string, hasError?: boolean): string {
    return hasError ? `${base} ${FIELD_ERROR_CLASS}` : base;
}
