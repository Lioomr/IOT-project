// app/components/Navbar/Navbar.tsx
"use client"; // Add use client for potential future interactivity (like mobile menu)

import React from 'react';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 flex flex-wrap justify-between items-center p-4 sm:p-6 bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700">
      {/* Brand Logo/Name */}
      <Link href="/" className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
        GrowVision
      </Link>

      {/* Navigation Links */}
      <ul className="flex gap-4 sm:gap-6 md:gap-8 text-base sm:text-lg items-center flex-wrap">
        <li><Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Home</Link></li>
        <li><Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Dashboard</Link></li>
        <li><Link href="/ml-lab" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">ML Lab</Link></li> {/* Assuming you added this */}
        <li><Link href="/team" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Team</Link></li>
        {/* UPDATED/NEW About Link */}
        <li><Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">About</Link></li>
        {/* Remove or update old Features link if it was separate */}
        {/* <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Features</a></li> */}
        <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Contact</a></li>
        <li><a href="#" className="bg-orange-500 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-full hover:bg-orange-600 transition text-sm sm:text-base">FAQ</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;

