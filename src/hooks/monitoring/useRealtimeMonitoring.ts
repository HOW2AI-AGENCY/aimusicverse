// Real-time Performance Monitoring (T107)
// Tracks connection health, latency, and subscription performance

import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeMetrics {
  connectionState: 'connected' | 'connecting' | 'disconnected' | 'error';
  latency: number | null;
  messagesReceived: number;
  messagesLost: number;
  reconnectCount: number;
  lastMessageTime: number | null;
  subscriptionCount: number;
  avgLatency: number;
}

export interface PerformanceAlert {
  type: 'high_latency' | 'connection_lost' | 'slow_response' | 'subscription_error';
  message: string;
  timestamp: number;
  severity: 'warning' | 'error' | 'critical';
}

const LATENCY_THRESHOLD_WARNING = 500; // ms
const LATENCY_THRESHOLD_CRITICAL = 1000; // ms
const MAX_LATENCY_SAMPLES = 50;

class RealtimeMonitor {
  private static instance: RealtimeMonitor;
  private metrics: RealtimeMetrics = {
    connectionState: 'disconnected',
    latency: null,
    messagesReceived: 0,
    messagesLost: 0,
    reconnectCount: 0,
    lastMessageTime: null,
    subscriptionCount: 0,
    avgLatency: 0,
  };
  
  private latencySamples: number[] = [];
  private alerts: PerformanceAlert[] = [];
  private listeners: Set<(metrics: RealtimeMetrics) => void> = new Set();
  private alertListeners: Set<(alert: PerformanceAlert) => void> = new Set();
  private channelMap: Map<string, RealtimeChannel> = new Map();
  private messageTimestamps: Map<string, number> = new Map();

  private constructor() {
    // Singleton pattern
    this.startMonitoring();
  }

  static getInstance(): RealtimeMonitor {
    if (!RealtimeMonitor.instance) {
      RealtimeMonitor.instance = new RealtimeMonitor();
    }
    return RealtimeMonitor.instance;
  }

