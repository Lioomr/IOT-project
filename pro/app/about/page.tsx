// app/about/page.tsx
'use client';

import React from 'react';
import Image from 'next/image'; // If you want to add any illustrative images
import Link from 'next/link';
import { Zap, Brain, Leaf, Users, Target as TargetIcon, TrendingUp, ShieldCheck } from 'lucide-react'; // Icons

const AboutPage: React.FC = () => {
    // --- Styles (consistent with your cinematic theme) ---
    const primaryBg = '#1a1f29'; // Dark blue-gray
    const cardBg = 'rgba(40, 48, 61, 0.8)';
    const borderColor = 'rgba(0, 173, 239, 0.2)';
    const accentTeal = '#00adef';
    const accentGreen = '#00ffae';
    const softWhite = '#f5f5f5';
    const textSecondary = '#a0a8b5';
    const glowColorTeal = 'rgba(0, 173, 239, 0.7)';
    const glowColorGreen = 'rgba(0, 255, 174, 0.7)';

    const featureCards = [
        {
            icon: <TrendingUp size={36} className="mb-4" style={{ color: accentTeal }} />,
            title: "Real-time Monitoring",
            description: "Continuous tracking of vital greenhouse parameters like temperature, humidity, soil moisture, pH, and light intensity, ensuring optimal growing conditions around the clock."
        },
        {
            icon: <ShieldCheck size={36} className="mb-4" style={{ color: accentTeal }} />,
            title: "Intelligent Alerts",
            description: "Proactive notifications via SMS and in-app alerts when sensor readings deviate from ideal ranges, enabling swift corrective action to protect crops."
        },
        {
            icon: <Leaf size={36} className="mb-4" style={{ color: accentGreen }} />,
            title: "AI-Powered Disease Detection",
            description: "Utilizing advanced DenseNet models to analyze leaf images and identify potential plant diseases early, aiding in timely treatment and preventing spread."
        },
        {
            icon: <TargetIcon size={36} className="mb-4" style={{ color: accentGreen }} />,
            title: "Object Detection with YOLO",
            description: "Employing YOLO models for visual analysis within the greenhouse, capable of identifying and tracking objects like fruits, pests, or equipment for enhanced management."
        },
        {
            icon: <Brain size={36} className="mb-4" style={{ color: accentTeal }} />,
            title: "Predictive Growth Insights (LSTM)",
            description: "Leveraging LSTM-Attention models to analyze historical sensor data and forecast plant growth stages or 'days of planted', providing valuable insights for planning and harvesting."
        },
        {
            icon: <Zap size={36} className="mb-4" style={{ color: accentGreen }} />,
            title: "Sustainable Agriculture",
            description: "Optimizing resource usage (water, energy) through data-driven insights, promoting eco-friendly farming practices and contributing to a more sustainable future."
        }
    ];

    return (
        <div style={{ backgroundColor: primaryBg, color: softWhite, fontFamily: "'Inter', sans-serif" }} className="min-h-screen py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-5xl">
                {/* Header Section */}
                <header className="text-center mb-16 sm:mb-20">
                    <h1 style={{ fontFamily: "'Poppins', sans-serif", color: accentGreen, textShadow: `0 0 10px ${glowColorGreen}` }} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                        About GrowVision
                    </h1>
                    <p style={{ color: textSecondary }} className="mt-4 text-lg sm:text-xl max-w-3xl mx-auto">
                        Revolutionizing agriculture through intelligent IoT solutions and advanced machine learning, paving the way for a sustainable and efficient future in farming.
                    </p>
                </header>

                {/* Mission Section */}
                <section style={{ backgroundColor: cardBg, borderColor: borderColor }} className="mb-12 sm:mb-16 p-6 sm:p-8 rounded-xl shadow-2xl border">
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", color: accentTeal, textShadow: `0 0 8px ${glowColorTeal}` }} className="text-2xl sm:text-3xl font-bold mb-6 text-center sm:text-left">
                        Our Mission
                    </h2>
                    <p className="text-base sm:text-lg leading-relaxed" style={{ color: textSecondary }}>
                        At GrowVision, we are a team of passionate students dedicated to harnessing the power of technology to address critical challenges in modern agriculture. Our mission is to empower growers with cutting-edge tools that enhance productivity, optimize resource management, and promote sustainable farming practices. We believe that by integrating IoT, data analytics, and machine learning, we can contribute to a more resilient and food-secure world.
                    </p>
                    <p className="text-base sm:text-lg leading-relaxed mt-4" style={{ color: textSecondary }}>
                        This project, born from academic endeavor and a drive for innovation, aims to provide a comprehensive, accessible, and intelligent greenhouse monitoring and analysis system.
                    </p>
                </section>

                {/* Technology & Features Section */}
                <section className="mb-12 sm:mb-16">
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", color: accentTeal, textShadow: `0 0 8px ${glowColorTeal}` }} className="text-2xl sm:text-3xl font-bold mb-8 text-center">
                        Key Features & Technologies
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {featureCards.map((feature, index) => (
                            <div
                                key={index}
                                style={{ backgroundColor: cardBg, borderColor: borderColor }}
                                className="p-6 rounded-lg shadow-xl border flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:shadow-teal-500/40"
                            >
                                {feature.icon}
                                <h3 style={{ fontFamily: "'Poppins', sans-serif", color: softWhite }} className="text-xl font-semibold mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm" style={{ color: textSecondary }}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Team Section */}
                <section style={{ backgroundColor: cardBg, borderColor: borderColor }} className="text-center p-6 sm:p-8 rounded-xl shadow-2xl border">
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", color: accentTeal, textShadow: `0 0 8px ${glowColorTeal}` }} className="text-2xl sm:text-3xl font-bold mb-6">
                        Meet the Innovators
                    </h2>
                    <p className="text-base sm:text-lg mb-8" style={{ color: textSecondary }}>
                        GrowVision is brought to life by a dedicated team of students from El Sewedy University of Technology, driven by a shared passion for technology and sustainable solutions.
                    </p>
                    <Link href="/team" passHref>
                        <button
                            style={{ background: `linear-gradient(90deg, ${accentTeal} 0%, ${accentGreen} 100%)`, color: primaryBg }}
                            className="text-lg font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-300 transform hover:scale-105"
                        >
                            <Users size={20} className="inline-block mr-2 mb-1" /> Our Team
                        </button>
                    </Link>
                </section>

                {/* Optional: Future Goals Section */}
                {/* <section className="mt-12 sm:mt-16">
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", color: accentTeal }} className="text-2xl sm:text-3xl font-bold mb-6 text-center">
                        Looking Ahead
                    </h2>
                    <p className="text-base sm:text-lg text-center max-w-2xl mx-auto" style={{ color: textSecondary }}>
                        We envision GrowVision evolving with more advanced predictive capabilities, expanded control features, and integration with broader farm management platforms.
                    </p>
                </section> */}

            </div>
        </div>
    );
};

export default AboutPage;
