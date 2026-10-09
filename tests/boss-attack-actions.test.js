const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load() {
    const ctx = vm.createContext({ window: {}, Math, performance: { now: () => 0 },
        soundEngine: { bossAlert() {}, wolfWind() {}, explosion() {} } });
    vm.runInContext(fs.readFileSync(require.resolve('../enemies.js'), 'utf8'), ctx);
    const source = fs.readFileSync(require.resolve('../game.js'), 'utf8');
    vm.runInContext(source.slice(0, source.indexOf('const game = new Game();')) + '\nthis.GameType=Game;this.Boss=BossWolf;', ctx);
    vm.runInContext(fs.readFileSync(require.resolve('../effects.js'), 'utf8') + '\nthis.Renderer=EffectsRenderer;', ctx);
    return ctx;
}

test('laser waits for range, stays at the gem, and deals damage only once', () => {
    const ctx = load();
    const boss = new ctx.Boss(1000, 424);
    const game = { house: { x: 0, w: 100, y: 200, hp: 1000, tier: 1, invincibleTimer: 0 },
        particles: [], showBanner() {}, triggerScreenShake() {} };
    boss.attackPatternTimer = 4999;
    boss.update(16.6, game);
    assert.equal(boss.laserCharging, false);
    boss.x = 700;
    boss.update(16.6, game);
    assert.equal(boss.laserCharging, true);
    const lockedX = boss.x;
    boss.update(1200, game);
    assert.equal(boss.x, lockedX);
    assert.equal(boss.laserBeamActive, true);
    const hp = game.house.hp;
    assert.equal(hp, 1000 - Math.round(38 * boss.damageMul));
    boss.update(16.6, game);
    assert.equal(game.house.hp, hp);
    const calls = [];
    const drawCtx = new Proxy({}, { get: (_, key) => (...args) => calls.push([key, ...args]), set: () => true });
    game.enemies = [boss];
    new ctx.Renderer(game).drawBossLaser(drawCtx);
    const origin = boss.getLaserOrigin();
    assert.deepEqual(calls.filter(x => x[0] === 'moveTo'), Array(3).fill(['moveTo', origin.x, origin.y]));
    assert.deepEqual(calls.filter(x => x[0] === 'lineTo'), Array(3).fill(['lineTo', 100, 240]));
});

for (const dt of [8.3, 16.6, 50]) {
    test(`meteor rises above boss, dives at 75 degrees, and hits once (${dt}ms frames)`, () => {
        const ctx = load();
        const game = Object.create(ctx.GameType.prototype);
        Object.assign(game, { house: { x: 100, w: 180, y: 180 }, boulders: [], showBanner() {} });
        game.throwBossBoulder(900, 94, 1.1);
        const meteor = game.boulders[0];
        const startY = meteor.y;
        game.updateBossMeteor(meteor, dt);
        assert.equal(meteor.x, 900);
        assert.ok(meteor.y < startY);
        let sawDive = false;
        for (let frame = 0; frame < 2000 && !meteor.impacted; frame++) {
            game.updateBossMeteor(meteor, dt);
            if (meteor.phase === 'dive' && meteor.vy > 0) {
                sawDive = true;
                assert.ok(Math.abs(Math.atan2(meteor.vy, Math.abs(meteor.vx)) * 180 / Math.PI - 75) < 1e-9);
            }
        }
        assert.ok(sawDive);
        assert.equal(meteor.impacted, true);
        assert.equal(meteor.x, 280);
        assert.equal(meteor.y, 220);
        const x = meteor.x, y = meteor.y;
        game.updateBossMeteor(meteor, 50);
        assert.equal(meteor.x, x);
        assert.equal(meteor.y, y);
    });
}
