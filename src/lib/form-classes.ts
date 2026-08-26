/**
 * Shared form validation class helper.
 * Zero dependencies, works with Tailwind v4 and inline error highlighting.
 */

/** Classes appended to a form control when it currently has a validation error. */
export const FIELD_ERROR_CLASS =
    'border-red-400 bg-red-50 text-red-700 font-bold ring-1 ring-red-300 focus:ring-red-100';

/**
 * Shared base style for admin settings inputs/textareas (DS5).
 * Single source for SettingsClient's 13 controls; focus uses the brand
 * `ocean` token instead of raw blue-600.
 */
export const SETTINGS_FIELD_CLASS =
    'rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-ocean focus:bg-white transition-all';

/** Append error styling to an input's existing base className when `hasError`. */
export function fieldClass(base: string, hasError?: boolean): string {
    return hasError ? `${base} ${FIELD_ERROR_CLASS}` : base;
}
