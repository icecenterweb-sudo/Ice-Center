/**
 * Database Backup Script
 * 
 * This script backs up the PostgreSQL database in SQL format.
 * It reads the database URL from POSTGRES_URL or DATABASE_URL in the env files.
 * 
 * Run with: npm run db:backup
 * Or: npx tsx scripts/backup-db.ts
 */

import 'dotenv/config';
import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Find the pg_dump executable on Windows, or fallback to 'pg_dump'
function findPgDump(): string {
  if (process.platform !== 'win32') {
    return 'pg_dump';
  }

  // Check if pg_dump is in the system PATH
  try {
    execSync('where pg_dump', { stdio: 'ignore' });
    return 'pg_dump';
  } catch {
    // If not in PATH, search standard PostgreSQL directories
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const pgDir = path.join(programFiles, 'PostgreSQL');
    if (fs.existsSync(pgDir)) {
      try {
        const versions = fs.readdirSync(pgDir);
        // Sort descending to get the highest version first
        versions.sort((a, b) => parseFloat(b) - parseFloat(a));
        for (const version of versions) {
          const pgDumpPath = path.join(pgDir, version, 'bin', 'pg_dump.exe');
          if (fs.existsSync(pgDumpPath)) {
            console.log(`ℹ️ Found pg_dump at: ${pgDumpPath}`);
            return `"${pgDumpPath}"`;
          }
        }
      } catch (err) {
        // Ignore read errors
      }
    }
  }
  return 'pg_dump';
}

async function runBackup() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: POSTGRES_URL or DATABASE_URL is not defined in your environment variables.');
    process.exit(1);
  }

  // Warn if using a Prisma Accelerate connection string (which starts with prisma:// or prisma+postgres://)
  if (databaseUrl.startsWith('prisma://') || databaseUrl.startsWith('prisma+postgres://')) {
    console.error('❌ Error: The database URL is a Prisma Accelerate URL.');
    console.error('pg_dump requires a direct PostgreSQL connection string (starting with postgres:// or postgresql://).');
    console.error('Please configure POSTGRES_URL or DATABASE_URL in your .env/env.local with a direct database URL.');
    process.exit(1);
  }

  // Create backups directory if it doesn't exist
  const backupsDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    console.log(`📁 Creating backups directory: ${backupsDir}`);
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Format backup filename: backup_YYYYMMDD_HHMMSS.sql
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');
  
  const filename = `backup_${timestamp}.sql`;
  const outputPath = path.join(backupsDir, filename);

  const pgDumpCmd = findPgDump();
  console.log('🔄 Initializing database backup...');
  
  let host = 'unknown';
  try {
    host = new URL(databaseUrl).hostname;
  } catch (e) {
    // Fallback if connection string cannot be parsed by URL
  }
  console.log(`📡 Connecting to database host: ${host}...`);

  // Build the pg_dump command
  // -d: database URI
  // -F p: plain-text SQL format
  // -f: output file path
  // --clean: include DROP TABLE statements
  // --if-exists: avoid errors during drops if tables don't exist
  // --no-owner: skip ownership commands (safe for cross-server restores)
  const command = `${pgDumpCmd} -d "${databaseUrl}" -F p --clean --if-exists --no-owner -f "${outputPath}"`;

  try {
    await execAsync(command);
    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log('✅ Backup completed successfully!');
    console.log(`📄 File: ${path.relative(process.cwd(), outputPath)} (${sizeMB} MB)`);
  } catch (error: any) {
    console.error('❌ Backup failed!');
    console.error(error.message);
    
    // Check if pg_dump is missing
    if (error.message.includes('not recognized') || error.message.includes('cannot find') || error.message.includes('spawn')) {
      console.log('\n💡 Tip: It seems pg_dump is not installed or not in your system PATH.');
      console.log('To resolve this:');
      console.log('1. Make sure PostgreSQL Client Tools are installed.');
      console.log('2. Add PostgreSQL bin directory (e.g. C:\\Program Files\\PostgreSQL\\<version>\\bin) to your system Environment Variables (PATH).');
      console.log('3. Or run this script on a machine/environment that has pg_dump installed.');
    }
  }
}

runBackup();
