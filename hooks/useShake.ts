import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useState } from 'react';

// This is the sensitivity threshold. A lower number is more sensitive.
const SHAKE_THRESHOLD = 80;

export const useShake = (onShake: () => void): [() => void] => {
  // Add a state to track if a shake has already been detected.
  const [shaken, setShaken] = useState(false);

  useEffect(() => {
    let lastX: number, lastY: number, lastZ: number;
    let lastTimestamp = 0;

    const subscription = Accelerometer.addListener(accelerometerData => {
      // If we're already in a "shaken" state, ignore all new data.
      if (shaken) {
        return;
      }
      
      const { x, y, z } = accelerometerData;
      const now = Date.now();

      if (lastTimestamp === 0) {
        lastTimestamp = now;
        lastX = x;
        lastY = y;
        lastZ = z;
        return;
      }

      const timeDelta = now - lastTimestamp;
      if (timeDelta > 300) { // Only check every 350ms
        const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / timeDelta * 10000;

        if (speed > SHAKE_THRESHOLD) {
          setShaken(true); // 1. Set state to "shaken" to pause detection
          onShake(); // 2. Call the provided function (e.g., show alert)
        }

        lastTimestamp = now;
        lastX = x;
        lastY = y;
        lastZ = z;
      }
    });

    // Cleanup: remove the listener when the component unmounts
    return () => {
      subscription.remove();
    };
  }, [onShake, shaken]); // Re-run effect if onShake or shaken changes

  // Create a memoized function to reset the shake state
  const resetShake = useCallback(() => {
    setShaken(false);
  }, []);

  // V-- MAKE SURE THIS LINE EXISTS --V
  return [resetShake];
};