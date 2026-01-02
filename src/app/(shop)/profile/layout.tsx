'use client';

import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import ProfileLayout from './ProfileLayout';

export default function ProfileRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoading, isAuthenticated, openAuthModal } = useAuth();

    // Redirect to auth if not authenticated
    if (!isLoading && !isAuthenticated) {
        openAuthModal('/profile');
        return null;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-ocean animate-spin" />
            </div>
        );
    }

    return <ProfileLayout>{children}</ProfileLayout>;
}