  private startMonitoring() {
    // Check connection health every 5 seconds
    setInterval(() => {
      this.checkConnectionHealth();
    }, 5000);

    // Cleanup old message timestamps (older than 5 minutes)
    setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      for (const [key, timestamp] of this.messageTimestamps.entries()) {
        if (timestamp < fiveMinutesAgo) {
          this.messageTimestamps.delete(key);
        }
      }
    }, 60000);
  }

  private checkConnectionHealth() {
    // Check if last message was too long ago
    if (this.metrics.lastMessageTime) {
      const timeSinceLastMessage = Date.now() - this.metrics.lastMessageTime;
      if (timeSinceLastMessage > 60000 && this.metrics.subscriptionCount > 0) {
        this.addAlert({
          type: 'slow_response',
          message: `No messages received in ${Math.floor(timeSinceLastMessage / 1000)}s`,
          timestamp: Date.now(),
          severity: 'warning',
        });
      }
    }

    // Check average latency
    if (this.metrics.avgLatency > LATENCY_THRESHOLD_CRITICAL) {
      this.addAlert({
        type: 'high_latency',
        message: `Critical latency: ${Math.round(this.metrics.avgLatency)}ms`,
        timestamp: Date.now(),
        severity: 'critical',
      });
    } else if (this.metrics.avgLatency > LATENCY_THRESHOLD_WARNING) {
      this.addAlert({
        type: 'high_latency',
        message: `High latency: ${Math.round(this.metrics.avgLatency)}ms`,
        timestamp: Date.now(),
        severity: 'warning',
      });
    }
  }

  registerChannel(channelName: string, channel: RealtimeChannel) {
    this.channelMap.set(channelName, channel);
    this.metrics.subscriptionCount = this.channelMap.size;
    this.notifyListeners();
  }

  unregisterChannel(channelName: string) {
    this.channelMap.delete(channelName);
    this.metrics.subscriptionCount = this.channelMap.size;
    this.notifyListeners();
  }

  updateConnectionState(state: RealtimeMetrics['connectionState']) {
    const wasConnected = this.metrics.connectionState === 'connected';
    this.metrics.connectionState = state;

    if (state === 'connected' && !wasConnected) {
      if (this.metrics.reconnectCount > 0) {
        this.addAlert({
          type: 'connection_lost',
          message: 'Connection restored',
          timestamp: Date.now(),
          severity: 'warning',
        });
      }
    } else if (state === 'disconnected' && wasConnected) {
      this.metrics.reconnectCount++;
      this.addAlert({
        type: 'connection_lost',
        message: 'Real-time connection lost',
        timestamp: Date.now(),
        severity: 'error',
      });
    } else if (state === 'error') {
      this.addAlert({
        type: 'subscription_error',
        message: 'Real-time subscription error',
        timestamp: Date.now(),
        severity: 'critical',
      });
    }

    this.notifyListeners();
  }

  recordMessage(messageId: string, sentTime?: number) {
    this.metrics.messagesReceived++;
    this.metrics.lastMessageTime = Date.now();

    // Calculate latency if sentTime provided
    if (sentTime) {
      const latency = Date.now() - sentTime;
      this.latencySamples.push(latency);

      // Keep only last N samples
      if (this.latencySamples.length > MAX_LATENCY_SAMPLES) {
        this.latencySamples.shift();
      }

      // Calculate average latency
      this.metrics.avgLatency =
        this.latencySamples.reduce((sum, val) => sum + val, 0) / this.latencySamples.length;
      this.metrics.latency = latency;
    }

    this.messageTimestamps.set(messageId, Date.now());
    this.notifyListeners();
  }

  recordLostMessage() {
    this.metrics.messagesLost++;
    this.notifyListeners();
  }

  getMetrics(): RealtimeMetrics {
    return { ...this.metrics };
  }

  getAlerts(limit: number = 10): PerformanceAlert[] {
    return this.alerts.slice(-limit).reverse();
  }

  clearAlerts() {
    this.alerts = [];
  }

  subscribe(listener: (metrics: RealtimeMetrics) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToAlerts(listener: (alert: PerformanceAlert) => void) {
    this.alertListeners.add(listener);
    return () => this.alertListeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getMetrics()));
  }

  private addAlert(alert: PerformanceAlert) {
    this.alerts.push(alert);
    this.alertListeners.forEach((listener) => listener(alert));

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = alert.severity === 'critical' ? '🔴' : alert.severity === 'error' ? '🟠' : '🟡';
      console.warn(`${emoji} Realtime Alert [${alert.type}]:`, alert.message);
    }
  }

  // Export metrics for analytics
  exportMetrics() {
    return {
      ...this.metrics,
      latencySamples: [...this.latencySamples],
      recentAlerts: this.getAlerts(10),
      timestamp: Date.now(),
    };
  }
}

// Hook for monitoring real-time performance
export function useRealtimeMonitoring() {
  const monitor = RealtimeMonitor.getInstance();
  const [metrics, setMetrics] = useState<RealtimeMetrics>(monitor.getMetrics());
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  useEffect(() => {
    const unsubMetrics = monitor.subscribe(setMetrics);
    const unsubAlerts = monitor.subscribeToAlerts((alert) => {
      setAlerts((prev) => [...prev.slice(-9), alert]);
    });

    return () => {
      unsubMetrics();
      unsubAlerts();
    };
  }, [monitor]);

  const clearAlerts = () => {
    setAlerts([]);
    monitor.clearAlerts();
  };

  return {
    metrics,
    alerts,
    clearAlerts,
    exportMetrics: () => monitor.exportMetrics(),
  };
}

// Hook for tracking individual channel performance
export function useChannelMonitoring(channelName: string, channel: RealtimeChannel | null) {
  const monitor = RealtimeMonitor.getInstance();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (channel) {
      monitor.registerChannel(channelName, channel);
      monitor.updateConnectionState('connecting');

      return () => {
        monitor.unregisterChannel(channelName);
      };
    }
  }, [channel, channelName, monitor]);

  const recordMessage = (messageId: string, sentTime?: number) => {
    monitor.recordMessage(messageId, sentTime);
  };

  const recordError = () => {
    monitor.updateConnectionState('error');
  };

  const recordConnected = () => {
    monitor.updateConnectionState('connected');
  };

  const recordDisconnected = () => {
    monitor.updateConnectionState('disconnected');
  };

  return {
    recordMessage,
    recordError,
    recordConnected,
    recordDisconnected,
  };
}

// Utility to measure message roundtrip latency
export function measureLatency() {
  return Date.now();
}

// Export singleton for direct access
export const realtimeMonitor = RealtimeMonitor.getInstance();

export default RealtimeMonitor;
