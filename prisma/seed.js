const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const adminPhone = '09130027927'
    const adminName = 'حمیدرضا'

    const existingAdmin = await prisma.admin.findUnique({
        where: { phone: adminPhone },
    })

    if (!existingAdmin) {
        await prisma.admin.create({
            data: {
                phone: adminPhone,
                name: adminName,
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        })
        console.log(`✅ Admin created: ${adminName}`)
    } else {
        console.log(`ℹ️ Admin already exists: ${adminName}`)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
