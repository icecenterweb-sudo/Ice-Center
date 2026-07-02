const fs = require('fs');
const readline = require('readline');

async function main() {
    const file = process.argv[2] || 'backups/backup_2026-07-02_07-44-22.sql';
    const stream = fs.createReadStream(file, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    let currentTable = null;
    const counts = {};

    for await (const line of rl) {
        const t = line.trim();
        if (t.startsWith('COPY public."')) {
            const m = t.match(/COPY public\."(\w+)"/);
            if (m) { currentTable = m[1]; counts[currentTable] = 0; }
        } else if (currentTable) {
            if (t === '\\.') {
                currentTable = null;
            } else if (t !== '') {
                counts[currentTable]++;
            }
        }
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    for (const [table, count] of sorted) {
        console.log(`${table}: ${count} rows`);
    }
}
main();
