// app/components/Dashboard/Dashboard.tsx
"use client"; // <--- Add this directive for client-side interactivity

import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css'; // Import the CSS file

// Import Chart.js and react-chartjs-2
// Ensure you've installed them: npm install chart.js react-chartjs-2
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler, // Import Filler plugin for area fill
    ChartData, // Import TypeScript types
    ChartOptions // Import TypeScript types
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler // Register Filler plugin
);

// --- Interfaces/Types (Optional but good practice with TypeScript) ---
interface SensorData {
    [key: string]: number | string; // Allow number or string values (like 'wet'/'dry')
}

interface Settings {
    unit: 'metric' | 'imperial';
    refreshRate: number;
}

interface ModalData {
    key: string;
    title: string;
    description: string;
    image: string;
}

interface TrendChartData {
    labels: (string | number)[];
    datasets: any[]; // Adjust type based on your dataset structure if needed
}

// --- Mock Data & Config (Moved from script.js - Adapt as needed) ---
const MOCK_CREDENTIALS = { username: "admin", password: "123" };

// Sensor Units Mapping
const sensorUnits: { [key: string]: string } = { temperature: "°C", humidity: "%", airQuality: "ppm", soilMoisture: "%", pH: "", lightIntensity: "lux", leafWetness: "", vibration: "", uvLight: "UV Index", energyUsage: "" };

// Sensor Display Names
const sensorDisplayNames: { [key: string]: string } = { temperature: "Temperature", humidity: "Humidity", airQuality: "Air Quality", soilMoisture: "Soil Moisture", pH: "pH Level", lightIntensity: "Light Intensity", leafWetness: "Leaf Wetness", vibration: "Vibration", uvLight: "UV Light", energyUsage: "Energy Usage" };

