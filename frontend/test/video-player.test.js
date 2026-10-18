import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

test('video transport controls keep back, play/pause and forward together in the bottom bar', () => {
  const controls = read('../src/features/learning/components/SkipControls.jsx');
  const back = controls.indexOf('onSkip(-SKIP_SECONDS)');
  const toggle = controls.indexOf('onClick={onToggle}');
  const forward = controls.indexOf('onSkip(SKIP_SECONDS)');

  assert.ok(back >= 0 && toggle > back && forward > toggle);
  assert.equal(controls.includes('absolute inset-x-0 top-1/2'), false);

  for (const player of ['VideoPlayer.jsx', 'YouTubePlayer.jsx']) {
    const source = read(`../src/features/learning/components/${player}`);
    assert.match(source, /<SkipControls playing=\{playing\} onToggle=\{toggle\} onSkip=\{skip\} \/>/);
    assert.equal((source.match(/<SkipControls/g) ?? []).length, 1);
  }
});

test('both video players expose an adjustable, mute-aware volume control', () => {
  const control = read('../src/features/learning/components/VolumeControl.jsx');
  assert.match(control, /type="range"/);
  assert.match(control, /min="0"/);
  assert.match(control, /max="100"/);
  assert.match(control, /aria-label="Volume"/);

  for (const player of ['VideoPlayer.jsx', 'YouTubePlayer.jsx']) {
    const source = read(`../src/features/learning/components/${player}`);
    assert.match(source, /<VolumeControl volume=\{volume\} muted=\{muted\} onToggleMute=\{toggleMute\} onChange=\{applyVolume\} \/>/);
    assert.match(source, /lastAudibleVolume/);
    assert.match(source, /setMuted\(next === 0\)/);
  }

  const youtube = read('../src/features/learning/components/YouTubePlayer.jsx');
  assert.match(youtube, /setVolume\?\.\(next \* 100\)/);
});
