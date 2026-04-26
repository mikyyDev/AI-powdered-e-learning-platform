'use client'
import { useAuth } from '@/context/AuthContext'
import { mockCourses } from '@/lib/mockData'
import Link from 'next/link'

export default function StudentDashboard() {
    const { user } = useAuth()
    const enrolledCourses = mockCourses.slice(0, 2)

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
                <p className="text-gray-600 mb-8">Continue your learning journey</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enrolledCourses.map((course) => (
                        <Link key={course.id} href={`/course/${course.id}`}>
                            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer">
                                <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                                <div className="p-4">
                                    <h2 className="text-xl font-bold">{course.title}</h2>
                                    <p className="text-gray-500 text-sm mt-1">{course.description}</p>
                                    <div className="mt-4 flex justify-between items-center">
                                        <span className="text-blue-600">Continue Learning →</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}