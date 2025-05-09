// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

// --- Type Definitions ---
interface SensorReading {
  sensor__name: string;
  value: number;
  timestamp: string;
}
interface SensorCardProps {
  sensor: { name: string; desc: string; action: string; img: string; };
  className?: string;
}
interface DataItemProps {
  img: string; alt: string; title: string; caption: string; text: string; className?: string;
}

// --- Constants ---
const sensors = [ { name: 'Temperature', desc: 'Monitoring', action: 'Control', img: '/temp.jpeg' }, { name: 'pH', desc: 'Monitoring', action: 'Control', img: '/php.jpeg' }, { name: 'Light', desc: 'Monitoring', action: 'Control', img: '/light-sensor1.jpeg' }, { name: 'AI Alerts', desc: 'Anomaly Detection', action: 'Notifications', img: '/ai-sensor.jpeg' }, ];
const data = [ { name: 'Filled', value: 70, color: '#FF6F00' }, { name: 'Remaining', value: 30, color: '#3b82f6' }, ];

// --- Helper Components (Reverting Image Sizing) ---

// SensorCard - Reverted to fixed height container, image fills it
const SensorCard = ({ sensor, className = '' }: SensorCardProps) => (
  <div className={`bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 dark:from-amber-800 dark:via-orange-900 dark:to-amber-950 rounded-xl shadow-lg overflow-hidden flex flex-col transition-transform duration-300 hover:scale-105 ${className}`}>
    {/* Image container: Reverted to fixed height */}
    <div className="relative h-40 w-full overflow-hidden bg-orange-300 dark:bg-orange-700"> {/* Restored h-40, removed aspect-square */}
      <Image
        src={sensor.img}
        alt={sensor.name}
        // Removed layout="fill"
        width={220} // Restore intrinsic width (adjust if needed)
        height={160} // Restore intrinsic height (adjust if needed)
        objectFit="cover"
        className="w-full h-full group-hover:scale-105 transition-transform duration-300" // Ensure it fills container
        priority={sensor.name === 'Temperature'}
      />
    </div>
    {/* Text container */}
    <div className="p-5 text-center flex flex-col flex-grow">
      <h3 className="text-xl font-bold font-sans text-amber-900 dark:text-amber-100 mb-1">{sensor.name}</h3>
      <p className="text-sm text-amber-700 dark:text-amber-300 mb-2 flex-grow">{sensor.desc}</p>
      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{sensor.action}</p>
    </div>
  </div>
);

// DataItem - Reverted to fixed width/height image
const DataItem = ({ img, alt, title, caption, text, className = '' }: DataItemProps) => (
  <div className={`flex flex-col sm:flex-row items-center gap-6 ${className}`}>
    {/* Removed the aspect-ratio container div */}
    <Image
      src={img}
      alt={alt}
      width={150} // Restore fixed width
      height={150} // Restore fixed height (makes it square)
      // Removed layout="fill"
      objectFit="cover"
      // Restored sizing and styling classes directly on Image
      className="rounded-lg shadow-md object-cover flex-shrink-0 w-36 h-36 sm:w-40 sm:h-40"
      priority={title === 'Temperature Sensor'}
    />
    <div className="text-center sm:text-left flex-grow">
      <h3 className="text-2xl font-semibold font-sans text-gray-800 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-base italic text-gray-600 dark:text-gray-400 mb-2">{caption}</p>
      <p className="text-lg text-gray-700 dark:text-gray-300">{text}</p>
    </div>
  </div>
);


