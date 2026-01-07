import { connection } from 'next/server';
import AppearanceClient from './AppearanceClient';
import { Suspense } from 'react';

async function AppearanceContent() {
    await connection();
    return <AppearanceClient />;
}

export default function AppearancePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>}>
            <AppearanceContent />
        </Suspense>
    );
}

