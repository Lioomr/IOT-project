// app/ml-lab/page.tsx
'use client';

// UPDATED: Added useEffect to the import
import React, { useState, ChangeEvent, FormEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { UploadCloud, AlertTriangle, CheckCircle, Zap, Leaf, ScanSearch, Target } from 'lucide-react';

// --- Define types for prediction results ---
interface DiseasePrediction {
    class_name: string;
    confidence: number;
}

interface YoloDetection {
    box: [number, number, number, number]; // [x1, y1, x2, y2]
    class_name: string;
    confidence: number;
}

// interface LstmPrediction { // We'll add this later
//     predicted_value: number;
// }

const MlLabPage: React.FC = () => {
    // --- State for Disease Detection (DenseNet) ---
    const [diseaseFile, setDiseaseFile] = useState<File | null>(null);
    const [diseasePreview, setDiseasePreview] = useState<string | null>(null);
    const [diseasePrediction, setDiseasePrediction] = useState<DiseasePrediction | null>(null);
    const [isPredictingDisease, setIsPredictingDisease] = useState<boolean>(false);
    const [diseaseError, setDiseaseError] = useState<string | null>(null);

    // --- State for Object Detection (YOLO) ---
    const [yoloFile, setYoloFile] = useState<File | null>(null);
    const [yoloPreview, setYoloPreview] = useState<string | null>(null);
    const [yoloDetections, setYoloDetections] = useState<YoloDetection[] | null>(null);
    const [isDetectingObjects, setIsDetectingObjects] = useState<boolean>(false);
    const [yoloError, setYoloError] = useState<string | null>(null);
    const yoloImageRef = useRef<HTMLImageElement>(null);
    const yoloCanvasRef = useRef<HTMLCanvasElement>(null);

    // --- State for LSTM Prediction - Placeholder for now ---
    // const [lstmPrediction, setLstmPrediction] = useState<LstmPrediction | null>(null);
    // ...

    const handleFileChange = (
        event: ChangeEvent<HTMLInputElement>,
        setFile: React.Dispatch<React.SetStateAction<File | null>>,
        setPreview: React.Dispatch<React.SetStateAction<string | null>>,
        clearPreviousResults?: () => void
    ) => {
        const file = event.target.files?.[0];
        if (clearPreviousResults) clearPreviousResults();

        if (file) {
            setFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setFile(null);
            setPreview(null);
        }
    };

    const handleDiseasePredict = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!diseaseFile) {
            setDiseaseError('Please select an image file first.');
            return;
        }
        setIsPredictingDisease(true);
        setDiseaseError(null);
        setDiseasePrediction(null);
        const formData = new FormData();
        formData.append('image', diseaseFile);
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
        try {
            const response = await fetch(`${apiUrl}/api/ml/disease-detect/`, { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Prediction failed: ' + response.statusText }));
                throw new Error(errorData.error || `HTTP error ${response.status}`);
            }
            const result: DiseasePrediction = await response.json();
            setDiseasePrediction(result);
        } catch (err) {
            console.error('Disease prediction error:', err);
            setDiseaseError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsPredictingDisease(false);
        }
    };

    const handleYoloPredict = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!yoloFile) {
            setYoloError('Please select an image file first.');
            return;
        }
        setIsDetectingObjects(true);
        setYoloError(null);
        setYoloDetections(null);
        if (yoloCanvasRef.current) {
            const ctx = yoloCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, yoloCanvasRef.current.width, yoloCanvasRef.current.height);
            }
        }
        const formData = new FormData();
        formData.append('image', yoloFile);
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
        try {
            const response = await fetch(`${apiUrl}/api/ml/yolo-predict/`, { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Object detection failed: ' + response.statusText }));
                throw new Error(errorData.error || `HTTP error ${response.status}`);
            }
            const result: { detections: YoloDetection[] } = await response.json();
            setYoloDetections(result.detections);
            drawYoloBoxes(result.detections);
        } catch (err) {
            console.error('YOLO prediction error:', err);
            setYoloError(err instanceof Error ? err.message : 'An unknown error occurred during object detection.');
        } finally {
            setIsDetectingObjects(false);
        }
    };

    const drawYoloBoxes = (detections: YoloDetection[] | null) => {
        const canvas = yoloCanvasRef.current;
        const imgElement = yoloImageRef.current;
        const ctx = canvas?.getContext('2d');
        const accentTeal = '#00adef'; // Defined here for use in this function

        if (ctx && canvas && imgElement && yoloPreview) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const originalImage = new window.Image();
            originalImage.onload = () => {
                const displayWidth = imgElement.clientWidth;
                const displayHeight = imgElement.clientHeight;
                canvas.width = displayWidth;
                canvas.height = displayHeight;
                ctx.drawImage(originalImage, 0, 0, displayWidth, displayHeight);

                if (detections && detections.length > 0) {
                    const scaleX = displayWidth / originalImage.naturalWidth;
                    const scaleY = displayHeight / originalImage.naturalHeight;
                    detections.forEach(det => {
                        const [x1, y1, x2, y2] = det.box;
                        const scaledX1 = x1 * scaleX;
                        const scaledY1 = y1 * scaleY;
                        const scaledWidth = (x2 - x1) * scaleX;
                        const scaledHeight = (y2 - y1) * scaleY;
                        ctx.strokeStyle = accentTeal;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(scaledX1, scaledY1, scaledWidth, scaledHeight);
                        ctx.fillStyle = accentTeal;
                        ctx.font = '14px Poppins';
                        const text = `${det.class_name} (${(det.confidence * 100).toFixed(1)}%)`;
                        ctx.fillText(text, scaledX1, scaledY1 > 20 ? scaledY1 - 5 : scaledY1 + 15);
                    });
                }
            };
            originalImage.src = yoloPreview;
        }
    };

    useEffect(() => {
        if (yoloPreview && yoloDetections) {
            drawYoloBoxes(yoloDetections);
        } else if (yoloCanvasRef.current && yoloImageRef.current && yoloPreview) {
            const canvas = yoloCanvasRef.current;
            const imgElement = yoloImageRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const originalImage = new window.Image();
                originalImage.onload = () => {
                    const displayWidth = imgElement.clientWidth;
                    const displayHeight = imgElement.clientHeight;
                    canvas.width = displayWidth;
                    canvas.height = displayHeight;
                    ctx.drawImage(originalImage, 0, 0, displayWidth, displayHeight);
                };
                originalImage.src = yoloPreview;
            }
        } else if (yoloCanvasRef.current) {
             const ctx = yoloCanvasRef.current.getContext('2d');
             if (ctx) ctx.clearRect(0, 0, yoloCanvasRef.current.width, yoloCanvasRef.current.height);
        }
    }, [yoloPreview, yoloDetections]); // Dependency array includes yoloDetections

    // --- Styles ---
    const primaryBg = '#1a1f29'; const cardBg = 'rgba(40, 48, 61, 0.8)';
    const borderColor = 'rgba(0, 173, 239, 0.2)'; const accentTeal = '#00adef';
    const accentGreen = '#00ffae'; const softWhite = '#f5f5f5';
    const textSecondary = '#a0a8b5'; const glowColorTeal = 'rgba(0, 173, 239, 0.7)';
    const glowColorGreen = 'rgba(0, 255, 174, 0.7)';

    return (
        <div style={{ backgroundColor: primaryBg, color: softWhite, fontFamily: "'Inter', sans-serif" }} className="min-h-screen p-4 sm:p-8">
            <header className="mb-12 text-center">
                <h1 style={{ fontFamily: "'Poppins', sans-serif", color: accentGreen, textShadow: `0 0 8px ${glowColorGreen}` }} className="text-4xl sm:text-5xl font-bold">
                    ML Analysis Lab
                </h1>
                <p style={{ color: textSecondary }} className="text-lg mt-2">
                    Upload images for plant disease detection and object analysis.
                </p>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section 1: Disease Detection (DenseNet) */}
                <section style={{ backgroundColor: cardBg, borderColor: borderColor }} className="p-6 rounded-xl shadow-2xl border transition-all duration-300 hover:shadow-teal-500/30">
                    <div className="flex items-center mb-6">
                        <Leaf size={32} style={{ color: accentGreen, textShadow: `0 0 6px ${glowColorGreen}` }} className="mr-3" />
                        <h2 style={{ fontFamily: "'Poppins', sans-serif", color: accentGreen, textShadow: `0 0 6px ${glowColorGreen}` }} className="text-2xl sm:text-3xl font-semibold">
                            Plant Disease Detection
                        </h2>
                    </div>
                    <form onSubmit={handleDiseasePredict}>
                        <div className="mb-6">
                            <label htmlFor="diseaseFile" style={{ borderColor: borderColor, backgroundColor: 'rgba(26, 31, 41, 0.7)' }} className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-opacity-60 transition-colors">
                                {diseasePreview ? ( <img src={diseasePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" /> ) : ( <div className="flex flex-col items-center justify-center pt-5 pb-6"> <UploadCloud size={48} style={{ color: textSecondary }} className="mb-3" /> <p style={{ color: textSecondary }} className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p> <p style={{ color: textSecondary }} className="text-xs">PNG, JPG, GIF, WEBP (MAX. 5MB)</p> </div> )}
                                <input id="diseaseFile" type="file" className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" onChange={(e) => handleFileChange(e, setDiseaseFile, setDiseasePreview, () => {setDiseasePrediction(null); setDiseaseError(null);})}/>
                            </label>
                        </div>
                        <button type="submit" disabled={!diseaseFile || isPredictingDisease} style={{ background: `linear-gradient(90deg, ${accentTeal} 0%, ${accentGreen} 100%)`, color: primaryBg }} className="w-full flex items-center justify-center text-lg font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isPredictingDisease ? ( <><Zap size={20} className="animate-ping mr-2" /> Analyzing...</> ) : ( <><ScanSearch size={20} className="mr-2" /> Predict Disease</> )}
                        </button>
                    </form>
                    {diseaseError && ( <div style={{ backgroundColor: 'rgba(244, 67, 54, 0.2)', borderColor: 'rgba(244, 67, 54, 0.5)', color: '#f8d7da' }} className="mt-6 p-4 rounded-lg border flex items-center"> <AlertTriangle size={24} className="mr-3 text-red-400" /> <p>{diseaseError}</p> </div> )}
                    {diseasePrediction && ( <div style={{ backgroundColor: 'rgba(0, 255, 174, 0.1)', borderColor: 'rgba(0, 255, 174, 0.3)', color: softWhite }} className="mt-6 p-4 rounded-lg border"> <h3 style={{ fontFamily: "'Poppins', sans-serif", color: accentGreen }} className="text-xl font-semibold mb-2 flex items-center"> <CheckCircle size={24} className="mr-2 text-green-400" /> Prediction Result: </h3> <p className="text-lg"> <span style={{ color: textSecondary }}>Detected:</span> {diseasePrediction.class_name} </p> <p className="text-lg"> <span style={{ color: textSecondary }}>Confidence:</span> {diseasePrediction.confidence}% </p> </div> )}
                </section>

                {/* Section 2: Object Detection (YOLO) - UPDATED */}
                <section style={{ backgroundColor: cardBg, borderColor: borderColor }} className="p-6 rounded-xl shadow-2xl border transition-all duration-300 hover:shadow-teal-500/30">
                    <div className="flex items-center mb-6">
                        <Target size={32} style={{ color: accentTeal, textShadow: `0 0 6px ${glowColorTeal}` }} className="mr-3" />
                        <h2 style={{ fontFamily: "'Poppins', sans-serif", color: accentTeal, textShadow: `0 0 6px ${glowColorTeal}` }} className="text-2xl sm:text-3xl font-semibold">
                            Object Detection
                        </h2>
                    </div>
                    <form onSubmit={handleYoloPredict}>
                        <div className="mb-6">
                            <label htmlFor="yoloFile" style={{ borderColor: borderColor, backgroundColor: 'rgba(26, 31, 41, 0.7)' }} className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-opacity-60 transition-colors">
                                {yoloPreview ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <img ref={yoloImageRef} src={yoloPreview} alt="YOLO Preview" className="max-h-full max-w-full object-contain rounded-md" />
                                        <canvas ref={yoloCanvasRef} className="absolute top-0 left-0 pointer-events-none" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud size={48} style={{ color: textSecondary }} className="mb-3" />
                                        <p style={{ color: textSecondary }} className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p style={{ color: textSecondary }} className="text-xs">PNG, JPG, GIF, WEBP (MAX. 5MB)</p>
                                    </div>
                                )}
                                <input id="yoloFile" type="file" className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" onChange={(e) => handleFileChange(e, setYoloFile, setYoloPreview, () => {setYoloDetections(null); setYoloError(null);})}/>
                            </label>
                        </div>
                        <button type="submit" disabled={!yoloFile || isDetectingObjects} style={{ background: `linear-gradient(90deg, ${accentTeal} 0%, ${accentGreen} 100%)`, color: primaryBg }} className="w-full flex items-center justify-center text-lg font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isDetectingObjects ? ( <><Zap size={20} className="animate-ping mr-2" /> Detecting Objects...</> ) : ( <><Target size={20} className="mr-2" /> Detect Objects</> )}
                        </button>
                    </form>

                    {yoloError && ( <div style={{ backgroundColor: 'rgba(244, 67, 54, 0.2)', borderColor: 'rgba(244, 67, 54, 0.5)', color: '#f8d7da' }} className="mt-6 p-4 rounded-lg border flex items-center"> <AlertTriangle size={24} className="mr-3 text-red-400" /> <p>{yoloError}</p> </div> )}

                    {yoloDetections && yoloDetections.length > 0 && (
                        <div style={{ backgroundColor: 'rgba(0, 173, 239, 0.1)', borderColor: 'rgba(0, 173, 239, 0.3)', color: softWhite }} className="mt-6 p-4 rounded-lg border max-h-60 overflow-y-auto">
                            <h3 style={{ fontFamily: "'Poppins', sans-serif", color: accentTeal }} className="text-xl font-semibold mb-2 flex items-center">
                                <CheckCircle size={24} className="mr-2 text-teal-400" /> Detection Results:
                            </h3>
                            <ul className="list-disc list-inside space-y-1">
                                {yoloDetections.map((det, index) => (
                                    <li key={index} className="text-sm">
                                        <span className="font-semibold">{det.class_name}</span> ({(det.confidence * 100).toFixed(1)}%)
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                     {yoloDetections && yoloDetections.length === 0 && !isDetectingObjects && (
                        <p style={{ color: textSecondary }} className="mt-4 text-center">No objects detected with current confidence threshold.</p>
                    )}
                </section>
            </main>
        </div>
    );
};

export default MlLabPage;
