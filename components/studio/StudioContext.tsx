import React, { createContext, useContext, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';

// Compute AOI area in km² (flat-earth approximation)
function aoiKm2(minLon: number, minLat: number, maxLon: number, maxLat: number): number {
    const wKm = (maxLon - minLon) * 111 * Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const hKm = (maxLat - minLat) * 111;
    return wKm * hKm;
}

// Auto-scale resolution based on AOI size to prevent GEE timeout
function autoScale(areaKm2: number): number {
    if (areaKm2 > 100000) return 1000;
    if (areaKm2 > 50000) return 500;
    if (areaKm2 > 10000) return 300;
    if (areaKm2 > 1000) return 150;
    return 100;
}

interface StudioContextType {
    cfg: any;
    setCfg: (cfg: any) => void;
    results: any;
    loading: boolean;
    fromCache: boolean;
    farmerMode: boolean;
    setFarmerMode: (v: boolean) => void;
    handleRun: (overrideCfg?: any) => Promise<void>;
    layerVisibility: any;
    setLayerVisibility: (v: any) => void;
    baseLayer: 'light' | 'dark' | 'satellite' | 'terrain';
    setBaseLayer: (l: 'light' | 'dark' | 'satellite' | 'terrain') => void;
    aoiMode: 'draw' | 'manual';
    setAoiMode: (m: 'draw' | 'manual') => void;
    drawnBounds: [number, number, number, number] | null;
    setDrawnBounds: (b: [number, number, number, number] | null) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
    const [cfg, setCfg] = useState({
        min_lon: 0, max_lon: 0,
        min_lat: 0, max_lat: 0,
        pre_start: '2022-05-01', pre_end: '2022-05-31',
        post_start: '2022-06-01', post_end: '2022-06-30',
        threshold: -2.0, ndvi_thresh: -0.12, cloud_pct: 25,
        sar_conf_base: 0.90, opt_conf_base: 0.80,
        scale: 150, run: true
    });

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [fromCache, setFromCache] = useState(false);
    const [farmerMode, setFarmerMode] = useState(false);
    const [drawnBounds, setDrawnBounds] = useState<[number, number, number, number] | null>(null);

    const [layerVisibility, setLayerVisibility] = useState({
        sarBase: true, flood: true, optWater: true, vegDamage: true, confidence: false
    });

    const [baseLayer, setBaseLayer] = useState<'light' | 'dark' | 'satellite' | 'terrain'>('satellite');
    const [aoiMode, setAoiMode] = useState<'draw' | 'manual'>('draw');

    // ── RBAC Session Init ──
    React.useEffect(() => {
        const role = sessionStorage.getItem('netra_role');
        if (role === 'FARMER') setFarmerMode(true);
    }, []);

    const handleRun = async (overrideCfg?: any) => {
        const currentCfg = overrideCfg || cfg;

        if (!currentCfg.min_lon && !currentCfg.max_lon && !currentCfg.min_lat && !currentCfg.max_lat) {
            toast.error('Please draw an AOI on the map or enter coordinates first.', { id: 'gee' });
            return;
        }

        const area = aoiKm2(currentCfg.min_lon, currentCfg.min_lat, currentCfg.max_lon, currentCfg.max_lat);
        if (area > 200000) {
            toast.error(`AOI too large (${Math.round(area).toLocaleString()} km²). Max ~200,000 km².`, { id: 'gee' });
            return;
        }

        const smartScale = autoScale(area);
        if (smartScale > currentCfg.scale) {
            currentCfg.scale = smartScale;
            setCfg({ ...currentCfg });
            toast(`Resolution auto-adjusted to ${smartScale}m`, { id: 'scale-info', icon: '📐' });
        }

        setLoading(true);
        setFromCache(false);
        toast.loading('Dispatching to Earth Engine…', { id: 'gee' });

        try {
            // ── Step 1: Submit job (non-blocking, returns job_id) ──────
            const submitRes = await fetch('/api/studio/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentCfg),
            });
            const submit = await submitRes.json();

            // ── Cache HIT: result returned immediately ─────────────────
            if (submit.fromCache) {
                setResults(submit);
                setFromCache(true);
                toast.success('✅ Served from 24h ARD Cache — instant results!', { id: 'gee' });
                setLoading(false);
                return;
            }

            const jobId = submit.job_id;
            if (!jobId) throw new Error(submit.error || 'No job_id returned');

            toast.loading('Pipeline running… polling for results', { id: 'gee' });

            // ── Step 2: Poll every 3s until done ──────────────────────
            let attempts = 0;
            const maxAttempts = 60; // 3 min max
            while (attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 3000));
                attempts++;

                const pollRes  = await fetch(`/api/studio/job/${jobId}`);
                const pollData = await pollRes.json();

                if (pollData.status === 'done') {
                    setResults(pollData.result);
                    setFromCache(false);
                    toast.success('Analysis Synchronized Successfully', { id: 'gee' });
                    break;
                }
                if (pollData.status === 'error') {
                    toast.error(`Pipeline Error: ${pollData.error}`, { id: 'gee' });
                    break;
                }
            }
            if (attempts >= maxAttempts) {
                toast.error('Pipeline timed out. Draw a smaller AOI or increase resolution.', { id: 'gee' });
            }
        } catch (e: any) {
            toast.error(`Operational Error: ${e.message || 'Unknown'}`, { id: 'gee' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <StudioContext.Provider value={{
            cfg, setCfg, results, loading, fromCache, farmerMode, setFarmerMode, handleRun,
            layerVisibility, setLayerVisibility,
            baseLayer, setBaseLayer,
            aoiMode, setAoiMode,
            drawnBounds, setDrawnBounds
        }}>
            {children}
        </StudioContext.Provider>
    );
}

export function useStudio() {
    const context = useContext(StudioContext);
    if (!context) throw new Error('useStudio must be used within a StudioProvider');
    return context;
}
