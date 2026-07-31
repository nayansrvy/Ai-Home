import React from 'react';
import { MessageSquare, Shield, HelpCircle, Pin, Edit3, Trash2 } from 'lucide-react';

const PrivacyHelp = () => {
    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-800 font-sans">
            {/* Header */}
            <header className="border-b border-gray-200 px-10 py-4 flex items-center sticky top-0 bg-white z-50 shadow-sm">
                <h1 className="text-xl text-gray-600 font-medium">AIHome Apps Help</h1>
            </header>

            {/* Sub-Header Navigation */}
            <nav className="flex gap-8 px-10 py-4 border-b border-gray-200 text-sm font-medium bg-white">
                <span className="text-blue-600 border-b-2 border-blue-600 pb-4 cursor-default">Help Center</span>
            </nav>

            <main className="max-w-4xl mx-auto py-10 px-6">
                {/* Left Content Area - Ab ye poori width lega */}
                <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
                    <h2 className="text-3xl font-normal text-gray-900 mb-8">Find & manage your recent chats in AIHome Apps</h2>
                    
                    <section className="space-y-10">
                        {/* 1. Chat Management */}
                        <div className="flex gap-5">
                            <div className="mt-1 text-blue-500 bg-blue-50 p-2 rounded-lg h-fit"><Pin size={22} /></div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-800">Chat Management</h3>
                                <p className="text-gray-600 leading-relaxed text-[15px]">
                                    In <strong>AIHome</strong>, you can <strong>Pin</strong> important chats to the top, <strong>Rename</strong> them for better identification, or <strong>Delete</strong> them when they are no longer needed. This helps you keep your workspace organized and efficient.
                                </p>
                            </div>
                        </div>

                        {/* 2. Understanding Deletion */}
                        <div className="flex gap-5">
                            <div className="mt-1 text-red-500 bg-red-50 p-2 rounded-lg h-fit"><Trash2 size={22} /></div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-800">Understanding Deletion</h3>
                                <p className="text-gray-600 leading-relaxed text-[15px]">
                                    When you delete a chat, it is permanently removed from your <strong>AIHome Apps Activity</strong> (history). Please note that deleted conversations cannot be recovered once they are removed from the system.
                                </p>
                            </div>
                        </div>

                        {/* 3. Content Cleanup */}
                        <div className="flex gap-5">
                            <div className="mt-1 text-orange-500 bg-orange-50 p-2 rounded-lg h-fit"><Edit3 size={22} /></div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-800">Content Cleanup</h3>
                                <p className="text-gray-600 leading-relaxed text-[15px]">
                                    Deleting a chat also removes any associated content created within that session, such as generated images, documents, or integrated app data. All contextual information from that specific conversation is cleared immediately.
                                </p>
                            </div>
                        </div>

                        {/* 4. Privacy Information */}
                        <div className="flex gap-5">
                            <div className="mt-1 text-green-500 bg-green-50 p-2 rounded-lg h-fit"><Shield size={22} /></div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-800">Privacy Information</h3>
                                <p className="text-gray-600 leading-relaxed text-[15px]">
                                    This section explains how <strong>AIHome</strong> handles your data and how you can manage your privacy settings. We prioritize your data security and provide you with full control over your conversation history and personal information.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="mt-12 pt-8 border-t border-gray-100 flex gap-8 text-blue-600 text-sm font-semibold">
                        <span className="cursor-pointer hover:underline underline-offset-4">Computer</span>
                    </div>
                </div>

                {/* Right Sidebar wala pura div yahan se delete kar diya hai */}
            </main>
        </div>
    );
};

export default PrivacyHelp;