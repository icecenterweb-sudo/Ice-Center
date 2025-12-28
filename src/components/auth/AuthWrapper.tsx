'use client'

import { ReactNode } from 'react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import AuthModal from '@/components/auth/AuthModal'

function AuthModalController() {
    const { showAuthModal, closeAuthModal, authRedirectPath } = useAuth()

    return (
        <AuthModal
            isOpen={showAuthModal}
            onClose={closeAuthModal}
            onSuccess={() => {
                if (authRedirectPath) {
                    window.location.href = authRedirectPath
                }
            }}
        />
    )
}

export default function AuthWrapper({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <AuthModalController />
        </AuthProvider>
    )
}
