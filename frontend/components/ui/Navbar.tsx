'use client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
    const { user, logout } = useAuth()
    const [showDropdown, setShowDropdown] = useState(false)

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-blue-600">
                    ET
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="/courses" className="text-gray-600 hover:text-blue-600 transition">
                        Courses
                    </Link>

                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-600 transition"
                            >
                                {user.name.charAt(0).toUpperCase()}
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
                                    <Link
                                        href={user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard'}
                                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout()
                                            setShowDropdown(false)
                                        }}
                                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <Link href="/login" className="text-gray-600 hover:text-blue-600">
                                Login
                            </Link>
                            <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}