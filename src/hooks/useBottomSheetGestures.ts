/**
 * useBottomSheetGestures - Handle gestures for bottom sheets
 * Provides drag-to-close, snap points, and velocity-based closing
 */

import { useRef, useState, useCallback, RefObject } from 'react';
import { useHaptic } from './useHaptic';

interface BottomSheetGesturesOptions {
  onClose: () => void;
  onSnapChange?: (snapIndex: number) => void;
  snapPoints?: number[]; // Heights as percentages (0-1)
  closeThreshold?: number; // Pixels to drag before closing
  velocityThreshold?: number; // Pixels/second for velocity-based closing
}

interface GestureState {
  startY: number;
  currentY: number;
  isDragging: boolean;
  velocity: number;
}

export function useBottomSheetGestures({
  onClose,
  onSnapChange,
  snapPoints = [0.5, 0.9],
  closeThreshold = 100,
  velocityThreshold = 500,
}: BottomSheetGesturesOptions) {
  const { patterns } = useHaptic();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSnap, setCurrentSnap] = useState(snapPoints.length - 1);
  const gestureRef = useRef<GestureState>({
    startY: 0,
    currentY: 0,
    isDragging: false,
    velocity: 0,
  });
  const lastTimeRef = useRef<number>(0);
  const lastYRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    gestureRef.current = {
      startY: touch.clientY,
      currentY: touch.clientY,
      isDragging: true,
      velocity: 0,
    };
    lastTimeRef.current = Date.now();
    lastYRef.current = touch.clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gestureRef.current.isDragging) return;
    
    const touch = e.touches[0];
    const now = Date.now();
    const timeDelta = now - lastTimeRef.current;
    
    if (timeDelta > 0) {
      gestureRef.current.velocity = 
        (touch.clientY - lastYRef.current) / timeDelta * 1000;
    }
    
    gestureRef.current.currentY = touch.clientY;
    lastTimeRef.current = now;
    lastYRef.current = touch.clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!gestureRef.current.isDragging) return;
    
    const { startY, currentY, velocity } = gestureRef.current;
    const dragDistance = currentY - startY;
    
    gestureRef.current.isDragging = false;
    
    // Close if dragged down far enough or with high velocity
    if (dragDistance > closeThreshold || velocity > velocityThreshold) {
      patterns.tap();
      onClose();
      return;
    }
    
    // Snap up if dragged up
    if (dragDistance < -closeThreshold || velocity < -velocityThreshold) {
      const newSnap = Math.min(currentSnap + 1, snapPoints.length - 1);
      if (newSnap !== currentSnap) {
        patterns.select();
        setCurrentSnap(newSnap);
        onSnapChange?.(newSnap);
      }
      return;
    }
    
    // Find closest snap point based on current position
    // This is simplified - in a real implementation you'd track the actual height
  }, [closeThreshold, velocityThreshold, currentSnap, snapPoints, patterns, onClose, onSnapChange]);

  const dragOffset = gestureRef.current.isDragging
    ? Math.max(0, gestureRef.current.currentY - gestureRef.current.startY)
    : 0;

  return {
    containerRef,
    currentSnap,
    snapHeight: snapPoints[currentSnap],
    dragOffset,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
