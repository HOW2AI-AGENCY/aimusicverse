# Telegram Mini App Advanced Features Integration

## Overview

This document describes the advanced Telegram Mini App features integrated into MusicVerse, including Bot API 9.x and Mini App 2.0 features.

## Table of Contents

1. [Type Definitions](#type-definitions)
2. [Hooks](#hooks)
3. [Components](#components)
4. [Context Methods](#context-methods)
5. [Usage Examples](#usage-examples)
6. [Platform Support](#platform-support)

---

## Type Definitions

Location: `src/types/telegram.d.ts`

Enhanced TypeScript definitions for:
- Bot API 9.x methods
- Mini App 2.0 features
- Sensor APIs (Accelerometer, Gyroscope, DeviceOrientation)
- Storage APIs (CloudStorage, DeviceStorage, SecureStorage)
- Biometric authentication
- QR scanning
- Fullscreen control
- New buttons (SecondaryButton, SettingsButton)

---

## Hooks

### useTelegramSensors

Access device sensors for motion and orientation detection.

```tsx
import { useTelegramSensors } from '@/hooks/telegram';

const { accelerometer, gyroscope, orientation, isSupported } = useTelegramSensors({
  enableAccelerometer: true,
  enableGyroscope: true,
  refreshRate: 60, // Hz
});

// Use accelerometer data
if (accelerometer) {
  const tilt = Math.atan2(accelerometer.y, accelerometer.x) * 180 / Math.PI;
}
```

**Features:**
- Accelerometer (x, y, z motion)
- Gyroscope (x, y, z rotation)
- Device orientation (alpha, beta, gamma angles)
- Configurable refresh rate
- Automatic cleanup

**Platform Support:** iOS, Android (Mini App 2.0)

---

### useTelegramFullscreen

Control fullscreen mode for immersive experiences.

```tsx
import { useTelegramFullscreen } from '@/hooks/telegram';

const { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen } = useTelegramFullscreen();

// Toggle fullscreen for player
<Button onClick={toggleFullscreen}>
  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
</Button>
```

**Features:**
- Enter/exit fullscreen
- Track fullscreen state
- Event listeners for state changes

**Platform Support:** iOS, Android (Mini App 2.0)

---

### useTelegramBiometric

Biometric authentication (Touch ID, Face ID, fingerprint).

```tsx
import { useTelegramBiometric } from '@/hooks/telegram';

const {
  isAvailable,
  biometricType,
  authenticate,
  requestAccess
} = useTelegramBiometric();

// Authenticate before sensitive action
const handleSecureAction = async () => {
  const { success, token } = await authenticate('Confirm purchase');
  if (success) {
    // Proceed with action
  }
};
```

**Features:**
- Automatic biometric type detection (face/finger)
- Access request flow
- Token management
- Settings access

**Platform Support:** iOS, Android (Telegram 7.2+)

---

### useTelegramQRScanner

Native QR code scanning.

```tsx
import { useTelegramQRScanner } from '@/hooks/telegram';

const { scanQR, isScanning } = useTelegramQRScanner();

const handleScan = async () => {
  const result = await scanQR('Scan track QR code', (data) => {
    // Validate QR data
    return data.startsWith('https://');
  });
  
  if (result) {
    console.log('Scanned:', result);
  }
};
```

**Features:**
- Native camera QR scanning
- Validation callback
- Auto-close on success
- Timeout handling

**Platform Support:** iOS, Android, Desktop (Telegram 6.4+)

---

### useTelegramStorage

Unified storage API for CloudStorage, DeviceStorage, and SecureStorage.

```tsx
import { useTelegramStorage } from '@/hooks/telegram';

const { cloud, device, secure } = useTelegramStorage();

// Cloud storage (synced across devices)
await cloud.set('settings', JSON.stringify(settings));
const data = await cloud.get('settings');

// Device storage (local only)
await device.set('cache', JSON.stringify(cache));

// Secure storage (encrypted)
if (secure.isAvailable) {
  await secure.set('refresh_token', token);
  const token = await secure.get('refresh_token');
}
```

**Storage Types:**

| Type | Capacity | Synced | Encrypted | Use Case |
|------|----------|--------|-----------|----------|
| CloudStorage | 1024 keys, 4KB/value | ✅ | ❌ | User preferences, settings |
| DeviceStorage | ~5 MB total | ❌ | ❌ | Cache, temp data |
| SecureStorage | 10 items | ❌ | ✅ | Tokens, passwords |

**Platform Support:** All platforms

---

## Components

### BiometricPrompt

Dialog component for biometric authentication.

```tsx
import { BiometricPrompt } from '@/components/telegram/advanced/BiometricPrompt';

<BiometricPrompt
  open={showBiometric}
  onOpenChange={setShowBiometric}
  reason="Confirm track purchase"
  onAuthenticate={(success, token) => {
    if (success) {
      // Proceed with purchase
    }
  }}
/>
```

**Features:**
- Automatic biometric type detection
- Visual feedback
- Error handling
- Settings link

---

### QRScannerDialog

Dialog component for QR code scanning.

```tsx
import { QRScannerDialog } from '@/components/telegram/advanced/QRScannerDialog';

<QRScannerDialog
  buttonText="Scan Track QR"
  scanText="Scan track QR code"
  onScan={(data) => {
    console.log('Scanned:', data);
  }}
  validate={(data) => data.startsWith('https://t.me/')}
/>
```

**Features:**
- Native QR scanner integration
- Custom validation
- Loading states

---

## Context Methods

### TelegramContext Enhanced Methods

Location: `src/contexts/TelegramContext.tsx`

#### Buttons

```tsx
const { showSecondaryButton, hideSecondaryButton } = useTelegram();

// Show secondary button
showSecondaryButton('Cancel', handleCancel, {
  color: '#FF0000',
  position: 'left'
});
```

#### Fullscreen

```tsx
const { requestFullscreen, exitFullscreen, isFullscreen } = useTelegram();

// Enter fullscreen for player
requestFullscreen();
```

#### Orientation

```tsx
const { lockOrientation, unlockOrientation } = useTelegram();

// Lock to portrait for video player
lockOrientation();
```

#### Sharing

```tsx
const { shareURL, shareToStory } = useTelegram();

// Share track URL
shareURL('https://t.me/bot/app?startapp=track_123', 'Check out this track!');

// Share to story
shareToStory(coverUrl, {
  text: 'My new track 🎵',
  widget_link: {
    url: 'https://t.me/bot/app?startapp=track_123',
    name: 'Listen'
  }
});
```

#### QR Scanner

```tsx
const { showQRScanner, closeQRScanner } = useTelegram();

// Show QR scanner
showQRScanner('Scan QR code', (data) => {
  if (data.startsWith('https://')) {
    // Valid QR
    return true; // Close scanner
  }
  return false; // Keep scanner open
});
```

#### Downloads

```tsx
const { downloadFile, requestWriteAccess } = useTelegram();

// Request write access first
requestWriteAccess((granted) => {
  if (granted) {
    // Download track
    downloadFile(audioUrl, 'track.mp3', (success) => {
      if (success) {
        console.log('Downloaded');
      }
    });
  }
});
```

---

## Usage Examples

### Example 1: Fullscreen Music Player with Gesture Controls

```tsx
import { useTelegramFullscreen, useTelegramSensors } from '@/hooks/telegram';

export const FullscreenPlayer = ({ track }) => {
  const { isFullscreen, enterFullscreen, exitFullscreen } = useTelegramFullscreen();
  const { gyroscope, isGyroscopeActive, startGyroscope } = useTelegramSensors({
    enableGyroscope: true,
    refreshRate: 60
  });

  useEffect(() => {
    if (isFullscreen && !isGyroscopeActive) {
      startGyroscope();
    }
  }, [isFullscreen, isGyroscopeActive]);

  // Use gyroscope for visual effects
  const tilt = gyroscope ? {
    x: gyroscope.x * 10,
    y: gyroscope.y * 10
  } : { x: 0, y: 0 };

  return (
    <div className="player">
      <Button onClick={enterFullscreen}>
        Fullscreen Player
      </Button>
      
      {isFullscreen && (
        <div
          style={{
            transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`
          }}
        >
          <TrackVisualizer />
        </div>
      )}
    </div>
  );
};
```

### Example 2: Secure Purchase with Biometric Auth

```tsx
import { useTelegramBiometric } from '@/hooks/telegram';
import { BiometricPrompt } from '@/components/telegram/advanced/BiometricPrompt';

