'use client'
import Link from 'next/link'
import { Course } from '@/types'

interface Props {
    course: Course
    showDescription?: boolean
}

export default function CourseCard({ course, showDescription = false }: Props) {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="h-40 bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
                <span className="text-4xl">📚</span>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{course.title}</h3>
                {showDescription && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{course.description}</p>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                    <span>⏱ {course.duration}</span>
                    <span>📖 {course.lessons.length} lessons</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-blue-600">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                    </span>
                    <Link href={`/payment/${course.id}`}>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                            Enroll
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}