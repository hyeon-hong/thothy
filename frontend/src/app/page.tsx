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

// Define pricing policy type
interface PricingPolicy {
    id: string;
    name: string;
    monthly_price: number;
    description: string;
}

export default function Home() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signIn, loading, supabase } = useAuth();
    const [currentView, setCurrentView] = useState("landing");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [pricingPolicies, setPricingPolicies] = useState<PricingPolicy[]>([]);
    const [pricingLoading, setPricingLoading] = useState(true);

    useEffect(() => {
        // Check if user has previously acknowledged the notice
        const hasAcknowledged = localStorage.getItem('thothyNoticeAcknowledged');
        if (!hasAcknowledged) {
            setOpenSnackbar(true);
        }

        // Fetch pricing policies from Supabase
        const fetchPricingPolicies = async () => {
            if (!supabase) return;
            
            try {
                setPricingLoading(true);
                const { data, error } = await supabase
                    .from('pricing_policy')
                    .select('*');
                
                if (error) {
                    console.error('Error fetching pricing policies:', error);
                    return;
                }
                
                // Sort the pricing policies
                const sortedPolicies = data?.sort((a, b) => {
                    const order = ['Free', 'Personal', 'Business', 'Enterprise', 'Custom'];
                    return order.indexOf(a.name) - order.indexOf(b.name);
                }) || [];
                
                setPricingPolicies(sortedPolicies);
            } catch (error) {
                console.error('Error fetching pricing policies:', error);
            } finally {
                setPricingLoading(false);
            }
        };

        fetchPricingPolicies();
    }, [supabase]);

    // Format description into bullet points
    const formatDescription = (description: string): string[] => {
        // If description contains bullet points or line breaks, split by them
        if (description.includes('•') || description.includes('\n')) {
            return description.split(/[•\n]/).filter(item => item.trim().length > 0).map(item => item.trim());
        }
        
        // Otherwise, split by periods or commas and create bullet points
        return description.split(/[.,]/).filter(item => item.trim().length > 0).map(item => item.trim());
    };

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
                    {pricingLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                            {pricingPolicies.map((policy) => (
                                <div key={policy.id} className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col h-full w-full md:w-auto pricing-card">
                                    <h3 className="text-xl font-semibold mb-4">
                                        {policy.name}
                                    </h3>
                                    {policy.name === 'Custom' ? (
                                        <div className="mb-4 text-lg font-bold">
                                            Custom Price
                                        </div>
                                    ) : (
                                        policy.monthly_price > 0 ? (
                                            <div className="mb-4 text-lg font-bold">
                                                ${policy.monthly_price.toFixed(2)}/month
                                            </div>
                                        ) : (
                                            <div className="mb-4 text-lg font-bold">
                                                Free
                                            </div>
                                        )
                                    )}
                                    <div className="space-y-2 text-gray-600 flex-grow">
                                        {formatDescription(policy.description).map((item, index) => (
                                            <p key={index}>• {item}</p>
                                        ))}
                                    </div>
                                    <Button 
                                        onClick={handleGetStarted} 
                                        variant="outline" 
                                        className="mt-4"
                                    >
                                        Get Started
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
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
