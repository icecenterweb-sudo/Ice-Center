import { prisma } from '@/lib/db';
import AddProductForm from './AddProductForm';

export default async function AddProductPage() {
    // Fetch subcategories with their categories
    const subcategories = await prisma.subcategory.findMany({
        include: {
            category: true
        },
        orderBy: {
            category: {
                name: 'asc'
            }
        }
    });

    return <AddProductForm subcategories={subcategories} />;
}
