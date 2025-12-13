import { prisma } from '@/lib/db';
import CategoryForm from './CategoryForm';

export default async function AddCategoryPage() {
    return <CategoryForm />;
}
