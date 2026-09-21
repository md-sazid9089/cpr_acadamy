import Button from '@/components/ui/Button.jsx';

const RATES = [0.75, 1, 1.25, 1.5, 2];

/**
 * Shared playback-speed button row — a controlled component so both the plain
 * <video> player and the YouTube player (which speak different APIs for
 * actually applying a rate) can drive the same, consistently visible UI.
 */
export default function PlaybackRateControl({ rate, onChange }) {
  return (
    <div className="flex gap-1">
      {RATES.map((value) => (
        <Button
          key={value}
          size="sm"
          variant={value === rate ? 'primary' : 'ghost'}
          onClick={() => onChange(value)}
        >
          {value}×
        </Button>
      ))}
    </div>
  );
}
