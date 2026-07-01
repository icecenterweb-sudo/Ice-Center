/**
 * Promote an existing User to an Admin with SUPER_ADMIN role.
 * Usage: node scripts/make-super-admin.js <phone>
 * Example: node scripts/make-super-admin.js 09130027927
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function main() {
    const inputPhone = process.argv[2];
    if (!inputPhone) {
        console.error('Usage: node scripts/make-super-admin.js <phone>');
        console.error('Example: node scripts/make-super-admin.js 09130027927');
        process.exit(1);
    }

    // Normalize phone: strip +98 prefix, ensure 0 prefix
    let phone = inputPhone.replace(/\s/g, '');
    if (phone.startsWith('+98')) phone = '0' + phone.slice(3);
    else if (phone.startsWith('98') && phone.length === 12) phone = '0' + phone.slice(2);

    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('No database URL found in env');
        process.exit(1);
    }

    const pool = new Pool({ connectionString, connectionTimeoutMillis: 10000 });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // Find the user by phone
        let user = await prisma.user.findUnique({
            where: { phone },
            select: { id: true, phone: true, firstName: true, lastName: true },
        });

        if (!user) {
            console.log(`No user found with phone: ${phone}. Creating user...`);
            user = await prisma.user.create({
                data: { phone, isVerified: true, status: 'ACTIVE' },
                select: { id: true, phone: true, firstName: true, lastName: true },
            });
            console.log(`Created user: ${user.phone}`);
        } else {
            console.log(`Found user: ${user.firstName || ''} ${user.lastName || ''} (${user.phone})`);
        }

        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { phone },
        });

        if (existingAdmin) {
            // Update to SUPER_ADMIN
            await prisma.admin.update({
                where: { phone },
                data: { roles: ['SUPER_ADMIN'], status: 'ACTIVE' },
            });
            console.log(`Updated existing admin to SUPER_ADMIN: ${phone}`);
        } else {
            // Create new admin
            const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;
            await prisma.admin.create({
                data: {
                    phone,
                    name,
                    roles: ['SUPER_ADMIN'],
                    status: 'ACTIVE',
                },
            });
            console.log(`Created new SUPER_ADMIN: ${phone}`);
        }

        console.log('\nDone! This user can now log in via /admin/login with their phone + OTP.');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
