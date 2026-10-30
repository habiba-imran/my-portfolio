"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playTick: () => void;
  playWhoosh: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true);
  const [ready, setReady] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      setIsMuted(sessionStorage.getItem("isMuted") !== "false");
    } catch {
      /* Storage can be unavailable. */
    }
    setReady(true);
    return () => {
      void audioCtxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        sessionStorage.setItem("isMuted", String(isMuted));
      } catch {
        /* Keep the in-memory preference. */
      }
    }
  }, [isMuted, ready]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      if (!window.AudioContext) return null;
      audioCtxRef.current = new window.AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume().catch(() => undefined);
    }
    return audioCtxRef.current;
  };

  const playTick = () => {
    if (isMuted) return;
    const ctx = initAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    // Start at a high frequency and quickly drop (creates a 'click/tick' transient)
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  };

  const playWhoosh = () => {
    if (isMuted) return;
    const ctx = initAudio();
    if (!ctx) return;

    // Create noise buffer for the whoosh
    const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // White noise
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter to make it a deep, soft whoosh
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(100, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start(ctx.currentTime);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Initialize audio context on first interaction if turning sound ON
    if (isMuted) {
      initAudio();
    }
  };

  return (
    <SoundContext.Provider
      value={{ isMuted, toggleMute, playTick, playWhoosh }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
