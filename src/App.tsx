/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Trophy, Music, Gamepad2, Volume2 } from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120;

const TRACKS = [
  {
    id: 1,
    title: "Neon Dreams",
    artist: "Cyber Synth",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "text-cyan-400"
  },
  {
    id: 2,
    title: "Midnight Drive",
    artist: "Retro Wave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "text-pink-400"
  },
  {
    id: 3,
    title: "Digital Rain",
    artist: "Lo-Fi AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "text-purple-400"
  }
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Game Logic ---
  const generateFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Check if food is on snake
      const onSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setFood(generateFood());
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE
      };

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        setIsPaused(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check collision with food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  const animate = (time: number) => {
    if (time - lastUpdateRef.current > GAME_SPEED) {
      moveSnake();
      lastUpdateRef.current = time;
    }
    gameLoopRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(animate);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [moveSnake]);

  // --- Music Logic ---
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTrack = (dir: 'next' | 'prev') => {
    let nextIndex;
    if (dir === 'next') {
      nextIndex = (currentTrackIndex + 1) % TRACKS.length;
    } else {
      nextIndex = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    }
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/30 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
            <Gamepad2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase italic">Neon Snake</h1>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Rhythm Protocol v1.0</p>
          </div>
        </div>
        
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Score</p>
            <p className="text-2xl font-mono text-cyan-400 leading-none">{score.toString().padStart(4, '0')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">High</p>
            <p className="text-2xl font-mono text-pink-400 leading-none">{highScore.toString().padStart(4, '0')}</p>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="relative group">
        {/* Game Border */}
        <div className="relative p-1 bg-gradient-to-br from-cyan-500/50 via-purple-500/50 to-pink-500/50 rounded-xl shadow-[0_0_50px_-12px_rgba(6,182,212,0.5)]">
          <div className="bg-zinc-900 rounded-lg overflow-hidden relative" style={{ width: 'min(80vw, 500px)', aspectRatio: '1/1' }}>
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10" 
                 style={{ 
                   backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                   backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
                 }} 
            />

            {/* Snake & Food */}
            <div className="relative w-full h-full">
              {/* Food */}
              <div 
                className="absolute bg-pink-500 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.8)] animate-pulse"
                style={{
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  left: `${(food.x / GRID_SIZE) * 100}%`,
                  top: `${(food.y / GRID_SIZE) * 100}%`
                }}
              />
              
              {/* Snake Body */}
              {snake.map((segment, i) => (
                <div 
                  key={i}
                  className={`absolute rounded-sm transition-all duration-100 ${i === 0 ? 'bg-cyan-400 z-10 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-cyan-600/80'}`}
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                    opacity: 1 - (i / snake.length) * 0.6
                  }}
                />
              ))}
            </div>

            {/* Overlays */}
            {isGameOver && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <h2 className="text-4xl font-black text-pink-500 uppercase tracking-tighter italic mb-2">Game Over</h2>
                <p className="text-zinc-400 mb-6 font-mono">Final Score: {score}</p>
                <button 
                  onClick={resetGame}
                  className="px-8 py-3 bg-cyan-500 text-zinc-950 font-bold rounded-full hover:bg-cyan-400 transition-colors uppercase tracking-widest text-sm"
                >
                  Restart System
                </button>
              </div>
            )}

            {isPaused && !isGameOver && (
              <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                <button 
                  onClick={() => setIsPaused(false)}
                  className="group/play p-6 bg-cyan-500/20 border border-cyan-500/50 rounded-full hover:bg-cyan-500/30 transition-all"
                >
                  <Play className="w-12 h-12 text-cyan-400 fill-cyan-400 group-hover/play:scale-110 transition-transform" />
                </button>
                <p className="mt-4 text-cyan-400/70 font-mono text-xs uppercase tracking-[0.3em]">System Paused</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls Hint */}
        <div className="mt-6 flex justify-center gap-8 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 border border-zinc-700 rounded bg-zinc-800 text-zinc-300">WASD</span>
            <span>Move</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 border border-zinc-700 rounded bg-zinc-800 text-zinc-300">SPACE</span>
            <span>Pause</span>
          </div>
        </div>
      </main>

      {/* Music Player Bar */}
      <footer className="fixed bottom-8 w-full max-w-xl px-4">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl flex items-center gap-6">
          {/* Album Art Placeholder */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 group">
            <div className={`absolute inset-0 flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : ''}`}>
              <Music className={`w-8 h-8 ${currentTrack.color} opacity-50`} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
          </div>

          {/* Track Info */}
          <div className="flex-grow min-w-0">
            <h3 className="font-bold text-sm truncate">{currentTrack.title}</h3>
            <p className="text-xs text-zinc-500 truncate">{currentTrack.artist}</p>
            
            {/* Progress Bar (Visual only) */}
            <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r from-cyan-500 to-pink-500 transition-all duration-1000 ${isPlaying ? 'w-full' : 'w-1/3'}`}
                style={{ transitionTimingFunction: 'linear' }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => skipTrack('prev')}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={togglePlay}
              className="p-3 bg-white text-zinc-950 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <button 
              onClick={() => skipTrack('next')}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>

          {/* Hidden Audio Element */}
          <audio 
            ref={audioRef}
            src={currentTrack.url}
            onEnded={() => skipTrack('next')}
            loop={false}
          />
        </div>
      </footer>

      {/* Visualizer Accents */}
      <div className="fixed bottom-0 left-0 w-full h-1 flex gap-1 px-1 opacity-20">
        {Array.from({ length: 40 }).map((_, i) => (
          <div 
            key={i} 
            className="flex-grow bg-cyan-500 transition-all duration-300"
            style={{ 
              height: isPlaying ? `${Math.random() * 100}%` : '20%',
              opacity: isPlaying ? 0.5 + Math.random() * 0.5 : 0.2
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