export const PremiumPurchase = () => {
  const [showAuth, setShowAuth] = useState(false);
  const { isAvailable } = useTelegramBiometric();

  const handlePurchase = async () => {
    if (isAvailable) {
      setShowAuth(true);
    } else {
      // Fallback to regular purchase flow
      processPurchase();
    }
  };

  const handleAuthenticate = (success: boolean) => {
    if (success) {
      processPurchase();
    }
  };

  return (
    <>
      <Button onClick={handlePurchase}>
        Buy Premium - $9.99
      </Button>
      
      <BiometricPrompt
        open={showAuth}
        onOpenChange={setShowAuth}
        reason="Confirm premium purchase ($9.99)"
        onAuthenticate={handleAuthenticate}
      />
    </>
  );
};
```

### Example 3: QR-based Track Sharing

```tsx
import { QRScannerDialog } from '@/components/telegram/advanced/QRScannerDialog';

export const ShareTrackQR = ({ track }) => {
  const handleScan = (data: string) => {
    // Validate and navigate to shared track
    if (data.includes('startapp=track_')) {
      const trackId = data.split('startapp=track_')[1];
      navigate(`/library?track=${trackId}`);
    }
  };

  return (
    <QRScannerDialog
      buttonText="Scan Track QR"
      scanText="Scan friend's track QR code"
      onScan={handleScan}
      validate={(data) => data.includes('t.me/') && data.includes('startapp=track_')}
    />
  );
};
```

### Example 4: Multi-Device Settings Sync

```tsx
import { useTelegramStorage } from '@/hooks/telegram';

