'use client'
import { mockCourses } from '@/lib/mockData'
import CourseCard from '@/components/ui/CourseCard'

export default function CoursesPage() {
    const suggestedCourses = mockCourses.slice(0, 4)
    const exploreCourses = mockCourses

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Suggested Courses - Horizontal Scroll */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Suggested Courses</h2>
                    <div className="overflow-x-auto scrollbar-hide">
                        <div className="flex gap-6 pb-4 min-w-max">
                            {suggestedCourses.map((course) => (
                                <div key={course.id} className="w-80">
                                    <CourseCard course={course} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Explore Courses - Grid */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Explore Courses</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exploreCourses.map((course) => (
                            <CourseCard key={course.id} course={course} showDescription />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}