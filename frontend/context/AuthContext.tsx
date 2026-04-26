'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
    id: number
    name: string
    email: string
    role: 'student' | 'teacher'
}

interface AuthContextType {
    user: User | null
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string, role: string) => Promise<void>
    logout: () => void
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const stored = localStorage.getItem('user')
        if (stored) {
            setUser(JSON.parse(stored))
        }
        setLoading(false)
    }, [])

    const login = async (email: string, password: string) => {
        // Mock login - accept any email/password
        const mockUser = {
            id: 1,
            name: email.split('@')[0],
            email,
            role: email.includes('teacher') ? 'teacher' as const : 'student' as const
        }
        localStorage.setItem('user', JSON.stringify(mockUser))
        setUser(mockUser)
    }

    const register = async (name: string, email: string, password: string, role: string) => {
        const mockUser = {
            id: Date.now(),
            name,
            email,
            role: role as 'student' | 'teacher'
        }
        localStorage.setItem('user', JSON.stringify(mockUser))
        setUser(mockUser)
    }

    const logout = () => {
        localStorage.removeItem('user')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}