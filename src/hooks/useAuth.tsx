'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface User {
    id: number
    phone: string
    firstName: string | null
    lastName: string | null
    isVerified: boolean
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    showAuthModal: boolean
    authRedirectPath: string | null
    openAuthModal: (redirectPath?: string) => void
    closeAuthModal: () => void
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authRedirectPath, setAuthRedirectPath] = useState<string | null>(null)

    const refreshUser = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/me')
            if (response.ok) {
                const data = await response.json()
                setUser(data.user)
            } else {
                setUser(null)
            }
        } catch {
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        refreshUser()
    }, [refreshUser])

    const openAuthModal = useCallback((redirectPath?: string) => {
        setAuthRedirectPath(redirectPath || null)
        setShowAuthModal(true)
    }, [])

    const closeAuthModal = useCallback(() => {
        setShowAuthModal(false)
        setAuthRedirectPath(null)
    }, [])

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            setUser(null)
        } catch (error) {
            console.error('Logout error:', error)
        }
    }, [])

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                showAuthModal,
                authRedirectPath,
                openAuthModal,
                closeAuthModal,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
