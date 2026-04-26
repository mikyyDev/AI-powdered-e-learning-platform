'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateCourse() {
    const router = useRouter()
    const [lessons, setLessons] = useState([{ title: '', url: '' }])

    const addLesson = () => {
        setLessons([...lessons, { title: '', url: '' }])
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        alert('Course created! (Mock)')
        router.push('/teacher/dashboard')
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">Create New Course</h1>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-4">
                    <input type="text" placeholder="Course Name" className="w-full p-3 border rounded-lg" required />
                    <textarea placeholder="Description" rows={3} className="w-full p-3 border rounded-lg" required />
                    <input type="text" placeholder="Duration (e.g., 4 hours)" className="w-full p-3 border rounded-lg" required />
                    <input type="number" placeholder="Price (0 for free)" className="w-full p-3 border rounded-lg" required />
                    <input type="file" accept="image/*" className="w-full p-3 border rounded-lg" />
                    <input type="file" accept=".pdf" className="w-full p-3 border rounded-lg" />

                    <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Lessons</h3>
                        {lessons.map((lesson, idx) => (
                            <div key={idx} className="space-y-2 mb-4 p-3 border rounded-lg">
                                <input type="text" placeholder="Lesson Title" className="w-full p-2 border rounded" />
                                <input type="text" placeholder="YouTube URL" className="w-full p-2 border rounded" />
                            </div>
                        ))}
                        <button type="button" onClick={addLesson} className="text-blue-600">+ Add Lesson</button>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold">
                        Upload Course
                    </button>
                </form>
            </div>
        </div>
    )
}