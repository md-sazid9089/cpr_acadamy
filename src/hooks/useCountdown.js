import { useEffect, useRef, useState } from 'react';

/**
 * Counts down from `seconds`, ticking once per second. Used by the exam auto
 * timer and the OTP resend cooldown.
 *
 * @param {number} seconds        Starting value.
 * @param {Object} [options]
 * @param {boolean} [options.autoStart=true]
 * @param {() => void} [options.onExpire] Fired once when the timer hits zero.
 */
export function useCountdown(seconds, { autoStart = true, onExpire } = {}) {
  const [remaining, setRemaining] = useState(seconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const id = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          clearInterval(id);
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  return {
    remaining,
    isRunning,
    isExpired: remaining === 0,
    start: () => setIsRunning(true),
    pause: () => setIsRunning(false),
    reset: (next = seconds) => {
      setRemaining(next);
      setIsRunning(true);
    },
  };
}
