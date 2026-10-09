const test = require('node:test');
const assert = require('node:assert/strict');
const music = require('../music.js');

test('all ten stages have independent playable themes', () => {
    const themes = Array.from({ length: 10 }, (_, index) => music.getTheme('stage', index + 1));
    assert.equal(themes.length, 10);
    assert.equal(new Set(themes.map(theme => theme.name)).size, 10);
    assert.equal(new Set(themes.map(theme => theme.melody.join(','))).size, 10);
    for (const theme of themes) {
        assert.ok(theme.stepMs >= 90);
        assert.ok(theme.melody.some(note => note > 0));
        assert.ok(theme.bass.length > 0);
        assert.ok(theme.chords.length > 0);
    }
});

test('endless waves cycle through the ten stage themes', () => {
    assert.equal(music.getTheme('stage', 1), music.getTheme('stage', 11));
    assert.equal(music.getTheme('stage', 10), music.getTheme('stage', 20));
});

test('midboss and final boss use distinct heavy urgent themes', () => {
    const midboss = music.getTheme('midboss', 5);
    const finalboss = music.getTheme('finalboss', 10);
    assert.equal(midboss.heavy, true);
    assert.equal(finalboss.heavy, true);
    assert.notDeepEqual(midboss.melody, finalboss.melody);
    assert.ok(finalboss.stepMs < midboss.stepMs);
    assert.match(midboss.name, /중간보스/);
    assert.match(finalboss.name, /최종보스/);
});

test('MIDI conversion produces concert A at 440Hz', () => {
    assert.equal(music.midiToFrequency(0), 0);
    assert.equal(music.midiToFrequency(69), 440);
});
