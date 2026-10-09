/**
 * Shared image registry.
 * Every renderer asks this module for images so identical URLs are decoded once.
 */
class GameAssetManager {
    constructor(ImageCtor = typeof Image !== 'undefined' ? Image : null) {
        this.ImageCtor = ImageCtor;
        this.imagesByUrl = new Map();
    }

    image(src) {
        if (!src || !this.ImageCtor) return null;
        let image = this.imagesByUrl.get(src);
        if (!image) {
            image = new this.ImageCtor();
            image.decoding = 'async';
            image.src = src;
            this.imagesByUrl.set(src, image);
        }
        return image;
    }

    imageMap(manifest) {
        const result = {};
        Object.keys(manifest).forEach(key => {
            result[key] = this.image(manifest[key]);
        });
        return result;
    }

    preload(sources, onProgress) {
        const uniqueSources = [...new Set(sources)];
        let loaded = 0;
        const total = uniqueSources.length;

        if (total === 0) return Promise.resolve([]);

        return Promise.all(uniqueSources.map(src => new Promise(resolve => {
            const image = this.image(src);
            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                loaded++;
                if (onProgress) onProgress(loaded, total, src);
                resolve(image);
            };

            // complete=true also covers a cached load failure; preload must never hang.
            if (!image || image.complete) {
                finish();
                return;
            }

            image.addEventListener('load', finish, { once: true });
            image.addEventListener('error', finish, { once: true });
        })));
    }
}

const gameAssets = new GameAssetManager();

if (typeof window !== 'undefined') {
    window.GameAssetManager = GameAssetManager;
    window.gameAssets = gameAssets;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameAssetManager };
}
