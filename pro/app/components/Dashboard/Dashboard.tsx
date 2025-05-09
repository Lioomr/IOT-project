// app/components/Dashboard/Dashboard.tsx
'use client';

// UPDATED: Added FormEvent and ChangeEvent to the import from React
import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import './Dashboard.css'; // Import the CSS file

// Import Chart.js and react-chartjs-2
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
    Filler,
    ChartData,
    ChartOptions
} from 'chart.js';
import { Brain, TrendingUp, AlertCircle } from 'lucide-react'; // Icons

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// --- Interfaces/Types ---
interface SensorReading {
    id: number;
    timestamp: string;
    gas_ppm: number | null;
    moisture_percent: number | null;
    temperature_c: number | null;
    humidity_percent: number | null;
    pressure_hpa: number | null;
    ph_value: number | null;
}

interface AlertData {
    id: number;
    sensor_key: string;
    trigger_value: number | null;
    threshold_type: string;
    threshold_value: number | null;
    message: string;
    timestamp: string;
    is_active: boolean;
    triggering_reading_id: number | null;
}

interface LstmPrediction {
    predicted_value: number;
}

type LatestSensorData = Partial<Omit<SensorReading, 'id' | 'timestamp'>>;

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

const MOCK_CREDENTIALS = { username: "admin", password: "123" };
const sensorUnits: { [key: string]: string } = { temperature_c: "°C", humidity_percent: "%", airQuality: "ppm", soilMoisture: "%", pH: "", lightIntensity: "lux", leafWetness: "", vibration: "", uvLight: "UV Index", energyUsage: "", gas_ppm: "ppm", moisture_percent: "%", pressure_hpa: "hPa", ph_value: "" };
const sensorDisplayNames: { [key: string]: string } = { temperature_c: "Temperature", humidity_percent: "Humidity", airQuality: "Air Quality", soilMoisture: "Soil Moisture", pH: "pH Level", lightIntensity: "Light Intensity", leafWetness: "Leaf Wetness", vibration: "Vibration", uvLight: "UV Light", energyUsage: "Energy Usage", gas_ppm: "Gas Conc.", moisture_percent: "Soil Moisture", pressure_hpa: "Pressure", ph_value: "pH Level" };
const sensorIcons: { [key: string]: string } = { temperature_c: "https://placehold.co/50x50/FF5733/FFFFFF?text=Temp", humidity_percent: "https://placehold.co/50x50/3357FF/FFFFFF?text=Humid", airQuality: "https://placehold.co/50x50/33FF57/000000?text=AQ", soilMoisture: "https://placehold.co/50x50/A0522D/FFFFFF?text=Soil", pH: "https://placehold.co/50x50/FF33F3/FFFFFF?text=pH", lightIntensity: "https://placehold.co/50x50/FFD700/000000?text=Light", leafWetness: "https://placehold.co/50x50/ADD8E6/000000?text=Leaf", vibration: "https://placehold.co/50x50/999999/FFFFFF?text=Vibe", uvLight: "https://placehold.co/50x50/FFA500/FFFFFF?text=UV", energyUsage: "https://placehold.co/50x50/666666/FFFFFF?text=Power", gas_ppm: "https://placehold.co/50x50/888888/FFFFFF?text=Gas", moisture_percent: "https://placehold.co/50x50/A0522D/FFFFFF?text=Soil", pressure_hpa: "https://placehold.co/50x50/7777FF/FFFFFF?text=Pres", ph_value: "https://placehold.co/50x50/FF33F3/FFFFFF?text=pH", default: "https://placehold.co/50x50/eeeeee/000000?text=N/A" };
const sensorDescriptions: { [key: string]: { description: string; image: string } } = { temperature_c: { description: "Measures the ambient air temperature...", image: "/assets/images/temperature-wiring.png" }, humidity_percent: { description: "Measures the amount of water vapor...", image: "https://placehold.co/300x200/3357FF/ffffff?text=Humidity+Sensor" }, gas_ppm: { description: "Detects levels of various gases (e.g., CO2 equivalent)...", image: "https://placehold.co/300x200/888888/ffffff?text=Gas+Sensor+Info" }, moisture_percent: { description: "Measures the volumetric water content in the soil...", image: "https://placehold.co/300x200/A0522D/ffffff?text=Soil+Moisture+Setup" }, ph_value: { description: "Measures the acidity or alkalinity of the soil/water...", image: "https://placehold.co/300x200/FF33F3/ffffff?text=pH+Probe+Wiring" }, pressure_hpa: { description: "Measures the atmospheric pressure...", image: "https://placehold.co/300x200/7777FF/ffffff?text=Pressure+Sensor" }, };
const thresholds: { [key: string]: { min?: number; max?: number; criticalValue?: string; type: 'range' | 'max' | 'min' | 'state' } } = { temperature_c: { min: 18, max: 28, type: 'range' }, humidity_percent: { min: 50, max: 75, type: 'range' }, gas_ppm: { max: 1000, type: 'max' }, moisture_percent: { min: 30, max: 65, type: 'range' }, ph_value: { min: 6.0, max: 7.0, type: 'range' }, };
const statusColors: { [key: string]: string } = { normal: '#4CAF50', warning: '#FFC107', critical: '#F44336', default: '#cccccc' };