// --- Main Page Component ---
const Home = () => {
  // State and useEffect remain the same
  const [showLinks, setShowLinks] = useState(false);
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { const fetchData = async () => { setLoading(true); try { const response = await fetch('http://localhost:8000/api/latest/'); if (!response.ok) throw new Error('Failed to fetch landing page sensor data'); const data = await response.json(); if (Array.isArray(data.readings)) { setSensorData(data.readings); setError(null); } else { console.error("Fetched data.readings is not an array:", data.readings); setError("Received invalid sensor data format."); setSensorData([]); } } catch (err) { console.error("Error fetching landing page sensor data:", err); setError(err instanceof Error ? err.message : 'Unknown error'); setSensorData([]); } finally { setLoading(false); } }; fetchData(); }, []);

  return (
    <div className="bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-200 font-sans">
      {/* Navbar is rendered by layout.tsx */}

      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center justify-center text-center overflow-hidden">
        {/* ... Hero content ... */}
        <div className="absolute inset-0"> <Image src="/greenhouse.jpeg" alt="Greenhouse background" layout="fill" objectFit="cover" className="opacity-80" priority /> <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/75"></div> </div> <div className="relative z-10 max-w-4xl text-white px-6 py-20 animate-fade-in"> <h2 className="text-xl sm:text-2xl font-semibold mb-2 drop-shadow">Welcome to GrowVision</h2> <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg">Discover the Future of Agriculture</h1> <p className="mt-4 text-lg sm:text-xl text-white max-w-2xl mx-auto mb-8 drop-shadow-md"> Revolutionize your agricultural practices with our cutting-edge IoT greenhouse monitoring system. </p> <div className="flex flex-col sm:flex-row justify-center items-center gap-4"> <Link href="/dashboard" passHref> <button className="bg-teal-500 text-white px-8 py-3 text-lg sm:text-xl font-semibold rounded-full hover:bg-teal-600 transition transform hover:scale-105 shadow-lg"> Go to Dashboard </button> </Link> <button className="bg-orange-500 text-white px-8 py-3 text-lg sm:text-xl font-semibold rounded-full hover:bg-orange-600 transition transform hover:scale-105 shadow-lg"> Explore Now </button> </div> </div>
      </section>

      {/* About Section */}
      <section className="text-center py-16 sm:py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-800 dark:text-blue-300 mb-4">About Our Solution</h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg sm:text-xl mb-12 sm:mb-16 max-w-3xl mx-auto">Unlock the power of data-driven greenhouse management with integrated hardware and intelligent software.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[ { title: "IOT Dell Greenhouse", img: "/product1.jpeg" }, { title: "Advanced Sensors", img: "/product2.jpeg" }, { title: "Smart Analytics", img: "/product3.jpeg" } ].map((product, index) => (
              // Reverted card structure for About section image
              <div key={index} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg text-center overflow-hidden group transform transition duration-300 hover:-translate-y-2 flex flex-col">
                {/* Restored original image container style */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-950">
                   {/* Restored original Image style */}
                   <Image
                     src={product.img}
                     alt={product.title}
                     width={180} // Restored fixed width
                     height={180} // Restored fixed height (square)
                     // Removed layout="fill"
                     className="mx-auto rounded-full border-4 border-white dark:border-gray-700 shadow-md group-hover:scale-110 transition-transform duration-300" // Restored classes
                   />
                </div>
                 {/* Text content */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-100 mt-4 mb-4">{product.title}</h3>
                  <div className="mt-auto">
                     <button className="border border-blue-600 dark:border-blue-400 px-6 py-2 rounded-full text-base font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-600 dark:hover:bg-blue-400 hover:text-white dark:hover:text-gray-900 transition duration-300"> Learn More </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real-time Sensor Data Overview Section */}
      <section className="container mx-auto px-6 py-16 sm:py-24">
         {/* ... sensor data display ... */}
         <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-gray-900 dark:text-gray-100">Real-time Sensor Data Overview</h2> {loading ? ( <div className="text-center text-gray-600 dark:text-gray-400 py-8">Loading sensor data...</div> ) : error ? ( <div className="text-red-500 text-center py-8">Error fetching sensor data: {error}</div> ) : ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"> {Array.isArray(sensorData) && sensorData.length > 0 ? ( sensorData.slice(0, 3).map((reading, index) => ( <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-indigo-100 dark:hover:shadow-indigo-900/30 transition-shadow duration-300"> <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">{reading.sensor__name}</h3> <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 my-3 truncate"> {typeof reading.value === 'number' ? reading.value.toFixed(1) : reading.value} </p> <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm"> Last updated: {new Date(reading.timestamp).toLocaleString()} </p> </div> )) ) : ( <div className="text-center col-span-full py-8 text-gray-500 dark:text-gray-400">No sensor data available to display.</div> )} </div> )} {!loading && !error && Array.isArray(sensorData) && sensorData.length > 3 && ( <div className="text-center mt-12"> <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline"> View Full Dashboard for More Data &rarr; </Link> </div> )}
      </section>

      {/* Sustainability Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
         {/* ... Sustainability content ... */}
         <div className="container mx-auto px-6"> <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16"> <div className="lg:w-1/2 text-center lg:text-left"> <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">Empowering Sustainability</h2> <p className="text-gray-800 dark:text-gray-300 text-lg sm:text-xl leading-relaxed mb-8"> Our innovative IoT greenhouse monitoring system combines state-of-the-art sensors and intelligent data analysis to optimize resource usage and promote eco-friendly farming practices. </p> <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"> <button className="bg-orange-500 text-white px-7 py-3 text-lg font-semibold rounded-full hover:bg-orange-600 transition transform hover:scale-105 shadow-md"> Meet the Team </button> <button className="bg-teal-600 text-white px-7 py-3 text-lg font-semibold rounded-full hover:bg-teal-700 transition transform hover:scale-105 shadow-md"> Get In Touch </button> </div> </div> <div className="lg:w-1/2 flex justify-center lg:justify-end"> <Image src="/earth.jpeg" alt="Earth Sustainability" width={450} height={450} className="rounded-2xl shadow-xl object-cover transform transition duration-500 hover:rotate-3 hover:scale-105" /> </div> </div> </div>
      </section>

      {/* Sensors Section (Uses SensorCard component) */}
      <section className="py-16 sm:py-24 bg-white dark:bg-black">
         {/* ... Sensors content ... */}
         <div className="container mx-auto px-6 text-center"> <div className="relative z-10"> <h2 className="text-lg font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2">Explore Our Hardware</h2> <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-12 sm:mb-16">Real-time Data Capture</h3> <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"> {sensors.map((sensor, index) => ( <SensorCard key={index} sensor={sensor} /> ))} </div> </div> </div>
      </section>

      {/* Divider */}
      <div className="h-1 bg-gradient-to-r from-teal-200 via-blue-300 to-orange-200 dark:from-teal-800 dark:via-blue-800 dark:to-orange-900"></div>

      {/* Data Visualization Section (Uses DataItem component) */}
      <section>
         {/* ... Data Viz content ... */}
         <div className="flex flex-col lg:flex-row min-h-[80vh]"> <div className="w-full lg:w-1/2 bg-white dark:bg-gray-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-center"> <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Visualize Your Data</h2> <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-10 sm:mb-12">Gain real-time insights into your greenhouse's vital signs.</p> <div className="space-y-10"> <DataItem img="/temp-sensor.jpeg" alt="Temperature Sensor" title="Temperature Sensor" caption="Measures ambient temperature" text="Precisely monitor and control the temperature within your greenhouse." /> <DataItem img="/ph-sensor.jpeg" alt="pH Sensor" title="pH Sensor" caption="Monitors soil acidity levels" text="Maintain the ideal pH levels in your greenhouse soil with monitoring and alerts." /> <DataItem img="/light-sensor.jpeg" alt="Light Intensity Sensor" title="Light Intensity Sensor" caption="Detects light levels for plant growth" text="Optimize lighting conditions to boost photosynthesis and plant growth." /> </div> </div> <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-800 to-indigo-900 dark:from-gray-950 dark:to-black text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-center"> <h2 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-10 text-center">Sustainable Farming Index</h2> <div className="relative w-full max-w-md h-80 sm:h-96"> <ResponsiveContainer width="100%" height="100%"> <PieChart> <Pie data={data} dataKey="value" outerRadius="90%" innerRadius="60%" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => { const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180)); const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180)); return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="14px" fontWeight="bold"> {`${(percent * 100).toFixed(0)}%`} </text> ); }}> {data.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} className="focus:outline-none" /> ))} </Pie> <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#eee' }} /> </PieChart> </ResponsiveContainer> </div> <p className="mt-6 text-center text-blue-200">Efficiency vs. Resource Usage</p> </div> </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-gray-300 py-12 sm:py-16">
         {/* ... Footer content ... */}
         <div className="container mx-auto px-6"> <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8"> <div className="mb-6 md:mb-0 lg:col-span-1"> <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-3">GrowVision</h2> <p className="text-sm text-gray-700 dark:text-gray-400">Leading the future of sustainable agriculture through technology.</p> </div> <div className="mb-6 md:mb-0"> <h4 className="font-semibold mb-4 uppercase tracking-wider text-gray-900 dark:text-gray-200">Quick Links</h4> <ul className="space-y-2"> <li><Link href="/" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm">Home</Link></li> <li><Link href="/dashboard" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm">Dashboard</Link></li> <li><Link href="/team" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm">Our Team</Link></li> <li><a href="#" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm">About</a></li> <li><a href="#" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm">Features</a></li> <li><a href="#" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm">Contact</a></li> </ul> </div> <div className="mb-6 md:mb-0"> <h4 className="font-semibold mb-4 uppercase tracking-wider text-gray-900 dark:text-gray-200">Resources</h4> <ul className="space-y-2"> <li><a href="#" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm">Blog</a></li> <li><a href="#" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm">Webinars</a></li> <li><a href="#" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm">Case Studies</a></li> <li><a href="#" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-sm">FAQs</a></li> </ul> </div> <div> <h4 className="font-semibold mb-4 uppercase tracking-wider text-gray-900 dark:text-gray-200">Stay Updated</h4> <p className="text-sm mb-3 text-gray-700 dark:text-gray-400">Get the latest news and updates.</p> <form className="flex"> <input type="email" placeholder="Enter your email" className="w-full px-3 py-2 rounded-l-md text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200" /> <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-r-md text-sm font-medium hover:bg-blue-700 transition-colors">Subscribe</button> </form> </div> </div> <div className="mt-10 pt-8 border-t border-gray-300 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400"> © {new Date().getFullYear()} GrowVision. All rights reserved. </div> </div>
      </footer>
    </div>
  );
};

export default Home;
