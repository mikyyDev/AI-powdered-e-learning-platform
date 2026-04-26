'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { mockCourses } from '@/lib/mockData'
import { useAuth } from '@/context/AuthContext'

export default function ContentViewer() {
    const { id, contentId } = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const course = mockCourses.find(c => c.id === Number(id))
    const lessonIndex = parseInt(String(contentId).split('-')[1]) - 1
    const lesson = course?.lessons[lessonIndex]

    const [completed, setCompleted] = useState(false)

    if (!course || !lesson) return <div className="text-center p-8">Content not found</div>

    const handleComplete = () => {
        setCompleted(true)
        // Save to localStorage (mock)
        const saved = localStorage.getItem(`progress-${user?.id}`)
        const progress = saved ? JSON.parse(saved) : []
        if (!progress.includes(`${id}-${lesson.id}`)) {
            progress.push(`${id}-${lesson.id}`)
            localStorage.setItem(`progress-${user?.id}`, JSON.stringify(progress))
        }
        alert('Lesson completed!')
    }

    const renderContent = () => {
        switch (lesson.type) {
            case 'video':
                return (
                    <iframe
                        className="w-full aspect-video rounded-lg"
                        src={lesson.content}
                        title={lesson.title}
                        allowFullScreen
                    />
                )
            case 'text':
                return (
                    <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed">{lesson.content}</p>
                    </div>
                )
            default:
                return <p>Content type not supported</p>
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Breadcrumb */}
                <div className="text-sm text-gray-500 mb-4">
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push(`/course/${id}`)}>
                        {course.title}
                    </span>
                    {' / '}
                    <span className="text-gray-900">{lesson.title}</span>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
                        <div className="mb-6">
                            {renderContent()}
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between items-center pt-6 border-t">
                            <button
                                onClick={() => lessonIndex > 0 && router.push(`/course/${id}/content/lesson-${lessonIndex}`)}
                                disabled={lessonIndex === 0}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                ← Previous
                            </button>

                            <button
                                onClick={handleComplete}
                                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                            >
                                ✓ Mark Complete
                            </button>

                            <button
                                onClick={() => lessonIndex < course.lessons.length - 1 && router.push(`/course/${id}/content/lesson-${lessonIndex + 2}`)}
                                disabled={lessonIndex === course.lessons.length - 1}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}