export const useSettingsSync = () => {
  const { cloud } = useTelegramStorage();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Load settings from cloud on mount
  useEffect(() => {
    const loadSettings = async () => {
      const data = await cloud.get('app_settings');
      if (data) {
        setSettings(JSON.parse(data));
      }
    };
    loadSettings();
  }, []);

  // Save settings to cloud
  const saveSettings = async (newSettings: AppSettings) => {
    await cloud.set('app_settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  return { settings, saveSettings };
};
```

---

## Platform Support

| Feature | iOS | Android | Desktop |
|---------|-----|---------|---------|
| Accelerometer | ✅ | ✅ | ❌ |
| Gyroscope | ✅ | ✅ | ❌ |
| DeviceOrientation | ✅ | ✅ | ❌ |
| Biometric Auth | ✅ | ✅ | ❌ |
| QR Scanner | ✅ | ✅ | ✅* |
| Fullscreen | ✅ | ✅ | ✅ |
| CloudStorage | ✅ | ✅ | ✅ |
| DeviceStorage | ✅ | ✅ | ✅ |
| SecureStorage | ✅ | ✅ | ❌ |
| Share to Story | ✅ | ✅ | ❌ |
| Download File | ✅ | ✅ | ✅ |

*✅ = Supported, ❌ = Not supported, *Desktop uses webcam

---

## Best Practices

### 1. Feature Detection

Always check if a feature is supported before using it:

```tsx
const { isSupported, isAvailable } = useTelegramBiometric();

if (isSupported && isAvailable) {
  // Use biometric auth
} else {
  // Fallback to password/PIN
}
```

### 2. Graceful Degradation

Provide fallbacks for unsupported platforms:

```tsx
const { isSupported } = useTelegramSensors();

if (isSupported) {
  return <MotionControlledPlayer />;
}
return <StandardPlayer />;
```

### 3. Storage Selection

Choose the right storage type:

- **CloudStorage**: User preferences, settings (synced)
- **DeviceStorage**: Cache, temporary data (local)
- **SecureStorage**: Tokens, passwords (encrypted)

### 4. Battery Considerations

Sensors consume battery. Stop them when not needed:

```tsx
useEffect(() => {
  if (isPlayerActive) {
    startAccelerometer();
  }
  return () => stopAccelerometer();
}, [isPlayerActive]);
```

### 5. User Privacy

Always request permissions explicitly and explain why:

```tsx
const granted = await requestAccess('Для защиты ваших покупок');
```

---

## Troubleshooting

### Sensors not working

1. Check platform support
2. Verify user granted permissions
3. Ensure refresh rate is reasonable (30-60 Hz)

### Biometric auth fails

1. Check if device has biometric hardware
2. Verify biometric is configured on device
3. Request access before authenticating

### QR scanner not opening

1. Check Telegram version (6.4+)
2. Ensure camera permissions granted
3. Test on different device/platform

---

## Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Bot API Changelog](https://core.telegram.org/bots/api-changelog)

---

**Last Updated:** 2025-12-10
