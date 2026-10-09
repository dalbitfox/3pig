/**
 * Runtime performance services kept outside the game rules:
 * - X-axis enemy broad phase for projectile collisions
 * - adaptive render cadence and cosmetic budgets
 * - collection caps to prevent effect storms and GC spikes
 */
class EnemySpatialIndex {
    constructor(cellSize = 128, minX = -256, maxX = 1664) {
        this.cellSize = cellSize;
        this.minX = minX;
        this.bucketCount = Math.ceil((maxX - minX) / cellSize) + 1;
        this.buckets = Array.from({ length: this.bucketCount }, () => []);
        this.queryResult = [];
    }

    bucketIndex(x) {
        return Math.max(0, Math.min(this.bucketCount - 1, Math.floor((x - this.minX) / this.cellSize)));
    }

    rebuild(enemies) {
        for (let i = 0; i < this.buckets.length; i++) this.buckets[i].length = 0;
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy || enemy.isDead || enemy.hp <= 0) continue;
            this.buckets[this.bucketIndex(enemy.x)].push(enemy);
        }
    }

    queryX(x, radius) {
        const result = this.queryResult;
        result.length = 0;
        const start = this.bucketIndex(x - radius);
        const end = this.bucketIndex(x + radius);
        for (let bucketIndex = start; bucketIndex <= end; bucketIndex++) {
            const bucket = this.buckets[bucketIndex];
            for (let i = 0; i < bucket.length; i++) {
                const enemy = bucket[i];
                if (Math.abs(enemy.x - x) <= radius) result.push(enemy);
            }
        }
        return result;
    }
}

class GamePerformanceManager {
    constructor() {
        this.enemyIndex = new EnemySpatialIndex();
        this.averageFrameMs = 16.7;
        this.prefersReducedMotion = typeof window !== 'undefined'
            && typeof window.matchMedia === 'function'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.maxQuality = this.prefersReducedMotion ? 1 : 2;
        this.quality = this.maxQuality; // 2=high, 1=balanced, 0=performance
        this.frameCount = 0;
        this.lastFrameAt = 0;
        this.lastRenderAt = 0;
        this.lastUiAt = 0;
    }

    beginFrame(timestamp) {
        if (this.lastFrameAt > 0) {
            const elapsed = timestamp - this.lastFrameAt;
            if (elapsed > 0 && elapsed < 250) {
                this.averageFrameMs = this.averageFrameMs * 0.92 + elapsed * 0.08;
            }
        }
        this.lastFrameAt = timestamp;
        this.frameCount++;

        // Hysteresis prevents quality from oscillating around one threshold.
        if (this.frameCount % 30 === 0) {
            if (this.averageFrameMs > 31) this.quality = 0;
            else if (this.averageFrameMs > 22) this.quality = Math.min(this.quality, 1);
            else if (this.averageFrameMs < 18.5) this.quality = Math.min(this.maxQuality, this.quality + 1);
        }
    }

    shouldRender(timestamp) {
        const minimumGap = this.quality === 0 ? 30 : 0;
        if (minimumGap && timestamp - this.lastRenderAt < minimumGap) return false;
        this.lastRenderAt = timestamp;
        return true;
    }

    shouldUpdateUi(timestamp) {
        if (timestamp - this.lastUiAt < 100) return false;
        this.lastUiAt = timestamp;
        return true;
    }

    get cosmeticScale() {
        return this.quality === 2 ? 1 : (this.quality === 1 ? 0.65 : 0.35);
    }

    get particleLimit() {
        return this.quality === 2 ? 64 : (this.quality === 1 ? 44 : 28);
    }

    rebuildEnemyIndex(enemies) {
        this.enemyIndex.rebuild(enemies);
    }

    nearbyEnemiesX(x, radius) {
        return this.enemyIndex.queryX(x, radius);
    }

    trimEffects(game) {
        const limits = {
            particles: this.particleLimit,
            floatingTexts: this.quality === 0 ? 10 : 16,
            confetti: this.quality === 0 ? 18 : 35,
            comicExplosions: this.quality === 0 ? 8 : 14,
            secondaryClusters: this.quality === 0 ? 18 : 32
        };
        Object.keys(limits).forEach(key => {
            const collection = game[key];
            const limit = limits[key];
            if (!collection || collection.length <= limit) return;
            const firstKept = collection.length - limit;
            for (let i = 0; i < limit; i++) collection[i] = collection[i + firstKept];
            collection.length = limit;
        });
    }
}

if (typeof window !== 'undefined') {
    window.EnemySpatialIndex = EnemySpatialIndex;
    window.GamePerformanceManager = GamePerformanceManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnemySpatialIndex, GamePerformanceManager };
}
