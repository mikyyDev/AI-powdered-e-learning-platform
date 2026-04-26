'use client'
import { useState } from 'react'

export default function ChatPanel() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

    const sendMessage = async () => {
        if (!input.trim()) return
        setMessages([...messages, { role: 'user', content: input }])
        setLoading(true)
        // Mock AI response
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', content: `AI response to: "${input}" (mock)` }])
            setLoading(false)
        }, 1000)
        setInput('')
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 transition z-40"
            >
                🤖
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col z-50 border">
                    <div className="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between">
                        <span>AI Assistant</span>
                        <button onClick={() => setIsOpen(false)} className="text-white">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && <div className="text-gray-400">AI is thinking...</div>}
                    </div>

                    <div className="p-4 border-t flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask me anything about the course..."
                            className="flex-1 p-2 border rounded-lg"
                        />
                        <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}