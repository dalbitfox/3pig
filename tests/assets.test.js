const test = require('node:test');
const assert = require('node:assert/strict');
const { GameAssetManager } = require('../assets.js');

class FakeImage {
    constructor() {
        this.complete = false;
        this.naturalWidth = 0;
        this.listeners = {};
    }

    set src(value) {
        this._src = value;
        this.complete = true;
        this.naturalWidth = 32;
    }

    get src() { return this._src; }
    addEventListener(type, callback) { this.listeners[type] = callback; }
}

test('asset manager decodes each image URL once', () => {
    const assets = new GameAssetManager(FakeImage);
    const first = assets.image('wolf.png');
    const second = assets.image('wolf.png');
    assert.equal(first, second);
    assert.equal(assets.imagesByUrl.size, 1);
});

test('asset maps and preload reuse the shared cache', async () => {
    const assets = new GameAssetManager(FakeImage);
    const map = assets.imageMap({ wolf: 'wolf.png', boss: 'boss.png' });
    const progress = [];
    await assets.preload(['wolf.png', 'boss.png', 'wolf.png'], (loaded, total) => {
        progress.push([loaded, total]);
    });

    assert.equal(map.wolf, assets.image('wolf.png'));
    assert.equal(assets.imagesByUrl.size, 2);
    assert.deepEqual(progress.at(-1), [2, 2]);
});
