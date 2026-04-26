'use client'
import Link from 'next/link'
import { mockCourses } from '@/lib/mockData'

export default function TeacherDashboard() {
    const teacherCourses = mockCourses

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Your Uploads</h1>
                    <Link href="/teacher/course/create">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            + Create New Course
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teacherCourses.map((course) => (
                        <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg">{course.title}</h3>
                                <p className="text-gray-500 text-sm">{course.description}</p>
                                <div className="flex justify-between items-center mt-4">
                                    <span className="text-blue-600 font-bold">${course.price}</span>
                                    <div className="flex gap-2">
                                        <button className="text-blue-600">Edit</button>
                                        <button className="text-red-600">Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}