export interface Lesson {
    id: string
    title: string
    duration: string
    type: 'video' | 'text'
    content: string
}

export interface Course {
    id: number
    title: string
    description: string
    duration: string
    price: number
    lessons: Lesson[]
}

export const mockCourses: Course[] = [
    {
        id: 1,
        title: 'React Basics',
        description: 'Learn React from scratch. Build modern web applications.',
        duration: '4 hours',
        price: 0,
        lessons: [
            { id: 'lesson-1', title: 'Introduction to React', duration: '15 min', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { id: 'lesson-2', title: 'Components & Props', duration: '20 min', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { id: 'lesson-3', title: 'State & Hooks', duration: '25 min', type: 'text', content: 'React hooks allow you to use state and other React features...' },
            { id: 'lesson-4', title: 'Events & Forms', duration: '20 min', type: 'text', content: 'Handling events in React is similar to handling events on DOM elements...' },
            { id: 'lesson-5', title: 'API Calls', duration: '30 min', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        ]
    },
    {
        id: 2,
        title: 'Next.js Mastery',
        description: 'Build production-ready React apps with Next.js',
        duration: '6 hours',
        price: 49,
        lessons: [
            { id: 'lesson-1', title: 'Next.js Overview', duration: '15 min', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { id: 'lesson-2', title: 'App Router', duration: '25 min', type: 'text', content: 'The App Router is the new routing system in Next.js 13...' },
            { id: 'lesson-3', title: 'Server Components', duration: '20 min', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { id: 'lesson-4', title: 'Data Fetching', duration: '25 min', type: 'text', content: 'Next.js provides multiple ways to fetch data...' },
            { id: 'lesson-5', title: 'Deployment', duration: '15 min', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        ]
    },
    {
        id: 3,
        title: 'TypeScript Pro',
        description: 'Master TypeScript for type-safe JavaScript',
        duration: '3 hours',
        price: 39,
        lessons: [
            { id: 'lesson-1', title: 'Why TypeScript?', duration: '10 min', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { id: 'lesson-2', title: 'Basic Types', duration: '20 min', type: 'text', content: 'TypeScript supports many basic types including number, string, boolean...' },
            { id: 'lesson-3', title: 'Interfaces & Types', duration: '20 min', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { id: 'lesson-4', title: 'Generics', duration: '25 min', type: 'text', content: 'Generics allow you to create reusable components...' },
        ]
    }
]

export const mockProgress: Record<number, string[]> = {
    1: ['1-lesson-1', '1-lesson-2'] // User 1 completed first 2 lessons of course 1
}

export const saveProgress = (userId: number, courseId: number, lessonId: string) => {
    if (!mockProgress[userId]) mockProgress[userId] = []
    if (!mockProgress[userId].includes(`${courseId}-${lessonId}`)) {
        mockProgress[userId].push(`${courseId}-${lessonId}`)
    }
}