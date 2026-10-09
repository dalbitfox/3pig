const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(roll) {
    const ctx = vm.createContext({ window: {}, Math: Object.assign(Object.create(Math), { random: () => roll }), soundEngine: {} });
    vm.runInContext(fs.readFileSync(require.resolve('../enemies.js'), 'utf8') + '\nthis.Boss = BossWolf;', ctx);
    const boss = new ctx.Boss(1000, 500);
    const shots = [];
    const game = { house: { x: 0, w: 100 }, particles: [], showBanner() {}, throwBossBoulder: (...args) => shots.push(args) };
    return { boss, game, shots };
}

test('final boss ranged chance is exactly 30 percent at each 3 second opportunity', () => {
    let fired = 0;
    for (let i = 0; i < 100; i++) {
        const { boss, game, shots } = setup(i / 100);
        boss.rangedAttackTimer = 2980;
        boss.update(10, game);
        assert.equal(shots.length, 0);
        boss.update(10, game);
        assert.equal(shots.length, i < 30 ? 1 : 0);
        if (shots.length) assert.deepEqual(shots[0], [boss.x, boss.y - boss.h - 20, boss.damageMul]);
        assert.equal(boss.rangedAttackTimer, 0);
        boss.update(10, game);
        assert.equal(shots.length, i < 30 ? 1 : 0);
        fired += shots.length;
    }
    assert.equal(fired, 30);
});

for (const state of ['dead', 'airborne', 'laser']) {
    test(`extra ranged attack pauses while ${state}`, () => {
        const { boss, game, shots } = setup(0);
        boss.rangedAttackTimer = 2999;
        if (state === 'dead') { boss.isDead = true; boss.hp = 0; }
        if (state === 'airborne') boss.launchAirborne(0, -10, game);
        if (state === 'laser') { boss.laserBeamActive = true; boss.laserBeamTimer = 1000; }
        boss.update(16.6, game);
        assert.equal(shots.length, 0);
        assert.equal(boss.rangedAttackTimer, 2999);
    });
}
