const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function audio() {
    let created = 0, disconnected = 0, buffers = 0;
    const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
    const node = () => ({ gain: param(), frequency: param(), connect() {}, disconnect() { disconnected++; }, start() {}, stop() {} });
    const ctx = { currentTime: 0, state: 'running', sampleRate: 100,
        createOscillator() { created++; return node(); }, createGain: node,
        createBiquadFilter: node, createBufferSource() { created++; return node(); },
        createBuffer() { buffers++; return { sampleRate: 100, duration: 1, getChannelData: () => new Float32Array(100) }; },
        createDynamicsCompressor: () => ({ ...node(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }) };
    const globals = vm.createContext({ window: { game: { performanceManager: { quality: 2 } } }, localStorage: { getItem: () => 'false' }, console, Math, setTimeout });
    vm.runInContext(fs.readFileSync(require.resolve('../audio.js'), 'utf8') + '\nthis.Engine=SoundEngine;', globals);
    const engine = new globals.Engine(); engine.ctx = ctx;
    return { engine, ctx, globals, created: () => created, buffers: () => buffers };
}

test('effect storm is bounded, noise buffer reused, voices recover after expiry', () => {
    const { engine, ctx, created, buffers } = audio();
    for (let i = 0; i < 1000; i++) { engine.explosion(); engine.hit(); engine.shoot(); }
    assert.ok(created() <= 8, 'same-instant duplicates must be coalesced');
    assert.equal(buffers(), 1);
    for (let i = 0; i < 1000; i++) engine.playTone(440, 'sine', 0.1);
    assert.equal(engine.sfxVoices.length, 24);
    ctx.currentTime = 2;
    engine.playTone(440);
    assert.equal(engine.sfxVoices.length, 1);
    engine.isMuted = true;
    const before = created(); engine.explosion(); engine.playNoise();
    assert.equal(created(), before);
    assert.equal(engine.isBgmEnabled, false);
});

test('low quality limits effect voices to 12 and suspended audio does not queue', () => {
    const { engine, globals, ctx, created } = audio();
    globals.window.game.performanceManager.quality = 0;
    for (let i = 0; i < 100; i++) engine.playTone(440);
    assert.equal(created(), 12);
    ctx.currentTime = 10; ctx.state = 'suspended';
    engine.playTone(440); engine.explosion();
    assert.equal(created(), 12);
});

test('particle palette cache and added sparkle draw calls stay bounded', () => {
    const globals = vm.createContext({ Math });
    vm.runInContext(fs.readFileSync(require.resolve('../effects.js'), 'utf8') + '\nthis.Renderer=EffectsRenderer;', globals);
    const game = { particles: [], performanceManager: { quality: 2 } };
    const renderer = new globals.Renderer(game);
    let strokes = 0;
    const ctx = new Proxy({}, { get: (_, k) => () => { if (k === 'stroke') strokes++; }, set: () => true });
    for (let frame = 0; frame < 200; frame++) {
        game.particles = [{ x: 1, y: 2, size: 3, color: `rgb(${frame},0,0)` }];
        renderer.drawParticles(ctx);
        assert.ok(renderer._particleBuckets.size <= 2);
    }
    assert.equal(strokes, 200);
    game.performanceManager.quality = 0;
    renderer.drawParticles(ctx);
    assert.equal(strokes, 200);
});
