import { connection } from 'next/server';
import AddSlideClient from './AddSlideClient';
import { Suspense } from 'react';

async function AddSlideContent() {
    await connection(); // Required for cacheComponents
    return <AddSlideClient />;
}

export default function AddSlidePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <AddSlideContent />
        </Suspense>
    );
}
