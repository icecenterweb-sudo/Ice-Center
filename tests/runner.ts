/**
 * Minimal zero-dependency test runner.
 * Suites register cases at import time; `run()` executes them all.
 * Exit code 1 on any failure — wired to `npm test`.
 */

type TestFn = () => void | Promise<void>;
type TestCase = { suite: string; name: string; fn: TestFn };

const cases: TestCase[] = [];
let collector: { name: string; fn: TestFn }[] | null = null;

export function suite(label: string, register: () => void): void {
    const scoped: { name: string; fn: TestFn }[] = [];
    collector = scoped;
    try {
        register();
    } finally {
        collector = null;
    }
    for (const c of scoped) {
        cases.push({ suite: label, name: c.name, fn: c.fn });
    }
}

export function it(name: string, fn: TestFn): void {
    if (collector) {
        collector.push({ name, fn });
    } else {
        cases.push({ suite: '(root)', name, fn });
    }
}

export async function run(): Promise<number> {
    let pass = 0;
    let fail = 0;
    let currentSuite = '';
    for (const c of cases) {
        if (c.suite !== currentSuite) {
            currentSuite = c.suite;
            console.log(`\n=== ${currentSuite} ===`);
        }
        try {
            await c.fn();
            pass++;
            console.log(`  PASS  ${c.name}`);
        } catch (e) {
            fail++;
            const msg = e instanceof Error ? e.message : String(e);
            console.log(`  FAIL  ${c.name}`);
            console.log(`        ${msg.split('\n')[0]}`);
        }
    }
    console.log(`\n==== TOTAL: ${pass} passed, ${fail} failed ====${'='.repeat(20)}`);
    return fail > 0 ? 1 : 0;
}
