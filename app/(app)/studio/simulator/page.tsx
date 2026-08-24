'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, Zap, ShieldCheck, Cpu } from 'lucide-react';

const GRID_SIZE = 8;
const REQUIRED_PASSES = 12; // Example threshold

export default function SimulatorPage() {
    // 8x8 Grid of Farm Cells
    // 0 = Healthy (Green), 1 = Sick (Red/Yellow)
    const [grid, setGrid] = useState<number[][]>([]);
    const [simulating, setSimulating] = useState(false);
    const [fertilizerDropped, setFertilizerDropped] = useState(0);
    const [yieldSaved, setYieldSaved] = useState(0);

    // Drone state
    const [dronePos, setDronePos] = useState({ x: -1, y: 0 }); // Off grid initially
    const [activeSpray, setActiveSpray] = useState(false);

    // Initialize random sickly map
    useEffect(() => {
        const initial = Array(GRID_SIZE).fill(0).map(() =>
            Array(GRID_SIZE).fill(0).map(() => (Math.random() > 0.6 ? 1 : 0))
        );
        setGrid(initial);
    }, []);

    // Drone flight logic (Boustrophedon / Zig-Zag)
    const runSimulation = () => {
        if (simulating) return;
        setSimulating(true);
        setFertilizerDropped(0);
        setYieldSaved(0);
        
        let cx = 0;
        let cy = 0;
        let direction = 1; // 1 = right, -1 = left

        const step = () => {
            setDronePos({ x: cx, y: cy });

            // Detect if cell is sick
            setGrid(prev => {
                const updated = [...prev];
                const row = [...updated[cy]];
                
                if (row[cx] === 1) { // Sick!
                    setActiveSpray(true);
                    row[cx] = 2; // Mark as "Healed" (Bright Green)
                    updated[cy] = row;
                    
                    setTimeout(() => setActiveSpray(false), 300);
                    setFertilizerDropped(p => p + 5); 
                    setYieldSaved(p => p + 1.2);
                }
                return updated;
            });

            // Move logic
            cx += direction;

            if (cx >= GRID_SIZE || cx < 0) {
                // Drop down a row
                cy += 1;
                direction *= -1; // reverse
                if (direction === 1) cx = 0;
                else cx = GRID_SIZE - 1;
            }

            if (cy < GRID_SIZE) {
                setTimeout(step, 400); // 400ms per tile
            } else {
                setSimulating(false);
                setDronePos({ x: -1, y: -1 }); // Fly away
            }
        };

        step();
    };

    return (
        <div style={{ height: 'calc(100vh - 64px)', background: '#0F172A', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* ── Header ── */}
            <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', background: '#0B1120' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Plane color="#4ADE80" size={24} />
                        <h1 style={{ color: 'white', margin: 0, fontSize: 20, fontWeight: 800 }}>PELICAN Hardware Simulation</h1>
                    </div>
                    <p style={{ color: '#94A3B8', margin: '4px 0 0', fontSize: 13, fontWeight: 500 }}>Autonomous 3D Drone Hardware & Precision Fertilizer Application</p>
                </div>
                
                <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ color: '#94A3B8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Fertilizer Dispersed</div>
                        <div style={{ color: '#38BDF8', fontSize: 24, fontWeight: 900 }}>{fertilizerDropped} kg</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ color: '#94A3B8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Yield Saved</div>
                        <div style={{ color: '#4ADE80', fontSize: 24, fontWeight: 900 }}>+{yieldSaved.toFixed(1)} T</div>
                    </div>
                    
                    <button 
                        onClick={runSimulation}
                        disabled={simulating}
                        style={{
                            background: simulating ? '#1E293B' : 'linear-gradient(135deg, #0D7377, #14B8A6)',
                            border: 'none', borderRadius: 12, padding: '0 24px',
                            color: 'white', fontWeight: 800, fontSize: 14, cursor: simulating ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 10,
                            boxShadow: simulating ? 'none' : '0 4px 16px rgba(20, 184, 166, 0.4)',
                            transition: 'all 0.2s',
                        }}
                    >
                        {simulating ? <Cpu size={18} className="animate-pulse" /> : <Zap size={18} />}
                        {simulating ? 'Simulating Flight...' : 'Launch Drone Drone'}
                    </button>
                </div>
            </div>

            {/* ── 3D Isometric Viewport ── */}
            <div style={{ 
                flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center',
                perspective: 1200 // The secret to CSS 3D
            }}>
                
                {/* Scene container rotated isometrically */}
                <motion.div 
                    initial={{ rotateX: 60, rotateZ: 45, scale: 0.8 }}
                    animate={{ rotateX: 60, rotateZ: 45, scale: 1 }}
                    transition={{ duration: 1, type: 'spring' }}
                    style={{
                        position: 'relative',
                        width: GRID_SIZE * 60, height: GRID_SIZE * 60,
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* The Grid */}
                    {grid.map((row, y) => (
                        <div key={y} style={{ display: 'flex' }}>
                            {row.map((cellState, x) => (
                                <div key={'{x}-{y}'} style={{
                                    width: 60, height: 60,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    background: cellState === 1 ? 'rgba(239, 68, 68, 0.8)' // Sick Red
                                             : cellState === 2 ? 'rgba(34, 197, 94, 0.9)' // Healed Green
                                             : 'rgba(21, 128, 61, 0.4)', // Base Healthy
                                    transform: `translateZ(${cellState === 1 ? 5 : cellState === 2 ? 8 : 0}px)`,
                                    transition: 'all 0.4s ease',
                                    boxShadow: cellState === 2 ? '0 0 20px rgba(34, 197, 94, 0.6)' : 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {cellState === 1 && <div style={{width: 8, height: 8, background: '#FCA5A5', borderRadius: '50%'}} />}
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* The Drone */}
                    {dronePos.x >= 0 && dronePos.y >= 0 && (
                        <motion.div 
                            animate={{ 
                                x: dronePos.x * 60, 
                                y: dronePos.y * 60, 
                                z: 40 // Float above the grid!
                            }}
                            transition={{ duration: 0.38, ease: "linear" }}
                            style={{
                                position: 'absolute', top: 0, left: 0,
                                width: 60, height: 60,
                                pointerEvents: 'none',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                transformStyle: 'preserve-3d',
                            }}
                        >
                            {/* Drone Shadow */}
                            <div style={{ position: 'absolute', width: 20, height: 20, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', filter: 'blur(4px)', transform: 'translateZ(-39px)' }} />
                            
                            {/* Drone Body */}
                            <div style={{
                                width: 24, height: 24, background: '#E2E8F0', borderRadius: '4px',
                                boxShadow: 'inset 0 -2px 10px rgba(0,0,0,0.5), 0 0 10px rgba(255,255,255,0.8)',
                                position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                transform: 'rotate(-45deg)', // Counter-rotate relative to scene so it looks straight
                            }}>
                                <div style={{ position:'absolute', top: -10, left: -10, width: 14, height: 14, border: '2px solid #94A3B8', borderRadius: '50%' }} />
                                <div style={{ position:'absolute', top: -10, right: -10, width: 14, height: 14, border: '2px solid #94A3B8', borderRadius: '50%' }} />
                                <div style={{ position:'absolute', bottom: -10, left: -10, width: 14, height: 14, border: '2px solid #94A3B8', borderRadius: '50%' }} />
                                <div style={{ position:'absolute', bottom: -10, right: -10, width: 14, height: 14, border: '2px solid #94A3B8', borderRadius: '50%' }} />
                                
                                <div style={{ width: 8, height: 8, background: '#38BDF8', borderRadius: '50%', boxShadow: '0 0 10px #38BDF8' }} />
                            </div>

                            {/* Fertilizer Spray Particle Effect */}
                            {activeSpray && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 0.8, height: 40 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        position: 'absolute',
                                        width: 12, top: 20,
                                        background: 'linear-gradient(to bottom, #38BDF8, transparent)',
                                        transform: 'translateZ(-20px)',
                                    }}
                                />
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </div>
            
        </div>
    );
}