function getSensorDisplayName(key: string): string {
    return sensorDisplayNames[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

// Sensor Icons Mapping (Using placeholders - replace with actual paths relative to /public or imported images)
const sensorIcons: { [key: string]: string } = {
    temperature: "https://placehold.co/50x50/FF5733/FFFFFF?text=Temp",
    humidity: "https://placehold.co/50x50/3357FF/FFFFFF?text=Humid",
    airQuality: "https://placehold.co/50x50/33FF57/000000?text=AQ",
    soilMoisture: "https://placehold.co/50x50/A0522D/FFFFFF?text=Soil",
    pH: "https://placehold.co/50x50/FF33F3/FFFFFF?text=pH",
    lightIntensity: "https://placehold.co/50x50/FFD700/000000?text=Light",
    leafWetness: "https://placehold.co/50x50/ADD8E6/000000?text=Leaf",
    vibration: "https://placehold.co/50x50/999999/FFFFFF?text=Vibe",
    uvLight: "https://placehold.co/50x50/FFA500/FFFFFF?text=UV",
    energyUsage: "https://placehold.co/50x50/666666/FFFFFF?text=Power",
    default: "https://placehold.co/50x50/eeeeee/000000?text=N/A"
};

// Sensor Descriptions and Images (Replace placeholders)
// For images, use paths relative to the /public folder (e.g., '/assets/images/temp.png')
// Or import images directly: import tempImage from '/public/assets/images/temp.png';
const sensorDescriptions: { [key: string]: { description: string; image: string } } = {
    temperature: { description: "Measures the ambient air temperature...", image: "/assets/images/temperature-wiring.png" }, // Example path
    humidity: { description: "Measures the amount of water vapor...", image: "https://placehold.co/300x200/3357FF/ffffff?text=Humidity+Sensor" }, // Placeholder
    airQuality: { description: "Detects levels of various gases...", image: "https://placehold.co/300x200/33FF57/000000?text=Air+Quality+Diagram" },
    soilMoisture: { description: "Measures the volumetric water content...", image: "https://placehold.co/300x200/A0522D/ffffff?text=Soil+Moisture+Setup" },
    pH: { description: "Measures the acidity or alkalinity...", image: "https://placehold.co/300x200/FF33F3/ffffff?text=pH+Probe+Wiring" },
    lightIntensity: { description: "Measures the amount of light...", image: "https://placehold.co/300x200/FFD700/000000?text=Light+(Lux)+Sensor" },
    leafWetness: { description: "Detects the presence of moisture...", image: "https://placehold.co/300x200/ADD8E6/000000?text=Leaf+Wetness+Detector" },
    vibration: { description: "Detects physical vibrations...", image: "https://placehold.co/300x200/999999/ffffff?text=Vibration+Sensor+Placement" },
    uvLight: { description: "Measures the intensity of UV radiation...", image: "https://placehold.co/300x200/FFA500/ffffff?text=UV+Index+Sensor" },
    energyUsage: { description: "Monitors electrical consumption...", image: "https://placehold.co/300x200/666666/ffffff?text=Energy+Monitoring+Setup" }
};


// Thresholds for status indicators
const thresholds: { [key: string]: { min?: number; max?: number; criticalValue?: string; type: 'range' | 'max' | 'min' | 'state' } } = {
    temperature: { min: 18, max: 28, type: 'range' },
    humidity: { min: 50, max: 75, type: 'range' },
    airQuality: { max: 600, type: 'max' },
    soilMoisture: { min: 30, max: 65, type: 'range' },
    pH: { min: 6.0, max: 7.0, type: 'range' },
    lightIntensity: { min: 300, type: 'min' },
    uvLight: { max: 5, type: 'max' },
    leafWetness: { criticalValue: 'wet', type: 'state' },
    vibration: { criticalValue: 'on', type: 'state' },
    energyUsage: { criticalValue: 'high', type: 'state' }
};

// Status colors
const statusColors: { [key: string]: string } = {
    normal: '#4CAF50', // Green
    warning: '#FFC107', // Yellow
    critical: '#F44336', // Red
    default: '#cccccc'  // Grey
};

// Function to determine status
function getStatus(value: number | string | undefined | null, sensorKey: string): string {
    const config = thresholds[sensorKey];
    if (value === undefined || value === null || !config) return 'default'; // No threshold or value

    const numericValue = typeof value === 'string' ? parseFloat(value) : value; // Attempt conversion if string
    let status = 'normal'; // Default to normal

    // Check based on threshold type
    if (config.type === 'range' && typeof numericValue === 'number' && !isNaN(numericValue)) {
        if (numericValue < (config.min ?? -Infinity) || numericValue > (config.max ?? Infinity)) status = 'critical';
    } else if (config.type === 'max' && typeof numericValue === 'number' && !isNaN(numericValue)) {
        if (numericValue > (config.max ?? Infinity)) status = 'critical';
    } else if (config.type === 'min' && typeof numericValue === 'number' && !isNaN(numericValue)) {
        if (numericValue < (config.min ?? -Infinity)) status = 'critical';
    } else if (config.type === 'state') {
        if (String(value).toLowerCase() === String(config.criticalValue).toLowerCase()) {
            status = 'critical';
        } else {
             status = 'normal'; // Assume non-critical states are normal
        }
    } else if (typeof numericValue !== 'number' || isNaN(numericValue) && config.type !== 'state') {
        status = 'default'; // If value is not numeric and not a state type
    }

     // Ensure states like 'dry', 'off', 'normal' map to normal color unless explicitly critical
    if (config.type === 'state' && status !== 'critical') {
        status = 'normal';
    }

    return status;
}


// --- Mock API Functions (Adapted from script.js) ---
// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchSensorData(): Promise<SensorData> {
    await delay(50);
    return {
        temperature: (Math.random() * 15 + 18).toFixed(1),
        humidity: (Math.random() * 40 + 40).toFixed(1),
        airQuality: Math.floor(Math.random() * 200 + 300),
        soilMoisture: (Math.random() * 50 + 20).toFixed(1),
        pH: (Math.random() * 1.5 + 6.0).toFixed(1),
        lightIntensity: Math.floor(Math.random() * 800 + 200),
        leafWetness: Math.random() > 0.8 ? "wet" : "dry",
        vibration: Math.random() > 0.95 ? "on" : "off",
        uvLight: (Math.random() * 4 + 1).toFixed(1),
        energyUsage: Math.random() > 0.9 ? "high" : "normal",
    };
}

async function fetchHistoricalData(sensorKey: string): Promise<number[]> {
    await delay(80);
    const hours = 24;
    let data: number[] = [];
    // Generate somewhat realistic historical patterns
    switch (sensorKey) {
        case 'temperature': data = Array.from({ length: hours }, (_, i) => parseFloat((25 + Math.sin(i / hours * Math.PI * 2) * 5 + Math.random() * 2 - 1).toFixed(1))); break;
        case 'humidity': data = Array.from({ length: hours }, (_, i) => parseFloat((60 - Math.sin(i / hours * Math.PI * 2) * 10 + Math.random() * 5 - 2.5).toFixed(1))); break;
        case 'airQuality': data = Array.from({ length: hours }, () => Math.floor(Math.random() * 100 + 350)); break;
        case 'soilMoisture': data = Array.from({ length: hours }, (_, i) => parseFloat((45 - (i / hours) * 10 + Math.random() * 5).toFixed(1))); break;
        case 'pH': data = Array.from({ length: hours }, () => parseFloat((6.5 + Math.random() * 0.4 - 0.2).toFixed(1))); break;
        case 'lightIntensity': data = Array.from({ length: hours }, (_, i) => parseFloat(Math.max(0, Math.sin(i / hours * Math.PI * 2 - Math.PI / 2) * 800 + 200 + Math.random() * 100 - 50).toFixed(0))); break; // Use toFixed(0) for lux
        case 'uvLight': data = Array.from({ length: hours }, (_, i) => parseFloat(Math.max(0, (Math.sin(i / hours * Math.PI * 2 - Math.PI / 2) * 3 + 1 + Math.random() * 0.5 - 0.25)).toFixed(1))); break;
        default: data = Array.from({ length: hours }, () => Math.random() * 100); // Generic random data for others
    }
    return data;
}

// --- React Component ---
function Dashboard() {
    // --- State Variables ---
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loginError, setLoginError] = useState<string>('');
    const [sensorData, setSensorData] = useState<SensorData>({});
    const [notifications, setNotifications] = useState<string[]>([]);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [settings, setSettings] = useState<Settings>({ unit: 'metric', refreshRate: 5 });
    // Explicitly type chart data state
    const [historicalData, setHistoricalData] = useState<ChartData<'line'>>({ labels: [], datasets: [] });
    const [modalData, setModalData] = useState<ModalData | null>(null);
    const [trendData, setTrendData] = useState<{ [key: string]: ChartData<'line'> }>({});
    const [visibleTrend, setVisibleTrend] = useState<string | null>(null);

    // Use NodeJS.Timeout for interval ID type in Node.js environments (like Next.js)
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // --- Login Logic ---
    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (username === MOCK_CREDENTIALS.username && password === MOCK_CREDENTIALS.password) {
            setIsLoggedIn(true);
            setLoginError('');
            setUsername('');
            setPassword('');
        } else {
            setLoginError("Invalid username or password!");
            setPassword('');
        }
    };

    // --- Data Fetching and Refresh Logic ---
    const updateDashboardData = async () => {
        console.log("Refreshing data...");
        try {
            const currentData = await fetchSensorData();
            setSensorData(currentData);
            // Add a new notification
            const possibleNotifications = [
                "Temperature exceeded 30°C in Zone A.", "Humidity dropped below 40% in Zone B.",
                "Air quality is poor in Zone C. Consider ventilating.", "Soil moisture is critically low in Zone D.",
                "UV light levels are high. Consider shading.", "Energy usage is above normal limits.",
                "Leaf wetness detected in Zone E.", "Vibration detected near sensor in Zone F.",
                "pH level approaching lower threshold in Zone A.", "Light intensity below optimal range in Zone B.",
            ];
            const randomIndex = Math.floor(Math.random() * possibleNotifications.length);
            const timestamp = new Intl.DateTimeFormat('default', { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date());
            const newNotification = `[${timestamp}] ${possibleNotifications[randomIndex]}`;
            setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
        } catch (error) {
            console.error("Error fetching sensor data:", error);
        }
    };

    const updateHistoricalChart = async () => {
        console.log("Fetching historical data...");
        const sensorsToPlot = ['temperature', 'humidity', 'airQuality', 'soilMoisture', 'pH', 'lightIntensity', 'uvLight'];
        const colors = ['#FF5733', '#3357FF', '#33FF57', '#A0522D', '#FF33F3', '#FFD700', '#FFA500'];
        const backgroundColors = colors.map(c => c + '33');

        try {
            const dataPromises = sensorsToPlot.map(key => fetchHistoricalData(key));
            const allData = await Promise.all(dataPromises);

            const datasets = sensorsToPlot.map((key, i) => ({
                label: `${getSensorDisplayName(key)} (${sensorUnits[key] || ''})`,
                data: allData[i],
                borderColor: colors[i % colors.length],
                backgroundColor: backgroundColors[i % backgroundColors.length],
                borderWidth: 1.5,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHitRadius: 10
            }));

            const labels = Array.from({ length: 24 }, (_, i) => {
                const date = new Date();
                date.setHours(date.getHours() - 23 + i);
                return date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit', hour12: false });
            });

            setHistoricalData({ labels, datasets });

        } catch (error) {
            console.error("Error fetching/rendering history chart:", error);
        }
    };

    // --- useEffect Hooks ---
    useEffect(() => {
        if (isLoggedIn) {
            updateDashboardData();
            updateHistoricalChart();

            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }

            console.log(`Starting auto-refresh every ${settings.refreshRate} seconds.`);
            refreshIntervalRef.current = setInterval(updateDashboardData, settings.refreshRate * 1000);

            return () => {
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                    console.log("Auto-refresh stopped.");
                }
            };
        } else {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                console.log("Auto-refresh stopped (logged out).");
            }
        }
    }, [isLoggedIn, settings.refreshRate]);

    // --- Event Handlers ---
    const handleSettingsToggle = () => setShowSettings(!showSettings);

    const handleSettingsSave = () => {
        console.log("Settings saved:", settings);
        setShowSettings(false);
    };

    const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings(prev => ({ ...prev, unit: e.target.value as 'metric' | 'imperial' }));
    };

    const handleRefreshRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRate = parseInt(e.target.value, 10);
        if (!isNaN(newRate) && newRate > 0) {
            setSettings(prev => ({ ...prev, refreshRate: newRate }));
        }
    };

    const handleDescriptionClick = (key: string) => {
        const descData = sensorDescriptions[key];
        if (descData) {
            setModalData({
                key: key,
                title: `${getSensorDisplayName(key)} Details`,
                description: descData.description || "No description available.",
                // Use the image path directly if it's relative to /public
                image: descData.image || ''
            });
        } else {
            alert(`Details for sensor "${getSensorDisplayName(key)}" are not available.`);
        }
    };

    const handleCloseModal = () => setModalData(null);

    const handleTrendClick = async (key: string) => {
        if (visibleTrend === key) {
            setVisibleTrend(null);
        } else {
            setVisibleTrend(key);
            if (!trendData[key]) {
                console.log(`Fetching trend data for ${key}...`);
                try {
                    const data = await fetchHistoricalData(key);
                    const labels = Array.from({ length: data.length }, (_, i) => i + 1);
                    setTrendData(prev => ({
                        ...prev,
                        [key]: {
                            labels: labels,
                            datasets: [{
                                data: data,
                                borderColor: statusColors.normal,
                                backgroundColor: statusColors.normal + '33',
                                borderWidth: 1,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 0
                            }]
                        }
                    }));
                } catch (error) {
                    console.error(`Failed to fetch trend data for ${key}:`, error);
                }
            }
        }
    };

    // --- SVG Color Update Logic ---
    const svgFills: { [key: string]: string } = Object.keys(sensorData).reduce((acc, key) => {
        const status = getStatus(sensorData[key], key);
        acc[key] = statusColors[status] || statusColors.default;
        return acc;
    }, {} as { [key: string]: string }); // Add type assertion for accumulator

    // --- Chart Options (Define once) ---
    const historyChartOptions: ChartOptions<'line'> = {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }, y: { beginAtZero: false, grid: { color: '#eee' } } },
        plugins: { legend: { position: 'top', labels:{ boxWidth: 12, padding: 15 } }, tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(0, 0, 0, 0.7)', titleFont: { weight: 'bold'}, bodySpacing: 4, padding: 10 } },
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 500, easing: 'easeInOutQuad'}
    };

    const trendChartOptions: ChartOptions<'line'> = {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { display: false }, y: { display: false } },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { duration: 300 }
    };


    // --- Render Logic ---
    if (!isLoggedIn) {
        return (
            <div className="overlay">
                <form id="login-form" onSubmit={handleLogin}>
                    <h2>Login</h2>
                    {loginError && <p style={{ color: 'red', marginBottom: '10px' }}>{loginError}</p>}
                    <input
                        type="text"
                        id="username"
                        placeholder="Username"
                        value={username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        id="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Login</button>
                </form>
            </div>
        );
    }

    // Main Dashboard View
    return (
        <> {/* React Fragment */}
            <div id="main-content-wrapper">
                <header>
                    <h1>Greenhouse Monitoring Dashboard</h1>
                    <button id="settings-toggle" title="Open Settings" onClick={handleSettingsToggle}>⚙️ Settings</button>
                </header>

                <main id="main-content" className="dashboard-layout">

                    <div className="main-area">
                        <section id="dashboard">
                            <h2>Sensor Readings</h2>
                            <div id="sensor-cards" className="grid-container">
                                {Object.entries(sensorData).map(([key, value]) => {
                                    const displayName = getSensorDisplayName(key);
                                    const unit = sensorUnits[key] || '';
                                    const numericValue = typeof value === 'string' ? parseFloat(value) : value; // Attempt conversion
                                    const displayValue = typeof numericValue === 'number' && !isNaN(numericValue)
                                        ? `${numericValue.toFixed(1)} ${unit}`.trim() // Format number
                                        : String(value); // Use string value directly (for 'wet', 'dry', etc.)
                                    const showTrendButton = typeof numericValue === 'number' && !isNaN(numericValue);
                                    const status = getStatus(value, key);
                                    const iconUrl = sensorIcons[key] || sensorIcons.default;

                                    return (
                                        <div className="sensor-card" key={key} data-sensor-key={key}>
                                            <img src={iconUrl} alt={`${displayName} icon`} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = sensorIcons.default; (e.target as HTMLImageElement).onerror = null; }} />
                                            <h3>{displayName}</h3>
                                            <p>{displayValue}</p>
                                            <div className={`status-indicator ${status}`} style={{ backgroundColor: statusColors[status] || statusColors.default }}></div>
                                            <div className="card-buttons">
                                                <button className="description-btn" data-sensor={key} title={`Show ${displayName} details`} onClick={() => handleDescriptionClick(key)}>Info</button>
                                                {showTrendButton && (
                                                    <button
                                                        className="trend-btn"
                                                        data-sensor={key}
                                                        title={`Show ${displayName} trend`}
                                                        onClick={() => handleTrendClick(key)}
                                                        disabled={visibleTrend === key && !trendData[key]}
                                                    >
                                                        {visibleTrend === key ? (trendData[key] ? 'Hide' : 'Loading...') : 'Trend'}
                                                    </button>
                                                )}
                                            </div>
                                            {showTrendButton && visibleTrend === key && (
                                                <div className="trend-chart">
                                                    {trendData[key] ? (
                                                         <Line data={trendData[key]} options={trendChartOptions} />
                                                    ) : (
                                                        <p style={{fontSize: '0.8em', color: '#888'}}>Loading trend...</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section id="greenhouse-visualization">
                            <h2>Greenhouse Layout & Status</h2>
                            <svg id="greenhouse-svg" width="100%" height="auto" viewBox="0 0 200 150" style={{ maxWidth: '500px', margin: '0 auto', display: 'block' }}>
                                <rect x="5" y="5" width="190" height="140" fill="#f0f0f0" stroke="#cccccc" strokeWidth="1" rx="5" ry="5"/>
                                {/* Temperature */}
                                <circle id="svg-temp" data-sensor-key="temperature" cx="30" cy="30" r="6" fill={svgFills.temperature || statusColors.default} stroke="#666" strokeWidth="0.5"/>
                                <text id="svg-temp-value" x="40" y="34" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.temperature !== undefined ? `${Number(sensorData.temperature).toFixed(1)}${sensorUnits.temperature}` : '--'}</text>
                                <text x="40" y="28" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">Temp</text>
                                {/* Humidity */}
                                <circle id="svg-humid" data-sensor-key="humidity" cx="30" cy="60" r="6" fill={svgFills.humidity || statusColors.default} stroke="#666" strokeWidth="0.5"/>
                                <text id="svg-humid-value" x="40" y="64" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.humidity !== undefined ? `${Number(sensorData.humidity).toFixed(1)}${sensorUnits.humidity}` : '--'}</text>
                                <text x="40" y="58" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">Humid</text>
                                {/* Air Quality */}
                                <circle id="svg-air" data-sensor-key="airQuality" cx="30" cy="90" r="6" fill={svgFills.airQuality || statusColors.default} stroke="#666" strokeWidth="0.5"/>
                                <text id="svg-air-value" x="40" y="94" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.airQuality !== undefined ? `${Number(sensorData.airQuality).toFixed(0)}${sensorUnits.airQuality}` : '--'}</text>
                                <text x="40" y="88" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">AQ</text>
                                {/* Soil Moisture */}
                                <circle id="svg-soil" data-sensor-key="soilMoisture" cx="80" cy="125" r="6" fill={svgFills.soilMoisture || statusColors.default} stroke="#666" strokeWidth="0.5"/>
                                <text id="svg-soil-value" x="90" y="129" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.soilMoisture !== undefined ? `${Number(sensorData.soilMoisture).toFixed(1)}${sensorUnits.soilMoisture}` : '--'}</text>
                                <text x="90" y="123" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">Soil</text>
                                {/* pH */}
                                <circle id="svg-ph" data-sensor-key="pH" cx="120" cy="125" r="6" fill={svgFills.pH || statusColors.default} stroke="#666" strokeWidth="0.5"/>
                                <text id="svg-ph-value" x="130" y="129" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.pH !== undefined ? `${Number(sensorData.pH).toFixed(1)}${sensorUnits.pH}` : '--'}</text>
                                <text x="130" y="123" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">pH</text>
                                {/* Light Intensity */}
                                <circle id="svg-light" data-sensor-key="lightIntensity" cx="170" cy="30" r="6" fill={svgFills.lightIntensity || statusColors.default} stroke="#666" strokeWidth="0.5"/>
                                <text id="svg-light-value" x="158" y="34" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.lightIntensity !== undefined ? `${Number(sensorData.lightIntensity).toFixed(0)}${sensorUnits.lightIntensity}` : '--'}</text>
                                <text x="158" y="28" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">Light</text>
                                {/* UV Light */}
                                <circle id="svg-uv" data-sensor-key="uvLight" cx="170" cy="60" r="6" fill={svgFills.uvLight || statusColors.default} stroke="#666" strokeWidth="0.5"/>
                                <text id="svg-uv-value" x="158" y="64" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.uvLight !== undefined ? `${Number(sensorData.uvLight).toFixed(1)}${sensorUnits.uvLight}` : '--'}</text>
                                <text x="158" y="58" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">UV</text>
                                {/* Leaf Wetness */}
                                <circle id="svg-leaf" data-sensor-key="leafWetness" cx="170" cy="90" r="6" fill={svgFills.leafWetness || statusColors.default} stroke="#666" strokeWidth="0.5"/>
                                <text id="svg-leaf-value" x="158" y="94" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.leafWetness !== undefined ? String(sensorData.leafWetness) : '--'}</text>
                                <text x="158" y="88" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">Leaf</text>
                            </svg>
                        </section>

                        <section id="historical-data">
                            <h2>Historical Data</h2>
                            <div className="chart-container">
                                {historicalData.datasets.length > 0 ? (
                                    <Line id="history-chart" data={historicalData} options={historyChartOptions} />
                                ) : (
                                    <p>Loading historical data...</p>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="sidebar-area">
                        <aside id="notifications-panel">
                            <h3>Notifications</h3>
                            <ul id="notifications-list">
                                {notifications.length > 0 ? (
                                    notifications.map((note, index) => <li key={index}>{note}</li>)
                                ) : (
                                    <li>No new notifications.</li>
                                )}
                            </ul>
                        </aside>

                        {showSettings && (
                            <aside id="settings-panel">
                                <h3>Settings</h3>
                                <label>
                                    Units:
                                    <select id="unit-selector" value={settings.unit} onChange={handleUnitChange}>
                                        <option value="metric">Metric (°C)</option>
                                        <option value="imperial">Imperial (°F)</option>
                                    </select>
                                </label>
                                <label>
                                    Refresh Rate (seconds):
                                    <select id="refresh-rate" value={settings.refreshRate} onChange={handleRefreshRateChange}>
                                        <option value="5">5</option>
                                        <option value="30">30</option>
                                        <option value="60">60</option>
                                    </select>
                                </label>
                                <button id="save-settings" onClick={handleSettingsSave}>Save</button>
                            </aside>
                        )}
                    </div>
                </main>
            </div>

            {modalData && (
                <div id="description-modal" className="modal">
                    <div className="modal-content">
                        <span className="close" title="Close Modal" onClick={handleCloseModal}>&times;</span>
                        <h3 id="modal-title">{modalData.title}</h3>
                        <p id="modal-description">{modalData.description}</p>
                        {modalData.image && (
                            <img
                                id="modal-image"
                                src={modalData.image} // Assumes image path is relative to /public
                                alt={`${modalData.title} Diagram`}
                                style={{ maxWidth: '100%', marginTop: '10px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/300x200/eeeeee/666666?text=${encodeURIComponent('Image N/A')}`; (e.target as HTMLImageElement).onerror = null; }}
                             />
                        )}
                    </div>
                    {/* Optional: Close modal on overlay click */}
                    {/* <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1}} onClick={handleCloseModal}></div> */}
                </div>
            )}
        </>
    );
}

export default Dashboard;
