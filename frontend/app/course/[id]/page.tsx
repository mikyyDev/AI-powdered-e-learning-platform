'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { mockCourses, mockProgress, saveProgress } from '@/lib/mockData'
import { useAuth } from '@/context/AuthContext'

export default function CourseRoadmap() {
    const { id } = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const course = mockCourses.find(c => c.id === Number(id))
    const [progress, setProgress] = useState<string[]>([])
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0)

    useEffect(() => {
        const userProgress = mockProgress[user?.id || 1] || []
        setProgress(userProgress)
        const completedCount = userProgress.filter(p => p === `${id}-lesson-1`).length
        setCurrentLessonIndex(completedCount)
    }, [id, user])

    if (!course) return <div className="text-center p-8">Course not found</div>

    const handleLessonClick = (lessonIndex: number) => {
        if (lessonIndex <= currentLessonIndex) {
            router.push(`/course/${id}/content/lesson-${lessonIndex + 1}`)
        }
    }

    const progressPercent = (currentLessonIndex / course.lessons.length) * 100

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            {/* Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold">{course.title}</h1>
                    <p className="text-blue-100 mt-2">{course.description}</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Progress Bar */}
                <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Your Progress</span>
                        <span className="text-gray-600">{currentLessonIndex} of {course.lessons.length} lessons</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-green-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Vertical Timeline - NOT CARDS */}
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                    {course.lessons.map((lesson, index) => {
                        const isCompleted = progress.includes(`${id}-${lesson.id}`)
                        const isActive = index === currentLessonIndex && !isCompleted
                        const isLocked = index > currentLessonIndex

                        return (
                            <div
                                key={lesson.id}
                                onClick={() => !isLocked && handleLessonClick(index)}
                                className={`
                  relative flex gap-4 mb-8 cursor-pointer group
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:translate-x-1 transition'}
                `}
                            >
                                {/* Timeline node */}
                                <div className="relative z-10">
                                    <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${isActive ? 'bg-blue-500 text-white ring-4 ring-blue-200' : ''}
                    ${!isCompleted && !isActive && !isLocked ? 'bg-gray-300 text-gray-600' : ''}
                    ${isLocked ? 'bg-gray-200 text-gray-400' : ''}
                  `}>
                                        {isCompleted ? '✓' : index + 1}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className={`
                  flex-1 bg-white rounded-xl p-4 shadow-sm
                  ${isActive ? 'border-2 border-blue-500' : ''}
                  ${isCompleted ? 'border border-green-300 bg-green-50' : 'border border-gray-200'}
                `}>
                                    <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{lesson.duration}</p>
                                    {isLocked && (
                                        <span className="text-xs text-gray-400 mt-2 inline-block">🔒 Complete previous lessons first</span>
                                    )}
                                    {isActive && !isCompleted && (
                                        <span className="text-xs text-blue-500 mt-2 inline-block">▶ Current lesson</span>
                                    )}
                                </div>

                                {/* Connector line (except last) */}
                                {index < course.lessons.length - 1 && (
                                    <div className={`
                    absolute left-5 top-10 w-0.5 h-16
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}