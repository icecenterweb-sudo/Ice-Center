import { connection } from 'next/server';
import EditSlideClient from './EditSlideClient';
import { Suspense } from 'react';

interface Props {
    params: Promise<{ id: string }>;
}

async function EditSlideContent({ params }: Props) {
    await connection(); // Required for cacheComponents
    const { id } = await params;
    return <EditSlideClient id={id} />;
}

export default function EditSlidePage(props: Props) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <EditSlideContent {...props} />
        </Suspense>
    );
}
