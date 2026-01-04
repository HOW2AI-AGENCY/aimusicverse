/**
 * HardwareStudioDemo - Demo page for hardware studio components
 */

import React, { useState, useCallback } from 'react';
import { HardwareKnob } from '@/components/ui/hardware/HardwareKnob';
import { HardwareFader } from '@/components/ui/hardware/HardwareFader';
import { VUMeter } from '@/components/ui/hardware/VUMeter';
import { LEDIndicator } from '@/components/ui/hardware/LEDIndicator';
import { HardwareSwitch } from '@/components/ui/hardware/HardwareSwitch';
import { LCDDisplay, SegmentedDisplay } from '@/components/ui/hardware/LCDDisplay';
import { HardwareMixer } from '@/components/stem-studio/hardware/HardwareMixer';
import { HardwareEffectsRack } from '@/components/stem-studio/hardware/HardwareEffectsRack';
import { defaultStemEffects } from '@/hooks/studio/stemEffectsConfig';
import type { StemState, StemEffects } from '@/hooks/studio/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Demo stems data
const demoStems = [
  { id: 'vocals', name: 'Vocals', type: 'vocals', level: 0.7 },
  { id: 'drums', name: 'Drums', type: 'drums', level: 0.85 },
  { id: 'bass', name: 'Bass', type: 'bass', level: 0.65 },
  { id: 'other', name: 'Other', type: 'other', level: 0.5 },
];

export default function HardwareStudioDemo() {
  const navigate = useNavigate();
  
  // Demo state
  const [knobValue, setKnobValue] = useState(50);
  const [faderValue, setFaderValue] = useState(75);
  const [vuLevel, setVuLevel] = useState(0.6);
  const [ledOn, setLedOn] = useState(true);
  const [switchOn, setSwitchOn] = useState(false);
  const [bpm, setBpm] = useState(120);
  
  // Mixer state
  const [stemStates, setStemStates] = useState<Record<string, StemState>>({
    vocals: { volume: 80, muted: false, solo: false },
    drums: { volume: 85, muted: false, solo: false },
    bass: { volume: 75, muted: false, solo: false },
    other: { volume: 60, muted: false, solo: false },
  });
  const [masterVolume, setMasterVolume] = useState(85);
  const [masterMuted, setMasterMuted] = useState(false);
  
  // Effects state
  const [showEffects, setShowEffects] = useState(false);
  const [selectedStem, setSelectedStem] = useState<string | null>(null);
  const [effects, setEffects] = useState<StemEffects>(defaultStemEffects);

  // Animate VU meter
  React.useEffect(() => {
    const interval = setInterval(() => {
      setVuLevel(0.4 + Math.random() * 0.5);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleStemVolumeChange = useCallback((stemId: string, volume: number) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: { ...prev[stemId], volume }
    }));
  }, []);

  const handleStemMuteToggle = useCallback((stemId: string) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: { ...prev[stemId], muted: !prev[stemId].muted }
    }));
  }, []);

  const handleStemSoloToggle = useCallback((stemId: string) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: { ...prev[stemId], solo: !prev[stemId].solo }
    }));
  }, []);

  const handleEffectsClick = useCallback((stemId: string) => {
    setSelectedStem(stemId);
    setShowEffects(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-zinc-100">Hardware Studio Demo</h1>
      </div>

      {/* UI Primitives Section */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
          UI Primitives
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          {/* Knobs */}
          <div className="flex flex-col items-center gap-2">
            <HardwareKnob
              value={knobValue}
              onChange={setKnobValue}
              size="md"
              variant="dark"
              label="VOLUME"
              showTicks
            />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <HardwareKnob
              value={knobValue - 50}
              min={-50}
              max={50}
              onChange={(v) => setKnobValue(v + 50)}
              size="md"
              variant="modern"
              label="PAN"
              bipolar
            />
          </div>

          {/* Fader */}
          <div className="flex flex-col items-center gap-2">
            <HardwareFader
              value={faderValue}
              onChange={setFaderValue}
              height={140}
              label="FADER"
            />
          </div>

          {/* VU Meters */}
          <div className="flex flex-col items-center gap-2">
            <VUMeter value={vuLevel} type="led" size="md" label="LEVEL" />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <VUMeter value={vuLevel} type="needle" label="VU" />
          </div>

          {/* LEDs and Switches */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3">
              <LEDIndicator on={ledOn} color="green" label="ON" />
              <LEDIndicator on={!ledOn} color="red" label="OFF" />
            </div>
            
            <HardwareSwitch
              on={switchOn}
              onChange={setSwitchOn}
              label="POWER"
              size="md"
            />
            
            <HardwareSwitch
              on={ledOn}
              onChange={setLedOn}
              variant="button"
              label="LED"
              size="md"
            />
          </div>
        </div>
      </section>

      {/* LCD Displays */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
          Displays
        </h2>
        
        <div className="flex flex-wrap gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <LCDDisplay text="FILTER 1: ANALOG LP12" variant="green" />
          <LCDDisplay text="REVERB: HALL" secondaryText="Decay: 2.5s" variant="blue" />
          <LCDDisplay text="COMPRESSOR" variant="amber" />
          <SegmentedDisplay value={bpm} digits={3} label="BPM" variant="green" />
          <SegmentedDisplay value={-12.5} digits={5} showSign label="dB" variant="amber" />
        </div>
      </section>

      {/* Hardware Mixer */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
          Mixer
        </h2>
        
        <HardwareMixer
          stems={demoStems}
          stemStates={stemStates}
          masterVolume={masterVolume}
          masterMuted={masterMuted}
          masterLeftLevel={vuLevel * 0.9}
          masterRightLevel={vuLevel * 0.95}
          onStemVolumeChange={handleStemVolumeChange}
          onStemMuteToggle={handleStemMuteToggle}
          onStemSoloToggle={handleStemSoloToggle}
          onMasterVolumeChange={setMasterVolume}
          onMasterMuteToggle={() => setMasterMuted(!masterMuted)}
          onStemEffectsClick={handleEffectsClick}
        />
      </section>

      {/* Effects Rack */}
      {showEffects && selectedStem && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
            Effects Rack
          </h2>
          
          <HardwareEffectsRack
            stemName={selectedStem}
            effects={effects}
            onEffectsChange={(e) => setEffects(prev => ({ ...prev, ...e }))}
            onClose={() => setShowEffects(false)}
            getCompressorReduction={() => Math.random() * 12}
          />
        </section>
      )}
    </div>
  );
}