function getSensorDisplayName(key: string): string { return sensorDisplayNames[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'); }
function getStatus(value: number | string | undefined | null, sensorKey: string): string { const config = thresholds[sensorKey]; if (value === undefined || value === null || !config) return 'default'; const numericValue = typeof value === 'number' ? value : NaN; let status = 'normal'; if (!isNaN(numericValue)) { if (config.type === 'range') { if (numericValue < (config.min ?? -Infinity) || numericValue > (config.max ?? Infinity)) status = 'critical'; } else if (config.type === 'max') { if (numericValue > (config.max ?? Infinity)) status = 'critical'; } else if (config.type === 'min') { if (numericValue < (config.min ?? -Infinity)) status = 'critical'; } } else { status = 'default'; } return status; }

function Dashboard() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loginError, setLoginError] = useState<string>('');
    const [sensorData, setSensorData] = useState<LatestSensorData>({});
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [settings, setSettings] = useState<Settings>({ unit: 'metric', refreshRate: 10 });
    const [historicalData, setHistoricalData] = useState<ChartData<'line'>>({ labels: [], datasets: [] });
    const [modalData, setModalData] = useState<ModalData | null>(null);
    const [isLoadingLatest, setIsLoadingLatest] = useState<boolean>(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
    const [isLoadingAlerts, setIsLoadingAlerts] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [lstmPrediction, setLstmPrediction] = useState<LstmPrediction | null>(null);
    const [isLoadingLstm, setIsLoadingLstm] = useState<boolean>(true);
    const [lstmError, setLstmError] = useState<string | null>(null);

    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const alertRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lstmRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogin = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); if (username === MOCK_CREDENTIALS.username && password === MOCK_CREDENTIALS.password) { setIsLoggedIn(true); setLoginError(''); setUsername(''); setPassword(''); setFetchError(null); setLstmError(null); } else { setLoginError("Invalid username or password!"); setPassword(''); } };

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

    const fetchLatestData = async () => { setIsLoadingLatest(true); try { const response = await fetch(`${API_BASE_URL}/api/latest/`); if (!response.ok) { if (response.status === 404) { setSensorData({}); } else { throw new Error(`Latest: ${response.status} ${response.statusText}`); } } else { const d: SensorReading = await response.json(); setSensorData({ temperature_c: d.temperature_c, humidity_percent: d.humidity_percent, gas_ppm: d.gas_ppm, moisture_percent: d.moisture_percent, ph_value: d.ph_value, pressure_hpa: d.pressure_hpa }); setFetchError(p => p?.includes('Latest:') ? null : p); } } catch (e) { setFetchError(e instanceof Error ? e.message : 'Err latest'); setSensorData({}); } finally { setIsLoadingLatest(false); } };
    const fetchHistoricalData = async () => { setIsLoadingHistory(true); try { const response = await fetch(`${API_BASE_URL}/api/history/`); if (!response.ok) { throw new Error(`History: ${response.status} ${response.statusText}`); } const h: SensorReading[] = await response.json(); if (!Array.isArray(h) || h.length === 0) { setHistoricalData({ labels: [], datasets: [] }); setIsLoadingHistory(false); return; } const sH = [...h].reverse(); const l = sH.map(r => new Date(r.timestamp).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit', hour12: false })); const sp = [{ k: 'temperature_c', c: '#FF5733', L: 'Temp (°C)' }, { k: 'humidity_percent', c: '#3357FF', L: 'Humid (%)' }, { k: 'gas_ppm', c: '#888888', L: 'Gas (ppm)' }, { k: 'moisture_percent', c: '#A0522D', L: 'Soil Moist (%)' }, { k: 'ph_value', c: '#FF33F3', L: 'pH' }]; const ds = sp.map(s => ({ label: s.L, data: sH.map(r => r[s.k as keyof SensorReading] ?? null), borderColor: s.c, backgroundColor: s.c + '33', borderWidth: 1.5, fill: true, tension: 0.3, pointRadius: 0 })); setHistoricalData({ labels: l, datasets: ds }); setFetchError(p => p?.includes('History:') ? null : p); } catch (e) { setFetchError(e instanceof Error ? e.message : 'Err history'); setHistoricalData({ labels: [], datasets: [] }); } finally { setIsLoadingHistory(false); } };
    const fetchAlerts = async () => { setIsLoadingAlerts(true); try { const response = await fetch(`${API_BASE_URL}/api/alerts/`); if (!response.ok) { throw new Error(`Alerts: ${response.status} ${response.statusText}`); } const aD: AlertData[] = await response.json(); setAlerts(aD); setFetchError(p => p?.includes('Alerts:') ? null : p); } catch (e) { setFetchError(e instanceof Error ? e.message : 'Err alerts'); setAlerts([]); } finally { setIsLoadingAlerts(false); } };
    const fetchLstmPrediction = async () => { console.log("Fetching LSTM prediction..."); setIsLoadingLstm(true); setLstmError(null); try { const response = await fetch(`${API_BASE_URL}/api/ml/lstm-predict/`); if (!response.ok) { const errorData = await response.json().catch(() => ({ error: 'LSTM prediction failed: ' + response.statusText })); throw new Error(errorData.error || `HTTP error ${response.status}`); } const result: LstmPrediction = await response.json(); setLstmPrediction(result); } catch (err) { console.error('LSTM prediction error:', err); setLstmError(err instanceof Error ? err.message : 'An unknown error occurred during LSTM prediction.'); setLstmPrediction(null); } finally { setIsLoadingLstm(false); } };

    useEffect(() => {
        if (isLoggedIn) {
            fetchLatestData(); fetchHistoricalData(); fetchAlerts(); fetchLstmPrediction();
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            if (alertRefreshIntervalRef.current) clearInterval(alertRefreshIntervalRef.current);
            if (lstmRefreshIntervalRef.current) clearInterval(lstmRefreshIntervalRef.current);
            refreshIntervalRef.current = setInterval(fetchLatestData, settings.refreshRate * 1000);
            const alertInterval = 30000; alertRefreshIntervalRef.current = setInterval(fetchAlerts, alertInterval);
            const lstmInterval = 60000 * 5; lstmRefreshIntervalRef.current = setInterval(fetchLstmPrediction, lstmInterval);
            return () => { if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current); if (alertRefreshIntervalRef.current) clearInterval(alertRefreshIntervalRef.current); if (lstmRefreshIntervalRef.current) clearInterval(lstmRefreshIntervalRef.current); console.log("Auto-refresh intervals stopped."); };
        } else {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current); if (alertRefreshIntervalRef.current) clearInterval(alertRefreshIntervalRef.current); if (lstmRefreshIntervalRef.current) clearInterval(lstmRefreshIntervalRef.current); console.log("Auto-refresh intervals stopped (logged out).");
        }
    }, [isLoggedIn, settings.refreshRate]);

    const handleSettingsToggle = () => setShowSettings(!showSettings);
    const handleSettingsSave = () => { console.log("Settings saved:", settings); setShowSettings(false); };
    const handleUnitChange = (e: ChangeEvent<HTMLSelectElement>) => { setSettings(prev => ({ ...prev, unit: e.target.value as 'metric' | 'imperial' })); };
    const handleRefreshRateChange = (e: ChangeEvent<HTMLSelectElement>) => { const newRate = parseInt(e.target.value, 10); if (!isNaN(newRate) && newRate > 0) { setSettings(prev => ({ ...prev, refreshRate: newRate })); } };
    const handleDescriptionClick = (key: string) => { const descData = sensorDescriptions[key]; if (descData) { setModalData({ key: key, title: `${getSensorDisplayName(key)} Details`, description: descData.description || "No description available.", image: descData.image || '' }); } else { alert(`Details for sensor "${getSensorDisplayName(key)}" are not available.`); } };
    const handleCloseModal = () => setModalData(null);

    const svgFills: { [key: string]: string } = Object.keys(sensorData).reduce((acc, key) => { const status = getStatus(sensorData[key as keyof LatestSensorData], key); acc[key] = statusColors[status] || statusColors.default; return acc; }, {} as { [key: string]: string });
    const historyChartOptions: ChartOptions<'line'> = { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }, y: { beginAtZero: false, grid: { color: '#eee' } } }, plugins: { legend: { position: 'top', labels:{ boxWidth: 12, padding: 15 } }, tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(0, 0, 0, 0.7)', titleFont: { weight: 'bold'}, bodySpacing: 4, padding: 10 } }, interaction: { mode: 'index', intersect: false }, animation: { duration: 500, easing: 'easeInOutQuad'} };

    if (!isLoggedIn) { return ( <div className="overlay"> <form id="login-form" onSubmit={handleLogin}> <h2>Login</h2> {loginError && <p style={{ color: 'red', marginBottom: '10px' }}>{loginError}</p>} <input type="text" id="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required /> <input type="password" id="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required /> <button type="submit">Login</button> </form> </div> ); }

    const activeAlertCount = alerts.length;

    return (
        <>
            <div id="main-content-wrapper">
                <header> <h1>Greenhouse Monitoring Dashboard</h1> <button id="settings-toggle" title="Open Settings" onClick={handleSettingsToggle}>⚙️ Settings</button> </header>
                {fetchError && ( <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '8px', margin: '10px 15px' }}> Error fetching sensor/alert data: {fetchError} </div> )}
                {lstmError && ( <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '8px', margin: '10px 15px' }}> Error fetching LSTM prediction: {lstmError} </div> )}
                <main id="main-content" className="dashboard-layout">
                    <div className="main-area">
                        <section id="dashboard"> <h2>Sensor Readings {isLoadingLatest && <span style={{fontSize: '0.8em', color: '#888'}}> (Loading...)</span>}</h2> <div id="sensor-cards" className="grid-container"> {Object.entries(sensorData).map(([key, value]) => { const displayName = getSensorDisplayName(key); const unit = sensorUnits[key] || ''; const displayValue = (value !== null && value !== undefined) ? `${Number(value).toFixed(1)} ${unit}`.trim() : "N/A"; const status = getStatus(value, key); const iconUrl = sensorIcons[key] || sensorIcons.default; return ( <div className="sensor-card" key={key} data-sensor-key={key}> <img src={iconUrl} alt={`${displayName} icon`} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = sensorIcons.default; (e.target as HTMLImageElement).onerror = null; }} /> <h3>{displayName}</h3> <p>{displayValue}</p> <div className={`status-indicator ${status}`} style={{ backgroundColor: statusColors[status] || statusColors.default }}></div> <div className="card-buttons"> <button className="description-btn" data-sensor={key} title={`Show ${displayName} details`} onClick={() => handleDescriptionClick(key)} disabled={!sensorDescriptions[key]}>Info</button> </div> </div> ); })} {Object.keys(sensorData).length === 0 && !isLoadingLatest && ( <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888', padding: '20px' }}>No current sensor data available.</p> )} </div> </section>
                        <section id="lstm-prediction"> <div className="flex items-center mb-4"> <Brain size={28} className="mr-3 text-purple-400" style={{filter: 'drop-shadow(0 0 5px rgba(192, 132, 252, 0.7))'}}/> <h2 className="!mb-0 !border-none !pb-0" style={{color: '#c084fc', textShadow: '0 0 6px rgba(192, 132, 252, 0.7)'}}> Growth Forecast (LSTM) </h2> {isLoadingLstm && <span style={{fontSize: '0.8em', color: '#888', marginLeft: '10px'}}> (Loading...)</span>} </div> {lstmPrediction ? ( <div className="p-4 rounded-lg" style={{backgroundColor: 'rgba(192, 132, 252, 0.1)', borderColor: 'rgba(192, 132, 252, 0.3)', borderStyle:'solid', borderWidth: '1px'}}> <p className="text-lg font-semibold" style={{color: '#e9d5ff'}}> Predicted Days of Planted: <span className="text-2xl ml-2 font-bold" style={{color: '#c084fc'}}> {lstmPrediction.predicted_value.toFixed(1)} days </span> </p> </div> ) : lstmError ? ( <p className="text-red-400">Could not load prediction.</p> ) : ( <p style={{color: '#a0a8b5'}}>No prediction data available yet.</p> )} </section>
                        <section id="greenhouse-visualization"> <h2>Greenhouse Layout & Status</h2> <svg id="greenhouse-svg" width="100%" height="auto" viewBox="0 0 200 150" style={{ maxWidth: '500px', margin: '0 auto', display: 'block' }}> <rect x="5" y="5" width="190" height="140" fill="#f0f0f0" stroke="#cccccc" strokeWidth="1" rx="5" ry="5"/> <circle id="svg-temp" data-sensor-key="temperature_c" cx="30" cy="30" r="6" fill={svgFills.temperature_c || statusColors.default} stroke="#666" strokeWidth="0.5"/> <text id="svg-temp-value" x="40" y="34" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.temperature_c !== undefined && sensorData.temperature_c !== null ? `${Number(sensorData.temperature_c).toFixed(1)}${sensorUnits.temperature_c}` : '--'}</text> <text x="40" y="28" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">Temp</text> <circle id="svg-humid" data-sensor-key="humidity_percent" cx="30" cy="60" r="6" fill={svgFills.humidity_percent || statusColors.default} stroke="#666" strokeWidth="0.5"/> <text id="svg-humid-value" x="40" y="64" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.humidity_percent !== undefined && sensorData.humidity_percent !== null ? `${Number(sensorData.humidity_percent).toFixed(1)}${sensorUnits.humidity_percent}` : '--'}</text> <text x="40" y="58" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">Humid</text> <circle id="svg-gas" data-sensor-key="gas_ppm" cx="30" cy="90" r="6" fill={svgFills.gas_ppm || statusColors.default} stroke="#666" strokeWidth="0.5"/> <text id="svg-gas-value" x="40" y="94" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.gas_ppm !== undefined && sensorData.gas_ppm !== null ? `${Number(sensorData.gas_ppm).toFixed(0)}${sensorUnits.gas_ppm}` : '--'}</text> <text x="40" y="88" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">Gas</text> <circle id="svg-soil" data-sensor-key="moisture_percent" cx="80" cy="125" r="6" fill={svgFills.moisture_percent || statusColors.default} stroke="#666" strokeWidth="0.5"/> <text id="svg-soil-value" x="90" y="129" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.moisture_percent !== undefined && sensorData.moisture_percent !== null ? `${Number(sensorData.moisture_percent).toFixed(1)}${sensorUnits.moisture_percent}` : '--'}</text> <text x="90" y="123" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">Soil</text> <circle id="svg-ph" data-sensor-key="ph_value" cx="120" cy="125" r="6" fill={svgFills.ph_value || statusColors.default} stroke="#666" strokeWidth="0.5"/> <text id="svg-ph-value" x="130" y="129" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.ph_value !== undefined && sensorData.ph_value !== null ? `${Number(sensorData.ph_value).toFixed(1)}${sensorUnits.ph_value}` : '--'}</text> <text x="130" y="123" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">pH</text> <circle id="svg-pressure" data-sensor-key="pressure_hpa" cx="170" cy="30" r="6" fill={svgFills.pressure_hpa || statusColors.default} stroke="#666" strokeWidth="0.5"/> <text id="svg-pressure-value" x="158" y="34" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="6px" fill="#333">{sensorData.pressure_hpa !== undefined && sensorData.pressure_hpa !== null ? `${Number(sensorData.pressure_hpa).toFixed(0)}${sensorUnits.pressure_hpa}` : '--'}</text> <text x="158" y="28" textAnchor="end" fontFamily="Poppins, sans-serif" fontSize="5px" fill="#777">Press</text> </svg> </section>
                        <section id="historical-data"> <h2>Historical Data {isLoadingHistory && <span style={{fontSize: '0.8em', color: '#888'}}> (Loading...)</span>}</h2> <div className="chart-container"> {(historicalData.labels && historicalData.labels.length > 0) ? ( <Line id="history-chart" data={historicalData} options={historyChartOptions} /> ) : ( <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}> {isLoadingHistory ? 'Loading historical data...' : 'No historical data available to display.'} </p> )} </div> </section>
                    </div>
                    <div className="sidebar-area"> <aside id="alerts-panel"> <div className="alerts-header"> <h3>Active Alerts</h3> {activeAlertCount > 0 && ( <span className="alert-count-badge">{activeAlertCount}</span> )} </div> {isLoadingAlerts && <span style={{fontSize: '0.8em', color: '#888', display: 'block', marginBottom: '10px'}}> (Loading...)</span>} <ul id="alerts-list"> {alerts.length > 0 ? ( alerts.map((alert) => ( <li key={alert.id} className="alert-item"> <span className="alert-icon">⚠️</span> <div className="alert-content"> <p className="alert-message">{alert.message}</p> <p className="alert-timestamp">{alert.timestamp}</p> </div> </li> )) ) : ( <li>{isLoadingAlerts ? '' : 'No active alerts.'}</li> )} </ul> </aside> {showSettings && ( <aside id="settings-panel"> <h3>Settings</h3> <label> Units: <select id="unit-selector" value={settings.unit} onChange={handleUnitChange}> <option value="metric">Metric (°C)</option> <option value="imperial">Imperial (°F)</option> </select> </label> <label> Refresh Rate (seconds): <select id="refresh-rate" value={settings.refreshRate} onChange={handleRefreshRateChange}> <option value="5">5</option> <option value="10">10</option> <option value="30">30</option> <option value="60">60</option> </select> </label> <button id="save-settings" onClick={handleSettingsSave}>Save</button> </aside> )} </div>
                </main>
            </div>
            {modalData && ( <div id="description-modal" className="modal"> <div className="modal-content"> <span className="close" title="Close Modal" onClick={handleCloseModal}>&times;</span> <h3 id="modal-title">{modalData.title}</h3> <p id="modal-description">{modalData.description}</p> {modalData.image && ( <img id="modal-image" src={modalData.image} alt={`${modalData.title} Diagram`} style={{ maxWidth: '100%', marginTop: '10px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/300x200/eeeeee/666666?text=${encodeURIComponent('Image N/A')}`; (e.target as HTMLImageElement).onerror = null; }} /> )} </div> </div> )}
        </>
    );
}

export default Dashboard;
