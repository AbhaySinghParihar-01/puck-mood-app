'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

const EMOTION_CONFIG = {
  happy:   { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   label: '😄 Happy',   glow: 'glow-happy',   meter: 90 },
  excited: { color: '#84cc16', bg: 'rgba(132,204,22,0.15)',  label: '🤩 Excited', glow: 'glow-excited', meter: 80 },
  neutral: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  label: '😐 Neutral', glow: 'glow-neutral', meter: 50 },
  sad:     { color: '#eab308', bg: 'rgba(234,179,8,0.15)',   label: '😢 Sad',     glow: 'glow-sad',     meter: 30 },
  angry:   { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   label: '😠 Angry',   glow: 'glow-angry',   meter: 20 },
  stressed:{ color: '#f97316', bg: 'rgba(249,115,22,0.15)',  label: '😰 Stressed',glow: 'glow-stressed', meter: 15 },
};

const SUGGESTION_ICONS = { joke: '😄', quote: '✨', fact: '🧠' };
const SUGGESTION_LABELS = { joke: 'Cheer Up — Here\'s a Joke!', quote: 'Motivational Quote for You', fact: 'Cool Fact to Brighten Your Day' };

export default function PuckApp() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const autoRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setAutoMode(false);
    setResult(null);
    setCapturedImage(null);
    setHistory([]);
  };

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const analyzeEmotion = useCallback(async () => {
    if (analysing || !cameraActive) return;
    setAnalysing(true);
    setScanning(true);
    setError('');

    const imageData = captureFrame();
    if (!imageData) {
      setAnalysing(false);
      setScanning(false);
      return;
    }
    setCapturedImage(imageData);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setResult(data);
      if (data.emotion) {
        setHistory(prev => [
          { emotion: data.emotion, time: new Date().toLocaleTimeString(), confidence: data.confidence },
          ...prev.slice(0, 4),
        ]);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setAnalysing(false);
      setScanning(false);
    }
  }, [analysing, cameraActive, captureFrame]);

  useEffect(() => {
    if (autoMode && cameraActive) {
      analyzeEmotion();
      autoRef.current = setInterval(analyzeEmotion, 8000);
    } else {
      clearInterval(autoRef.current);
    }
    return () => clearInterval(autoRef.current);
  }, [autoMode, cameraActive]);

  const cfg = result?.emotion ? EMOTION_CONFIG[result.emotion] || EMOTION_CONFIG.neutral : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Ambient background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: `${20 + i * 10}px`,
              height: `${20 + i * 10}px`,
              background: `rgba(139,92,246,${0.05 + i * 0.02})`,
              left: `${10 + i * 15}%`,
              top: `${20 + i * 12}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-lg font-bold shadow-lg">
              P
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">PUCK</h1>
              <p className="text-xs text-white/40">Analyse Your Mood</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            AI-Powered Emotion Detection
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT — Camera Panel */}
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold mb-1">Emotion Scanner</h2>
              <p className="text-white/40 text-sm">Point your face at the camera and let AI analyse your mood in real time.</p>
            </div>

            {/* Camera Box */}
            <div
              className={`relative rounded-2xl overflow-hidden border transition-all duration-700 ${
                cameraActive
                  ? `border-violet-500/40 ${cfg ? cfg.glow : ''}`
                  : 'border-white/10'
              }`}
              style={{ aspectRatio: '4/3', background: '#0d0d1a' }}
            >
              {/* Video */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                style={{ display: cameraActive ? 'block' : 'none', transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Placeholder when no camera */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-4xl">
                    📷
                  </div>
                  <p className="text-white/30 text-sm">Camera not active</p>
                </div>
              )}

              {/* Scanning overlay */}
              {scanning && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-violet-500/5" />
                  <div
                    className="scanning-line absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent"
                    style={{ top: '0%' }}
                  />
                  {/* Corner brackets */}
                  {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-8 h-8 border-violet-400 border-opacity-80`}
                      style={{
                        borderTop: i < 2 ? '2px solid' : 'none',
                        borderBottom: i >= 2 ? '2px solid' : 'none',
                        borderLeft: i % 2 === 0 ? '2px solid' : 'none',
                        borderRight: i % 2 === 1 ? '2px solid' : 'none',
                        borderColor: '#a78bfa',
                      }}
                    />
                  ))}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <span className="text-violet-300 text-xs font-mono bg-black/40 px-3 py-1 rounded-full">
                      ANALYSING...
                    </span>
                  </div>
                </div>
              )}

              {/* Auto mode badge */}
              {autoMode && cameraActive && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Auto Mode
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-200 shadow-lg shadow-violet-500/20 active:scale-95"
                >
                  📷 Start Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={analyzeEmotion}
                    disabled={analysing}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-500/20 active:scale-95"
                  >
                    {analysing ? '⏳ Analysing...' : '🔍 Analyse Now'}
                  </button>
                  <button
                    onClick={() => setAutoMode(!autoMode)}
                    className={`px-4 py-3 rounded-xl font-semibold text-sm border transition-all duration-200 active:scale-95 ${
                      autoMode
                        ? 'bg-green-500/20 border-green-500/40 text-green-300'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {autoMode ? '⏹ Stop Auto' : '▶ Auto'}
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-3 rounded-xl font-semibold text-sm bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-200 active:scale-95"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="rounded-2xl bg-white/3 border border-white/5 p-4">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Recent Detections</p>
                <div className="space-y-2">
                  {history.map((h, i) => {
                    const hcfg = EMOTION_CONFIG[h.emotion];
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: hcfg?.color }} />
                          <span className="text-white/70">{hcfg?.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white/30 text-xs">{h.confidence}%</span>
                          <span className="text-white/20 text-xs font-mono">{h.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Results Panel */}
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold mb-1">Mood Analysis</h2>
              <p className="text-white/40 text-sm">Your emotional state and AI-generated insights.</p>
            </div>

            {/* Result Card */}
            {!result && !analysing && (
              <div className="rounded-2xl border border-white/5 bg-white/3 p-8 flex flex-col items-center justify-center gap-4 text-center" style={{ minHeight: '200px' }}>
                <div className="text-5xl">🎭</div>
                <div>
                  <p className="font-semibold text-white/60">No analysis yet</p>
                  <p className="text-sm text-white/30 mt-1">Start camera and click Analyse Now</p>
                </div>
              </div>
            )}

            {analysing && !result && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8 flex flex-col items-center justify-center gap-4" style={{ minHeight: '200px' }}>
                <div className="spinner" />
                <p className="text-violet-300 text-sm">Processing facial features...</p>
              </div>
            )}

            {result && cfg && (
              <div className="emotion-card space-y-4">
                {/* Main emotion display */}
                <div
                  className={`rounded-2xl border p-6 transition-all duration-700 ${cfg.glow}`}
                  style={{ background: cfg.bg, borderColor: cfg.color + '40' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Detected Emotion</p>
                      <p className="text-3xl font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Confidence</p>
                      <p className="text-3xl font-bold" style={{ color: cfg.color }}>{result.confidence}%</p>
                    </div>
                  </div>

                  {result.description && (
                    <p className="text-sm text-white/60 italic border-t border-white/5 pt-3">
                      "{result.description}"
                    </p>
                  )}
                </div>

                {/* Mood Meter */}
                <div className="rounded-2xl bg-white/3 border border-white/5 p-5">
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-4">Mood Meter</p>
                  
                  {/* All emotions bar */}
                  <div className="space-y-3">
                    {Object.entries(EMOTION_CONFIG).map(([key, ecfg]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-white/40 w-14 text-right capitalize">{key}</span>
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="meter-bar h-full rounded-full"
                            style={{
                              width: result.emotion === key ? `${result.confidence}%` : '0%',
                              background: ecfg.color,
                              boxShadow: result.emotion === key ? `0 0 8px ${ecfg.color}` : 'none',
                            }}
                          />
                        </div>
                        <span className="text-xs text-white/30 w-8">
                          {result.emotion === key ? `${result.confidence}%` : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Color legend */}
                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
                    {Object.entries(EMOTION_CONFIG).map(([key, ecfg]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: ecfg.color, opacity: result.emotion === key ? 1 : 0.3 }}
                        />
                        <span
                          className="text-xs capitalize"
                          style={{
                            color: result.emotion === key ? ecfg.color : 'rgba(255,255,255,0.25)',
                            fontWeight: result.emotion === key ? 600 : 400,
                          }}
                        >
                          {key}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Face detected warning */}
                {result.face_detected === false && (
                  <div className="rounded-xl p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
                    😕 No face clearly detected. Please ensure good lighting and face the camera directly.
                  </div>
                )}
              </div>
            )}

            {/* Suggestion Card — shown when stressed/sad/angry */}
            {result?.suggestion && (
              <div className="emotion-card rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{SUGGESTION_ICONS[result.suggestion.type]}</span>
                  <p className="font-semibold text-orange-200 text-sm">
                    {SUGGESTION_LABELS[result.suggestion.type]}
                  </p>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  {result.suggestion.content}
                </p>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-white/30">
                    💡 We noticed you might be feeling down. Hang in there — it gets better!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-white/20 text-xs">
            PUCK – Analyse Your Mood &nbsp;•&nbsp; Software Engineering Project &nbsp;•&nbsp; 
            Abhay Singh Parihar, 24BECCS01 &nbsp;•&nbsp; CSE (Cyber Security), Semester 4
          </p>
          <p className="text-white/15 text-xs mt-1">
            Central University of Jammu &nbsp;•&nbsp; BECCS2C025
          </p>
        </div>
      </main>
    </div>
  );
}
