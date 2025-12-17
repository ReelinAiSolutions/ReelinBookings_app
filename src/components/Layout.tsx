'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Settings, Bell, Search, Menu } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

// NOTE: This is a visual layout. Real auth state checking will be implemented 
// in the page logic or middleware. For now, we simulate the 'view' based on the URL.

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const isAdmin = pathname?.includes('/admin');

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
            {/* Modern Navbar */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-xl bg-white/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        {/* Logo Section */}
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-3 group">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/30 transition-all duration-300">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900 tracking-tight">Reelin<span className="text-primary-600"> Bookings</span></span>
                            </Link>

                            {/* Desktop Nav Links - Only show if likely logged in or for demo purposes */}
                            <div className="hidden md:flex items-center space-x-1 bg-gray-50/50 p-1 rounded-full border border-gray-100">
                                <Link
                                    href="/"
                                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${!isAdmin ? 'bg-white text-primary-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Bookings
                                </Link>
                                <Link
                                    href="/admin"
                                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${isAdmin ? 'bg-white text-primary-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Dashboard
                                </Link>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2">
                                <button className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
                                    <Search className="w-5 h-5" />
                                </button>
                                <button className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
                                    <Bell className="w-5 h-5" />
                                </button>
                                <button className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="h-8 w-px bg-gray-200 hidden md:block mx-2"></div>

                            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 leading-none">Guest User</p>
                                    <p className="text-xs text-gray-500 mt-1">Sign In</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 p-0.5 border border-white shadow-sm">
                                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-primary-700 font-bold">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <button className="md:hidden p-2 text-gray-500">
                                <Menu className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-lg font-bold text-gray-900">Reelin.</span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Streamline your booking process with our modern, AI-powered platform.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-primary-600">Features</a></li>
                                <li><a href="#" className="hover:text-primary-600">Pricing</a></li>
                                <li><a href="#" className="hover:text-primary-600">Integrations</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-primary-600">About</a></li>
                                <li><a href="#" className="hover:text-primary-600">Careers</a></li>
                                <li><a href="#" className="hover:text-primary-600">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Support</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-primary-600">Help Center</a></li>
                                <li><a href="#" className="hover:text-primary-600">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-primary-600">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-8 text-center text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} Reelin Bookings. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};
