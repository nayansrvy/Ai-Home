import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const SharedChat = () => {
    const { sessionId } = useParams();
    const [chatData, setChatData] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = "http://127.0.0.1:5000";

    useEffect(() => {
        const fetchSharedChat = async () => {
            try {
                // Note: Iske liye backend mein ek 'public' route hona chahiye
                // Agar nahi hai, toh abhi ke liye session fetch route use karein
                const res = await axios.get(`${API_BASE}/api/share/${sessionId}`);
                setChatData(res.data);
            } catch (err) {
                console.error("Shared Chat Load Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSharedChat();
    }, [sessionId]);

    if (loading) return <div className="h-screen flex items-center justify-center text-white bg-[#131314]">Loading shared conversation...</div>;

    return (
        <div className="min-h-screen bg-[#131314] text-gray-200 p-4 md:p-10 font-sans">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-xl font-bold mb-10 text-blue-400">AIHome - Shared Conversation</h1>
                
                {chatData.length === 0 && <p className="text-center opacity-50">No conversation found or link expired.</p>}

                {chatData.map((chat, idx) => (
                    <div key={idx} className="mb-8 animate-fade-in">
                        {/* User Message */}
                        <div className="flex justify-end mb-4">
                            <div className="bg-[#2d2e2f] px-5 py-3 rounded-2xl max-w-[85%] text-sm">
                                {chat.userMessage}
                            </div>
                        </div>

                        {/* AI Response */}
                        <div className="flex justify-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">AI</div>
                            <div className="text-sm leading-relaxed pt-1 markdown-body w-full overflow-hidden">
                                <ReactMarkdown>{chat.aiResponse}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="mt-20 text-center border-t border-gray-800 pt-6">
                    <p className="text-xs text-gray-500 mb-4">This conversation was shared via AIHome Aggregator.</p>
                    <button onClick={() => window.location.href = '/'} className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium">Create Your Own Chat</button>
                </div>
            </div>
        </div>
    );
};

export default SharedChat;