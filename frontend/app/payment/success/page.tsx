import Link from 'next/link'

export default function PaymentSuccess() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-6">You now have access to your course.</p>
                <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-lg">
                    Go to Dashboard
                </Link>
            </div>
        </div>
    )
}