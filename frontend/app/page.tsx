'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function LandingPage() {
  const [isSignIn, setIsSignIn] = useState(true)
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { login, register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignIn) {
      await login(email, password)
    } else {
      if (password !== confirmPassword) {
        alert('Passwords do not match')
        return
      }
      await register(name, email, password, role)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Side - Hero */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Learn Anything,
              <br />
              <span className="text-blue-600">Anywhere</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              AI-powered learning platform for students and teachers
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">✓</div>
                <span>Students: Take courses with AI assistance</span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">✓</div>
                <span>Teachers: Create and share your knowledge</span>
              </div>
            </div>
            <Link href="/courses">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition">
                Browse Courses →
              </button>
            </Link>
          </div>

          {/* Right Side - Auth Form */}
          <div className="flex-1 max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="flex gap-2 mb-6">
              <button
                className={`flex-1 py-2 text-center font-semibold rounded-lg transition ${isSignIn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setIsSignIn(true)}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2 text-center font-semibold rounded-lg transition ${!isSignIn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setIsSignIn(false)}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSignIn && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </>
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {!isSignIn && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {isSignIn ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button className="w-full border border-gray-300 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition">
              <span>G</span>
              <span>Sign in with Google (coming soon)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}