'use client'
import { useParams } from 'next/navigation'
import { mockCourses } from '@/lib/mockData'

export default function PaymentPage() {
    const { id } = useParams()
    const course = mockCourses.find(c => c.id === Number(id))
    const isEthiopia = true // Mock detection

    if (!course) return <div>Course not found</div>

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                <h1 className="text-2xl font-bold mb-4">Complete Payment</h1>
                <div className="border-b pb-4 mb-4">
                    <h2 className="font-semibold">{course.title}</h2>
                    <p className="text-2xl font-bold text-blue-600 mt-2">${course.price}</p>
                </div>

                <div className="space-y-3">
                    <button className="w-full border border-gray-300 rounded-lg p-3 text-left hover:bg-gray-50">
                        💳 Credit Card (Stripe)
                    </button>
                    {isEthiopia && (
                        <button className="w-full border border-gray-300 rounded-lg p-3 text-left hover:bg-gray-50">
                            📱 Chapa (Ethiopia)
                        </button>
                    )}
                </div>

                <p className="text-xs text-gray-500 text-center mt-6">
                    🔒 Secure payment processing
                </p>
            </div>
        </div>
    )
}