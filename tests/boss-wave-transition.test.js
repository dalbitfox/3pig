const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadEnemies() {
    const context = vm.createContext({ window: {}, Math, soundEngine: {} });
    vm.runInContext(fs.readFileSync(require.resolve('../enemies.js'), 'utf8') +
        '\nthis.bossTypes = { BossWolf, MidBossWolf };', context);
    return context.bossTypes;
}

for (const [name, Boss] of Object.entries(loadEnemies())) {
    for (const outcome of ['landing', 'offscreen']) {
        test(`${name} killed in tornado finishes ${outcome} and permits endless wave transition`, () => {
            const boss = new Boss(900, 500);
            const game = { particles: [], floatingTexts: [] };
            boss.launchAirborne(outcome === 'offscreen' ? 100 : 0, -12, game);
            boss.hp = 0;
            boss.isDead = true;
            for (let frame = 0; frame < 180 && boss.tornadoState.active; frame++) {
                boss.update(16.6, game);
            }
            assert.equal(boss.tornadoState.active, false, 'dead boss must finish flight');

            // Execute the production enemy cleanup and wave transition logic.
            const source = fs.readFileSync(require.resolve('../game.js'), 'utf8');
            const cleanup = source.slice(source.indexOf('        // 적 업데이트 (회오리바람'), source.indexOf('        // 동전 집 안으로'));
            const transition = source.slice(source.indexOf('        // 웨이브 스폰 처리'), source.indexOf('        // 구름 이동'));
            for (const wave of [20, 30, 100]) {
                const state = {
                    enemies: [boss], waveEnemiesToSpawn: [], waveInProgress: true,
                    spawnTimer: 0, mode: 'ENDLESS', wave, unlockedTitles: ['nuclear_beginner'],
                    gold: 0, getGoldGain: x => x, checkAllMaxed: () => false,
                    showBanner() {}, startWave(next) { this.wave = next; }
                };
                const ctx = vm.createContext({ game: state, dt: 16.6, soundEngine: { victory() {} } });
                vm.runInContext('(function(){' + cleanup + transition + '}).call(game)', ctx);
                assert.equal(state.enemies.length, 0);
                assert.equal(state.waveInProgress, false);
                assert.equal(state.waveTransitionTimer, 2200);
                ctx.dt = 2200;
                vm.runInContext('(function(){' + transition + '}).call(game)', ctx);
                assert.equal(state.wave, wave + 1);
            }
        });
    }
    test(`${name} alive in tornado cannot attack or summon during flight`, () => {
        const boss = new Boss(900, 500);
        boss.launchAirborne(0, -12, {});
        boss.update(16.6, { particles: [] });
        assert.equal(boss.tornadoState.active, true);
        assert.ok(boss.y < 500);
        assert.equal(boss.isEnraged, false);
    });
}
