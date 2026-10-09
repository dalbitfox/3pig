const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load() {
    const ctx = vm.createContext({ window: {}, Math, V_WIDTH: 1280,
        soundEngine: { startMidBossBGM() {}, startFinalBossBGM() {} },
        DIFFICULTY_CONFIG: Object.fromEntries(['easy', 'normal', 'hard', 'endless'].map(name => [name, {
            name, hpMul: 1, speedMul: 1, bossHp: 4800, bossDamage: 1.1,
            skillIgnoreChance: 0.3, normalDodgeChance: 0.2, bossCastleAttackPct: 0.3
        }]))
    });
    vm.runInContext(fs.readFileSync(require.resolve('../enemies.js'), 'utf8'), ctx);
    const gameSource = fs.readFileSync(require.resolve('../game.js'), 'utf8');
    vm.runInContext(gameSource.slice(0, gameSource.indexOf('const game = new Game();')) + '\nthis.GameType = Game;', ctx);
    return ctx;
}

test('final boss marches 12 percent faster than midboss in all modes and endless tiers', () => {
    const ctx = load();
    for (const currentDiff of ['easy', 'normal', 'hard', 'endless']) {
        for (const mode of ['STORY', 'ENDLESS']) {
            for (const wave of [10, 20, 100, 110, 200]) {
                const game = Object.create(ctx.GameType.prototype);
                Object.assign(game, { currentDiff, mode, wave, enemies: [], updateBGMButton() {} });
                game.spawnEnemy('midboss');
                game.spawnEnemy('boss');
                const [mid, boss] = game.enemies;
                assert.ok(Math.abs(boss.baseSpeed / mid.baseSpeed - 1.12) < 1e-12);
                assert.equal(boss.speed, boss.baseSpeed);
                assert.equal(boss.y, 510);
                assert.equal(boss.w, 218 * 1.2);
                assert.equal(boss.h, 258 * 1.2);
            }
        }
    }
});

test('final boss rendering scales around its feet for sprite and image paths', () => {
    const ctx = load();
    const boss = vm.runInContext('new BossWolf(900, 424)', ctx);
    for (const sprite of [false, true]) {
        const calls = [];
        const drawCtx = new Proxy({}, { get: (_, key) => (...args) => calls.push([key, ...args]), set: () => true });
        boss.animator = sprite ? { isReady: true, draw: (...args) => calls.push(['sprite', ...args.slice(1)]) } : null;
        boss.draw(drawCtx, { wolfImages: { boss: { complete: true, naturalWidth: 390 } } });
        assert.deepEqual(calls.slice(0, 4), [
            ['save'], ['translate', 900, 424], ['scale', 1.2, 1.2], ['translate', -900, -424]
        ]);
    }
});
