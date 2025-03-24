"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import AgentHub from "@/components/AgentHub";
import MyAgents from "@/components/MyAgents";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"

export default function Home() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signIn, loading } = useAuth();
    const [currentView, setCurrentView] = useState("landing");
    const [openSnackbar, setOpenSnackbar] = useState(false);

    useEffect(() => {
        // Check if user has previously acknowledged the notice
        const hasAcknowledged = localStorage.getItem('thothyNoticeAcknowledged');
        if (!hasAcknowledged) {
            setOpenSnackbar(true);
        }
    }, []);

    const handleGetStarted = () => {
        if (user) {
            router.push('/agent');
        } else {
            signIn();
        }
    };

    const handleCloseSnackbar = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackbar(false);
    };

    const handleAcknowledgeNotice = (acknowledge: boolean) => {
        if (acknowledge) {
            localStorage.setItem('thothyNoticeAcknowledged', 'true');
        }
        setOpenSnackbar(false);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header currentView={currentView} />
            
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-3">
                                Your Personal AI Assistant
                            </h1>
                            <p className="text-lg opacity-90 mb-4">
                                Meet Thothy - your friendly AI companion that helps you get things done faster and smarter. No complex tech talk, just simple solutions for your daily tasks.
                            </p>
                            <Button
                                onClick={handleGetStarted}
                                disabled={loading}
                                variant="default"
                                size="lg"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Checking...
                                    </div>
                                ) : (
                                    "Get Started"
                                )}
                            </Button>
                        </div>
                        <div className="hidden md:block">
                            <img
                                src="/hero-image.png"
                                alt="Thothy AI Assistant"
                                className="w-full max-w-md mx-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Why Choose Thothy?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-xl font-semibold mb-2">
                                Smart & Simple
                            </h3>
                            <p className="text-gray-600">
                                No tech jargon here! Thothy speaks your language and helps you accomplish tasks without the complexity.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-xl font-semibold mb-2">
                                Always Learning
                            </h3>
                            <p className="text-gray-600">
                                The more you use Thothy, the better it gets at understanding your needs and preferences.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-xl font-semibold mb-2">
                                Your Time Saver
                            </h3>
                            <p className="text-gray-600">
                                Let Thothy handle the routine tasks while you focus on what matters most to you.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gray-100 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                        Join thousands of users who are already experiencing the power of Thothy.
                    </p>
                    <Button
                        onClick={handleGetStarted}
                        disabled={loading}
                        variant="default"
                        size="lg"
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Checking...
                            </div>
                        ) : (
                            "Try Thothy Now"
                        )}
                    </Button>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Pricing
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col h-full">
                            <h3 className="text-xl font-semibold mb-4">
                                Free
                            </h3>
                            <div className="space-y-2 text-gray-600 flex-grow">
                                <p>- No charge. It's totally free.</p>
                                <p>- User can use only agent menu.</p>
                                <p>- Limitation on usage</p>
                                <p>- No memory about user</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col h-full">
                            <h3 className="text-xl font-semibold mb-4">
                                Personal
                            </h3>
                            <div className="space-y-2 text-gray-600 flex-grow">
                                <p>- Include all features in Free.</p>
                                <p>- Can use staff menu.</p>
                                <p>- No limitation on usage.</p>
                                <p>- Memory about user.</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col h-full">
                            <h3 className="text-xl font-semibold mb-4">
                                Business
                            </h3>
                            <div className="space-y-2 text-gray-600 flex-grow">
                                <p>- Include all features in Personal.</p>
                                <p>- Can use team menu.</p>
                                <p>- Can use cron job for team</p>
                                <p>- Can monitor team's work</p>
                                <p>- Can use inbox menu for team's report</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col h-full">
                            <h3 className="text-xl font-semibold mb-4">
                                Enterprise
                            </h3>
                            <div className="space-y-2 text-gray-600 flex-grow">
                                <p>- Include all features in Business.</p>
                                <p>- Can use project menu.</p>
                                <p>- Can use 24/7 project working time.</p>
                                <p>- Can monitor project's work</p>
                                <p>- Can use inbox for project's report</p>
                                <p>- Cooperate with Vercel, Supabase, GitHub platform.</p>
                                <p>- Can write a code for a running service</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col h-full">
                            <h3 className="text-xl font-semibold mb-4">
                                Custom
                            </h3>
                            <div className="space-y-2 text-gray-600 flex-grow">
                                <p>- Include all features in Enterprise</p>
                                <p>- Support onpremise</p>
                                <p>- Support customized development for integration</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Disclaimer Snackbar */}
            {openSnackbar && (
                <AlertDialog>
                    <AlertDialogTrigger>Open</AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Disclaimer</AlertDialogTitle>
                            <AlertDialogDescription>
                                This is an experimental project with AI agents. Performance may vary and content is not guaranteed to be accurate.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => handleAcknowledgeNotice(false)}>Dismiss</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleAcknowledgeNotice(true)}>Don't show again</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}
