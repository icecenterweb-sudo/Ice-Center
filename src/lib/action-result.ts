export type ActionResult<T = undefined> =
    | { success: true; data?: T }
    | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * True for the control-flow "errors" that Next.js throws internally from
 * redirect() / notFound(). These MUST propagate — swallowing them turns a
 * navigation into a bogus failure result and breaks the redirect.
 */
function isNextControlFlowError(e: unknown): boolean {
    if (typeof e !== 'object' || e === null || !('digest' in e)) return false;
    const digest = (e as { digest?: unknown }).digest;
    return typeof digest === 'string' && (
        digest.startsWith('NEXT_REDIRECT') ||
        digest === 'NEXT_NOT_FOUND' ||
        digest.startsWith('NEXT_HTTP_ERROR_FALLBACK')
    );
}

export async function runAction<T>(
    fn: () => Promise<T>,
    fallbackFa: string = 'خطایی در انجام عملیات رخ داد'
): Promise<ActionResult<T>> {
    try {
        const data = await fn();
        return { success: true, data };
    } catch (e) {
        if (isNextControlFlowError(e)) throw e;
        console.error(fallbackFa, e);
        const error = e instanceof Error && e.message ? e.message : fallbackFa;
        return { success: false, error };
    }
}
