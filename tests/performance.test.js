const test = require('node:test');
const assert = require('node:assert/strict');
const { EnemySpatialIndex, GamePerformanceManager } = require('../performance.js');

test('enemy spatial index returns only nearby live enemies', () => {
    const index = new EnemySpatialIndex(100, -100, 500);
    const near = { x: 90, hp: 10, isDead: false };
    const far = { x: 360, hp: 10, isDead: false };
    const dead = { x: 95, hp: 0, isDead: true };
    index.rebuild([near, far, dead]);

    assert.deepEqual(index.queryX(100, 30), [near]);
    assert.deepEqual(index.queryX(350, 30), [far]);
});

test('enemy spatial index clears stale buckets when rebuilt', () => {
    const index = new EnemySpatialIndex(100, -100, 500);
    const enemy = { x: 100, hp: 10, isDead: false };
    index.rebuild([enemy]);
    assert.equal(index.queryX(100, 20).length, 1);
    index.rebuild([]);
    assert.equal(index.queryX(100, 20).length, 0);
});

test('performance manager lowers quality and caps cosmetic collections', () => {
    const manager = new GamePerformanceManager();
    for (let frame = 1; frame <= 60; frame++) manager.beginFrame(frame * 40);
    assert.equal(manager.quality, 0);

    const game = {
        particles: Array(100).fill({}),
        floatingTexts: Array(30).fill({}),
        confetti: Array(40).fill({}),
        comicExplosions: Array(20).fill({}),
        secondaryClusters: Array(40).fill({})
    };
    manager.trimEffects(game);
    assert.equal(game.particles.length, 28);
    assert.equal(game.floatingTexts.length, 10);
    assert.equal(game.confetti.length, 18);
});
