import Button from '@/components/ui/Button.jsx';

const RATES = [0.75, 1, 1.25, 1.5, 2];

/**
 * Shared playback-speed button row — a controlled component so both the plain
 * <video> player and the YouTube player (which speak different APIs for
 * actually applying a rate) can drive the same, consistently visible UI.
 */
export default function PlaybackRateControl({ rate, onChange }) {
  return (
    <select
      value={rate}
      onChange={(e) => onChange(Number(e.target.value))}
      className="appearance-none bg-transparent text-[13px] text-white font-medium cursor-pointer outline-none hover:text-brand-300 transition-colors"
      aria-label="Playback speed"
    >
      {RATES.map((value) => (
        <option key={value} value={value} className="text-black">
          {value === 1 ? 'Normal' : `${value}x`}
        </option>
      ))}
    </select>
  );
}
