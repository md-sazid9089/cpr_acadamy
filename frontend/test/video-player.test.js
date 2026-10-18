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
