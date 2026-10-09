/**
 * game.js
 * 메인 게임 엔진 코어 컨트롤러 (상태, 입력, 웨이브 스폰, 스킬, 업그레이드)
 * 렌더링 시스템은 constants.js, background.js, house.js, enemies.js, effects.js로 모듈화 분리 완료
 */

class Game {
    constructor() {
        this.state = GameState.MENU;
        this.mode = 'STORY'; // 'STORY' 또는 'ENDLESS'
        this.currentDiff = 'easy';
        this.selectedDiff = 'easy';
        this.unlockedDiff = localStorage.getItem('pigs_unlocked_diff') || 'easy';
        this.wave = 1;
        this.maxStoryWave = 10;

        // 모듈화된 전용 서브 렌더러 인스턴스화
        this.bgRenderer = new BackgroundRenderer(this);
        this.houseRenderer = new HouseRenderer(this);
        this.effectsRenderer = new EffectsRenderer(this);
        this.performanceManager = new GamePerformanceManager();
        this.score = 0;
        this.gold = 50;

        // 마우스 좌표 (캔버스 내부 좌표 기준)
        this.mouse = { x: V_WIDTH / 2, y: V_HEIGHT / 2, isDown: false };
        this.lastShootTime = 0;
        this.isTurbo = false; // ⚡ 도토리 자동 연속 발사 터보 모드 상태

        // 신축 집 (Base) - 15% 확대 (w: 215, h: 278) 및 바닥 접지선(534) 일치 (y: 256)
        this.house = {
            tier: 1, // 1: 짚집, 2: 통나무집, 3: 콘크리트 성채
            x: 85,
            y: 256, // 534 - 278 = 256 (지면 완벽 일치)
            w: 215, // 15% 추가 확대 (187 -> 215)
            h: 278, // 15% 추가 확대 (242 -> 278)
            hp: 150,
            maxHp: 150,
            shake: 0,
            autoRepairRate: 0, // 초당 회복량
            invincibleTimer: 0, // 3성 셋째 무적 방어막 지속시간 ms
            repairFxTimer: 0 // 치유 룬 & 균열 봉합 이펙트 타이머 ms
        };
        this.reconstruction = null; // 신축 공사 연출 객체

        // 아기돼지 삼형제 각각의 골드 승급 성급 (1: 1성, 2: 2성, 3: 3성 MAX)
        this.pigRanks = {
            1: 1, // 첫째 돼지 (짚의 명인)
            2: 1, // 둘째 돼지 (도토리 명사수)
            3: 1  // 셋째 돼지 (벽돌 마스터)
        };

        // 상점 현재 탭 ('house' 또는 'pigs')
        this.shopActiveTab = 'house';

        // 업그레이드 수치
        this.upgrades = {
            damageLevel: 1,
            attackSpeedLevel: 1,
            cooldownLevel: 1,
            autoRepairLevel: 0
        };

        // 삼형제 스킬 상태 (남은 쿨타임 ms)
        this.skills = {
            1: { name: '짚단 굴리기', maxCd: 9000, currentCd: 0, icon: '🌾' },
            2: { name: '도토리 폭격', maxCd: 11000, currentCd: 0, icon: '🌰' },
            3: { name: '뚝딱 수리&솥', maxCd: 16000, currentCd: 0, icon: '🧱' },
            4: { name: '천지개벽 대회오리', maxCd: 35000, currentCd: 0, icon: '🌪️' }
        };

        // 궁극기 해금 상태 및 모든 능력 MAX 이력 (로컬스토리지 영구 저장)
        this.everMaxedAll = localStorage.getItem('pigs_ever_maxed_all') === 'true';
        this.ultimateUnlocked = localStorage.getItem('pigs_ultimate_unlocked') === 'true';

        // 삼형제 공식 캐릭터 일러스트 이미지 로드
        this.pigImages = gameAssets.imageMap({
            1: 'assets/pig1.png',
            2: 'assets/pig2.png',
            3: 'assets/pig3.png'
        });

        // 늑대 군단 공식 캐릭터 일러스트 스프라이트 이미지 로드
        this.wolfImages = gameAssets.imageMap({
            normal: 'assets/wolf_normal.png',
            skater: 'assets/wolf_skater.png',
            granny: 'assets/wolf_granny.png',
            balloon: 'assets/wolf_balloon.png',
            blower: 'assets/wolf_blower.png',
            midboss: 'assets/wolf_midboss.png',
            boss: 'assets/wolf_boss.png',
            balloon_ground: 'assets/wolf_balloon_ground.png',
            granny_revealed: 'assets/wolf_granny_revealed.png'
        });

        // 🏠 아기돼지 삼형제 집 3단계 고화질 공식 일러스트 이미지 로드
        this.houseImages = gameAssets.imageMap({
            1: 'assets/house_straw.png',
            2: 'assets/house_wood.png',
            3: 'assets/house_brick.png'
        });

        // 🌄 동화 만화풍 분리형 배경화면 레이어 로드 (원경 하늘·산 + 중경 숲과 언덕 + 근경 흙길·잔디)
        this.bgImages = gameAssets.imageMap({
            sky: 'assets/bg_sky.png',
            forestMid: 'assets/bg_forest_mid.png',
            ground: 'assets/bg_ground.png'
        });

        // 🌰 둘째 돼지 기본 사격 도토리 탄환 3단계 스프라이트
        this.projImages = gameAssets.imageMap({
            1: 'assets/proj_acorn_1.png',
            2: 'assets/proj_acorn_2.png',
            3: 'assets/proj_acorn_3.png'
        });

        // 🌾 첫째 돼지 1스킬 짚단 굴리기 3성 스프라이트
        this.strawImages = gameAssets.imageMap({
            1: 'assets/straw_roll_1.png',
            2: 'assets/straw_roll_2.png',
            3: 'assets/straw_roll_3.png'
        });

        // 💣 둘째 돼지 2스킬 도토리 폭격 3성 스프라이트 & 만화 폭발 FX
        this.bombImages = gameAssets.imageMap({
            1: 'assets/bomb_acorn_1.png',
            2: 'assets/bomb_acorn_2.png',
            3: 'assets/bomb_acorn_3.png'
        });

        this.fxBoomImage = gameAssets.image('assets/fx_comic_boom.png');

        // 삼형제 실시간 모션 & 반응 액션 애니메이션 상태
        this.pigAnim = {
            1: { bounce: 0, recoil: 0, rot: 0 },
            2: { bounce: 0, recoil: 0, rot: 0 },
            3: { bounce: 0, recoil: 0, rot: 0 }
        };

        // 삼형제 고유 기능 & 스킬 Sprite Sheet 기반 프레임 애니메이터 초기화
        this.pigAnimators = null;
        if (window.PigSpriteSystem) {
            this.pigAnimators = {
                1: new window.PigSpriteSystem.PigAnimator(1),
                2: new window.PigSpriteSystem.PigAnimator(2),
                3: new window.PigSpriteSystem.PigAnimator(3)
            };
        }

        // 삼형제 스킬 발사 시 지속 액션 및 모션 타이머
        this.pig1SkillTimer = 0;
        this.pig3SkillTimer = 0;
        this.pig3SkillType = null; // 'repair' | 'shield'

        // 엔티티 컬렉션
        this.projectiles = [];
        this.antiAirRockets = []; // 셋째 돼지 마스터 대공 요격 로켓 컬렉션
        this.pig3AntiAirTimer = 0; // 대공 방공망 지속 시간
        this.pig3AntiAirAutoTimer = 0; // 대공 방공망 자동 발사 인터벌
        this.fallingBombs = []; // 공중 낙하 도토리 폭탄 컬렉션
        this.comicExplosions = []; // 만화 폭발 버섯구름 & 충격파 컬렉션
        this.enemies = [];
        this.particles = [];
        this.floatingTexts = [];
        this.coins = [];
        this.strawRolls = [];
        this.boulders = [];
        this.cosmicStorms = []; // 천지개벽 대회오리 폭풍 컬렉션
        this.confetti = [];
        this.cauldronFire = 0; // 셋째 가마솥 활성 남은 시간

        // 🐷 삼형제 개별스킬 MAX 2단계 연계 콤보 스킬 상태 (0: 미습득, 1: 1단계, 2: 2단계 MAX)
        this.pigComboSkills = { 1: 0, 2: 0, 3: 0 };
        this.pigSpeedBuffTimer = 0; // 셋째 콤보 공속 버프 타이머

        // ⚡ 스탯 ALL MAX 신성 각성 (5초 주기 50% 확률 자동 벼락/지진 공격) 타이머
        this.statMaxTimer = 0;

        // 🌟 신규 연계 콤보 & 스탯 각성 엔티티 컬렉션
        this.groundFireTrails = []; // 첫째: 화염 가시 장판
        this.secondaryClusters = []; // 둘째: 2차 유탄 클러스터 파편
        this.sulfurMines = []; // 둘째: 바닥 유황 지뢰
        this.steamPulses = []; // 셋째: 요새 고압 증기 펄스 & 플라즈마 충격파
        this.lavaMortars = []; // 셋째: 가마솥 용암 대공포 3연발
        this.divineLightnings = []; // 스탯 MAX: 천벌의 벼락

        // 웨이브 스폰 매니저
        this.waveEnemiesToSpawn = [];
        this.spawnTimer = 0;
        this.waveInProgress = false;
        this.waveTransitionTimer = 0;
        this.bossSpawned = false;

        // 구름 배경
        this.clouds = [
            { x: 100, y: 70, speed: 0.25, size: 45 },
            { x: 450, y: 120, speed: 0.18, size: 55 },
            { x: 850, y: 60, speed: 0.3, size: 40 },
            { x: 1100, y: 140, speed: 0.22, size: 50 }
        ];

        // 밤하늘 별무리 (밤/황혼/종말 전장 테마용)
        this.stars = [];
        for (let i = 0; i < 75; i++) {
            this.stars.push({
                x: Math.random() * V_WIDTH,
                y: Math.random() * 380,
                size: Math.random() * 2.2 + 0.8,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 2.5 + 1.2
            });
        }

        // 스테이지 환경 앰비언트 파티클 (민들레 홀씨, 나뭇잎, 반딧불이, 화염 잉걸불 등)
        this.envParticles = [];
        this.envParticleTimer = 0;

        // 아기돼지 삼형제의 말풍선 목록
        this.pigSpeeches = [];

        // 영구 메타 코인 금고 및 골드 배율 버프 (100G = +1% 영구 골드 버프, 최대 200%)
        this.metaBankGold = parseInt(localStorage.getItem('pigs_meta_bank_gold') || '0', 10);
        this.metaGoldBonus = Math.min(200, parseInt(localStorage.getItem('pigs_meta_gold_bonus') || '0', 10));
        // 일반공격 적 밀치기 (넉백) 확률: 750G당 +1%, 최대 15% (맵 10분의 2 = 256px 넉백)
        this.metaKnockbackChance = parseInt(localStorage.getItem('pigs_meta_knockback_chance') || '0', 10);
        if (isNaN(this.metaKnockbackChance)) this.metaKnockbackChance = 0;
        this.metaKnockbackChance = Math.max(0, Math.min(15, this.metaKnockbackChance));

        // 무한 모드 전용 투사체 데미지 강화: 1%당 5,000G, 최대 +1000%
        this.endlessDamagePercent = parseInt(localStorage.getItem('pigs_endless_damage_pct') || '0', 10);
        if (isNaN(this.endlessDamagePercent)) this.endlessDamagePercent = 0;
        this.endlessDamagePercent = Math.min(1000, Math.max(0, this.endlessDamagePercent));

        // 칭호 시스템: 무한모드 100W 클리어 시 핵초보 해금 -> 100만G(핵핵초보) -> 100만G(핵핵핵초보) -> 1000만G(윤석열) -> 1억G(윤석열 꼬추)
        this.unlockedTitles = JSON.parse(localStorage.getItem('pigs_unlocked_titles') || '[]');
        this.currentTitle = localStorage.getItem('pigs_current_title') || '';

        this.ultimateCinematic = 0; // 전설의 궁극기 시네마틱 컷인 프레임

        this.lastTime = performance.now();
        this.initEventListeners();
        this.startActiveTab = 'play';
        this.updateDiffCardsUI();
        this.renderMenuMetaUI();
        this.updateHUD();
        this.switchStartTab('play');
        this.initAssetPreloader();
    }

    // 핵심 그래픽 리소스 사전 프리로딩 및 진행률 표시기
    initAssetPreloader() {
        const startBtn = document.getElementById('start-btn');
        const preloadContainer = document.getElementById('asset-preload-container');
        const barFill = document.getElementById('preload-bar-fill');
        const percentText = document.getElementById('preload-percent-text');

        const coreAssets = [
            'bg_stage1_meadow.jpg',
            'bg_stage2_windmill.jpg',
            'bg_stage3_rainbow.jpg',
            'bg_stage4_sunflower.jpg',
            'bg_stage5_mushroom.jpg',
            'bg_stage6_cottoncandy.jpg',
            'bg_stage7_crystal.jpg',
            'bg_stage8_emerald.jpg',
            'bg_stage9_twilight.jpg',
            'bg_stage10_carnival.jpg',
            'assets/pig1.png',
            'assets/pig2.png',
            'assets/pig3.png',
            'assets/wolf_normal.png',
            'assets/wolf_skater.png',
            'assets/house_straw.png',
            'assets/house_wood.png',
            'assets/house_brick.png'
        ];

        let loadedCount = 0;
        let isComplete = false;

        const completePreload = () => {
            if (isComplete) return;
            isComplete = true;
            if (barFill) barFill.style.width = '100%';
            if (percentText) percentText.innerText = '100% 준비 완료!';
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.innerHTML = '🚀 게임 시작하기';
            }
            if (preloadContainer) {
                setTimeout(() => {
                    preloadContainer.style.transition = 'opacity 0.4s ease';
                    preloadContainer.style.opacity = '0';
                    setTimeout(() => {
                        preloadContainer.style.display = 'none';
                    }, 400);
                }, 400);
            }
        };

        const onAssetLoaded = (loaded, total) => {
            loadedCount = loaded;
            const pct = Math.min(100, Math.round((loaded / total) * 100));
            if (barFill) barFill.style.width = `${pct}%`;
            if (percentText) percentText.innerText = `${pct}%`;
            if (startBtn && startBtn.disabled) {
                startBtn.innerHTML = `⏳ 리소스 준비 중... (${pct}%)`;
            }
            if (loadedCount >= coreAssets.length) {
                completePreload();
            }
        };

        // 공용 이미지 캐시를 통해 병렬 로드한다. 동일 URL은 한 번만 디코딩된다.
        gameAssets.preload(coreAssets, onAssetLoaded).then(completePreload);

        // 3.5초 안전 타임아웃: 네트워크 지연이나 누락 시에도 무조건 게임 시작 가능하도록 폴백 해제
        setTimeout(() => {
            completePreload();
        }, 3500);
    }

    // 골드 획득 시 영구 메타 버프(+1% ~ +200% MAX) 배율 적용
    getGoldGain(baseAmount) {
        const bonusMul = 1 + (this.metaGoldBonus / 100);
        return Math.max(1, Math.round(baseAmount * bonusMul));
    }

    // 메타 골드 버프 투자 (100골드 = +1%, 최대 200%)
    investMetaGold(percent) {
        if (this.metaGoldBonus >= 200) {
            soundEngine.playNoise(0.2, 0.15, 300);
            alert("골드 보너스가 이미 최대치(200%)에 도달했습니다!");
            return;
        }
        const maxCanAdd = 200 - this.metaGoldBonus;
        const actualAdd = Math.min(percent, maxCanAdd);
        const cost = actualAdd * 100;
        if (this.metaBankGold >= cost) {
            this.metaBankGold -= cost;
            this.metaGoldBonus += actualAdd;
            localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
            localStorage.setItem('pigs_meta_gold_bonus', this.metaGoldBonus);
            soundEngine.metaInvest();
            this.renderMenuMetaUI();
            this.updateHUD();
        } else {
            soundEngine.playNoise(0.2, 0.15, 300);
            alert(`금고 골드가 부족합니다!\n필요: ${cost.toLocaleString()}G / 보유: ${this.metaBankGold.toLocaleString()}G\n게임이나 무한모드를 플레이하여 골드를 모아보세요.`);
        }
    }

    // 메타 골드 전액 올인 투자 (최대 200% 상한)
    investAllMetaGold() {
        if (this.metaGoldBonus >= 200) {
            soundEngine.playNoise(0.2, 0.15, 300);
            alert("골드 보너스가 이미 최대치(200%)에 도달했습니다!");
            return;
        }
        const maxCanAdd = 200 - this.metaGoldBonus;
        const affordable = Math.floor(this.metaBankGold / 100);
        const percent = Math.min(maxCanAdd, affordable);
        if (percent > 0) {
            const cost = percent * 100;
            this.metaBankGold -= cost;
            this.metaGoldBonus += percent;
            localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
            localStorage.setItem('pigs_meta_gold_bonus', this.metaGoldBonus);
            soundEngine.metaInvest();
            this.renderMenuMetaUI();
            this.updateHUD();
        } else {
            soundEngine.playNoise(0.2, 0.15, 300);
            alert("투자할 수 있는 골드가 부족합니다! (최소 100G 필요)");
        }
    }

    // 🔥 무한 모드 전용 투사체 데미지 강화 (1%당 5,000G, 최대 +1000%)
    investEndlessDamage(amount) {
        if (this.endlessDamagePercent >= 1000) {
            soundEngine.playNoise(0.2, 0.15, 300);
            alert("무한 모드 투사체 데미지가 이미 최대치(+1,000%)에 도달했습니다!");
            return;
        }
        const maxAdd = 1000 - this.endlessDamagePercent;
        const actualAdd = Math.min(amount, maxAdd);
        const cost = actualAdd * 5000;
        if (this.metaBankGold >= cost) {
            this.metaBankGold -= cost;
            this.endlessDamagePercent += actualAdd;
            localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
            localStorage.setItem('pigs_endless_damage_pct', this.endlessDamagePercent);
            soundEngine.metaInvest();
            this.renderMenuMetaUI();
            this.updateHUD();
        } else {
            soundEngine.playNoise(0.2, 0.15, 300);
            alert(`금고 골드가 부족합니다!\n필요: ${cost.toLocaleString()}G / 보유: ${this.metaBankGold.toLocaleString()}G`);
        }
    }

    investAllEndlessDamage() {
        if (this.endlessDamagePercent >= 1000) {
            soundEngine.playNoise(0.2, 0.15, 300);
            alert("무한 모드 투사체 데미지가 이미 최대치(+1,000%)에 도달했습니다!");
            return;
        }
        const maxAdd = 1000 - this.endlessDamagePercent;
        const affordable = Math.floor(this.metaBankGold / 5000);
        const actualAdd = Math.min(maxAdd, affordable);
        if (actualAdd > 0) {
            const cost = actualAdd * 5000;
            this.metaBankGold -= cost;
            this.endlessDamagePercent += actualAdd;
            localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
            localStorage.setItem('pigs_endless_damage_pct', this.endlessDamagePercent);
            soundEngine.metaInvest();
            this.renderMenuMetaUI();
            this.updateHUD();
        } else {
            soundEngine.playNoise(0.2, 0.15, 300);
            alert("강화할 수 있는 골드가 부족합니다! (최소 5,000G 필요)");
        }
    }

    // 👑 칭호 획득 및 승급 시스템
    unlockTitle(titleId) {
        if (!this.unlockedTitles.includes(titleId)) {
            this.unlockedTitles.push(titleId);
            localStorage.setItem('pigs_unlocked_titles', JSON.stringify(this.unlockedTitles));
        }
        this.currentTitle = titleId;
        localStorage.setItem('pigs_current_title', this.currentTitle);
        soundEngine.victory();
        this.renderMenuMetaUI();
        this.updateHUD();
    }

    buyTitle(titleId) {
        const cfg = TITLES_CONFIG.find(t => t.id === titleId);
        if (!cfg) return;
        if (this.unlockedTitles.includes(titleId)) {
            this.equipTitle(titleId);
            return;
        }
        if (cfg.prev && !this.unlockedTitles.includes(cfg.prev)) {
            const prevCfg = TITLES_CONFIG.find(t => t.id === cfg.prev);
            soundEngine.playNoise(0.2, 0.15, 300);
            alert(`이전 칭호인 【${prevCfg ? prevCfg.name : ''}】를 먼저 획득해야 승급할 수 있습니다!`);
            return;
        }
        if (this.metaBankGold < cfg.cost) {
            soundEngine.playNoise(0.2, 0.15, 300);
            alert(`금고 골드가 부족합니다!\n필요: ${cfg.cost.toLocaleString()}G / 보유: ${this.metaBankGold.toLocaleString()}G`);
            return;
        }
        this.metaBankGold -= cfg.cost;
        localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
        this.unlockTitle(titleId);
        alert(`🎉 축하합니다! 새로운 전설의 칭호 【${cfg.name}】을(를) 획득 및 장착했습니다!`);
    }

    equipTitle(titleId) {
        if (this.unlockedTitles.includes(titleId)) {
            this.currentTitle = titleId;
            localStorage.setItem('pigs_current_title', this.currentTitle);
            soundEngine.metaInvest();
            this.renderMenuMetaUI();
            this.updateHUD();
        }
    }

    // 메뉴 메타 UI 상태 갱신
    renderMenuMetaUI() {
        const bankEl = document.getElementById('menu-bank-gold');
        if (bankEl) bankEl.innerText = this.metaBankGold.toLocaleString();
        const bonusEl = document.getElementById('menu-gold-bonus');
        if (bonusEl) bonusEl.innerText = this.metaGoldBonus;

        // 투자 버튼 비활성화 상태 갱신
        document.querySelectorAll('.meta-invest-btn[data-percent]').forEach(btn => {
            const pct = parseInt(btn.getAttribute('data-percent'), 10);
            const cost = pct * 100;
            btn.disabled = this.metaBankGold < cost;
            btn.title = `${cost.toLocaleString()}G 필요`;
        });
        const allInBtn = document.getElementById('meta-invest-all-btn');
        if (allInBtn) {
            allInBtn.disabled = this.metaBankGold < 100;
        }

        // 전설의 궁극기 해금 상태 갱신
        const maxCheckEl = document.getElementById('menu-max-check');
        const coinCheckEl = document.getElementById('menu-coin-check');
        const buyUltBtn = document.getElementById('menu-buy-ultimate-btn');
        const ultBadge = document.getElementById('menu-ultimate-badge');

        const isEverMaxed = this.everMaxedAll || this.checkAllMaxed();
        if (maxCheckEl) {
            maxCheckEl.innerHTML = isEverMaxed
                ? `<span style="color: #16a34a;">✅ 달성 완료!</span>`
                : `<span style="color: #dc2626;">❌ 미달성 (인게임 모든 능력 MAX 필요)</span>`;
        }
        if (coinCheckEl) {
            const coinColor = this.metaBankGold >= 10000 ? '#16a34a' : '#ea580c';
            coinCheckEl.innerHTML = `<span style="color: ${coinColor};">${this.metaBankGold.toLocaleString()} / 10,000G</span>`;
        }

        if (buyUltBtn && ultBadge) {
            if (this.ultimateUnlocked) {
                ultBadge.className = 'ultimate-badge-unlocked';
                ultBadge.innerText = '👑 해금 완료';
                buyUltBtn.innerText = '✨ 궁극기 보유 중 (장착 완료)';
                buyUltBtn.disabled = true;
            } else {
                ultBadge.className = 'ultimate-badge-locked';
                ultBadge.innerText = '🔒 잠김';
                buyUltBtn.innerText = '⚡ 10,000 코인으로 궁극기 해금';
                buyUltBtn.disabled = !(isEverMaxed && this.metaBankGold >= 10000);
            }
        }

        // 일반공격 적 밀치기 (넉백) 연구 상태 갱신
        const knockValEl = document.getElementById('menu-knockback-val');
        if (knockValEl) knockValEl.innerText = this.metaKnockbackChance;
        const knockEffectEl = document.getElementById('menu-knockback-effect-text');
        if (knockEffectEl) {
            knockEffectEl.innerText = `${this.metaKnockbackChance}% 확률로 적을 64px 밀침`;
        }
        const buyKnockBtn = document.getElementById('menu-buy-knockback-btn');
        if (buyKnockBtn) {
            if (this.metaKnockbackChance >= 15) {
                buyKnockBtn.innerText = '🏆 MAX 완료 (15%)';
                buyKnockBtn.disabled = true;
                buyKnockBtn.title = '최대 강화 수치에 도달했습니다.';
            } else {
                buyKnockBtn.innerText = `💨 밀치기 확률 +1% 강화 (750G)`;
                buyKnockBtn.disabled = this.metaBankGold < 750;
                buyKnockBtn.title = this.metaBankGold < 750 ? '750 금고 골드가 필요합니다.' : '클릭하여 밀치기 확률 +1% 강화';
            }
        }

        // 🔥 무한 모드 전용 투사체 데미지 강화 상태 갱신 (1%당 5,000G, 최대 +1000%)
        const endlessValEl = document.getElementById('menu-endless-dmg-val');
        if (endlessValEl) {
            endlessValEl.innerText = `+${this.endlessDamagePercent}%`;
        }
        document.querySelectorAll('.meta-endless-dmg-btn[data-amount]').forEach(btn => {
            const amt = parseInt(btn.getAttribute('data-amount'), 10);
            const cost = amt * 5000;
            const isMax = this.endlessDamagePercent >= 1000;
            btn.disabled = isMax || (this.metaBankGold < cost);
            btn.title = isMax ? '최대 강화치 도달' : `${cost.toLocaleString()}G 필요`;
        });
        const endlessAllBtn = document.getElementById('meta-endless-dmg-all-btn');
        if (endlessAllBtn) {
            endlessAllBtn.disabled = (this.endlessDamagePercent >= 1000) || (this.metaBankGold < 5000);
        }

        // 👑 전설의 칭호 승급 상점 갱신
        const curTitleBadge = document.getElementById('menu-current-title-badge');
        if (curTitleBadge) {
            if (this.currentTitle) {
                const cfg = TITLES_CONFIG.find(t => t.id === this.currentTitle);
                if (cfg) {
                    curTitleBadge.innerText = `👑 【${cfg.name}】`;
                    curTitleBadge.style.color = cfg.color;
                    curTitleBadge.style.borderColor = cfg.color;
                } else {
                    curTitleBadge.innerText = '없음';
                    curTitleBadge.style.color = '#7e22ce';
                    curTitleBadge.style.borderColor = '#a855f7';
                }
            } else {
                curTitleBadge.innerText = '없음';
                curTitleBadge.style.color = '#7e22ce';
                curTitleBadge.style.borderColor = '#a855f7';
            }
        }

        const titlesContainer = document.getElementById('titles-cards-container');
        if (titlesContainer) {
            titlesContainer.innerHTML = TITLES_CONFIG.map(t => {
                const isEquipped = this.currentTitle === t.id;
                const isUnlocked = this.unlockedTitles.includes(t.id);
                const hasPrev = !t.prev || this.unlockedTitles.includes(t.prev);
                const canAfford = this.metaBankGold >= t.cost;

                let cardClass = 'title-card';
                if (isEquipped) cardClass += ' equipped';
                else if (isUnlocked) cardClass += ' unlocked';
                else cardClass += ' locked';

                let actionBtnHtml = '';
                if (isEquipped) {
                    actionBtnHtml = `<button class="title-action-btn btn-equipped" disabled>✅ 장착 중</button>`;
                } else if (isUnlocked) {
                    actionBtnHtml = `<button class="title-action-btn btn-equip" data-action="equip" data-title-id="${t.id}">🏷️ 장착하기</button>`;
                } else if (t.cost === 0) {
                    actionBtnHtml = `<button class="title-action-btn btn-buy" disabled title="무한 모드 100웨이브 클리어 시 자동 획득">🔒 100W 정복 필요</button>`;
                } else if (!hasPrev) {
                    const prevCfg = TITLES_CONFIG.find(p => p.id === t.prev);
                    actionBtnHtml = `<button class="title-action-btn btn-buy" disabled title="이전 칭호 【${prevCfg ? prevCfg.name : ''}】 필요">🔒 이전 칭호 필요</button>`;
                } else if (!canAfford) {
                    actionBtnHtml = `<button class="title-action-btn btn-buy" disabled title="금고 골드 부족">🪙 ${t.cost.toLocaleString()}G 필요</button>`;
                } else {
                    actionBtnHtml = `<button class="title-action-btn btn-buy" data-action="buy" data-title-id="${t.id}">🪙 승급 구매 (${t.cost.toLocaleString()}G)</button>`;
                }

                const prevReqText = t.prev ? `이전: 【${TITLES_CONFIG.find(p => p.id === t.prev)?.name || ''}】 필요` : `획득: 무한모드 100W 클리어`;
                const costText = t.cost > 0 ? `승급 비용: 🪙 ${t.cost.toLocaleString()}G` : `무료 보상`;

                return `
                    <div class="${cardClass}">
                        <div class="title-card-left">
                            <span class="title-badge-chip" style="color: ${t.color}; border-color: ${t.color}; background: rgba(0,0,0,0.03);">
                                👑 【${t.name}】
                            </span>
                            <div class="title-info-box">
                                <span class="title-info-desc">${t.desc}</span>
                                <span class="title-info-req">• ${prevReqText} · ${costText}</span>
                            </div>
                        </div>
                        ${actionBtnHtml}
                    </div>
                `;
            }).join('');
        }
    }

    // 일반공격 적 밀치기 (넉백) 확률 강화 (750G당 +1%, 최대 15%)
    buyKnockbackUpgrade(source = 'menu') {
        if (this.metaKnockbackChance >= 15) {
            soundEngine.playNoise(0.2, 0.15, 300);
            this.showBanner("적 밀치기 확률이 이미 최대치(15%)입니다!", "#ff9800");
            return;
        }

        const cost = 750;
        if (source === 'shop') {
            if (this.gold < cost) {
                soundEngine.playNoise(0.2, 0.15, 300);
                this.showBanner(`인게임 골드가 부족합니다! (${cost}G 필요)`, "#dc2626");
                return;
            }
            this.gold -= cost;
        } else {
            if (this.metaBankGold < cost) {
                soundEngine.playNoise(0.2, 0.15, 300);
                this.showBanner(`금고에 ${cost} 골드가 필요합니다!`, "#dc2626");
                return;
            }
            this.metaBankGold -= cost;
            localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
        }

        this.metaKnockbackChance += 1;
        localStorage.setItem('pigs_meta_knockback_chance', this.metaKnockbackChance);

        soundEngine.upgrade();
        this.showBanner(`💨 [일반공격 넉백 강화!] 밀치기 확률 +${this.metaKnockbackChance}% 달성! (적 64px 밀림)`, "#00e5ff");
        this.renderMenuMetaUI();
        this.renderShopUI();
        this.updateHUD();
    }

    // 기본 4대 스탯 ALL MAX 달성 여부 확인 (공격력, 공속, 쿨다운, 자동수리 모두 Lv.5)
    checkAllStatsMax() {
        return this.upgrades.damageLevel >= 5 &&
               this.upgrades.attackSpeedLevel >= 5 &&
               this.upgrades.cooldownLevel >= 5 &&
               this.upgrades.autoRepairLevel >= 5;
    }

    // 모든 능력치 ALL MAX 달성 여부 확인
    checkAllMaxed() {
        const isMax = this.house.tier >= 3 &&
            this.upgrades.damageLevel >= 5 &&
            this.upgrades.attackSpeedLevel >= 5 &&
            this.upgrades.cooldownLevel >= 5 &&
            this.upgrades.autoRepairLevel >= 5 &&
            this.pigRanks[1] >= 3 &&
            this.pigRanks[2] >= 3 &&
            this.pigRanks[3] >= 2 &&
            (this.pigComboSkills && this.pigComboSkills[1] >= 2 && this.pigComboSkills[2] >= 2 && this.pigComboSkills[3] >= 2);

        if (isMax && !this.everMaxedAll) {
            this.everMaxedAll = true;
            localStorage.setItem('pigs_ever_maxed_all', 'true');
        }
        return isMax;
    }

    // 전설의 궁극기 해금 구매 (10,000 코인 소모)
    buyUltimateSkill() {
        if (this.ultimateUnlocked) return;
        const isEverMaxed = this.everMaxedAll || this.checkAllMaxed();
        if (!isEverMaxed) {
            soundEngine.playNoise(0.2, 0.15, 300);
            this.showBanner("먼저 인게임에서 모든 능력을 MAX로 찍어야 합니다!", "#dc2626");
            return;
        }
        if (this.metaBankGold < 10000) {
            soundEngine.playNoise(0.2, 0.15, 300);
            this.showBanner("금고에 10,000 코인이 필요합니다!", "#dc2626");
            return;
        }

        this.metaBankGold -= 10000;
        localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
        this.ultimateUnlocked = true;
        localStorage.setItem('pigs_ultimate_unlocked', 'true');

        soundEngine.victory();
        this.showBanner("🌪️ [전설의 궁극기 해금!] 이제 모든 능력 MAX 상태에서 [4] 키로 35초마다 천지개벽 대회오리 폭풍을 수동 발사할 수 있습니다!", "#9c27b0");
        this.renderMenuMetaUI();
        this.renderShopUI();
        this.updateHUD();
    }

    // 쉬움/보통/어려움/무한모드 클리어 및 게임오버 시 메인 메뉴로 복귀
    returnToMenu() {
        // 남은 인게임 골드 금고로 자동 저축
        if (this.gold > 0) {
            this.metaBankGold += this.gold;
            localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
            this.gold = 0;
        }

        // 모달들 닫기
        document.getElementById('ending-modal').classList.remove('active');
        document.getElementById('gameover-modal').classList.remove('active');
        document.getElementById('shop-modal').classList.remove('active');
        const pauseModal = document.getElementById('pause-modal');
        if (pauseModal) pauseModal.classList.remove('active');

        soundEngine.stopBGM();
        this.state = GameState.MENU;

        // 인게임 엔티티 정리
        this.enemies = [];
        this.projectiles = [];
        this.fallingBombs = [];
        this.comicExplosions = [];
        this.boulders = [];
        this.strawRolls = [];
        this.coins = [];
        this.particles = [];
        this.floatingTexts = [];
        this.pigSpeeches = [];

        // 메인 메뉴 모달 표시 및 갱신
        document.getElementById('start-modal').classList.add('active');
        this.updateDiffCardsUI();
        this.renderMenuMetaUI();
        this.updateHUD();
    }

    // 늑대가 죽었을 때 삼형제가 "초보네~ㅋ", "똥꼬네~ㅋ", "꼬추네~ㅋ", "핵초보네!!" 놀리는 메서드
    onWolfKilled(wolf) {
        soundEngine.pigTease();
        const speechTexts = [
            "초보네~ㅋ", "똥꼬네~ㅋ", "꼬추네~ㅋ", "핵초보네!!",
            "초보네!", "똥꼬네!", "꼬추네!", "핵초보네ㅋㅋ",
            "완전 똥꼬네~", "완전 꼬추네~", "대박 핵초보네!",
            "늑대 실력 똥꼬네ㅋ", "초보네 똥꼬네 꼬추네ㅋ", "완전 핵초보네!"
        ];
        const chosenText = speechTexts[Math.floor(Math.random() * speechTexts.length)];
        
        // 1: 첫째(창문), 2: 둘째(지붕), 3: 셋째(문 앞)
        const pigIdx = Math.floor(Math.random() * 3) + 1;
        
        let pigX, pigY;
        if (this.house.tier === 1) {
            if (pigIdx === 3) {
                pigX = this.house.x + 44;
                pigY = this.house.y + 184;
            } else if (pigIdx === 2) {
                pigX = this.house.x + 105;
                pigY = this.house.y + 180;
            } else {
                pigX = this.house.x + 168;
                pigY = this.house.y + 184;
            }
        } else {
            if (pigIdx === 3) {
                pigX = this.house.x + 50;
                pigY = this.house.y + 184;
            } else if (pigIdx === 2) {
                pigX = this.house.x + this.house.w * 0.62;
                pigY = this.house.y + 96;
            } else {
                pigX = this.house.x + this.house.w * 0.5;
                pigY = this.house.y + 8;
            }
        }

        this.pigSpeeches.push({
            text: chosenText,
            x: pigX,
            y: pigY - 26,
            pigIdx: pigIdx,
            life: 1400,
            maxLife: 1400
        });

        // 놀리는 돼지 신나서 방방 뛰는 애니메이션 발동!
        if (this.pigAnim && this.pigAnim[pigIdx]) {
            this.pigAnim[pigIdx].bounce = 12;
            this.pigAnim[pigIdx].rot = (Math.random() - 0.5) * 0.35;
        }

        // 최대 3개까지만 유지
        if (this.pigSpeeches.length > 3) {
            this.pigSpeeches.shift();
        }
    }

    // 마우스, 터치 및 키보드 이벤트 바인딩
    initEventListeners() {
        const updateMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        };

        // PC 마우스 컨트롤
        canvas.addEventListener('mousemove', updateMousePos);
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.isDown = true;
                updateMousePos(e);
                this.tryShoot();
            }
        });
        window.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
        });

        // 모바일/태블릿 반응형 터치 컨트롤 지원 (touchstart, touchmove, touchend, touchcancel)
        const handleTouch = (e) => {
            if (e.touches && e.touches.length > 0) {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                this.mouse.x = (touch.clientX - rect.left) * scaleX;
                this.mouse.y = (touch.clientY - rect.top) * scaleY;
            }
        };

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mouse.isDown = true;
            handleTouch(e);
            this.tryShoot();
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleTouch(e);
        }, { passive: false });

        const endTouch = (e) => {
            if (!e.touches || e.touches.length === 0) {
                this.mouse.isDown = false;
            } else {
                handleTouch(e);
            }
        };
        canvas.addEventListener('touchend', endTouch, { passive: false });
        canvas.addEventListener('touchcancel', endTouch, { passive: false });

        // 키보드 단축키
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'f') {
                this.toggleFullscreen();
            }
            if (e.key.toLowerCase() === 'p' || e.key === 'Escape') {
                if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
                    this.togglePause();
                    return;
                }
            }
            if (this.state !== GameState.PLAYING) return;
            if (e.key === '1') this.useSkill(1);
            if (e.key === '2') this.useSkill(2);
            if (e.key === '3') this.useSkill(3);
            if (e.key === '4') {
                const isMaxed = this.checkAllMaxed();
                if (this.ultimateUnlocked && isMaxed) {
                    this.useSkill(4);
                }
            }
            if (e.key.toLowerCase() === 't' || e.code === 'Space') {
                e.preventDefault();
                this.toggleTurbo();
            }
            if (e.key.toLowerCase() === 'u') this.openShop();
            // 🐺 신규 늑대 테스트 소환 핫키 (7: 양철방패, 8: 우산공수, 9: 미니늑대)
            if (e.key === '7') {
                this.spawnEnemy('shield');
                this.showBanner('🛡️ [테스트 소환] 양철 방패 탱커 늑대 출현!', '#4fc3f7');
            }
            if (e.key === '8') {
                this.spawnEnemy('umbrella');
                this.showBanner('☂️ [테스트 소환] 우산 낙하산 공수 늑대 출현!', '#e040fb');
            }
            if (e.key === '9') {
                this.spawnEnemy('miniwolf');
                this.showBanner('🐾 [테스트 소환] 미니 새끼 늑대 출현!', '#69f0ae');
            }
        });

        // ⚡ 도토리 자동 연사 터보 모드 버튼 바인딩 (HUD 및 퀵 플로팅 버튼)
        const turboBtn = document.getElementById('turbo-btn');
        if (turboBtn) {
            turboBtn.addEventListener('click', () => this.toggleTurbo());
        }
        const quickTurboBtn = document.getElementById('quick-turbo-btn');
        if (quickTurboBtn) {
            quickTurboBtn.addEventListener('click', () => this.toggleTurbo());
        }

        // 하단 스킬 슬롯 클릭 바인딩
        document.getElementById('skill-1').addEventListener('click', () => this.useSkill(1));
        document.getElementById('skill-2').addEventListener('click', () => this.useSkill(2));
        document.getElementById('skill-3').addEventListener('click', () => this.useSkill(3));
        const skill4El = document.getElementById('skill-4');
        if (skill4El) {
            skill4El.addEventListener('click', () => {
                const isMaxed = this.checkAllMaxed();
                if (this.ultimateUnlocked && isMaxed) {
                    this.useSkill(4);
                }
            });
        }

        // 상단 버튼들
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
        document.getElementById('shop-btn').addEventListener('click', () => this.openShop());
        const soundBtn = document.getElementById('sound-btn');
        soundBtn.addEventListener('click', () => {
            const muted = soundEngine.toggleMute();
            soundBtn.innerText = muted ? '🔇 사운드' : '🔊 사운드';
            soundBtn.setAttribute('aria-pressed', String(!muted));
            soundBtn.setAttribute('aria-label', muted ? '전체 사운드 켜기' : '전체 사운드 끄기');
        });
        const bgmBtn = document.getElementById('bgm-btn');
        if (bgmBtn) {
            bgmBtn.addEventListener('click', () => {
                soundEngine.toggleBGM();
                this.updateBGMButton();
            });
            this.updateBGMButton();
        }

        const fullBtn = document.getElementById('fullscreen-btn');
        if (fullBtn) {
            fullBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // 🔄 모바일 가로모드 화면전환 버튼들 이벤트 바인딩
        const landscapeBtnIds = [
            'start-landscape-btn',
            'hud-landscape-btn',
            'banner-landscape-btn',
            'pause-landscape-btn'
        ];
        landscapeBtnIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleLandscapeMode();
                });
            }
        });

        // 가로모드 안내 모달 닫기 버튼
        const guideConfirmBtn = document.getElementById('guide-confirm-btn');
        if (guideConfirmBtn) {
            guideConfirmBtn.addEventListener('click', () => {
                const guideModal = document.getElementById('orientation-guide-modal');
                if (guideModal) {
                    guideModal.classList.remove('active');
                    guideModal.classList.add('hidden');
                }
            });
        }

        // 일시정지 모달 내 버튼 바인딩
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.resumeGame());
        }
        const pauseShopBtn = document.getElementById('pause-shop-btn');
        if (pauseShopBtn) {
            pauseShopBtn.addEventListener('click', () => this.openShop());
        }
        const pauseMenuBtn = document.getElementById('pause-menu-btn');
        if (pauseMenuBtn) {
            pauseMenuBtn.addEventListener('click', () => this.returnToMenu());
        }

        // 모바일 세로모드 회전 안내 및 가로모드 복귀 감지
        const checkOrientation = () => {
            const notice = document.getElementById('mobile-rotate-notice');
            const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
            const isPortrait = window.innerHeight > window.innerWidth;
            if (notice) {
                notice.classList.toggle('hidden', !(isMobile && isPortrait));
            }
            // 기기가 가로로 회전되면 안내 모달 자동 닫기
            if (!isPortrait) {
                const guideModal = document.getElementById('orientation-guide-modal');
                if (guideModal) {
                    guideModal.classList.remove('active');
                    guideModal.classList.add('hidden');
                }
            }
        };
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        checkOrientation();

        // 모달 관련 버튼
        document.getElementById('start-btn').addEventListener('click', () => {
            soundEngine.init();
            soundEngine.playGameStart();
            if (this.selectedDiff === 'endless') {
                this.startEndlessMode();
            } else {
                this.startStoryMode(this.selectedDiff);
            }
        });

        document.getElementById('close-shop-btn').addEventListener('click', () => this.closeShop());
        document.getElementById('evolve-house-btn').addEventListener('click', () => this.evolveHouse());
        document.getElementById('retry-btn').addEventListener('click', () => this.restartGame());

        // 시작 모달 탭 전환 바인딩
        document.getElementById('tab-start-play-btn')?.addEventListener('click', () => this.switchStartTab('play'));
        document.getElementById('tab-start-pigs-btn')?.addEventListener('click', () => this.switchStartTab('pigs'));
        document.getElementById('tab-start-meta-btn')?.addEventListener('click', () => this.switchStartTab('meta'));

        // 상점 탭 전환 바인딩
        const tabHouseBtn = document.getElementById('tab-house-btn');
        const tabPigsBtn = document.getElementById('tab-pigs-btn');
        if (tabHouseBtn && tabPigsBtn) {
            tabHouseBtn.addEventListener('click', () => this.switchShopTab('house'));
            tabPigsBtn.addEventListener('click', () => this.switchShopTab('pigs'));
        }

        // 스탯 업그레이드 버튼 일괄 위임 바인딩
        document.querySelectorAll('.shop-buy-btn[data-upg-key]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.currentTarget.getAttribute('data-upg-key');
                if (key) this.buyUpgrade(key);
            });
        });

        // 삼형제 승급 버튼 바인딩
        for (let pId = 1; pId <= 3; pId++) {
            const upgBtn = document.getElementById(`pig-${pId}-upg-btn`);
            if (upgBtn) {
                upgBtn.addEventListener('click', () => this.upgradePig(pId));
            }
            const comboBtn = document.getElementById(`pig-${pId}-combo-btn`);
            if (comboBtn) {
                comboBtn.addEventListener('click', () => this.upgradePigCombo(pId));
            }
        }
        
        const nextDiffBtn = document.getElementById('next-diff-btn');
        if (nextDiffBtn) {
            nextDiffBtn.addEventListener('click', () => {
                if (this.currentDiff === 'easy') {
                    this.selectedDiff = 'normal';
                } else if (this.currentDiff === 'normal') {
                    this.selectedDiff = 'hard';
                }
                this.startStoryMode(this.selectedDiff);
            });
        }

        const endlessBtn = document.getElementById('endless-btn');
        if (endlessBtn) {
            endlessBtn.addEventListener('click', () => this.startEndlessMode());
        }

        // 난이도 카드 선택 이벤트 (처음부터 누구나 자유롭게 쉬움/보통/어려움/무한 선택 가능!)
        const diffs = ['easy', 'normal', 'hard', 'endless'];
        diffs.forEach(d => {
            const card = document.getElementById(`diff-card-${d}`);
            if (card) {
                card.addEventListener('click', () => {
                    this.selectedDiff = d;
                    this.updateDiffCardsUI();

                    // 선택 피드백 1: 경쾌한 클릭 바운스 애니메이션 재트리거
                    card.classList.remove('just-clicked');
                    void card.offsetWidth;
                    card.classList.add('just-clicked');

                    // 선택 피드백 2: 시원하고 경쾌한 선택 전용 효과음 (찰진 팝 + 3화음 상승 챠임벨)
                    try {
                        soundEngine.playSelect();
                    } catch (e) {
                        console.warn(e);
                    }
                });
            }
        });

        // 메인 메뉴 메타 골드 투자 버튼들 바인딩
        document.querySelectorAll('.meta-invest-btn[data-percent]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pct = parseInt(e.currentTarget.getAttribute('data-percent'), 10);
                if (pct > 0) this.investMetaGold(pct);
            });
        });

        const allInBtn = document.getElementById('meta-invest-all-btn');
        if (allInBtn) {
            allInBtn.addEventListener('click', () => this.investAllMetaGold());
        }

        const testAddBtn = document.getElementById('meta-test-add-gold-btn');
        if (testAddBtn) {
            testAddBtn.addEventListener('click', () => {
                this.metaBankGold += 500;
                localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
                soundEngine.coin();
                this.renderMenuMetaUI();
                this.renderShopUI();
            });
        }

        const testAdd10kBtn = document.getElementById('meta-test-add-10k-btn');
        if (testAdd10kBtn) {
            testAdd10kBtn.addEventListener('click', () => {
                this.metaBankGold += 10000;
                localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
                soundEngine.coin();
                this.showBanner("🎁 [테스트] 금고에 10,000 코인이 충전되었습니다!", "#9c27b0");
                this.renderMenuMetaUI();
                this.renderShopUI();
            });
        }

        const testMaxAllBtn = document.getElementById('meta-test-max-all-btn');
        if (testMaxAllBtn) {
            testMaxAllBtn.addEventListener('click', () => {
                this.everMaxedAll = true;
                localStorage.setItem('pigs_ever_maxed_all', 'true');
                soundEngine.upgrade();
                this.showBanner("⚡ [테스트] 모든 능력 MAX 달성 조건이 활성화되었습니다!", "#0284c7");
                this.renderMenuMetaUI();
                this.renderShopUI();
            });
        }

        // 상점 내 신규 스킬 테스트 치트 버튼 바인딩
        const shopTestAddGoldBtn = document.getElementById('shop-test-add-gold-btn');
        if (shopTestAddGoldBtn) {
            shopTestAddGoldBtn.addEventListener('click', () => {
                this.gold += 1000;
                soundEngine.coin();
                this.renderShopUI();
                this.updateHUD();
            });
        }

        const shopTestMaxStatsBtn = document.getElementById('shop-test-max-stats-btn');
        if (shopTestMaxStatsBtn) {
            shopTestMaxStatsBtn.addEventListener('click', () => {
                this.upgrades.damageLevel = 5;
                this.upgrades.attackSpeedLevel = 5;
                this.upgrades.cooldownLevel = 5;
                this.upgrades.autoRepairLevel = 5;
                this.house.autoRepairRate = 5 * 2.5;
                soundEngine.upgrade();
                this.showBanner("⚡ [테스트] 4대 기본 스탯 ALL MAX 달성! 요새 신성 각성 활성화!", "#ffd700");
                this.renderShopUI();
                this.updateHUD();
            });
        }

        const shopTestMaxPigsBtn = document.getElementById('shop-test-max-pigs-btn');
        if (shopTestMaxPigsBtn) {
            shopTestMaxPigsBtn.addEventListener('click', () => {
                if (this.pigRanks[1] >= 3 && this.pigRanks[2] >= 3 && this.pigRanks[3] >= 2) {
                    this.pigComboSkills = { 1: 2, 2: 2, 3: 2 };
                    soundEngine.upgrade();
                    this.showBanner("👑 [테스트] 삼형제 2단계 콤보 스킬까지 ALL MAX 달성!", "#ffd700");
                } else {
                    this.pigRanks[1] = 3;
                    this.pigRanks[2] = 3;
                    this.pigRanks[3] = 2;
                    soundEngine.upgrade();
                    this.showBanner("🐷 [테스트] 삼형제 기본 스킬 ALL MAX 달성! 콤보 스킬 해금!", "#00e5ff");
                }
                this.renderShopUI();
                this.updateHUD();
            });
        }

        // 칭호 & 무한모드 테스트용 치트 버튼 바인딩
        const testAdd1mBtn = document.getElementById('meta-test-add-1m-btn');
        if (testAdd1mBtn) {
            testAdd1mBtn.addEventListener('click', () => {
                this.metaBankGold += 1000000;
                localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
                soundEngine.coin();
                this.showBanner("🎁 [테스트] 금고에 1,000,000 코인이 충전되었습니다!", "#fb923c");
                this.renderMenuMetaUI();
                this.renderShopUI();
            });
        }

        const testAdd100mBtn = document.getElementById('meta-test-add-100m-btn');
        if (testAdd100mBtn) {
            testAdd100mBtn.addEventListener('click', () => {
                this.metaBankGold += 100000000;
                localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
                soundEngine.victory();
                this.showBanner("🎁 [테스트] 금고에 100,000,000(1억) 코인이 충전되었습니다!", "#38bdf8");
                this.renderMenuMetaUI();
                this.renderShopUI();
            });
        }

        const testClear100wBtn = document.getElementById('meta-test-clear-100w-btn');
        if (testClear100wBtn) {
            testClear100wBtn.addEventListener('click', () => {
                this.unlockTitle('nuclear_beginner');
                this.showBanner("👑 [테스트] 무한 모드 100W 클리어! 전설의 【핵초보】 칭호 해금!", "#facc15");
                this.renderMenuMetaUI();
                this.updateHUD();
            });
        }

        // 무한 모드 전용 투사체 데미지 강화 버튼 바인딩
        document.querySelectorAll('.meta-endless-dmg-btn[data-amount]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amt = parseInt(e.currentTarget.getAttribute('data-amount'), 10);
                if (amt > 0) this.investEndlessDamage(amt);
            });
        });

        const endlessAllBtn = document.getElementById('meta-endless-dmg-all-btn');
        if (endlessAllBtn) {
            endlessAllBtn.addEventListener('click', () => this.investAllEndlessDamage());
        }

        // 전설의 칭호 승급 상점 이벤트 위임 바인딩
        const titlesContainer = document.getElementById('titles-cards-container');
        if (titlesContainer) {
            titlesContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.title-action-btn');
                if (!btn) return;
                const action = btn.getAttribute('data-action');
                const titleId = btn.getAttribute('data-title-id');
                if (action === 'buy' && titleId) {
                    this.buyTitle(titleId);
                } else if (action === 'equip' && titleId) {
                    this.equipTitle(titleId);
                }
            });
        }

        // 메뉴 및 상점 궁극기 구매 버튼 바인딩
        const menuBuyUltBtn = document.getElementById('menu-buy-ultimate-btn');
        if (menuBuyUltBtn) {
            menuBuyUltBtn.addEventListener('click', () => this.buyUltimateSkill());
        }
        const shopBuyUltBtn = document.getElementById('shop-buy-ultimate-btn');
        if (shopBuyUltBtn) {
            shopBuyUltBtn.addEventListener('click', () => this.buyUltimateSkill());
        }

        // 엔딩 / 게임오버 모달 메뉴 복귀 버튼 바인딩
        const endMenuBtn = document.getElementById('ending-menu-btn');
        if (endMenuBtn) {
            endMenuBtn.addEventListener('click', () => this.returnToMenu());
        }
        const goMenuBtn = document.getElementById('gameover-menu-btn');
        if (goMenuBtn) {
            goMenuBtn.addEventListener('click', () => this.returnToMenu());
        }

        // 상점 내 ALL MAX 시 인게임 골드 메타 투자 / 금고 입금 바인딩
        const shopInvestBtn = document.getElementById('shop-meta-invest-btn');
        if (shopInvestBtn) {
            shopInvestBtn.addEventListener('click', () => {
                if (this.gold >= 100) {
                    this.gold -= 100;
                    this.metaGoldBonus += 1;
                    localStorage.setItem('pigs_meta_gold_bonus', this.metaGoldBonus);
                    soundEngine.metaInvest();
                    this.showBanner("🔥 +1% 영구 골드 획득 버프 강화 성공!", "#ff9800");
                    this.renderShopUI();
                    this.renderMenuMetaUI();
                    this.updateHUD();
                } else {
                    soundEngine.playNoise(0.2, 0.15, 300);
                    this.showBanner("인게임 골드가 부족합니다! (100G 필요)", "#ff5252");
                }
            });
        }

        const shopDepositBtn = document.getElementById('shop-bank-deposit-btn');
        if (shopDepositBtn) {
            shopDepositBtn.addEventListener('click', () => {
                if (this.gold > 0) {
                    const deposited = this.gold;
                    this.metaBankGold += deposited;
                    this.gold = 0;
                    localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
                    soundEngine.coin();
                    this.showBanner(`🏛️ ${deposited}G를 메인 메뉴 금고로 안전하게 입금했습니다!`, "#4caf50");
                    this.renderShopUI();
                    this.renderMenuMetaUI();
                    this.updateHUD();
                }
            });
        }

        // 일반공격 넉백(밀치기) 연구 버튼 바인딩 (메뉴 & 상점)
        const menuBuyKbBtn = document.getElementById('menu-buy-knockback-btn');
        if (menuBuyKbBtn) {
            menuBuyKbBtn.addEventListener('click', () => this.buyKnockbackUpgrade('menu'));
        }
        const shopBuyKbBtn = document.getElementById('shop-knockback-invest-btn');
        if (shopBuyKbBtn) {
            shopBuyKbBtn.addEventListener('click', () => this.buyKnockbackUpgrade('shop'));
        }
    }

    // 전체화면 토글 메서드
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.warn(err));
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    }

    // 🔄 모바일 가로모드 화면전환 메서드
    async toggleLandscapeMode() {
        try {
            // 1. 전체화면 요청 (많은 모바일 브라우저에서 방향 잠금 API 작동을 위한 필수 단계)
            const docEl = document.documentElement;
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
            if (!isFullscreen) {
                if (docEl.requestFullscreen) {
                    await docEl.requestFullscreen().catch(e => console.log('requestFullscreen error:', e));
                } else if (docEl.webkitRequestFullscreen) {
                    await docEl.webkitRequestFullscreen().catch(e => console.log('webkitRequestFullscreen error:', e));
                }
            }

            // 2. Screen Orientation Lock API 시도 (Android Chrome, Samsung Internet, Edge 등 지원)
            if (screen.orientation && typeof screen.orientation.lock === 'function') {
                try {
                    await screen.orientation.lock('landscape');
                    this.showBanner('🔄 가로 모드로 고정 전환되었습니다!', '#00e5ff');
                    return;
                } catch (lockErr) {
                    console.log('Orientation lock error/fallback:', lockErr);
                }
            }
        } catch (err) {
            console.log('Fullscreen/orientation error:', err);
        }

        // 3. Fallback: 기기가 세로인 경우 친절한 안내 모달 띄우기
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isPortrait) {
            const guideModal = document.getElementById('orientation-guide-modal');
            if (guideModal) {
                guideModal.classList.add('active');
                guideModal.classList.remove('hidden');
            } else {
                this.showBanner('📱 화면 회전 잠금을 해제하고 기기를 가로로 돌려주세요!', '#ff9800');
            }
        } else {
            this.showBanner('✅ 이미 최적의 16:9 가로 화면입니다! 🚀', '#4caf50');
        }
    }

    // 난이도 카드 UI 갱신 (전체 선택 가능)
    updateDiffCardsUI() {
        const diffs = ['easy', 'normal', 'hard', 'endless'];
        diffs.forEach(d => {
            const card = document.getElementById(`diff-card-${d}`);
            if (card) {
                card.classList.remove('locked');
                card.classList.toggle('active', d === this.selectedDiff);
            }
        });
    }

    unlockDifficulty(diff) {
        const diffOrder = ['easy', 'normal', 'hard', 'endless'];
        if (diffOrder.indexOf(diff) > diffOrder.indexOf(this.unlockedDiff)) {
            this.unlockedDiff = diff;
            localStorage.setItem('pigs_unlocked_diff', diff);
        }
        this.updateDiffCardsUI();
    }

    // 스토리 모드 시작
    startStoryMode(diff = 'easy') {
        this.currentDiff = diff;
        this.selectedDiff = diff;
        if (diff === 'endless') {
            this.startEndlessMode();
            return;
        }

        this.mode = 'STORY';
        this.wave = 1;
        this.gold = 60;
        this.score = 0;
        this.resetHouse();
        this.envParticles = [];
        this.envParticleTimer = 0;
        this.hideAllModals();
        this.state = GameState.PLAYING;
        // 게임 시작 효과음(playGameStart)이 시원하게 울려 퍼진 후 자연스럽게 BGM 시작
        setTimeout(() => {
            if (this.state === GameState.PLAYING) {
                soundEngine.startStageBGM(this.wave);
                this.updateBGMButton();
            }
        }, 650);
        this.updateHUD();
        this.startWave(this.wave);
    }

    // 무한 모드 시작 (1웨이브부터 끝없는 무한 웨이브 도전!)
    startEndlessMode() {
        this.currentDiff = 'endless';
        this.selectedDiff = 'endless';
        this.mode = 'ENDLESS';
        this.wave = 1;
        this.gold = 100;
        this.score = 0;
        this.resetHouse();
        this.envParticles = [];
        this.envParticleTimer = 0;
        this.hideAllModals();
        this.state = GameState.PLAYING;
        // 게임 시작 효과음(playGameStart)이 시원하게 울려 퍼진 후 자연스럽게 BGM 시작
        setTimeout(() => {
            if (this.state === GameState.PLAYING) {
                soundEngine.startStageBGM(this.wave);
                this.updateBGMButton();
            }
        }, 650);
        this.updateHUD();
        this.startWave(this.wave);
    }

    resetHouse() {
        this.house.tier = 1;
        this.house.hp = 150;
        this.house.maxHp = 150;
        this.house.repairFxTimer = 0;
        this.reconstruction = null;
        this.upgrades = { damageLevel: 1, attackSpeedLevel: 1, cooldownLevel: 1, autoRepairLevel: 0 };
        this.pigRanks = { 1: 1, 2: 1, 3: 1 };
        this.cauldronFire = 0;
        this.house.invincibleTimer = 0;
        this.pig1SkillTimer = 0;
        this.pig3SkillTimer = 0;
        this.pig3SkillType = null;
        if (this.pigAnimators) {
            if (this.pigAnimators[1]) this.pigAnimators[1].playAction('idle', true);
            if (this.pigAnimators[2]) this.pigAnimators[2].playAction('idle', true);
            if (this.pigAnimators[3]) this.pigAnimators[3].playAction('idle', true);
        }
        this.projectiles = [];
        this.antiAirRockets = [];
        this.pig3AntiAirTimer = 0;
        this.pig3AntiAirAutoTimer = 0;
        this.fallingBombs = [];
        this.comicExplosions = [];
        this.enemies = [];
        this.particles = [];
        this.coins = [];
        this.strawRolls = [];
        this.boulders = [];
        this.cosmicStorms = [];
        this.confetti = [];
        this.pigComboSkills = { 1: 0, 2: 0, 3: 0 };
        this.pigSpeedBuffTimer = 0;
        this.statMaxTimer = 0;
        this.groundFireTrails = [];
        this.secondaryClusters = [];
        this.sulfurMines = [];
        this.steamPulses = [];
        this.lavaMortars = [];
        this.divineLightnings = [];

        // 스킬 쿨타임 및 궁극기 슬롯 상태 완전 리셋
        if (this.skills) {
            for (let s = 1; s <= 4; s++) {
                if (this.skills[s]) this.skills[s].currentCd = 0;
            }
        }
        const skill4Slot = document.getElementById('skill-4');
        if (skill4Slot) skill4Slot.classList.add('hidden');
        const awakeningBadge = document.getElementById('stat-awakening-badge');
        if (awakeningBadge) awakeningBadge.classList.add('hidden');
        for (let p = 1; p <= 3; p++) {
            const tag = document.getElementById(`skill-${p}-combo-tag`);
            if (tag) tag.classList.add('hidden');
        }
        const bossHud = document.getElementById('boss-hud-container');
        if (bossHud) bossHud.classList.add('hidden');
        const s1 = document.getElementById('skill-1-name');
        if (s1) s1.innerText = '짚단 굴리기';
        const s2 = document.getElementById('skill-2-name');
        if (s2) s2.innerText = '도토리 폭격';
        const s3 = document.getElementById('skill-3-name');
        if (s3) s3.innerText = '수리 & 끓는 솥';
        this.updateHouseStats();
        this.renderShopUI();
    }

    restartGame() {
        this.startStoryMode(this.selectedDiff);
    }

    hideAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
    }

    // 무한 모드 10웨이브마다 기하급수적으로 강력해지는 보스 스펙 계산기 (100웨이브는 난공불락)
    getEndlessBossConfig(wave) {
        const cycle = Math.max(1, Math.floor(wave / 10));
        let hp, damageMul, skillIgnore, normalDodge, castleAttackPct, speed, guardCount;

        if (cycle <= 10) {
            // 10웨이브(cycle=1): 16,000 HP(입문용)로 시작하여 10단계(100웨이브)에서 52억 HP의 종말 파괴신 제왕까지 점진적 스케일링!
            hp = Math.round(16000 * Math.pow(3.6, cycle - 1) * (1 + (cycle - 1) * 0.25));
            damageMul = +(1.2 + (cycle - 1) * 1.5 + Math.pow(cycle - 1, 2) * 0.35).toFixed(1);
            skillIgnore = +(0.20 + (cycle - 1) * (0.70 / 9)).toFixed(2);
            normalDodge = +(0.15 + (cycle - 1) * (0.73 / 9)).toFixed(2);
            castleAttackPct = +(0.30 + (cycle - 1) * (0.70 / 9)).toFixed(2);
            speed = 0.75 * 1.12; // 중간보스 기본 전진 속도보다 12% 빠름
            guardCount = Math.round(12 + (cycle - 1) * (68 / 9));
        } else {
            // 100웨이브 초과 시 추가 스케일링
            const extra = cycle - 10;
            hp = Math.round(16000 * Math.pow(3.6, 9) * (1 + 9 * 0.25) * Math.pow(2.5, extra));
            damageMul = +(43 + extra * 15).toFixed(1);
            skillIgnore = 0.90;
            normalDodge = 0.90;
            castleAttackPct = 1.0;
            speed = 0.75 * 1.12; // 모든 무한 단계에서 동일한 전진 속도 비율
            guardCount = Math.min(100, 80 + extra * 5);
        }

        let titleName = '각성 제왕';
        if (cycle === 1) titleName = '각성 늑대 제왕 (1단계)';
        else if (cycle === 2) titleName = '화염 분노 제왕 (2단계)';
        else if (cycle === 3) titleName = '심연의 군주 제왕 (3단계)';
        else if (cycle === 4) titleName = '폭풍 파괴 제왕 (4단계)';
        else if (cycle === 5) titleName = '대지 격돌 패왕 (5단계)';
        else if (cycle === 6) titleName = '암흑 차원 패왕 (6단계)';
        else if (cycle === 7) titleName = '묵시록의 멸망 패왕 (7단계)';
        else if (cycle === 8) titleName = '시공간 붕괴 패왕 (8단계)';
        else if (cycle === 9) titleName = '불멸의 혼돈 신왕 (9단계)';
        else if (cycle === 10) titleName = '절대불멸의 종말 파괴신 제왕 (FINAL BOSS)';
        else if (cycle > 10) titleName = `차원 초월 파멸신 (${cycle}단계)`;

        return {
            hp,
            damageMul,
            skillIgnore,
            normalDodge,
            castleAttackPct,
            speed,
            guardCount,
            title: `👑 [WAVE ${wave}] ${titleName}`
        };
    }

    // 스테이지별 동화 배경 테마 정의 (1~10 웨이브 10대 테마 1:1 완벽 매칭)
    getStageTheme(waveNum = this.wave) {
        const stageThemes = [
            null, // 1-indexed
            { id: 'sunny_meadow', name: '화창한 동화 초원', bannerColor: '#16a34a', icon: '☀️' },
            { id: 'windmill_valley', name: '살랑이는 바람의 풍차 마을', bannerColor: '#059669', icon: '🌾' },
            { id: 'rainbow_valley', name: '찬란한 무지개 언덕', bannerColor: '#0284c7', icon: '🌈' },
            { id: 'golden_sun', name: '황금빛 해바라기 고개', bannerColor: '#f59e0b', icon: '🌻' },
            { id: 'mushroom_forest', name: '신비로운 요정 버섯 숲 [중간보스전]', bannerColor: '#0d9488', icon: '🍄' },
            { id: 'cotton_candy', name: '달콤한 솜사탕 요정 숲', bannerColor: '#db2777', icon: '🌸' },
            { id: 'crystal_lake', name: '푸른 수정 반딧불 호수', bannerColor: '#0284c7', icon: '🔮' },
            { id: 'emerald_palace', name: '고귀한 에메랄드 왕국', bannerColor: '#0891b2', icon: '🏰' },
            { id: 'twilight_fortress', name: '신비로운 보랏빛 황혼 요새', bannerColor: '#7c3aed', icon: '🌌' },
            { id: 'carnival', name: '승리의 동화 대축제 [최종결전]', bannerColor: '#ea580c', icon: '🏆' }
        ];

        if (this.mode === 'ENDLESS') {
            if (waveNum >= 100) {
                return {
                    id: 'carnival',
                    name: `무한의 동화 대축제 (${waveNum}W)`,
                    bannerColor: '#ea580c',
                    icon: '🏆'
                };
            }
            const idx = ((waveNum - 1) % 10) + 1;
            const t = stageThemes[idx];
            return {
                id: t.id,
                name: `${t.name} (${waveNum}W)`,
                bannerColor: t.bannerColor,
                icon: t.icon
            };
        } else {
            // 스토리 모드: 1~10 웨이브 각 1:1 완벽 매칭!
            const idx = Math.max(1, Math.min(10, waveNum));
            return stageThemes[idx];
        }
    }

    // 웨이브 시작 및 적 리스트 생성
    startWave(waveNum) {
        if (this.bgRenderer) this.bgRenderer.invalidateCache();
        this.wave = waveNum;
        this.waveInProgress = true;
        this.waveEnemiesToSpawn = [];
        this.spawnTimer = 0;
        this.bossSpawned = false;
        const bossHud = document.getElementById('boss-hud-container');
        if (bossHud) bossHud.classList.add('hidden');

        const diff = DIFFICULTY_CONFIG[this.currentDiff || 'easy'];
        const theme = this.getStageTheme(waveNum);
        document.getElementById('wave-display').innerText = `WAVE ${this.wave}${this.mode === 'ENDLESS' ? ' (무한)' : '/10'}`;
        const themeEl = document.getElementById('stage-theme-display');
        if (themeEl) {
            themeEl.innerText = `${theme.icon} ${theme.name}`;
        }
        if (waveNum > 1 || soundEngine.bgmPlaying) {
            soundEngine.startStageBGM(waveNum);
            this.updateBGMButton();
        }

        // 웨이브 구성 로직
        if (this.mode === 'STORY' && waveNum === 10) {
            // 보스 웨이브: 10웨이브 늑대 대군단 총출동 + 힙스터 제왕 출격!
            soundEngine.bossAlert();
            this.showBanner(`⚠️ [10웨이브 최종 결전] [${diff.name}] 늑대 대군단과 힙스터 제왕 총진격! (${theme.icon} ${theme.name}) ⚠️`, "#ff3333");
            
            // 10웨이브 늑대 대폭 증원 (쉬움: 14마리, 보통: 22마리, 어려움: 32마리)
            const guardCount = this.currentDiff === 'easy' ? 14 : this.currentDiff === 'normal' ? 22 : 32;
            const enemyTypes = ['normal', 'skater', 'granny', 'balloon', 'blower', 'shield', 'umbrella'];

            for (let i = 0; i < guardCount; i++) {
                const type = enemyTypes[i % enemyTypes.length];
                const interval = this.currentDiff === 'hard' ? 450 : this.currentDiff === 'normal' ? 600 : 750;
                this.waveEnemiesToSpawn.push({
                    type: type,
                    delay: 700 + i * interval + Math.random() * 200
                });
            }
            // 보스는 대군단의 지원을 받으며 중반에 당당하게 출현!
            const bossDelay = this.currentDiff === 'easy' ? 4000 : this.currentDiff === 'normal' ? 5000 : 6000;
            this.waveEnemiesToSpawn.push({ type: 'boss', delay: bossDelay });
        } else if (this.mode === 'ENDLESS' && waveNum % 10 === 0) {
            // 무한 모드 10웨이브마다 점점 세지는 제왕 출현! 100웨이브는 난공불락 종말 파괴신 제왕!
            soundEngine.bossAlert();
            const endlessCfg = this.getEndlessBossConfig(waveNum);
            this.showBanner(`⚠️ [무한 모드] ${endlessCfg.title} 총진격!! (${theme.icon} ${theme.name}) ⚠️`, waveNum >= 100 ? "#ff0000" : "#ff0055");
            
            const enemyTypes = ['normal', 'skater', 'granny', 'balloon', 'blower', 'shield', 'umbrella'];
            for (let i = 0; i < endlessCfg.guardCount; i++) {
                this.waveEnemiesToSpawn.push({
                    type: enemyTypes[i % enemyTypes.length],
                    delay: 500 + i * Math.max(150, 450 - waveNum * 2) + Math.random() * 100
                });
            }
            this.waveEnemiesToSpawn.push({ type: 'boss', delay: 3500 });
        } else if (waveNum === 5) {
            // 5웨이브: 스테이지 5단계 중간보스(선봉 돌격대장) 출현!
            soundEngine.bossAlert();
            this.showBanner(`⚠️ [5웨이브 중간 결전] 중간보스 [늑대 선봉 돌격대장] 총진격!! (${theme.icon} ${theme.name}) ⚠️`, "#ff5722");
            
            const guardCount = this.currentDiff === 'easy' ? 8 : this.currentDiff === 'normal' ? 14 : 20;
            const enemyTypes = ['normal', 'skater', 'granny', 'balloon'];

            for (let i = 0; i < guardCount; i++) {
                const type = enemyTypes[i % enemyTypes.length];
                const interval = this.currentDiff === 'hard' ? 550 : this.currentDiff === 'normal' ? 700 : 900;
                this.waveEnemiesToSpawn.push({
                    type: type,
                    delay: 600 + i * interval + Math.random() * 200
                });
            }
            // 중간보스 출현
            const midBossDelay = this.currentDiff === 'easy' ? 3200 : this.currentDiff === 'normal' ? 4200 : 5000;
            this.waveEnemiesToSpawn.push({ type: 'midboss', delay: midBossDelay });
        } else {
            if (waveNum === 6) {
                this.showBanner(`⚠️ [WAVE 6 신규 늑대 출몰] 양철방패 탱커 & 우산공수 늑대 총진격! (${theme.icon} ${theme.name}) ⚠️`, "#00e5ff");
            } else {
                this.showBanner(`WAVE ${this.wave} 시작! [${diff.name}] - ${theme.icon} ${theme.name}`, theme.bannerColor);
            }
            const baseCount = this.mode === 'ENDLESS'
                ? Math.round((8 + waveNum * 3.5) * diff.countMul)
                : Math.round((5 + waveNum * 3) * diff.countMul);
            for (let i = 0; i < baseCount; i++) {
                let types = ['normal'];
                if (waveNum >= 2 || this.currentDiff !== 'easy') types.push('skater');
                if (waveNum >= 3 || this.currentDiff !== 'easy') types.push('granny');
                if (waveNum >= 4) types.push('balloon');
                if (waveNum >= 5) types.push('blower');
                if (waveNum >= 6) {
                    types.push('shield');
                    types.push('umbrella');
                }

                const chosenType = types[Math.floor(Math.random() * types.length)];
                const step = Math.max(350, (2300 - waveNum * 130) / diff.speedMul);
                this.waveEnemiesToSpawn.push({
                    type: chosenType,
                    delay: 800 + i * step + Math.random() * 300
                });
            }
        }

        // 모든 난이도/단계에서 출현 빈도 20% 증가 (시간 간격 = 기존 / 1.2).
        // 일반 웨이브뿐 아니라 중간보스·최종보스 지원군에도 동일하게 적용한다.
        for (const spawn of this.waveEnemiesToSpawn) {
            spawn.delay /= 1.2;
        }
    }

    addParticle(pt) {
        if (this.particles.length < 80) {
            this.particles.push(pt);
        }
    }

    createFloatingText(text, x, y, color = '#ffffff', duration = 900) {
        if (this.floatingTexts.length >= 18) {
            this.floatingTexts.shift();
        }
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            alpha: 1.0,
            duration: duration,
            elapsed: 0
        });
    }

    showBanner(text, color = "#ffaa00") {
        // 기존 활성 배너 제거: 다중 스킬/이벤트 시 텍스트 겹침 완전 방지
        this.floatingTexts = this.floatingTexts.filter(ft => !ft.isBanner);
        this.floatingTexts.push({
            text: text,
            x: V_WIDTH / 2,
            y: 190,
            color: color,
            alpha: 1.0,
            scale: 2.0,
            duration: 2200,
            elapsed: 0,
            isBanner: true
        });
    }

    // ⚡ 터보 및 스마트 조준: 집으로 다가오는 가장 위협적인 적(지상/공중 늑대) 탐색
    findBestTarget(originX, originY) {
        if (!this.enemies || this.enemies.length === 0) return null;
        let bestTarget = null;
        let bestDist = Infinity;

        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            if (e.isDead || e.hp <= 0) continue;
            if (e.x < originX - 30) continue; // 이미 집을 지나간 적은 제외

            let aimX = e.x;
            let aimY = e.y;
            if (e instanceof BalloonWolf && e.isFlying) {
                // 풍선 늑대는 오직 상단 풍선(x+2, y-196)을 정밀 조준! (30% 확대)
                aimX = e.x + 2;
                aimY = e.y - 196;
            } else if ((e instanceof UmbrellaWolf || e.wolfTypeKey === 'umbrella') && e.isFlying) {
                // 우산 늑대는 상단 우산 캐노피(x, y-140)를 정밀 조준!
                aimX = e.x;
                aimY = e.y - 140;
            } else {
                // 일반 지상 늑대는 몸체 중심부 조준
                aimY = e.y - (e.h || 80) * 0.45;
            }

            // 집과의 거리 (X축 진행도를 우선 고려하여 가장 가까이 다가온 적 우선 조준)
            const dist = (e.x - originX) * 0.85 + Math.abs(aimY - originY) * 0.15;
            if (dist < bestDist) {
                bestDist = dist;
                bestTarget = { x: aimX, y: aimY };
            }
        }
        return bestTarget;
    }

    // 기본 사격 (플레이어 마우스 클릭 또는 터보 모드 자동 연사)
    tryShoot() {
        if (this.state !== GameState.PLAYING) return;
        // 터보 모드(마우스 미클릭 상태)일 때 전장에 살아있는 적이 없으면 자동 대기 (탄약 낭비 및 소음 방지)
        if (!this.mouse.isDown && this.isTurbo) {
            const hasAliveEnemy = this.enemies && this.enemies.some(e => !e.isDead && e.hp > 0);
            if (!hasAliveEnemy) return;
        }

        const now = performance.now();
        let shootDelay = Math.max(160, 400 - this.upgrades.attackSpeedLevel * 45);
        if (this.pigSpeedBuffTimer > 0) {
            shootDelay = Math.max(90, Math.round(shootDelay * 0.65)); // 셋째 콤보 공속 50% 버프
        }

        if (now - this.lastShootTime >= shootDelay) {
            this.lastShootTime = now;

            // 둘째 돼지의 Y자 새총 발사 원점 (1단계 초가집은 1층 툇마루 중앙, 2단계부터는 2층 발코니 테라스)
            const originX = this.house.tier === 1 
                ? (this.house.x + 105) 
                : (this.house.x + this.house.w * 0.62);
            const originY = this.house.tier === 1 
                ? (this.house.y + 165) 
                : (this.house.y + 86);

            // 조준 목표 좌표 (마우스 커서 방향을 기본으로 하되, 
            // 커서가 집 뒤쪽(왼쪽)에 있거나 화면 밖인 경우 다가오는 가장 위협적인 적을 자동 스마트 조준!)
            let targetX = this.mouse.x;
            let targetY = this.mouse.y;

            const minAimX = originX + 25;
            if (targetX <= minAimX || targetX >= V_WIDTH + 80 || targetY < 0 || targetY > V_HEIGHT) {
                const autoTarget = this.findBestTarget(originX, originY);
                if (autoTarget) {
                    targetX = autoTarget.x;
                    targetY = autoTarget.y;
                } else {
                    targetX = V_WIDTH;
                    targetY = 474;
                }
            }

            const dx = targetX - originX;
            const dy = targetY - originY;
            const angle = Math.atan2(dy, dx);
            const speed = 14;

            let damage = 22 + (this.upgrades.damageLevel - 1) * 10 + (this.house.tier - 1) * 6;
            // 무한 모드 전용 투사체 데미지 강화 (+1% ~ +1,000%) 적용!
            if (this.mode === 'ENDLESS' && this.endlessDamagePercent > 0) {
                damage *= (1 + this.endlessDamagePercent / 100);
            }

            const tier = this.house.tier || 1;
            const projRadius = tier === 1 ? 9 : (tier === 2 ? 11 : 13);

            this.projectiles.push({
                x: originX,
                y: originY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                angle: angle,
                rotation: angle - Math.PI / 2,
                radius: projRadius,
                damage: damage,
                tier: tier,
                life: 180,
                isBasicAttack: true,
                history: []
            });

            soundEngine.shoot();
            // 돼지 반동 효과
            this.house.shake = 3;

            // 둘째 돼지 사격 속도(공격 속도 레벨)에 따른 모션 액션 분기 및 실시간 연동
            const spdLevel = this.upgrades.attackSpeedLevel || 1;
            let actionName = 'slingshot_shoot';
            if (spdLevel >= 5) {
                // Lv.5 이상: 초고속 개틀링 난사 (화염 Muzzle Flash & 스파크)
                actionName = 'gatling_shoot';
            } else if (spdLevel >= 3) {
                // Lv.3~4: 속사 퀵 스냅 사격 (주황빛 속사 플래시 & 이중 링)
                actionName = 'rapid_shoot';
            } else {
                // Lv.1~2: 표준 조준 사격 (정밀 당김 & 스냅 릴리즈)
                actionName = 'slingshot_shoot';
            }

            // 사격 속도에 맞춘 둘째 돼지 반동 및 삼형제 통통 반동
            if (this.pigAnim) {
                this.pigAnim[1].bounce = 1.5;
                if (spdLevel >= 5) {
                    // 고속 사격: 빠르고 날카로운 개틀링 진동 리코일
                    this.pigAnim[2].recoil = 2.6;
                    this.pigAnim[2].bounce = 1.3;
                    this.pigAnim[2].rot = -0.04;
                } else if (spdLevel >= 3) {
                    // 중속 속사: 탄력적인 스냅 리코일
                    this.pigAnim[2].recoil = 3.6;
                    this.pigAnim[2].bounce = 1.8;
                    this.pigAnim[2].rot = -0.055;
                } else {
                    // 저속 사격: 묵직한 조준 사격 킥백
                    this.pigAnim[2].recoil = 4.6;
                    this.pigAnim[2].bounce = 2.4;
                    this.pigAnim[2].rot = -0.07;
                }
                this.pigAnim[3].bounce = 1.2;
            }

            if (this.pigAnimators && this.pigAnimators[2]) {
                // 발사 주기(shootDelay)와 100% 실시간 연동되는 동적 애니메이션 FPS 계산 (한 발 쏠 때마다 정확히 1사이클 완벽 재생)
                const frameCount = 6;
                const dynamicFps = Math.max(16, Math.min(52, Math.round((frameCount / (shootDelay / 1000)) * 1.05)));
                this.pigAnimators[2].playAction(actionName, true, null, dynamicFps);
            }
        }
    }

    // 삼형제 스킬 발동 (승급 등급에 따른 초강력 진화)
    useSkill(slot) {
        if (this.state !== GameState.PLAYING) return;

        // [4] 전설의 궁극기: 해금 구매 완료 + 인게임 ALL MAX 달성으로 활성화된 상태에서만 발동 가능!
        if (slot === 4) {
            const isMaxed = this.checkAllMaxed();
            const hasUltimateActive = this.ultimateUnlocked && isMaxed;
            if (!hasUltimateActive) {
                return;
            }
        }

        const skill = this.skills[slot];
        if (!skill || skill.currentCd > 0) return;

        // 쿨다운 적용 (업그레이드 반영)
        const cdReduction = 1 - (this.upgrades.cooldownLevel - 1) * 0.12;
        skill.currentCd = skill.maxCd * cdReduction;
        const rank = this.pigRanks[slot] || 1;

        if (slot === 1) {
            // [1] 첫째 돼지: 짚단 굴리기 (1성: 일반, 2성: 불타는 짚단, 3성: 황금 태풍 짚단 2개)
            soundEngine.strawRoll();

            // 첫째 돼지 스킬 지속 시간 설정 (짚단이 화면 끝까지 굴러갈 때까지 연속 모션 유지)
            this.pig1SkillTimer = rank === 3 ? 3800 : (rank === 2 ? 3400 : 3200);

            // 첫째 돼지: 짚다발을 양손으로 굴리는 Sprite Sheet 액션 연속 발동 (loop: true)!
            if (this.pigAnimators && this.pigAnimators[1]) {
                this.pigAnimators[1].playAction('roll_straw', true, null, 12, true);
            }

            // 첫째 돼지 힘차게 짚단 투척 애니메이션!
            if (this.pigAnim) {
                this.pigAnim[1].bounce = 16;
                this.pigAnim[1].rot = -0.35;
                this.pigAnim[2].bounce = 4;
                this.pigAnim[3].bounce = 4;
            }

            if (rank === 1) {
                this.showBanner("🌾 첫째 돼지: 거대 짚단 굴리기!", "#e6a100");
                this.strawRolls.push({
                    x: this.house.x + this.house.w,
                    y: 412, // 늑대 출몰 가운데 수평선에 맞춰 정렬 (464 -> 412)
                    radius: 48,
                    vx: 6.5,
                    rotation: 0,
                    damage: 35 + (this.house.tier * 10),
                    rank: 1,
                    hitEnemies: new Set()
                });
            } else if (rank === 2) {
                this.showBanner("🔥 첫째 돼지: [★★ 2성] 불타는 짚단 굴리기!", "#ff5722");
                this.strawRolls.push({
                    x: this.house.x + this.house.w,
                    y: 412, // 늑대 출몰 가운데 수평선에 맞춰 정렬 (464 -> 412)
                    radius: 54,
                    vx: 8.0,
                    rotation: 0,
                    damage: 75 + (this.house.tier * 20),
                    rank: 2,
                    hitEnemies: new Set()
                });
            } else {
                this.showBanner("👑 첫째 돼지: [★★★ 3성] 황금 태풍 짚단 더블 롤링!!", "#ffd700");
                this.strawRolls.push({
                    x: this.house.x + this.house.w,
                    y: 410, // 늑대 출몰 가운데 수평선에 맞춰 정렬 (454 -> 410)
                    radius: 60,
                    vx: 9.0,
                    rotation: 0,
                    damage: 130 + (this.house.tier * 30),
                    rank: 3,
                    hitEnemies: new Set()
                });
                setTimeout(() => {
                    this.strawRolls.push({
                        x: this.house.x + this.house.w,
                        y: 416, // 늑대 출몰 가운데 수평선에 맞춰 정렬 (484 -> 416)
                        radius: 56,
                        vx: 9.5,
                        rotation: 0,
                        damage: 130 + (this.house.tier * 30),
                        rank: 3,
                        hitEnemies: new Set()
                    });
                }, 180);
            }
        } else if (slot === 2) {
            // [2] 둘째 돼지: 도토리 폭격 (1성: 5발, 2성: 7발 다이너마이트 + 지원사격, 3성: 10발 핵도토리 + 전체 기절)
            soundEngine.acornExplode();
            let targetX = this.mouse.x;
            let targetY = this.mouse.y;

            // 마우스 커서가 전투 영역 밖(UI 버튼 등)에 있으면 가장 위협적인 적(공중 풍선늑대 포함) 자동 조준!
            if (targetX < 350 || targetY > 540 || targetY < 40) {
                const autoTarget = this.findBestTarget(this.house.x + this.house.w, 400);
                if (autoTarget) {
                    targetX = autoTarget.x;
                    targetY = autoTarget.y;
                } else {
                    targetX = 650;
                    targetY = 400;
                }
            }
            targetX = Math.max(350, Math.min(V_WIDTH - 60, targetX));
            // 공중 풍선늑대(y=60~250)도 정밀 폭격할 수 있도록 y 제한을 하늘 높이(60)까지 확장!
            targetY = Math.min(534, Math.max(60, targetY));

            // 둘째 돼지: 폭탄 투척 프레임 액션 및 삼형제 바운스
            if (this.pigAnim) {
                this.pigAnim[1].bounce = 4;
                this.pigAnim[2].bounce = 6;
                this.pigAnim[2].recoil = 5;
                this.pigAnim[2].rot = -0.12;
                this.pigAnim[3].bounce = 3;
            }

            if (this.pigAnimators && this.pigAnimators[2]) {
                this.pigAnimators[2].playAction('bomb_throw', true);
            }

            if (rank === 1) {
                this.showBanner("🌰 둘째 돼지: 도토리 폭탄 세례!", "#8d5b28");
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const blastX = targetX + (Math.random() - 0.5) * 140;
                        const blastY = targetY + (Math.random() - 0.5) * 90;
                        this.spawnFallingBomb(blastX, blastY, 95, 50 + this.house.tier * 15, 1, false);
                    }, i * 90);
                }
            } else if (rank === 2) {
                this.showBanner("🧨 둘째 돼지: [★★ 2성] 다이너마이트 도토리 세례! (공중 풍선 격추)", "#e65100");
                for (let i = 0; i < 7; i++) {
                    setTimeout(() => {
                        const blastX = targetX + (Math.random() - 0.5) * 170;
                        const blastY = targetY + (Math.random() - 0.5) * 110;
                        this.spawnFallingBomb(blastX, blastY, 125, 85 + this.house.tier * 22, 2, false);
                    }, i * 80);
                }
                // 지원 사격 3발 (스마트 조준으로 공중 풍선 또는 지상 늑대 자동 사격)
                for (let s = 0; s < 3; s++) {
                    setTimeout(() => this.tryShoot(), s * 120);
                }
            } else {
                this.showBanner("🚀 둘째 돼지: [★★★ 3성] 핵도토리 융단폭격 & 전체 기절!!", "#ff1744");
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        const blastX = targetX + (Math.random() - 0.5) * 220;
                        const blastY = targetY + (Math.random() - 0.5) * 140;
                        this.spawnFallingBomb(blastX, blastY, 155, 140 + this.house.tier * 35, 3, true);
                    }, i * 70);
                }
                // 화면 전체 늑대 2초간 완전 기절 (보스는 스킬 무시 확률 적용, 공중 풍선/우산 늑대도 격추 및 기절!)
                this.enemies.forEach(e => {
                    if (e instanceof BalloonWolf || e.wolfTypeKey === 'balloon') {
                        if (e.isFlying) {
                            e.popBalloon(this);
                        }
                        e.slowTimer = 2200;
                        e.speed = 0;
                        return;
                    }
                    if (e instanceof UmbrellaWolf || e.wolfTypeKey === 'umbrella') {
                        if (e.isFlying) {
                            e.popUmbrella(this);
                        }
                        e.slowTimer = 2200;
                        e.speed = 0;
                        return;
                    }
                    if (e instanceof BossWolf && Math.random() < e.skillIgnoreChance) {
                        this.floatingTexts.push({
                            text: '🛡️ 스킬 무시!',
                            x: e.x,
                            y: e.y - e.h - 20,
                            color: '#e040fb',
                            alpha: 1.0,
                            duration: 900,
                            elapsed: 0
                        });
                        soundEngine.skillIgnore();
                        return;
                    }
                    e.slowTimer = 2200;
                    e.speed = 0;
                });
            }
        } else if (slot === 3) {
            // [3] 셋째 돼지: 수리 & 대공 요격포 (2단계 마스터 시 하늘 공중늑대 일제 요격!)
            soundEngine.repair();

            // 셋째 돼지 액션 모션 (망치질 수리 & 대공포 사격)
            const duration = rank >= 2 ? 5000 : 3500;
            this.pig3SkillTimer = duration;
            this.pig3SkillType = 'repair';
            if (this.pigAnimators && this.pigAnimators[3]) {
                this.pigAnimators[3].playAction('hammer_repair', true, null, 12, true);
            }

            // 셋째 돼지 황금망치 & 대공포 발사 바운스 애니메이션!
            if (this.pigAnim) {
                this.pigAnim[3].bounce = rank >= 2 ? 24 : 16;
                this.pigAnim[3].rot = -0.35;
                this.pigAnim[1].bounce = 8;
                this.pigAnim[2].bounce = 8;
            }

            if (rank >= 2) {
                // 👑 [2단계 마스터] 하늘 공중늑대 일제 요격 + 대공 방공망 전개 + 황금 망치 수리(65%) & 끓는 기름 가마솥!
                const heal = Math.floor(this.house.maxHp * 0.65);
                this.house.hp = Math.min(this.house.maxHp, this.house.hp + heal);
                this.cauldronFire = 5000;

                // 🎯 화면 내 비행 중인 하늘 공중늑대(풍선 & 우산) 전원 탐색 및 요격
                const flyingWolves = this.enemies.filter(e => ((e instanceof BalloonWolf || e.wolfTypeKey === 'balloon') || (e instanceof UmbrellaWolf || e.wolfTypeKey === 'umbrella')) && e.isFlying && !e.dead);
                if (flyingWolves.length > 0) {
                    flyingWolves.forEach((w, idx) => {
                        setTimeout(() => {
                            this.launchAntiAirRocket(w);
                        }, idx * 100);
                    });
                    this.showBanner(`🎯 [셋째 돼지 마스터] 대공 요격포 발사!! 하늘 공중늑대 ${flyingWolves.length}마리 일제 격추!! (체력 +${heal})`, "#00e5ff");
                } else {
                    // 화면에 공중 늑대가 없을 때: 전방으로 유성 벽돌 포격 3발 + 8초간 대공 자동 방공망 전개!
                    this.pig3AntiAirTimer = 8000;
                    this.launchAntiAirBarrage();
                    this.showBanner(`🎯 [셋째 돼지 마스터] 대공 방공망 전개 (8초간 공중 자동격추) & 황금 수리(+${heal})!!`, "#00e5ff");
                }
            } else {
                // 1단계: 기본 집 체력 40% 수리 & 펄펄 끓는 가마솥
                const heal = Math.floor(this.house.maxHp * 0.4);
                this.house.hp = Math.min(this.house.maxHp, this.house.hp + heal);
                this.cauldronFire = 3500;
                this.showBanner(`🧱 셋째 돼지: 집 수리(+${heal}) & 펄펄 가마솥!`, "#2e7d32");
            }

            // 벽면 손상 균열 치유 봉합 오라 발동!
            this.house.repairFxTimer = 1800;

            // 수리 & 대공 황금 스파크 파티클
            for (let i = 0; i < 28; i++) {
                this.particles.push({
                    x: this.house.x + Math.random() * this.house.w,
                    y: this.house.y + Math.random() * this.house.h,
                    vx: (Math.random() - 0.5) * 6,
                    vy: -Math.random() * 5 - 2,
                    color: rank >= 2 ? (Math.random() < 0.5 ? '#00e5ff' : '#ffd700') : '#4caf50',
                    size: 6,
                    life: 40
                });
            }

            // ♨️ 셋째 돼지 2단계 연계 콤보 스킬 발동 (증기 펄스 & 용암 대공포)
            const combo3 = this.pigComboSkills ? this.pigComboSkills[3] : 0;
            if (combo3 >= 1) {
                this.triggerPig3Combo(combo3);
            }
        } else if (slot === 4) {
            // [4] 전설의 궁극기: 천지개벽 대회오리 폭풍 (Tornado Blowaway)
            // 지면에서 하늘까지 솟구치는 거대 회오리바람이 전방의 모든 늑대를 공중으로 날려버림!
            soundEngine.tornadoHowl();
            this.showBanner("🌪️ [전설의 궁극기] 천지개벽 대회오리 폭풍 발사! (늑대 전원 공중 날리기!) 🌪️", "#0284c7");

            // 전설의 궁극기: 삼형제 다 함께 높이 점프 & 환호!
            if (this.pigAnim) {
                this.pigAnim[1].bounce = 26;
                this.pigAnim[2].bounce = 28;
                this.pigAnim[3].bounce = 26;
                this.pigAnim[2].rot = 0.45;
            }

            const stormWidth = 360; // 초거대 360px 폭풍 폭!
            const stormHeight = 580; // 화면 상단부터 지면까지 관통
            const stormOriginX = this.house.x + this.house.w + 40;
            const stormY = 345;

            this.cosmicStorms.push({
                x: stormOriginX,
                y: stormY,
                w: stormWidth,
                h: stormHeight,
                vx: 13.5, // 웅장한 전진 속도
                damage: 3000 + (this.upgrades.damageLevel * 600),
                hitEnemies: new Set(),
                knockbackTextCount: 0,
                life: 110,
                angle: 0
            });

            this.ultimateCinematic = 45; // 45프레임 시네마틱 만화 컷인 배너 & 하이퍼 집중선 연출!
            this.house.shake = 22; // 강렬한 화면 흔들림

            // 폭풍 발사 초기 소용돌이 나뭇잎 & 바람 스파크 방출
            for (let k = 0; k < 30; k++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * 9 + 4;
                this.particles.push({
                    x: stormOriginX,
                    y: stormY + (Math.random() - 0.5) * 200,
                    vx: Math.cos(angle) * spd + 3,
                    vy: Math.sin(angle) * spd,
                    color: Math.random() < 0.4 ? '#38bdf8' : (Math.random() < 0.7 ? '#4ade80' : '#facc15'),
                    size: Math.random() * 7 + 3,
                    life: 35
                });
            }
        }
    }

    // 셋째 돼지 마스터 대공 요격 로켓 발사
    launchAntiAirRocket(target) {
        soundEngine.cannon();
        const startX = this.house.x + this.house.w * 0.75;
        const startY = this.house.y + 35;
        const destX = target ? (target.x + 2) : (startX + 350 + Math.random() * 200);
        const destY = target ? (target.isFlying ? ((target.wolfTypeKey === 'umbrella' || target instanceof UmbrellaWolf) ? target.y - 140 : target.y - 196) : target.y) : (180 + Math.random() * 80);

        this.antiAirRockets.push({
            x: startX,
            y: startY,
            vx: 0,
            vy: -14,
            target: target,
            destX: destX,
            destY: destY,
            speed: 18,
            damage: 140,
            life: 80,
            history: []
        });

        // 굴뚝 발사 연기 & 황금 스파크 파티클
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: startX + (Math.random() - 0.5) * 12,
                y: startY + (Math.random() - 0.5) * 12,
                vx: -Math.random() * 4 - 1,
                vy: -Math.random() * 5 - 2,
                color: Math.random() < 0.5 ? '#ffd700' : '#ff5722',
                size: 5,
                life: 20
            });
        }
    }

    // 공중 늑대가 없을 때 발사하는 지상 유성 포격 세례
    launchAntiAirBarrage() {
        soundEngine.cannon();
        const startX = this.house.x + this.house.w * 0.75;
        const startY = this.house.y + 35;
        for (let b = 0; b < 3; b++) {
            setTimeout(() => {
                const targetX = 420 + b * 220 + Math.random() * 80;
                const targetY = 474;
                this.antiAirRockets.push({
                    x: startX,
                    y: startY,
                    vx: 0,
                    vy: -14,
                    target: null,
                    destX: targetX,
                    destY: targetY,
                    speed: 16,
                    damage: 130,
                    life: 90,
                    history: []
                });
            }, b * 130);
        }
    }

    // 💣 둘째 돼지 콤보: 2차 유탄 클러스터 파편 스폰
    spawnSecondaryClusters(x, y, tier) {
        const count = tier === 2 ? 10 : 5;
        if (soundEngine && soundEngine.clusterBurst) soundEngine.clusterBurst();
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.5;
            const speed = Math.random() * 5 + 3.5;
            this.secondaryClusters.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 4.5,
                radius: tier === 2 ? 10 : 7.5,
                rotation: Math.random() * Math.PI * 2,
                tier: tier,
                life: 20 + Math.floor(Math.random() * 12),
                damage: (tier === 2 ? 180 : 120) + (this.upgrades.damageLevel * 15)
            });
        }
    }

    // 💣 둘째 돼지 콤보 2단계: 바닥 유황 지뢰 3개 매설
    spawnSulfurMines(centerX) {
        const offsets = [-80, 0, 80];
        offsets.forEach(off => {
            const mineX = Math.max(this.house.x + this.house.w + 50, Math.min(V_WIDTH - 60, centerX + off));
            this.sulfurMines.push({
                x: mineX,
                y: 524,
                radius: 36,
                damage: 320 + (this.upgrades.damageLevel * 30),
                life: 18000 // 18초 유지
            });
        });
        this.showBanner("💣 [둘째 콤보 MAX] 바닥 유황 지뢰 3개 매설 완료! (적 접근 시 공중 폭발)", "#f59e0b");
    }

    // ♨️ 셋째 돼지 콤보: 요새 증기 충격파 & 용암 대공포 분출
    triggerPig3Combo(tier) {
        soundEngine.steamBurst();
        const pulseX = this.house.x + this.house.w;
        const pulseY = 440;

        if (tier === 1) {
            // 1단계: 고압 증기 펄스 넉백 + 아기돼지 사격 속도 +50% 버프
            this.steamPulses.push({
                x: pulseX,
                y: pulseY,
                radius: 30,
                maxRadius: 340,
                speed: 16,
                tier: 1,
                hitEnemies: new Set()
            });
            this.pigSpeedBuffTimer = 4000;
            this.showBanner("♨️ [셋째 콤보] 요새 고압 증기 방출! 적 넉백 & 아기돼지 사격 속도 +50%!!", "#00e5ff");
        } else {
            // 2단계: 초고압 플라즈마 증기 펄스(광역 스턴) + 용암 대공포 3연발 + 요새 5초 무적
            this.steamPulses.push({
                x: pulseX,
                y: pulseY,
                radius: 30,
                maxRadius: 480,
                speed: 20,
                tier: 2,
                hitEnemies: new Set()
            });
            this.pigSpeedBuffTimer = 5000;
            this.house.invincibleTimer = 5000; // 요새 5초 완전 무적

            // 🌋 가마솥에서 하늘로 치솟는 용암 대공포 3연발
            const flyingWolves = this.enemies.filter(e => ((e instanceof BalloonWolf || e.wolfTypeKey === 'balloon') || (e instanceof UmbrellaWolf || e.wolfTypeKey === 'umbrella')) && e.isFlying && !e.dead);
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (this.state !== GameState.PLAYING) return;
                    soundEngine.lavaCannon();
                    const target = flyingWolves[i] || (flyingWolves[0] || null);
                    const targetX = target ? target.x : (this.house.x + this.house.w + 180 + i * 160);
                    const targetY = target ? target.y : (120 + i * 40);
                    this.lavaMortars.push({
                        x: this.house.x + this.house.w * 0.7,
                        y: 280,
                        targetX: targetX,
                        targetY: targetY,
                        targetWolf: target,
                        vx: (targetX - (this.house.x + this.house.w * 0.7)) / 22,
                        vy: (targetY - 280) / 22,
                        radius: 15,
                        life: 22,
                        damage: 480 + (this.upgrades.damageLevel * 50)
                    });
                }, i * 140);
            }

            this.showBanner("♨️ [셋째 콤보 MAX] 플라즈마 증기 광역 스턴 & 용암 대공포 3연발 & 요새 5초 무적!!", "#e040fb");
        }
    }

    // ⚡ 스탯 ALL MAX: 천벌의 벼락 자동 공격
    triggerDivineLightning(target) {
        soundEngine.thunderStrike();
        this.house.shake = Math.max(this.house.shake, 14);

        const targetX = target ? target.x : (this.house.x + this.house.w + 250);
        const targetY = target ? target.y : 420;

        // 지그재그 번개 궤적 포인트 생성
        const points = [];
        const segments = 10;
        const startX = targetX + (Math.random() - 0.5) * 40;
        const startY = 0;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const px = startX + (targetX - startX) * t + (i === 0 || i === segments ? 0 : (Math.random() - 0.5) * 50);
            const py = startY + (targetY - startY) * t;
            points.push({ x: px, y: py });
        }

        this.divineLightnings.push({
            startX: startX,
            startY: startY,
            targetX: targetX,
            targetY: targetY,
            points: points,
            life: 18,
            maxLife: 18
        });

        const dmg = 850 + (this.upgrades.damageLevel * 120);

        // 주 타겟 피격
        if (target && !target.dead) {
            if ((target instanceof BalloonWolf || target.wolfTypeKey === 'balloon') && target.isFlying) {
                target.popBalloon(this);
            } else if ((target instanceof UmbrellaWolf || target.wolfTypeKey === 'umbrella') && target.isFlying) {
                target.popUmbrella(this);
            }
            target.takeDamage(dmg, this, true);
            target.slowTimer = 2000;
            target.speed = 0;
        }

        // 주변 최대 4마리 적에게 연쇄 감전 스파크 전파
        const nearby = this.enemies.filter(e => !e.dead && e !== target && Math.hypot(e.x - targetX, e.y - targetY) < 180);
        nearby.slice(0, 4).forEach(ne => {
            ne.takeDamage(Math.round(dmg * 0.55), this, true);
            ne.slowTimer = 1500;
            if (ne.animator) ne.animator.playAction('hurt', false, null, 12);
        });

        this.showBanner("⚡ [스탯 ALL MAX 각성] 천벌의 벼락 강타!! 공중 적 격추 & 연쇄 감전!", "#facc15");
    }

    // ⚡ 스탯 ALL MAX 주기적 자동 공격 (5초 주기 / 50% 확률로 천벌의 벼락 시전)
    updateStatMaxAwakening(dt) {
        const isStatsMax = this.checkAllStatsMax();
        const badge = document.getElementById('stat-awakening-badge');
        if (badge) {
            badge.classList.toggle('hidden', !isStatsMax);
        }

        if (!isStatsMax || this.state !== GameState.PLAYING) return;

        this.statMaxTimer += dt;
        if (this.statMaxTimer >= 5000) {
            this.statMaxTimer = 0;
            // 5초마다 50% 확률 발동 체크
            if (Math.random() < 0.50) {
                const flyingWolves = this.enemies.filter(e => ((e instanceof BalloonWolf || e.wolfTypeKey === 'balloon') || (e instanceof UmbrellaWolf || e.wolfTypeKey === 'umbrella')) && e.isFlying && !e.dead);
                const groundWolves = this.enemies.filter(e => !e.dead && (!e.isFlying));

                if (flyingWolves.length > 0) {
                    // 하늘 공중늑대(풍선/우산) 우선 격추 천벌의 벼락
                    this.triggerDivineLightning(flyingWolves[0]);
                } else if (groundWolves.length > 0) {
                    const target = this.findBestTarget(this.house.x + this.house.w, 400) || groundWolves[0];
                    this.triggerDivineLightning(target);
                } else {
                    const anyEnemy = this.enemies.find(e => !e.dead && e.hp > 0);
                    if (anyEnemy) {
                        this.triggerDivineLightning(anyEnemy);
                    }
                }
            }
        }
    }

    // 🐷 삼형제 2단계 콤보 추가 스킬 지속 이펙트 및 충돌 업데이트
    updatePigComboEffects(dt) {
        // 공속 버프 타이머 감소
        if (this.pigSpeedBuffTimer > 0) {
            this.pigSpeedBuffTimer = Math.max(0, this.pigSpeedBuffTimer - dt);
        }

        // 1. 화염 가시 장판 업데이트
        for (let i = this.groundFireTrails.length - 1; i >= 0; i--) {
            const t = this.groundFireTrails[i];
            t.life -= dt;
            t.damageTimer += dt;

            // 250ms마다 지속 피해 및 디버프 적용
            if (t.damageTimer >= 250) {
                t.damageTimer = 0;
                const dpsDmg = (t.tier === 2 ? 23 : 11) + (this.upgrades.damageLevel * 1.5);
                this.enemies.forEach(e => {
                    if (e.dead) return;
                    if (e.isFlying) return; // 비행 중인 공중 늑대는 바닥 가시 장판 무시

                    if (e.x >= t.x - 20 && e.x <= t.x + t.w + 20) {
                        e.takeDamage(dpsDmg, this, true);
                        if (t.tier === 1) {
                            e.slowTimer = 1000;
                        } else {
                            // 2단계: 1.5초 속박 & 방어력 30% 감소 디버프 (3초 지속)
                            e.rootTimer = Math.max(e.rootTimer || 0, 1500);
                            e.armorShredTimer = Math.max(e.armorShredTimer || 0, 3000);
                        }
                    }
                });
            }

            if (t.life <= 0) {
                this.groundFireTrails.splice(i, 1);
            }
        }

        // 2. 2차 클러스터 유탄 업데이트
        for (let i = this.secondaryClusters.length - 1; i >= 0; i--) {
            const c = this.secondaryClusters[i];
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.45; // 중력
            c.rotation += 0.2;
            c.life--;

            // 지면 바운스
            if (c.y >= 520) {
                c.y = 520;
                c.vy = -c.vy * 0.4;
                c.vx *= 0.65;
            }

            if (c.life <= 0) {
                // 클러스터 폭발
                this.comicExplosions.push({
                    x: c.x,
                    y: c.y,
                    maxRadius: 65,
                    rank: c.tier,
                    life: 18,
                    maxLife: 18,
                    rotation: Math.random() * 0.5,
                    shockwaveRadius: 8,
                    shockwaveMax: 70
                });
                soundEngine.pop();

                // 주변 적 피격
                this.enemies.forEach(e => {
                    if (e.dead) return;
                    const d = Math.hypot(e.x - c.x, e.y - c.y);
                    if (d <= 75) {
                        e.takeDamage(c.damage, this, true);
                        if ((e instanceof BalloonWolf || e.wolfTypeKey === 'balloon') && e.isFlying && d <= 55) {
                            e.popBalloon(this);
                        } else if ((e instanceof UmbrellaWolf || e.wolfTypeKey === 'umbrella') && e.isFlying && d <= 55) {
                            e.popUmbrella(this);
                        }
                    }
                });

                this.secondaryClusters.splice(i, 1);
            }
        }

        // 3. 바닥 유황 지뢰 업데이트
        for (let i = this.sulfurMines.length - 1; i >= 0; i--) {
            const m = this.sulfurMines[i];
            m.life -= dt;

            // 지상 늑대 접근 감지
            let triggered = false;
            for (let j = 0; j < this.enemies.length; j++) {
                const e = this.enemies[j];
                if (e.dead) continue;
                if (e.isFlying) continue; // 비행 중인 공중 늑대는 바닥 지뢰 무시

                if (Math.abs(e.x - m.x) < 38) {
                    triggered = true;
                    // 폭발 및 늑대 에어본
                    e.takeDamage(m.damage, this, true);
                    e.slowTimer = 2000;
                    if (typeof e.launchAirborne === 'function') {
                        e.launchAirborne(Math.random() * 2, -12.5, this);
                    }
                    break;
                }
            }

            if (triggered || m.life <= 0) {
                if (triggered) {
                    soundEngine.explosion();
                    this.comicExplosions.push({
                        x: m.x,
                        y: m.y - 15,
                        maxRadius: 90,
                        rank: 3,
                        life: 22,
                        maxLife: 22,
                        rotation: Math.random() * 0.4,
                        shockwaveRadius: 10,
                        shockwaveMax: 95
                    });
                }
                this.sulfurMines.splice(i, 1);
            }
        }

        // 4. 요새 증기 펄스 업데이트
        for (let i = this.steamPulses.length - 1; i >= 0; i--) {
            const s = this.steamPulses[i];
            s.radius += s.speed;

            this.enemies.forEach(e => {
                if (e.dead || s.hitEnemies.has(e)) return;
                if (e.isFlying) return; // 비행 중인 공중 늑대는 증기 펄스 무시

                const dist = Math.abs(e.x - s.x);
                if (dist <= s.radius) {
                    s.hitEnemies.add(e);
                    const kb = s.tier === 2 ? (e.isBoss ? 60 : 220) : (e.isBoss ? 35 : 130);
                    e.x += kb;
                    if (s.tier === 2) {
                        e.slowTimer = 2000;
                        e.speed = 0;
                    }
                    e.takeDamage(s.tier === 2 ? 300 : 150, this, true);
                    soundEngine.hit();
                }
            });

            if (s.radius >= s.maxRadius) {
                this.steamPulses.splice(i, 1);
            }
        }

        // 5. 가마솥 용암 대공포 업데이트
        for (let i = this.lavaMortars.length - 1; i >= 0; i--) {
            const m = this.lavaMortars[i];
            m.x += m.vx;
            m.y += m.vy;
            m.life--;

            if (m.life <= 0) {
                soundEngine.explosion();
                this.comicExplosions.push({
                    x: m.x,
                    y: m.y,
                    maxRadius: 90,
                    rank: 3,
                    life: 20,
                    maxLife: 20,
                    rotation: 0,
                    shockwaveRadius: 8,
                    shockwaveMax: 90
                });

                // 공중 격추 및 광역 폭발
                this.enemies.forEach(e => {
                    if (e.dead) return;
                    if (Math.hypot(e.x - m.x, e.y - m.y) < 110) {
                        if ((e instanceof BalloonWolf || e.wolfTypeKey === 'balloon') && e.isFlying) {
                            e.popBalloon(this);
                        } else if ((e instanceof UmbrellaWolf || e.wolfTypeKey === 'umbrella') && e.isFlying) {
                            e.popUmbrella(this);
                        }
                        e.takeDamage(m.damage, this, true);
                    }
                });

                this.lavaMortars.splice(i, 1);
            }
        }

        // 6. 벼락 이펙트 수명 감소
        for (let i = this.divineLightnings.length - 1; i >= 0; i--) {
            this.divineLightnings[i].life--;
            if (this.divineLightnings[i].life <= 0) {
                this.divineLightnings.splice(i, 1);
            }
        }
    }

    // 공중 낙하 도토리 폭탄 투하 스폰
    spawnFallingBomb(destX, destY, radius, damage, rank, isStun) {
        const startX = destX - 90 - Math.random() * 50;
        const startY = -40 - Math.random() * 30;
        const flightFrames = 18;
        const vx = (destX - startX) / flightFrames;
        const vy = (destY - startY) / flightFrames;
        const angle = Math.atan2(destY - startY, destX - startX);
        this.fallingBombs.push({
            x: startX,
            y: startY,
            destX: destX,
            destY: destY,
            vx: vx,
            vy: vy,
            flightFrames: flightFrames,
            currentFrame: 0,
            rank: rank || 1,
            radius: radius,
            damage: damage,
            isStun: isStun || false,
            rotation: angle - Math.PI / 2
        });
    }

    // 도토리 폭탄 착탄 및 만화 폭발 (BOOM & 충격파)
    triggerAcornDetonation(x, y, radius, damage, rank, isStun) {
        rank = rank || 1;
        if (rank === 1) {
            soundEngine.acornExplode();
        } else {
            soundEngine.explosion();
        }

        // 화면 흔들림 효과
        this.house.shake = Math.max(this.house.shake, rank === 3 ? 12 : (rank === 2 ? 8 : 5));

        // 만화 폭발 버섯구름 & 충격파 링 스폰
        this.comicExplosions.push({
            x: x,
            y: y,
            maxRadius: radius,
            rank: rank,
            life: 24,
            maxLife: 24,
            rotation: (Math.random() - 0.5) * 0.4,
            shockwaveRadius: 12,
            shockwaveMax: radius * 1.15
        });

        // 성급별 고유 파편 및 불꽃 파티클 방출
        const pCount = rank === 3 ? 24 : (rank === 2 ? 18 : 12);
        for (let i = 0; i < pCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 3;
            let pCol;
            if (rank === 3) {
                pCol = Math.random() < 0.4 ? '#ff1744' : (Math.random() < 0.7 ? '#ffea00' : '#76ff03');
            } else if (rank === 2) {
                pCol = Math.random() < 0.5 ? '#d32f2f' : (Math.random() < 0.8 ? '#ff9800' : '#ffd54f');
            } else {
                pCol = Math.random() < 0.6 ? '#8d5b28' : '#d7ccc8';
            }
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: pCol,
                size: Math.random() * 5 + 3,
                life: 25
            });
        }

        // 범위 내 적 타격 (풍선 비행 늑대 및 일반 지상 늑대 모두 명중!)
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (!enemy || enemy.isDead || enemy.hp <= 0) continue;

            // 공중 풍선 폭격수 늑대 타격 판정
            if (enemy instanceof BalloonWolf || enemy.wolfTypeKey === 'balloon') {
                const balloonX = enemy.x + 2;
                const balloonCenterY = enemy.y - 196;
                const distBalloon = Math.hypot(balloonX - x, balloonCenterY - y);
                const distBody = Math.hypot(enemy.x - x, (enemy.y - 45) - y);
                const minBalloonDist = Math.min(distBalloon, distBody);

                // 폭발 반경 내에 풍선 또는 늑대 본체가 걸치면 피격!
                if (minBalloonDist <= radius + 20) {
                    if (enemy.isFlying) {
                        enemy.popBalloon(this);
                        this.floatingTexts.push({
                            text: '💥 다이너마이트 폭발로 풍선 격추!!',
                            x: enemy.x,
                            y: enemy.y - 120,
                            color: '#ff9100',
                            alpha: 1.0,
                            duration: 900,
                            elapsed: 0
                        });
                    }
                    enemy.takeDamage(damage, this, true, true);
                    if (isStun) {
                        enemy.slowTimer = 2200;
                        enemy.speed = 0;
                    }
                }
                continue;
            }

            // 공중 우산 낙하산 공수 늑대 타격 판정
            if (enemy instanceof UmbrellaWolf || enemy.wolfTypeKey === 'umbrella') {
                const umbrellaX = enemy.x;
                const umbrellaCenterY = enemy.y - 140;
                const distUmbrella = Math.hypot(umbrellaX - x, umbrellaCenterY - y);
                const distBody = Math.hypot(enemy.x - x, (enemy.y - 45) - y);
                const minUmbrellaDist = Math.min(distUmbrella, distBody);

                // 폭발 반경 내에 우산 또는 늑대 본체가 걸치면 피격!
                if (minUmbrellaDist <= radius + 25) {
                    if (enemy.isFlying) {
                        enemy.popUmbrella(this);
                        this.floatingTexts.push({
                            text: '💥 다이너마이트 폭발로 우산 격추!!',
                            x: enemy.x,
                            y: enemy.y - 100,
                            color: '#ff9100',
                            alpha: 1.0,
                            duration: 900,
                            elapsed: 0
                        });
                    }
                    enemy.takeDamage(damage, this, true, true);
                    if (isStun) {
                        enemy.slowTimer = 2200;
                        enemy.speed = 0;
                    }
                }
                continue;
            }

            // 일반 지상 늑대 피격 판정
            const dist = Math.hypot(enemy.x - x, enemy.y - y);
            if (dist <= radius) {
                enemy.takeDamage(damage, this, true);
                if (isStun) {
                    if (enemy instanceof BossWolf && Math.random() < enemy.skillIgnoreChance) {
                        this.floatingTexts.push({
                            text: '🛡️ 스킬 무시!',
                            x: enemy.x,
                            y: enemy.y - enemy.h - 20,
                            color: '#e040fb',
                            alpha: 1.0,
                            duration: 900,
                            elapsed: 0
                        });
                        soundEngine.skillIgnore();
                    } else {
                        enemy.slowTimer = 2200;
                        enemy.speed = 0;
                    }
                }
            }
        }

        // 💣 둘째 돼지 2단계 연계 콤보 스킬 발동 (클러스터 유탄 & 바닥 유황 지뢰)
        const combo2 = this.pigComboSkills ? this.pigComboSkills[2] : 0;
        if (combo2 >= 1 && (rank >= 2 || Math.random() < 0.4)) {
            this.spawnSecondaryClusters(x, y, combo2);
            if (combo2 === 2) {
                const nowMs = performance.now();
                if (!this._lastMineDrop || (nowMs - this._lastMineDrop > 3500)) {
                    this._lastMineDrop = nowMs;
                    this.spawnSulfurMines(x);
                }
            }
        }
    }

    // 기존 폭발 호환용 메서드
    createExplosion(x, y, radius, damage) {
        this.triggerAcornDetonation(x, y, radius, damage, 1, false);
    }

    // 집 신축 및 업그레이드 (기존 건물 철거 -> 뽀얀 먼지 & 뚝딱뚝딱 망치질 -> 완공 팡파레)
    evolveHouse() {
        if (this.reconstruction && this.reconstruction.active) return; // 이미 공사 중이면 중복 방지

        if (this.house.tier === 1 && this.gold >= 150) {
            this.gold -= 150;
            this.startHouseReconstruction(1, 2);
            this.renderShopUI();
        } else if (this.house.tier === 2 && this.gold >= 350) {
            this.gold -= 350;
            this.startHouseReconstruction(2, 3);
            this.renderShopUI();
        }
    }

    // 🏗️ 신축 공사 시퀀스 개시 (철거 파편 -> 먼지 구름 & 망치질 -> 완공 팡파레)
    startHouseReconstruction(fromTier, toTier) {
        this.reconstruction = {
            active: true,
            fromTier: fromTier,
            toTier: toTier,
            elapsed: 0,
            duration: 1200, // 1.2초 스피디 액션 연출
            phase: 'demolish', // 'demolish' (0~300ms) -> 'build' (300~800ms) -> 'complete' (800~1200ms)
            hammerTicks: 0,
            dustClouds: [],
            debris: []
        };

        // 1. 기존 건물 붕괴 사운드 및 강력한 진동
        soundEngine.buildingCrumble();
        this.house.shake = 30;
        this.triggerScreenShake(14);

        // 철거 파편 분출 (건물 재질에 맞춘 파편 컬러)
        const debrisColors = fromTier === 1 
            ? ['#f59e0b', '#d97706', '#92400e', '#fef08a', '#78350f']
            : ['#b45309', '#78350f', '#d97706', '#94a3b8', '#475569'];

        for (let i = 0; i < 42; i++) {
            this.reconstruction.debris.push({
                x: this.house.x + this.house.w * 0.5 + (Math.random() - 0.5) * (this.house.w * 0.8),
                y: this.house.y + this.house.h * 0.6 + (Math.random() - 0.5) * (this.house.h * 0.6),
                vx: (Math.random() - 0.5) * 16,
                vy: -Math.random() * 14 - 3,
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.5,
                size: 6 + Math.random() * 9,
                color: debrisColors[Math.floor(Math.random() * debrisColors.length)]
            });
        }

        // 삼형제 철거 및 신축 돌입 대사
        this.pigSpeeches = [
            { pigIdx: 1, text: "기존 집을 허물고 새로 짓자!", timer: 1200 },
            { pigIdx: 2, text: "뚝딱뚝딱 신축 공사 돌입!", timer: 1200 },
            { pigIdx: 3, text: "최고로 튼튼하게 지어보자구!", timer: 1200 }
        ];

        // 돼지들 작업 액션
        if (this.pigAnimators && this.pigAnimators[3]) {
            this.pigAnimators[3].playAction('hammer_repair', true, null, 14, true);
        }
    }

    updateHouseStats() {
        if (this.house.tier === 1) {
            this.house.maxHp = 150;
        } else if (this.house.tier === 2) {
            this.house.maxHp = 350;
        } else if (this.house.tier === 3) {
            this.house.maxHp = 750; // 철근 콘크리트 성채의 압도적 내구도!
        }
        this.house.hp = this.house.maxHp;
        this.updateHUD();
    }

    // 상점 열기/닫기
    openShop() {
        if (this.state !== GameState.PLAYING && this.state !== GameState.PAUSED) return;
        this.previousStateBeforeShop = this.state;
        this.state = GameState.SHOP;
        const pauseModal = document.getElementById('pause-modal');
        if (pauseModal) pauseModal.classList.remove('active');
        document.getElementById('shop-modal').classList.add('active');
        this.renderShopUI();
    }

    closeShop() {
        document.getElementById('shop-modal').classList.remove('active');
        if (this.previousStateBeforeShop === GameState.PAUSED) {
            this.state = GameState.PAUSED;
            const pauseModal = document.getElementById('pause-modal');
            if (pauseModal) pauseModal.classList.add('active');
        } else {
            this.state = GameState.PLAYING;
            this.lastTime = performance.now();
        }
    }

    // 게임 일시정지 (PAUSE) 관리
    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.pauseGame();
        } else if (this.state === GameState.PAUSED) {
            this.resumeGame();
        }
    }

    pauseGame() {
        if (this.state !== GameState.PLAYING) return;
        this.state = GameState.PAUSED;
        this.mouse.isDown = false;
        soundEngine.pauseBGM();
        const pauseModal = document.getElementById('pause-modal');
        if (pauseModal) pauseModal.classList.add('active');
    }

    resumeGame() {
        if (this.state !== GameState.PAUSED) return;
        const pauseModal = document.getElementById('pause-modal');
        if (pauseModal) pauseModal.classList.remove('active');
        this.state = GameState.PLAYING;
        this.lastTime = performance.now();
        soundEngine.resumeBGM();
    }

    // ⚡ 도토리 자동 연속 발사 터보 모드 토글
    toggleTurbo(forcedState) {
        if (forcedState !== undefined) {
            this.isTurbo = forcedState;
        } else {
            this.isTurbo = !this.isTurbo;
        }

        if (soundEngine && soundEngine.turboToggle) {
            soundEngine.turboToggle(this.isTurbo);
        } else if (soundEngine) {
            if (this.isTurbo) soundEngine.upgrade();
            else soundEngine.pop();
        }

        this.updateTurboUI();

        // 게임 화면 중앙 상단 플로팅 알림
        if (this.floatingTexts) {
            this.floatingTexts.push({
                text: this.isTurbo ? '⚡ 도토리 터보 연사 [ON]!' : '💤 터보 연사 [OFF]',
                x: this.house.x + this.house.w * 0.62,
                y: this.house.y + 60,
                color: this.isTurbo ? '#ffea00' : '#b0bec5',
                alpha: 1.0,
                duration: 900,
                elapsed: 0
            });
        }
    }

    // 터보 모드 버튼 UI 상태 갱신 (HUD 버튼 및 퀵 플로팅 버튼 동기화)
    updateTurboUI() {
        const hudTurboBtn = document.getElementById('turbo-btn');
        if (hudTurboBtn) {
            if (this.isTurbo) {
                hudTurboBtn.classList.add('turbo-active');
                hudTurboBtn.innerHTML = '🔥 터보 ON';
                hudTurboBtn.title = '도토리 연속 자동 발사 중! [클릭 또는 T / 스페이스바로 끄기]';
            } else {
                hudTurboBtn.classList.remove('turbo-active');
                hudTurboBtn.innerHTML = '⚡ 터보 OFF';
                hudTurboBtn.title = '도토리 연속 발사 터보 모드 [클릭 또는 T / 스페이스바로 켜기]';
            }
        }

        const quickTurboBtn = document.getElementById('quick-turbo-btn');
        if (quickTurboBtn) {
            const iconEl = quickTurboBtn.querySelector('.turbo-icon');
            const labelEl = quickTurboBtn.querySelector('.turbo-label');
            if (this.isTurbo) {
                quickTurboBtn.classList.add('turbo-active');
                if (iconEl) iconEl.innerText = '🔥';
                if (labelEl) labelEl.innerText = '터보 ON';
                quickTurboBtn.title = '도토리 연속 자동 발사 중! [클릭 또는 T / 스페이스바로 끄기]';
            } else {
                quickTurboBtn.classList.remove('turbo-active');
                if (iconEl) iconEl.innerText = '⚡';
                if (labelEl) labelEl.innerText = '터보 OFF';
                quickTurboBtn.title = '도토리 연속 발사 터보 모드 [클릭 또는 T / 스페이스바로 켜기]';
            }
        }
    }

    // 상점 탭 전환
    switchShopTab(tab) {
        if (this.shopActiveTab !== tab) {
            try {
                soundEngine.playTab();
            } catch (e) {
                console.warn(e);
            }
        }
        this.shopActiveTab = tab;
        const tabHouseBtn = document.getElementById('tab-house-btn');
        const tabPigsBtn = document.getElementById('tab-pigs-btn');
        const houseContent = document.getElementById('shop-tab-house-content');
        const pigsContent = document.getElementById('shop-tab-pigs-content');

        if (tab === 'house') {
            tabHouseBtn.classList.add('active');
            tabPigsBtn.classList.remove('active');
            houseContent.classList.remove('hidden');
            pigsContent.classList.add('hidden');
        } else {
            tabHouseBtn.classList.remove('active');
            tabPigsBtn.classList.add('active');
            houseContent.classList.add('hidden');
            pigsContent.classList.remove('hidden');
        }
        this.renderShopUI();
    }

    // 시작 모달 탭 전환 (게임 시작 & 조작키 / 삼형제 스킬 도감 / 영구 연구소 & 궁극기)
    switchStartTab(tab) {
        if (this.startActiveTab !== tab) {
            try {
                soundEngine.playTab();
            } catch (e) {
                console.warn(e);
            }
        }
        this.startActiveTab = tab;
        const playBtn = document.getElementById('tab-start-play-btn');
        const pigsBtn = document.getElementById('tab-start-pigs-btn');
        const metaBtn = document.getElementById('tab-start-meta-btn');
        const playContent = document.getElementById('tab-start-play-content');
        const pigsContent = document.getElementById('tab-start-pigs-content');
        const metaContent = document.getElementById('tab-start-meta-content');

        const tabs = [
            { id: 'play', btn: playBtn, content: playContent },
            { id: 'pigs', btn: pigsBtn, content: pigsContent },
            { id: 'meta', btn: metaBtn, content: metaContent }
        ];

        tabs.forEach(t => {
            if (!t.btn || !t.content) return;
            if (t.id === tab) {
                t.btn.classList.add('active');
                t.content.classList.remove('hidden');
            } else {
                t.btn.classList.remove('active');
                t.content.classList.add('hidden');
            }
        });

        // 탭 1 (게임 시작 & 조작키)일 때는 세로 스크롤바가 전혀 생기지 않도록 overflow 제어
        const modal = document.querySelector('#start-modal .modal-card');
        if (modal) {
            if (tab === 'play') {
                modal.style.overflowY = 'hidden';
            } else {
                modal.style.overflowY = 'auto';
            }
        }
    }

    // 스탯 업그레이드 단일 비용 계산기 (UI와 내부 로직 100% 일치)
    getUpgradeCost(key, level) {
        const baseCosts = {
            damageLevel: 50,
            attackSpeedLevel: 55,
            cooldownLevel: 60,
            autoRepairLevel: 50
        };
        const costIncrements = {
            damageLevel: 25,
            attackSpeedLevel: 30,
            cooldownLevel: 35,
            autoRepairLevel: 30
        };
        return baseCosts[key] + (level - 1) * costIncrements[key];
    }

    // 스탯 업그레이드 구매
    buyUpgrade(key) {
        const curLevel = this.upgrades[key];
        if (curLevel >= 5) return;

        const cost = this.getUpgradeCost(key, curLevel);
        if (this.gold >= cost) {
            this.gold -= cost;
            this.upgrades[key]++;
            if (key === 'autoRepairLevel') {
                this.house.autoRepairRate = this.upgrades.autoRepairLevel * 2.5;
            } else if (key === 'attackSpeedLevel') {
                const spdLevel = this.upgrades.attackSpeedLevel;
                const actName = spdLevel >= 5 ? 'gatling_shoot' : (spdLevel >= 3 ? 'rapid_shoot' : 'slingshot_shoot');
                if (this.pigAnimators && this.pigAnimators[2]) {
                    this.pigAnimators[2].playAction(actName, true);
                }
                if (this.pigAnim && this.pigAnim[2]) {
                    this.pigAnim[2].bounce = 10;
                    this.pigAnim[2].rot = 0.2;
                }
            }
            soundEngine.upgrade();
            this.showBanner(`✨ ${key === 'damageLevel' ? '공격력' : key === 'attackSpeedLevel' ? '사격 속도' : key === 'cooldownLevel' ? '쿨다운' : '자동 수리'} Lv.${this.upgrades[key]} 달성!`, "#ffb300");
            this.renderShopUI();
            this.updateHUD();
        } else {
            soundEngine.playNoise(0.2, 0.15, 300);
            this.showBanner("골드가 부족합니다!", "#ff5252");
        }
    }

    // 삼형제 승급 비용 계산
    getPigUpgradeCost(pigId, rank) {
        if (pigId === 1) return rank === 1 ? 120 : (rank === 2 ? 260 : 9999);
        if (pigId === 2) return rank === 1 ? 140 : (rank === 2 ? 300 : 9999);
        if (pigId === 3) return rank === 1 ? 160 : 9999; // 셋째 돼지는 2단계가 마스터 MAX!
        return 9999;
    }

    // 아기돼지 골드 승급 실행
    upgradePig(pigId) {
        const currentRank = this.pigRanks[pigId];
        const maxRank = (pigId === 3) ? 2 : 3;
        if (currentRank >= maxRank) return;

        const cost = this.getPigUpgradeCost(pigId, currentRank);
        if (this.gold >= cost) {
            this.gold -= cost;
            this.pigRanks[pigId]++;
            const newRank = this.pigRanks[pigId];
            soundEngine.upgrade();

            const pigNames = { 1: '첫째 돼지', 2: '둘째 돼지', 3: '셋째 돼지' };
            let starText = '';
            if (pigId === 3) {
                starText = '👑 [2단계 마스터 (MAX)] (하늘 풍선늑대 대공 요격포 해금!)';
            } else {
                starText = newRank === 2 ? '★★ 2성' : '★★★ 3성 (MAX)';
            }
            this.showBanner(`👑 [${pigNames[pigId]}] ${starText} 승급 완료!!`, "#ffd700");

            // 하단 핫바 스킬명 갱신
            if (pigId === 1) {
                const names = ['짚단 굴리기', '불타는 짚단', '황금 태풍 짚단'];
                document.getElementById('skill-1-name').innerText = names[newRank - 1];
            } else if (pigId === 2) {
                const names = ['도토리 폭격', '다이너마이트 도토리', '핵도토리 융단폭격'];
                document.getElementById('skill-2-name').innerText = names[newRank - 1];
            } else if (pigId === 3) {
                const names = ['수리 & 끓는 솥', '🎯 대공 요격포'];
                document.getElementById('skill-3-name').innerText = names[newRank - 1];
            }

            this.renderShopUI();
            this.updateHUD();
        } else {
            soundEngine.playNoise(0.2, 0.15, 300);
            this.showBanner("골드가 부족합니다!", "#ff5252");
        }
    }

    // 삼형제 2단계 콤보 추가 스킬 비용 계산 (level 0: 1단계 해금, level 1: 2단계 MAX 각성)
    getPigComboCost(pigId, level) {
        const costs = {
            1: [220, 420],
            2: [250, 460],
            3: [280, 500]
        };
        return costs[pigId] ? (costs[pigId][level] || 9999) : 9999;
    }

    // 삼형제 2단계 콤보 추가 스킬 골드 승급 실행
    upgradePigCombo(pigId) {
        const curLevel = this.pigComboSkills ? (this.pigComboSkills[pigId] || 0) : 0;
        if (curLevel >= 2) return;

        // 선행 조건: 해당 돼지의 기본 랭크가 MAX여야 함 (1, 2돼지는 3성, 3돼지는 2단계)
        const maxRank = (pigId === 3) ? 2 : 3;
        if (this.pigRanks[pigId] < maxRank) {
            soundEngine.playNoise(0.2, 0.15, 300);
            this.showBanner("기본 스킬을 먼저 MAX까지 승급해야 콤보 스킬을 배울 수 있습니다!", "#ff5252");
            return;
        }

        const cost = this.getPigComboCost(pigId, curLevel);
        if (this.gold >= cost) {
            this.gold -= cost;
            if (!this.pigComboSkills) this.pigComboSkills = { 1: 0, 2: 0, 3: 0 };
            this.pigComboSkills[pigId]++;
            const newLevel = this.pigComboSkills[pigId];
            soundEngine.upgrade();

            const comboNames = {
                1: '🌾 화염 가시밭 잔류',
                2: '💣 다이너마이트 2차 클러스터 & 유황 지뢰',
                3: '♨️ 요새 증기 충격파 & 용암 대공포'
            };
            const tierText = newLevel === 2 ? '👑 [2단계 MAX 각성]' : '✨ [1단계 해금]';
            this.showBanner(`${tierText} ${comboNames[pigId]} 습득 완료!!`, "#ffd700");

            this.renderShopUI();
            this.updateHUD();
        } else {
            soundEngine.playNoise(0.2, 0.15, 300);
            this.showBanner("골드가 부족합니다!", "#ff5252");
        }
    }

    // 상점 전체 UI 렌더링
    renderShopUI() {
        document.getElementById('shop-gold-text').innerText = this.gold;

        // 1. 집 진화 카드
        const evolveBtn = document.getElementById('evolve-house-btn');
        const evolveTitle = document.getElementById('evolve-title');
        const evolveDesc = document.getElementById('evolve-desc');

        if (this.house.tier === 1) {
            evolveTitle.innerText = "2단계: 아늑한 통나무집";
            evolveDesc.innerText = "체력 350, 방어력 대폭 증가, 2층 발코니 사격 지원 개방 (비용: 150G)";
            evolveBtn.innerText = "통나무집 신축 (150G)";
            evolveBtn.disabled = this.gold < 150;
        } else if (this.house.tier === 2) {
            evolveTitle.innerText = "3단계: 벽과 콘크리트 성채";
            evolveDesc.innerText = "체력 750, 늑대 공격 대폭 반감, 난공불락의 콘크리트 방어 요새 (비용: 350G)";
            evolveBtn.innerText = "콘크리트 성채 신축 (350G)";
            evolveBtn.disabled = this.gold < 350;
        } else {
            evolveTitle.innerText = "최고 등급: 난공불락 콘크리트 성채";
            evolveDesc.innerText = "어떤 늑대 군단도 절대 무너뜨릴 수 없는 완벽한 요새 성채입니다!";
            evolveBtn.innerText = "신축 완료 (MAX)";
            evolveBtn.disabled = true;
        }

        // 2. 스탯 업그레이드 아이템들 갱신
        const updateStatItem = (id, key) => {
            const item = document.getElementById(id);
            if (!item) return;
            const level = this.upgrades[key];
            const cost = this.getUpgradeCost(key, level);
            item.querySelector('.shop-item-level').innerText = `Lv. ${level} / 5`;
            const btn = item.querySelector('.shop-buy-btn');
            if (level >= 5) {
                btn.innerText = 'MAX';
                btn.disabled = true;
            } else {
                btn.innerText = `${cost}G`;
                btn.disabled = this.gold < cost;
            }
        };

        updateStatItem('upg-damage', 'damageLevel');
        updateStatItem('upg-speed', 'attackSpeedLevel');
        updateStatItem('upg-cd', 'cooldownLevel');
        updateStatItem('upg-repair', 'autoRepairLevel');

        // 3. 삼형제 승급 카드들 갱신
        for (let pId = 1; pId <= 3; pId++) {
            const rank = this.pigRanks[pId];
            const badge = document.getElementById(`pig-${pId}-badge`);
            const skillNameEl = document.getElementById(`pig-${pId}-skill-name`);
            const descEl = document.getElementById(`pig-${pId}-desc`);
            const nextEl = document.getElementById(`pig-${pId}-next`);
            const btn = document.getElementById(`pig-${pId}-upg-btn`);
            const cost = this.getPigUpgradeCost(pId, rank);

            if (pId === 1) {
                badge.innerText = (rank >= 3) ? '👑 ★★★ 3성 (MAX)' : `★ ${rank}성`;
                if (rank === 1) {
                    skillNameEl.innerText = "스킬: 일반 짚단";
                    descEl.innerText = "직선으로 거대 짚단을 굴려 늑대를 넉백시키고 3초 감속을 겁니다.";
                    nextEl.innerText = "다음 승급: ★★ 불타는 짚단 (화염 관통 피해 + 넉백 1.5배)";
                    btn.innerText = `${cost}G`;
                    btn.disabled = this.gold < cost;
                } else if (rank === 2) {
                    skillNameEl.innerText = "스킬: 🔥 불타는 짚단";
                    descEl.innerText = "화염으로 늑대들을 관통하며 강력한 화상과 1.5배 넉백을 입힙니다.";
                    nextEl.innerText = "다음 승급: ★★★ 황금 태풍 짚단 (거대 짚단 2개 동시 발사 & 전원 강제 넉백)";
                    btn.innerText = `${cost}G`;
                    btn.disabled = this.gold < cost;
                } else {
                    skillNameEl.innerText = "스킬: 👑 황금 태풍 짚단";
                    descEl.innerText = "거대 황금 짚단 2개가 전방을 완전히 쓸어버리며 늑대들을 화면 끝까지 날려버립니다!";
                    nextEl.innerText = "최고 승급 등급 도달! (MAX)";
                    btn.innerText = "MAX";
                    btn.disabled = true;
                }
            } else if (pId === 2) {
                badge.innerText = (rank >= 3) ? '👑 ★★★ 3성 (MAX)' : `★ ${rank}성`;
                if (rank === 1) {
                    skillNameEl.innerText = "스킬: 5연발 도토리";
                    descEl.innerText = "지정한 마우스 좌표에 5발의 도토리 폭탄을 투하합니다.";
                    nextEl.innerText = "다음 승급: ★★ 다이너마이트 도토리 (7발 폭격 + 공중 풍선늑대 폭파 격추 + 반경 1.4배 + 자동 새총 지원사격)";
                    btn.innerText = `${cost}G`;
                    btn.disabled = this.gold < cost;
                } else if (rank === 2) {
                    skillNameEl.innerText = "스킬: 🧨 다이너마이트 도토리";
                    descEl.innerText = "7발의 다이너마이트가 지상과 공중의 풍선늑대를 모두 폭파 격추하고 둘째가 지속 지원 사격을 합니다.";
                    nextEl.innerText = "다음 승급: ★★★ 핵도토리 융단폭격 (10발 폭발 + 반경 2배 + 늑대 전원 2초 스턴)";
                    btn.innerText = `${cost}G`;
                    btn.disabled = this.gold < cost;
                } else {
                    skillNameEl.innerText = "스킬: 🚀 핵도토리 융단폭격";
                    descEl.innerText = "10발의 핵도토리가 연쇄 폭발하며 화면 내 모든 늑대들을 2초간 완전히 기절시킵니다!";
                    nextEl.innerText = "최고 승급 등급 도달! (MAX)";
                    btn.innerText = "MAX";
                    btn.disabled = true;
                }
            } else if (pId === 3) {
                if (rank === 1) {
                    badge.innerText = "★ 1성 (수리)";
                    skillNameEl.innerText = "스킬: 수리 & 가마솥";
                    descEl.innerText = "집 체력을 즉시 40% 회복하고 집 앞 늑대들에게 끓는 물을 붓습니다.";
                    nextEl.innerText = "다음 승급: 👑 마스터 [2단계] 대공 요격포 & 황금 수리 (하늘 풍선늑대 일제 격추 + 65% 회복 + 끓는 기름 솥)";
                    btn.innerText = `${cost}G`;
                    btn.disabled = this.gold < cost;
                } else {
                    badge.innerText = "👑 ★★★ 마스터 (MAX)";
                    skillNameEl.innerText = "스킬: 🎯 대공 요격포 & 황금 수리";
                    descEl.innerText = "집 체력을 65% 대량 복구하고, 하늘의 모든 풍선늑대를 정밀 요격하여 풍선을 즉시 격추시키며 끓는 기름 가마솥으로 지상 늑대를 녹여버립니다!";
                    nextEl.innerText = "최고 승급 등급 도달! (마스터 MAX)";
                    btn.innerText = "MAX";
                    btn.disabled = true;
                }
            }

            // 4. 삼형제 개별스킬 MAX 시 2단계 연계 콤보 스킬 카드 갱신
            const comboRow = document.getElementById(`pig-${pId}-combo-row`);
            const maxRank = (pId === 3) ? 2 : 3;
            if (comboRow) {
                if (rank >= maxRank) {
                    comboRow.style.display = 'flex';
                    const cLevel = this.pigComboSkills ? (this.pigComboSkills[pId] || 0) : 0;
                    const cBadge = document.getElementById(`pig-${pId}-combo-badge`);
                    const cDesc = document.getElementById(`pig-${pId}-combo-desc`);
                    const cBtn = document.getElementById(`pig-${pId}-combo-btn`);
                    const cCost = this.getPigComboCost(pId, cLevel);

                    if (cLevel === 0) {
                        if (cBadge) {
                            cBadge.className = 'pig-combo-badge';
                            cBadge.innerText = '✨ 콤보 1단계 미습득';
                        }
                        if (cDesc) {
                            if (pId === 1) cDesc.innerText = "1단계: 짚단 궤적에 4초간 화염 장판 잔류 (초당 45 지속피해 + 35% 감속)";
                            else if (pId === 2) cDesc.innerText = "1단계: 폭발 시 5개 유탄 파편이 공중/지상으로 튀어 2차 연쇄 폭발 (개당 120 피해)";
                            else if (pId === 3) cDesc.innerText = "1단계: 수리 시 요새 고압 증기 방출 (접근 적 전원 넉백 + 공속 +50% 버프)";
                        }
                        if (cBtn) {
                            cBtn.innerText = `1단계 해금 (${cCost}G)`;
                            cBtn.disabled = this.gold < cCost;
                        }
                    } else if (cLevel === 1) {
                        if (cBadge) {
                            cBadge.className = 'pig-combo-badge';
                            cBadge.innerText = '⭐ 1단계 습득 (2단계 가능)';
                        }
                        if (cDesc) {
                            if (pId === 1) cDesc.innerText = "2단계 [MAX 각성]: 8초간 황금 가시 불바다 (적 1.5초 속박 + 방어력 30% 감소 디버프 + 90 DPS)";
                            else if (pId === 2) cDesc.innerText = "2단계 [MAX 각성]: 10발 고폭 클러스터 대폭발 + 바닥 유황 지뢰 3개 매설 (적 에어본 넉백)";
                            else if (pId === 3) cDesc.innerText = "2단계 [MAX 각성]: 초고압 플라즈마 증기 펄스(광역 스턴) + 용암 대공포 3연발(공중 즉사) + 요새 5초 무적";
                        }
                        if (cBtn) {
                            cBtn.innerText = `2단계 MAX 각성 (${cCost}G)`;
                            cBtn.disabled = this.gold < cCost;
                        }
                    } else {
                        if (cBadge) {
                            cBadge.className = 'pig-combo-badge badge-max';
                            cBadge.innerText = '👑 2단계 MAX 각성 완료';
                        }
                        if (cDesc) {
                            if (pId === 1) cDesc.innerText = "👑 [각성 완료] 짚단 굴리기 시 8초간 황금 가시 불바다(속박 & 방어력 30% 감소) 자동 전개!";
                            else if (pId === 2) cDesc.innerText = "👑 [각성 완료] 도토리 폭격 시 10발 고폭탄 2차 폭발 & 3개 유황 지뢰 자동 매설!";
                            else if (pId === 3) cDesc.innerText = "👑 [각성 완료] 수리 시 플라즈마 펄스 스턴 & 용암 대공포 3연발 & 요새 5초 무적 보호막 자동 전개!";
                        }
                        if (cBtn) {
                            cBtn.innerText = '🏆 각성 완료 (MAX)';
                            cBtn.disabled = true;
                        }
                    }
                } else {
                    comboRow.style.display = 'none';
                }
            }
        }

        // 4. 모든 스펙 ALL MAX 확인 (무한모드/일반모드 남은 골드 메타 투자 & 궁극기 장착 안내)
        const isAllMaxed = this.checkAllMaxed();

        const maxBox = document.getElementById('shop-all-max-box');
        if (maxBox) {
            maxBox.classList.toggle('hidden', !isAllMaxed);
            const shopInvestBtn = document.getElementById('shop-meta-invest-btn');
            if (shopInvestBtn) {
                shopInvestBtn.disabled = this.gold < 100;
            }
            const shopDepositBtn = document.getElementById('shop-bank-deposit-btn');
            if (shopDepositBtn) {
                shopDepositBtn.disabled = this.gold <= 0;
            }

            // ALL MAX 시 인게임 골드로 일반공격 넉백(밀치기) 즉시 연구
            const shopKbBtn = document.getElementById('shop-knockback-invest-btn');
            if (shopKbBtn) {
                if (this.metaKnockbackChance >= 15) {
                    shopKbBtn.innerText = '💨 일반공격 넉백 MAX (15%)';
                    shopKbBtn.disabled = true;
                } else {
                    shopKbBtn.innerText = `💨 넉백 +1% 연구 (750G) [현재: ${this.metaKnockbackChance}%]`;
                    shopKbBtn.disabled = this.gold < 750;
                }
            }

            // 상점 내 궁극기 상태 갱신
            const shopUltBadge = document.getElementById('shop-ultimate-badge');
            const shopUltText = document.getElementById('shop-ultimate-status-text');
            const shopUltCoins = document.getElementById('shop-ultimate-coin-count');
            const shopBuyUltBtn = document.getElementById('shop-buy-ultimate-btn');

            if (shopUltBadge && shopUltText && shopBuyUltBtn) {
                if (this.ultimateUnlocked) {
                    shopUltBadge.className = 'ultimate-badge-unlocked';
                    shopUltBadge.innerText = '👑 장착 중';
                    shopUltText.innerHTML = `✨ <strong>궁극기 활성화 완료:</strong> 35초 쿨타임마다 [4] 키 또는 스킬 슬롯 클릭으로 천지개벽 대회오리 폭풍 수동 발사!`;
                    if (shopUltCoins) shopUltCoins.innerText = `해금 완료됨`;
                    shopBuyUltBtn.innerText = '✨ 장착 중';
                    shopBuyUltBtn.disabled = true;
                } else {
                    shopUltBadge.className = 'ultimate-badge-locked';
                    shopUltBadge.innerText = '🔒 잠김';
                    shopUltText.innerText = `메뉴 금고에 10,000 코인 보유 시 해금됩니다! (35초 쿨타임 [4] 키 수동 발사)`;
                    if (shopUltCoins) shopUltCoins.innerText = `금고: ${this.metaBankGold.toLocaleString()} / 10,000G`;
                    shopBuyUltBtn.innerText = '⚡ 10,000 코인으로 해금';
                    shopBuyUltBtn.disabled = this.metaBankGold < 10000;
                }
            }
        }
    }

    // 적 생성 (웨이브와 난이도에 따라 점진적 강화!)
    spawnEnemy(type) {
        const diff = DIFFICULTY_CONFIG[this.currentDiff || 'easy'];
        let waveHpMul, waveSpeedMul;
        if (this.mode === 'ENDLESS') {
            // 무한 모드 기하급수 스케일링: 100웨이브는 일반 늑대도 수백만 체력
            const waveScale = Math.pow(1.08, this.wave) * (1 + this.wave * 0.2);
            waveHpMul = diff.hpMul * waveScale;
            waveSpeedMul = Math.min(3.2, diff.speedMul * (1 + (this.wave - 1) * 0.02));
        } else {
            waveHpMul = (1 + (this.wave - 1) * 0.12) * diff.hpMul;
            waveSpeedMul = (1 + (this.wave - 1) * 0.02) * diff.speedMul;
        }

        if (type === 'midboss') {
            this.bossSpawned = true;
            soundEngine.startMidBossBGM();
            this.updateBGMButton();
            let midHp, midDamage, midSkillIgnore, midNormalDodge, midCastleAttack, midTitle;
            if (this.mode === 'ENDLESS') {
                midHp = diff.midBossHp || 7500;
                midDamage = diff.midBossDamage || 1.4;
                midSkillIgnore = 0.20;
                midNormalDodge = 0.15;
                midCastleAttack = 0.25;
                midTitle = '🐺 [WAVE 5 중간보스] 늑대 선봉 돌격대장';
            } else {
                midHp = diff.midBossHp || Math.round(diff.bossHp * 0.35);
                midDamage = diff.midBossDamage || (diff.bossDamage * 0.65);
                midSkillIgnore = diff.skillIgnoreChance * 0.6;
                midNormalDodge = diff.normalDodgeChance * 0.6;
                midCastleAttack = diff.bossCastleAttackPct * 0.6;
                midTitle = `🐺 [${diff.name} 5웨이브 중간보스] 늑대 선봉 돌격대장`;
            }
            this.enemies.push(new MidBossWolf(
                V_WIDTH + 60,
                444, // 5% 아래로 이동 (410 -> 444)
                midHp,
                midDamage,
                midSkillIgnore,
                midNormalDodge,
                midCastleAttack,
                0.75,
                midTitle
            ));
        } else if (type === 'boss') {
            this.bossSpawned = true;
            soundEngine.startFinalBossBGM();
            this.updateBGMButton();
            if (this.mode === 'ENDLESS') {
                const cfg = this.getEndlessBossConfig(this.wave);
                this.enemies.push(new BossWolf(
                    V_WIDTH + 80,
                    510, // 확대된 최종보스의 머리·왕관이 화면 안에 들어오도록 아래로 배치
                    cfg.hp,
                    cfg.damageMul,
                    cfg.skillIgnore,
                    cfg.normalDodge,
                    cfg.castleAttackPct,
                    cfg.speed,
                    cfg.title
                ));
            } else {
                this.enemies.push(new BossWolf(
                    V_WIDTH + 80,
                    510, // 확대된 최종보스의 머리·왕관이 화면 안에 들어오도록 아래로 배치
                    diff.bossHp,
                    diff.bossDamage,
                    diff.skillIgnoreChance,
                    diff.normalDodgeChance,
                    diff.bossCastleAttackPct,
                    0.75 * 1.12,
                    `👑 [${diff.name}] 힙스터 빅 배드 울프 제왕`
                ));
            }
        } else if (type === 'skater') {
            const e = new SkaterWolf(V_WIDTH + 50, 474); // 5% 아래로 이동 (440 -> 474)
            e.hp = Math.round(e.hp * waveHpMul);
            e.maxHp = e.hp;
            e.speed *= waveSpeedMul;
            e.baseSpeed = e.speed;
            this.enemies.push(e);
        } else if (type === 'granny') {
            const e = new GrannyWolf(V_WIDTH + 50, 469); // 5% 아래로 이동 (435 -> 469)
            e.hp = Math.round(e.hp * waveHpMul);
            e.maxHp = e.hp;
            e.speed *= waveSpeedMul;
            e.baseSpeed = e.speed;
            this.enemies.push(e);
        } else if (type === 'balloon') {
            // 풍선 폭격수 하늘 출연 위치도 동일하게 5% 아래로 이동 (160 -> 194)
            const e = new BalloonWolf(V_WIDTH + 50, 194 + Math.random() * 90);
            e.hp = Math.round(e.hp * waveHpMul);
            e.maxHp = e.hp;
            e.speed *= waveSpeedMul;
            e.baseSpeed = e.speed;
            this.enemies.push(e);
        } else if (type === 'blower') {
            const e = new BlowerWolf(V_WIDTH + 50, 464); // 5% 아래로 이동 (430 -> 464)
            e.hp = Math.round(e.hp * waveHpMul);
            e.maxHp = e.hp;
            e.speed *= waveSpeedMul;
            e.baseSpeed = e.speed;
            this.enemies.push(e);
        } else if (type === 'shield') {
            const e = new ShieldWolf(V_WIDTH + 50, 474);
            e.hp = Math.round(e.hp * waveHpMul);
            e.maxHp = e.hp;
            e.shieldHp = Math.round(e.shieldHp * waveHpMul);
            e.maxShieldHp = e.shieldHp;
            e.speed *= waveSpeedMul;
            e.baseSpeed = e.speed;
            this.enemies.push(e);
        } else if (type === 'umbrella') {
            const e = new UmbrellaWolf(V_WIDTH + 50, 195 + Math.random() * 80);
            e.hp = Math.round(e.hp * waveHpMul);
            e.maxHp = e.hp;
            e.speed *= waveSpeedMul;
            e.baseSpeed = e.speed;
            this.enemies.push(e);
        } else if (type === 'miniwolf') {
            const e = new MiniWolf(V_WIDTH + 50, 474, false);
            e.hp = Math.round(e.hp * waveHpMul);
            e.maxHp = e.hp;
            e.speed *= waveSpeedMul;
            e.baseSpeed = e.speed;
            this.enemies.push(e);
        } else {
            const e = new NormalWolf(V_WIDTH + 50, 474); // 5% 아래로 이동 (440 -> 474)
            e.hp = Math.round(e.hp * waveHpMul);
            e.maxHp = e.hp;
            e.speed *= waveSpeedMul;
            e.baseSpeed = e.speed;
            this.enemies.push(e);
        }
    }

    updateBGMButton() {
        const btn = document.getElementById('bgm-btn');
        if (!btn) return;
        const enabled = soundEngine.isBgmEnabled !== false;
        const trackName = soundEngine.getCurrentBGMName ? soundEngine.getCurrentBGMName() : '배경음악';
        btn.innerText = enabled ? '🎵 BGM ON' : '🔇 BGM OFF';
        btn.classList.toggle('bgm-off', !enabled);
        btn.setAttribute('aria-pressed', String(enabled));
        btn.setAttribute('aria-label', enabled ? '배경음악 끄기' : '배경음악 켜기');
        btn.title = enabled ? `현재 곡: ${trackName} · 클릭하여 끄기` : '배경음악 꺼짐 · 클릭하여 켜기';
    }

    // HUD 업데이트
    updateHUD() {
        // 🚀 최적화: 100ms 스로틀링 - DOM 조작을 초당 최대 10회로 제한
        const now = performance.now();
        if (this._lastHudUpdate && (now - this._lastHudUpdate) < 100) return;
        this._lastHudUpdate = now;
        this.updateBGMButton();

        const hpPercent = Math.max(0, Math.min(100, (this.house.hp / this.house.maxHp) * 100));
        const fill = document.getElementById('house-hp-fill');
        fill.style.width = `${hpPercent}%`;
        if (hpPercent < 25) {
            // 형광 네온 레드 / 핫 핑크 (위험)
            fill.style.background = 'linear-gradient(90deg, #ff0055 0%, #ff1744 50%, #ff5252 100%)';
            fill.style.boxShadow = '0 0 14px rgba(255, 23, 68, 0.95), 0 0 24px rgba(255, 0, 85, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.7)';
        } else if (hpPercent < 50) {
            // 형광 네온 옐로우 / 일렉트릭 앰버 (경고)
            fill.style.background = 'linear-gradient(90deg, #ffea00 0%, #ffd600 50%, #ff9100 100%)';
            fill.style.boxShadow = '0 0 12px rgba(255, 234, 0, 0.9), 0 0 20px rgba(255, 214, 0, 0.55), inset 0 2px 4px rgba(255, 255, 255, 0.7)';
        } else {
            // 초고휘도 형광 네온 라임 그린 (정상 - 안전)
            fill.style.background = 'linear-gradient(90deg, #00e676 0%, #00ff88 35%, #39ff14 75%, #76ff03 100%)';
            fill.style.boxShadow = '0 0 12px #00ff88, 0 0 22px rgba(57, 255, 20, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.7)';
        }

        const tierNames = ['따뜻한 짚집', '아늑한 통나무집', '콘크리트 성채'];
        document.getElementById('house-hp-text').innerText = `${Math.ceil(this.house.hp)} / ${this.house.maxHp} (${tierNames[this.house.tier - 1]})`;
        document.getElementById('gold-display').innerText = this.gold;

        // 상단 HUD 골드 버프 뱃지 갱신
        const goldBonusBadge = document.getElementById('gold-bonus-badge');
        if (goldBonusBadge) {
            if (this.metaGoldBonus > 0) {
                goldBonusBadge.classList.remove('hidden');
                goldBonusBadge.innerText = `+${this.metaGoldBonus}%`;
            } else {
                goldBonusBadge.classList.add('hidden');
            }
        }

        // 난이도 뱃지 갱신
        const badge = document.getElementById('diff-badge');
        if (badge) {
            const cfg = DIFFICULTY_CONFIG[this.currentDiff || 'easy'];
            const icons = { easy: '🟢', normal: '🟡', hard: '🔴', endless: '🔥' };
            badge.innerText = `${icons[this.currentDiff || 'easy']} ${cfg.name}`;
            badge.className = `diff-badge-pill ${cfg.badgeClass}`;
        }

        // 상단 HUD 장착 칭호 뱃지 갱신
        const titleBadge = document.getElementById('user-title-badge');
        if (titleBadge) {
            if (this.currentTitle) {
                const cfg = TITLES_CONFIG.find(t => t.id === this.currentTitle);
                if (cfg) {
                    titleBadge.classList.remove('hidden');
                    titleBadge.innerText = `👑 【${cfg.name}】`;
                    titleBadge.style.color = cfg.color;
                    titleBadge.style.borderColor = cfg.color;
                    titleBadge.style.boxShadow = `0 0 10px ${cfg.color}88`;
                } else {
                    titleBadge.classList.add('hidden');
                }
            } else {
                titleBadge.classList.add('hidden');
            }
        }

        // 보스 HUD 동기화 (전장에 살아있는 보스가 있을 때만 표시 및 체력바 갱신, 없으면 즉시 완전 숨김)
        const bossHud = document.getElementById('boss-hud-container');
        if (bossHud) {
            const activeBoss = this.enemies && this.enemies.find(e => e.isBoss && !e.isDead && e.hp > 0);
            if (activeBoss) {
                bossHud.classList.remove('hidden');
                const pct = Math.max(0, Math.min(100, (activeBoss.hp / activeBoss.maxHp) * 100));
                const barFill = document.getElementById('boss-hud-bar-fill');
                if (barFill) barFill.style.width = `${pct}%`;
                const hpText = document.getElementById('boss-hud-hp-text');
                if (hpText) hpText.innerText = `${Math.ceil(pct)}% (${Math.ceil(activeBoss.hp).toLocaleString()} / ${activeBoss.maxHp.toLocaleString()})`;
                const titleEl = bossHud.querySelector('.boss-hud-title');
                if (titleEl && activeBoss.bossTitle) {
                    titleEl.innerText = activeBoss.bossTitle;
                }
            } else {
                bossHud.classList.add('hidden');
            }
        }

        // ⚡ 스탯 ALL MAX 요새 신성 각성 뱃지 동기화
        const awakeningBadge = document.getElementById('stat-awakening-badge');
        if (awakeningBadge) {
            const isStatsMax = this.checkAllStatsMax();
            awakeningBadge.classList.toggle('hidden', !isStatsMax);
        }

        // 🐷 삼형제 핫바 스킬 슬롯 콤보 태그 동기화
        for (let p = 1; p <= 3; p++) {
            const tag = document.getElementById(`skill-${p}-combo-tag`);
            if (tag) {
                const cLevel = this.pigComboSkills ? (this.pigComboSkills[p] || 0) : 0;
                if (cLevel === 1) {
                    tag.classList.remove('hidden');
                    tag.classList.remove('tag-max');
                    tag.innerText = '✨연계 1';
                } else if (cLevel === 2) {
                    tag.classList.remove('hidden');
                    tag.classList.add('tag-max');
                    tag.innerText = '👑연계 MAX';
                } else {
                    tag.classList.add('hidden');
                }
            }
        }

        // 핫바 삼형제 스킬 명칭 실시간 동기화
        if (this.pigRanks) {
            const p1Names = ['짚단 굴리기', '불타는 짚단', '황금 태풍 짚단'];
            const p2Names = ['도토리 폭격', '다이너마이트 도토리', '핵도토리 융단폭격'];
            const p3Names = ['수리 & 끓는 솥', '🎯 대공 요격포'];
            const s1 = document.getElementById('skill-1-name');
            if (s1 && this.pigRanks[1]) s1.innerText = p1Names[Math.min(p1Names.length - 1, this.pigRanks[1] - 1)];
            const s2 = document.getElementById('skill-2-name');
            if (s2 && this.pigRanks[2]) s2.innerText = p2Names[Math.min(p2Names.length - 1, this.pigRanks[2] - 1)];
            const s3 = document.getElementById('skill-3-name');
            if (s3 && this.pigRanks[3]) s3.innerText = p3Names[Math.min(p3Names.length - 1, this.pigRanks[3] - 1)];
        }

        // 터보 모드 UI 동기화
        this.updateTurboUI();
    }

    // 메인 업데이트 루프
    update(dt) {
        if (this.state !== GameState.PLAYING) return;

        // 전설의 궁극기 시네마틱 컷인 프레임 감소
        if (this.ultimateCinematic > 0) {
            this.ultimateCinematic = Math.max(0, this.ultimateCinematic - (dt / 16.6));
        }

        // 셋째 돼지 수리 룬 타이머 감소
        if (this.house && this.house.repairFxTimer > 0) {
            this.house.repairFxTimer = Math.max(0, this.house.repairFxTimer - dt);
        }

        // 🏗️ 신축 공사 시퀀스 업데이트 (~1.2초)
        if (this.reconstruction && this.reconstruction.active) {
            const recon = this.reconstruction;
            recon.elapsed += dt;

            // 1. 파편 이동 및 감쇠
            for (let i = recon.debris.length - 1; i >= 0; i--) {
                const deb = recon.debris[i];
                deb.x += deb.vx;
                deb.y += deb.vy;
                deb.vy += 0.55; // 중력
                deb.rot += deb.vrot;
                if (deb.y > this.house.y + this.house.h + 20) {
                    recon.debris.splice(i, 1);
                }
            }

            // 2. 건설 먼지 구름 생성 및 업데이트
            if (recon.elapsed < 900 && Math.random() < 0.45) {
                recon.dustClouds.push({
                    x: this.house.x + Math.random() * this.house.w,
                    y: this.house.y + this.house.h - 20 - Math.random() * (this.house.h * 0.7),
                    size: 15 + Math.random() * 20,
                    maxSize: 45 + Math.random() * 25,
                    vx: (Math.random() - 0.5) * 2.5,
                    vy: -Math.random() * 2 - 1,
                    alpha: 0.75
                });
            }
            for (let i = recon.dustClouds.length - 1; i >= 0; i--) {
                const d = recon.dustClouds[i];
                d.x += d.vx;
                d.y += d.vy;
                d.size += 0.8;
                d.alpha -= 0.018;
                if (d.alpha <= 0) {
                    recon.dustClouds.splice(i, 1);
                }
            }

            // 3. 단계별 페이즈 전환
            if (recon.elapsed < 300) {
                recon.phase = 'demolish';
                this.house.shake = Math.max(this.house.shake, 14);
            } else if (recon.elapsed < 800) {
                recon.phase = 'build';
                this.house.shake = 0;
                // 주기적인 망치질 사운드 (약 120ms마다 타격)
                const currentTick = Math.floor((recon.elapsed - 300) / 120);
                if (currentTick > recon.hammerTicks) {
                    recon.hammerTicks = currentTick;
                    soundEngine.constructionHammer();
                    // 돼지들 바운스 & 작업 모션
                    if (this.pigAnim) {
                        this.pigAnim[1].bounce = 12;
                        this.pigAnim[2].bounce = 14;
                        this.pigAnim[3].bounce = 18;
                    }
                }
            } else {
                if (recon.phase !== 'complete') {
                    recon.phase = 'complete';
                    // 새 건물 티어 적용 및 체력 갱신
                    this.house.tier = recon.toTier;
                    this.updateHouseStats();
                    soundEngine.buildingCompleteFanfare();
                    this.triggerScreenShake(8);

                    // 완공 축하 황금 폭죽
                    for (let k = 0; k < 45; k++) {
                        this.particles.push({
                            x: this.house.x + this.house.w * 0.5 + (Math.random() - 0.5) * 100,
                            y: this.house.y + this.house.h * 0.5 + (Math.random() - 0.5) * 120,
                            vx: (Math.random() - 0.5) * 9,
                            vy: -Math.random() * 9 - 3,
                            color: Math.random() < 0.6 ? '#ffd700' : (Math.random() < 0.8 ? '#ffeb3b' : '#ff9800'),
                            size: 4 + Math.random() * 5,
                            life: 50
                        });
                    }

                    const bannerText = recon.toTier === 2 
                        ? "🪵 [신축 완공] 아늑하고 튼튼한 통나무 산장 오두막 완공!" 
                        : "🏰 [신축 완공] 난공불락의 콘크리트 요새 성채 완공!";
                    const bannerColor = recon.toTier === 2 ? "#8d6e63" : "#3b82f6";
                    this.showBanner(bannerText, bannerColor);

                    // 완공 환호 말풍선
                    this.pigSpeeches = recon.toTier === 2 ? [
                        { pigIdx: 1, text: "우와! 진짜 멋진 통나무집이다!", timer: 2000 },
                        { pigIdx: 2, text: "2층 발코니 시야 대박이야!", timer: 2000 },
                        { pigIdx: 3, text: "통나무가 엄청 단단해!", timer: 2000 }
                    ] : [
                        { pigIdx: 1, text: "난공불락 콘크리트 요새 성채다!", timer: 2000 },
                        { pigIdx: 2, text: "방어 테라스 사격 준비 완료!", timer: 2000 },
                        { pigIdx: 3, text: "늑대들이 절대 못 뚫는다구!", timer: 2000 }
                    ];
                }

                if (recon.elapsed >= recon.duration) {
                    recon.active = false;
                }
            }
        }

        // 삼형제 스킬 활성화 타이머 감소
        if (this.pig1SkillTimer > 0) {
            this.pig1SkillTimer = Math.max(0, this.pig1SkillTimer - dt);
        }
        if (this.pig3SkillTimer > 0) {
            this.pig3SkillTimer = Math.max(0, this.pig3SkillTimer - dt);
        }

        const isPig1SkillActive = (this.pig1SkillTimer > 0) || (this.strawRolls && this.strawRolls.length > 0);
        const isPig3ShieldActive = (this.house && this.house.invincibleTimer > 0) || (this.pig3SkillType === 'shield' && this.pig3SkillTimer > 0);
        const isPig3RepairActive = (this.cauldronFire > 0) || (this.pig3SkillType === 'repair' && this.pig3SkillTimer > 0);

        // 삼형제 액션 애니메이션 감쇠 및 스킬 중 지속적인 역동적 움직임
        if (this.pigAnim) {
            for (let p = 1; p <= 3; p++) {
                const a = this.pigAnim[p];
                if (a) {
                    a.bounce *= 0.88;
                    a.recoil *= 0.86;
                    a.rot *= 0.88;
                    if (Math.abs(a.bounce) < 0.05) a.bounce = 0;
                    if (Math.abs(a.recoil) < 0.05) a.recoil = 0;
                    if (Math.abs(a.rot) < 0.005) a.rot = 0;
                }
            }

            // 첫째 돼지: 스킬(짚단 굴리기) 발사 중 지속적인 짚단 밀기 역동적 모션 유지!
            if (isPig1SkillActive) {
                const rollPhase = performance.now() * 0.014;
                this.pigAnim[1].bounce = Math.max(this.pigAnim[1].bounce, Math.sin(rollPhase) * 6 + 5);
                this.pigAnim[1].recoil = Math.sin(rollPhase) * 5;
                this.pigAnim[1].rot = -0.12 + Math.sin(rollPhase) * 0.16;
            }

            // 셋째 돼지: 스킬 발사 중 지속적인 움직임 (3성 방패 방어 vs 1/2성 황금망치 수리)
            if (isPig3ShieldActive) {
                const shieldPhase = performance.now() * 0.009;
                this.pigAnim[3].bounce = Math.sin(shieldPhase) * 3 + 2;
                this.pigAnim[3].recoil = 5 + Math.sin(shieldPhase * 2) * 2;
                this.pigAnim[3].rot = 0.10 + Math.sin(shieldPhase) * 0.05;
            } else if (isPig3RepairActive) {
                const hammerPhase = performance.now() * 0.015;
                this.pigAnim[3].bounce = Math.max(this.pigAnim[3].bounce, Math.abs(Math.sin(hammerPhase)) * 10 + 3);
                this.pigAnim[3].recoil = Math.sin(hammerPhase) * 3;
                this.pigAnim[3].rot = -0.20 + Math.sin(hammerPhase) * 0.25;
            }
        }

        // 삼형제 Sprite Sheet 기반 프레임 애니메이터 업데이트
        if (this.pigAnimators) {
            const dtSec = dt / 1000;
            for (let p = 1; p <= 3; p++) {
                if (this.pigAnimators[p]) {
                    this.pigAnimators[p].update(dtSec);
                }
            }

            // 첫째 돼지: 스킬 발사 중이면 roll_straw 루프로 계속 움직이고, 완료 시 idle 자연 복귀
            if (this.pigAnimators[1]) {
                if (isPig1SkillActive) {
                    if (this.pigAnimators[1].getCurrentAction() !== 'roll_straw') {
                        this.pigAnimators[1].playAction('roll_straw', true, null, 12, true);
                    }
                } else {
                    if (this.pigAnimators[1].getCurrentAction() === 'roll_straw') {
                        this.pigAnimators[1].playAction('idle', true);
                    }
                }
            }

            // 셋째 돼지: 스킬 발사 중이면 shield_block 또는 hammer_repair 루프로 계속 움직이고, 완료 시 idle 복귀
            if (this.pigAnimators[3]) {
                if (isPig3ShieldActive) {
                    if (this.pigAnimators[3].getCurrentAction() !== 'shield_block') {
                        this.pigAnimators[3].playAction('shield_block', true, null, 10, true);
                    }
                } else if (isPig3RepairActive) {
                    if (this.pigAnimators[3].getCurrentAction() !== 'hammer_repair') {
                        this.pigAnimators[3].playAction('hammer_repair', true, null, 12, true);
                    }
                } else {
                    const act3 = this.pigAnimators[3].getCurrentAction();
                    if (act3 === 'shield_block' || act3 === 'hammer_repair') {
                        this.pigAnimators[3].playAction('idle', true);
                    }
                }
            }
        }

        // 마우스 계속 누르고 있거나 터보 모드가 켜져 있을 때 연속 자동 발사
        if (this.mouse.isDown || this.isTurbo) {
            this.tryShoot();
        }

        // 집 자동 회복
        if (this.house.autoRepairRate > 0 && this.house.hp < this.house.maxHp) {
            this.house.hp = Math.min(this.house.maxHp, this.house.hp + this.house.autoRepairRate * (dt / 1000));
        }

        // 셋째 3성 무적 방어막 지속시간 감소 (정확히 5초 유지)
        if (this.house.invincibleTimer > 0) {
            this.house.invincibleTimer = Math.max(0, this.house.invincibleTimer - dt);
        }

        // ⚡ 스탯 ALL MAX 요새 신성 각성 (5초 주기 50% 확률 자동 벼락/지진 공격) 업데이트
        this.updateStatMaxAwakening(dt);

        // 🐷 삼형제 2단계 콤보 추가 스킬 지속 이펙트 및 충돌 업데이트
        this.updatePigComboEffects(dt);

        // 셋째 가마솥 시간 감소
        if (this.cauldronFire > 0) {
            this.cauldronFire -= dt;
            // 집 앞 늑대들에게 화염 데미지
            this.enemies.forEach(e => {
                if (e.x < this.house.x + this.house.w + 120 && e.y > 350) {
                    e.takeDamage(0.6 * (dt / 16.6), this);
                }
            });
            // 불꽃 파티클
            if (Math.random() < 0.6) {
                this.particles.push({
                    x: this.house.x + this.house.w + Math.random() * 80,
                    y: 470,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3 - 2,
                    color: Math.random() > 0.5 ? '#ff5722' : '#ffeb3b',
                    size: 5,
                    life: 30
                });
            }
        }

        // 궁극기 활성화 여부 확인 (해금됨 + 현재 모든 능력치 MAX 달성 시)
        const isMaxed = this.checkAllMaxed();
        const hasUltimateActive = this.ultimateUnlocked && isMaxed;
        const shouldUpdateSkillUi = this.performanceManager.shouldUpdateUi(performance.now());
        if (shouldUpdateSkillUi) {
            const skill4Slot = document.getElementById('skill-4');
            if (skill4Slot) skill4Slot.classList.toggle('hidden', !hasUltimateActive);
        }

        const maxSkillSlots = hasUltimateActive ? 4 : 3;
        for (let i = 1; i <= maxSkillSlots; i++) {
            const skill = this.skills[i];
            if (!skill) continue;

            if (skill.currentCd > 0) {
                skill.currentCd -= dt;
            } else {
                skill.currentCd = 0;
            }

            // DOM 쓰기는 게임 시뮬레이션과 분리해 초당 최대 10회만 수행한다.
            if (shouldUpdateSkillUi) {
                const slotEl = document.getElementById(`skill-${i}`);
                if (!slotEl) continue;
                const overlay = slotEl.querySelector('.skill-overlay');
                const timer = slotEl.querySelector('.skill-timer');
                const coolingDown = skill.currentCd > 0;
                slotEl.classList.toggle('on-cooldown', coolingDown);
                if (overlay) overlay.style.height = coolingDown ? `${(skill.currentCd / skill.maxCd) * 100}%` : '0%';
                if (timer && coolingDown) timer.innerText = (skill.currentCd / 1000).toFixed(1);
            }
        }

        // (궁극기는 20초 쿨타임마다 [4] 키 또는 스킬 슬롯 클릭으로 수동 발사됨)

        // 웨이브 스폰 처리
        if (this.waveInProgress) {
            this.spawnTimer += dt;
            for (let i = this.waveEnemiesToSpawn.length - 1; i >= 0; i--) {
                if (this.spawnTimer >= this.waveEnemiesToSpawn[i].delay) {
                    this.spawnEnemy(this.waveEnemiesToSpawn[i].type);
                    this.waveEnemiesToSpawn.splice(i, 1);
                }
            }

            // 모든 적 스폰 완료 및 처치 확인
            if (this.waveEnemiesToSpawn.length === 0 && this.enemies.length === 0) {
                this.waveInProgress = false;
                this.waveTransitionTimer = 2200; // 다음 웨이브 대기
                soundEngine.victory();

                if (this.mode === 'STORY' && this.wave === this.maxStoryWave) {
                    // 스토리 최종 승리! 코믹 엔딩 컷씬
                    this.triggerVictoryEnding();
                    return;
                } else {
                    if (this.mode === 'ENDLESS' && this.wave >= 100 && !this.unlockedTitles.includes('nuclear_beginner')) {
                        // 무한 모드 100웨이브 최종 돌파! 전설의 【핵초보】 칭호 지급!
                        this.unlockTitle('nuclear_beginner');
                        this.triggerConfetti();
                        this.showBanner(`👑 [무한 모드 100W 완전 정복!] 👑\n최종 도달 성공! 전설의 【핵초보】 칭호를 획득했습니다!`, "#ffd700");
                    }
                    const waveGold = this.getGoldGain(30 + this.wave * 10);
                    this.gold += waveGold;

                    // 모든 능력치 MAX 달성 시 남은 인게임 골드 금고로 자동 저축
                    if (this.checkAllMaxed() && this.gold > 0) {
                        const autoBanked = this.gold;
                        this.metaBankGold += autoBanked;
                        this.gold = 0;
                        localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
                        this.showBanner(`WAVE ${this.wave} 클리어! (+${waveGold}G) 🏦 [ALL MAX 골드 자동 금고 저축: +${autoBanked}G]`, "#ffd700");
                        this.renderMenuMetaUI();
                    } else {
                        this.showBanner(`WAVE ${this.wave} 클리어! (+${waveGold}G)`, "#4caf50");
                    }
                }
            }
        } else {
            // 다음 웨이브 카운트다운
            this.waveTransitionTimer -= dt;
            if (this.waveTransitionTimer <= 0) {
                this.startWave(this.wave + 1);
            }
        }

        // 구름 이동
        this.clouds.forEach(c => {
            c.x += c.speed;
            if (c.x > V_WIDTH + 100) c.x = -120;
        });

        // 스테이지 환경 앰비언트 파티클 업데이트
        this.updateEnvParticles(dt);

        // 탄환-늑대 충돌용 X축 공간 인덱스는 프레임당 한 번만 재구성한다.
        this.performanceManager.rebuildEnemyIndex(this.enemies);

        // 투사체 업데이트
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (!p.history) p.history = [];
            p.history.push({ x: p.x, y: p.y });
            if (p.history.length > 5) p.history.shift();

            // 3단계 화염 로켓 도토리 파티클 꼬리
            if (p.tier === 3 && Math.random() < 0.45 * this.performanceManager.cosmeticScale) {
                this.particles.push({
                    x: p.x - p.vx * 0.4,
                    y: p.y - p.vy * 0.4,
                    vx: -p.vx * 0.15 + (Math.random() - 0.5) * 2,
                    vy: -p.vy * 0.15 + (Math.random() - 0.5) * 2,
                    color: Math.random() < 0.6 ? '#ff9800' : '#ff5722',
                    size: 3 + Math.random() * 2,
                    life: 14
                });
            }

            // 적과의 충돌
            let hit = false;
            const nearbyEnemies = this.performanceManager.nearbyEnemiesX(p.x, 95);
            for (let j = 0; j < nearbyEnemies.length; j++) {
                const e = nearbyEnemies[j];
                if (!e || e.dead || e.hp <= 0) continue;
                // 풍선 늑대 전용 대공 충돌 판정 (30% 확대 판정 반영):
                // 1. 공중 대형 노란 풍선 (상단 중심 x+2, y-196, 반경 57) - 오직 풍선에 맞아야 터지고 낙하!
                if (e instanceof BalloonWolf && e.isFlying) {
                    const balloonX = e.x + 2;
                    const balloonCenterY = e.y - 196;
                    const balloonRadius = 57;
                    const balloonDx = p.x - balloonX;
                    const balloonDy = p.y - balloonCenterY;
                    if (balloonDx * balloonDx + balloonDy * balloonDy < balloonRadius * balloonRadius) {
                        e.popBalloon(this);
                        hit = true;
                        break;
                    }

                    // 2. 비행 중 늑대 머리통 및 몸체(y-143~y) 피격 판정 (30% 확대)
                    if (p.x > e.x - 50 && p.x < e.x + 50 && p.y > e.y - 143 && p.y < e.y) {
                        if (this.pigRanks && this.pigRanks[2] >= 2) {
                            // ★★ 2성 이상 다이너마이트 도토리: 본체 피격 시에도 다이너마이트 폭발로 풍선 연쇄 격추!
                            e.popBalloon(this);
                            e.takeDamage(p.damage, this, true, true);
                            soundEngine.acornExplode();
                            this.floatingTexts.push({
                                text: '💥 다이너마이트 폭발 풍선 격추!',
                                x: e.x,
                                y: e.y - 115,
                                color: '#ff9100',
                                alpha: 1.0,
                                duration: 800,
                                elapsed: 0
                            });
                            hit = true;
                            break;
                        } else {
                            this.floatingTexts.push({
                                text: '🎈 풍선만 타격 가능! (몸체 무적)',
                                x: e.x,
                                y: e.y - 115,
                                color: '#ffeb3b',
                                alpha: 1.0,
                                duration: 700,
                                elapsed: 0
                            });
                            soundEngine.playNoise(0.06, 0.06, 700);
                            hit = true;
                            break;
                        }
                    }
                    continue; // 풍선이나 본체 어디에도 맞지 않은 허공은 관통
                }

                // 우산 낙하산 공수 늑대 전용 대공 충돌 판정:
                // 1. 공중 무지개 우산 캐노피 (상단 중심 x, y-135, 반경 55)
                if ((e instanceof UmbrellaWolf || e.wolfTypeKey === 'umbrella') && e.isFlying) {
                    const umbrellaX = e.x;
                    const umbrellaCenterY = e.y - 135;
                    const umbrellaRadius = 55;
                    const umbrellaDx = p.x - umbrellaX;
                    const umbrellaDy = p.y - umbrellaCenterY;
                    if (umbrellaDx * umbrellaDx + umbrellaDy * umbrellaDy < umbrellaRadius * umbrellaRadius) {
                        e.popUmbrella(this);
                        hit = true;
                        break;
                    }

                    // 2. 비행 중 늑대 본체 피격 판정
                    if (p.x > e.x - 45 && p.x < e.x + 45 && p.y > e.y - 100 && p.y < e.y) {
                        if (this.pigRanks && this.pigRanks[2] >= 2) {
                            // ★★ 2성 이상 다이너마이트 도토리: 본체 피격 시에도 우산 연쇄 격추!
                            e.popUmbrella(this);
                            e.takeDamage(p.damage, this, true, true);
                            soundEngine.acornExplode();
                            this.floatingTexts.push({
                                text: '💥 다이너마이트 폭발 우산 격추!',
                                x: e.x,
                                y: e.y - 80,
                                color: '#ff9100',
                                alpha: 1.0,
                                duration: 800,
                                elapsed: 0
                            });
                            hit = true;
                            break;
                        } else {
                            // 일반 도토리는 비행 중 본체에 맞으면 대미지를 입음
                            e.takeDamage(p.damage, this, false);
                            hit = true;
                            break;
                        }
                    }
                    continue; // 우산이나 본체 어디에도 맞지 않은 허공은 관통
                }

                if (p.x > e.x - e.w / 2 && p.x < e.x + e.w / 2 &&
                    p.y > e.y - e.h && p.y < e.y) {
                    const damaged = e.takeDamage(p.damage, this, false);
                    hit = true;

                    // 도토리 탄환 파편 파티클
                    const hitCount = p.tier === 3 ? 6 : (p.tier === 2 ? 5 : 4);
                    for (let k = 0; k < hitCount; k++) {
                        this.particles.push({
                            x: p.x,
                            y: p.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            color: p.tier === 3 ? '#ff7043' : (p.tier === 2 ? '#b0bec5' : '#8d5b28'),
                            size: 2.5 + Math.random() * 2.5,
                            life: 16
                        });
                    }

                    // 일반공격 적 밀치기 (넉백) 확률 체크: 맵의 20분의 1 (V_WIDTH * 0.05 = 64px) 밀림
                    // 보스가 공격 무시(회피)를 했을 때는 절대로 넉백되지 않음! (damaged !== false)
                    if (damaged !== false && p.isBasicAttack && !e.isDead && this.metaKnockbackChance > 0) {
                        if (Math.random() * 100 < this.metaKnockbackChance) {
                            const knockbackDist = V_WIDTH * (1 / 20); // 64px (1280 / 20)
                            e.x = Math.min(V_WIDTH + 140, e.x + knockbackDist);
                            soundEngine.playNoise(0.18, 0.12, 180);
                            this.floatingTexts.push({
                                text: `💨 넉백! (+64px)`,
                                x: e.x,
                                y: e.y - e.h - 15,
                                color: '#00e5ff',
                                alpha: 1.0,
                                duration: 800,
                                elapsed: 0
                            });
                            for (let k = 0; k < 8; k++) {
                                this.particles.push({
                                    x: e.x,
                                    y: e.y - e.h / 2,
                                    vx: 3 + Math.random() * 4,
                                    vy: (Math.random() - 0.5) * 5,
                                    color: '#00e5ff',
                                    size: 4 + Math.random() * 3,
                                    life: 25
                                });
                            }
                        }
                    }
                    break;
                }
            }

            // 바위와의 충돌 판정
            if (!hit) {
                for (let b = 0; b < this.boulders.length; b++) {
                    const bld = this.boulders[b];
                    if (Math.abs(p.x - bld.x) > p.radius + bld.radius) continue;
                    const dx = p.x - bld.x;
                    const dy = p.y - bld.y;
                    const collisionRadius = p.radius + bld.radius;
                    if (dx * dx + dy * dy < collisionRadius * collisionRadius) {
                        bld.hp -= p.damage;
                        hit = true;
                        soundEngine.hit();

                        // 도토리 탄환 파편 파티클
                        const hitCount = p.tier === 3 ? 6 : (p.tier === 2 ? 5 : 4);
                        for (let k = 0; k < hitCount; k++) {
                            this.particles.push({
                                x: p.x,
                                y: p.y,
                                vx: (Math.random() - 0.5) * 6,
                                vy: (Math.random() - 0.5) * 6,
                                color: p.tier === 3 ? '#ff7043' : (p.tier === 2 ? '#b0bec5' : '#8d5b28'),
                                size: 2.5 + Math.random() * 2.5,
                                life: 16
                            });
                        }

                        this.floatingTexts.push({
                            text: `-${Math.round(p.damage)}`,
                            x: bld.x,
                            y: bld.y - 20,
                            color: '#ff9800',
                            alpha: 1.0,
                            duration: 600,
                            elapsed: 0
                        });
                        if (bld.hp <= 0) {
                            if (bld.isWind) {
                                soundEngine.wolfWind();
                                for (let k = 0; k < 20; k++) {
                                    this.particles.push({
                                        x: bld.x,
                                        y: bld.y,
                                        vx: (Math.random() - 0.5) * 8,
                                        vy: (Math.random() - 0.5) * 8,
                                        color: Math.random() < 0.5 ? '#b2ebf2' : '#80deea',
                                        size: Math.random() * 5 + 2,
                                        life: 25
                                    });
                                }
                                this.boulders.splice(b, 1);
                                const bldGold = this.getGoldGain(10);
                                this.gold += bldGold;
                                this.score += 100;
                                this.showBanner(`💨 바람늑대 돌풍 요격 성공! +${bldGold}G`, "#00e5ff");
                            } else {
                                soundEngine.explosion();
                                for (let k = 0; k < 20; k++) {
                                    this.particles.push({
                                        x: bld.x,
                                        y: bld.y,
                                        vx: (Math.random() - 0.5) * 8,
                                        vy: (Math.random() - 0.5) * 8,
                                        color: '#795548',
                                        size: Math.random() * 6 + 2,
                                        life: 30
                                    });
                                }
                                this.boulders.splice(b, 1);
                                const bldGold = this.getGoldGain(15);
                                this.gold += bldGold;
                                this.score += 150;
                                const hitMsg = bld.isAxe ? `💥 회전 도끼 격추 성공! +${bldGold}G` : `💥 거대 바위 격추 성공! +${bldGold}G`;
                                this.showBanner(hitMsg, "#4caf50");
                            }
                        }
                        break;
                    }
                }
            }

            if (hit || p.life <= 0 || p.x > V_WIDTH + 20 || p.y < 0 || p.y > V_HEIGHT) {
                this.projectiles.splice(i, 1);
            }
        }

        // 셋째 돼지 마스터 대공 요격 로켓 업데이트
        for (let i = this.antiAirRockets.length - 1; i >= 0; i--) {
            const r = this.antiAirRockets[i];

            // 유도 목표 좌표 실시간 추적
            let tx = r.destX;
            let ty = r.destY;
            if (r.target && !r.target.dead) {
                tx = r.target.x + 2;
                ty = r.target.isFlying ? ((r.target.wolfTypeKey === 'umbrella' || r.target instanceof UmbrellaWolf) ? r.target.y - 140 : r.target.y - 196) : r.target.y;
            }

            const angle = Math.atan2(ty - r.y, tx - r.x);
            r.vx = Math.cos(angle) * r.speed;
            r.vy = Math.sin(angle) * r.speed;
            r.x += r.vx;
            r.y += r.vy;
            r.life--;

            if (!r.history) r.history = [];
            r.history.push({ x: r.x, y: r.y });
            if (r.history.length > 5) r.history.shift();

            // 로켓 화염 연기 파티클
            if (Math.random() < 0.65) {
                this.particles.push({
                    x: r.x - r.vx * 0.4,
                    y: r.y - r.vy * 0.4,
                    vx: -r.vx * 0.15 + (Math.random() - 0.5) * 2,
                    vy: -r.vy * 0.15 + (Math.random() - 0.5) * 2,
                    color: Math.random() < 0.5 ? '#ffd700' : '#ff5722',
                    size: 3 + Math.random() * 2,
                    life: 14
                });
            }

            // 목표 도달 / 충돌 판정
            const dist = Math.hypot(tx - r.x, ty - r.y);
            if (dist < 28 || r.life <= 0) {
                if (r.target && !r.target.dead) {
                    if (r.target instanceof BalloonWolf || r.target.wolfTypeKey === 'balloon') {
                        if (r.target.isFlying) {
                            r.target.popBalloon(this);
                        }
                    } else if (r.target instanceof UmbrellaWolf || r.target.wolfTypeKey === 'umbrella') {
                        if (r.target.isFlying) {
                            r.target.popUmbrella(this);
                        }
                    }
                    r.target.takeDamage(r.damage, this, true, true);
                    this.floatingTexts.push({
                        text: (r.target.wolfTypeKey === 'umbrella' || r.target instanceof UmbrellaWolf) ? '🎯 [대공 요격] 우산 격추!!' : '🎯 [대공 요격] 풍선 격추!!',
                        x: r.x,
                        y: r.y - 30,
                        color: '#00e5ff',
                        alpha: 1.0,
                        duration: 800,
                        elapsed: 0
                    });
                } else {
                    // 목표 반경 지상 폭발 피해
                    this.enemies.forEach(en => {
                        if (!en.dead && Math.hypot(en.x - r.x, en.y - r.y) < 110) {
                            en.takeDamage(r.damage * 0.85, this, true);
                        }
                    });
                }

                // 폭발 이펙트 & 사운드
                soundEngine.pop();
                for (let k = 0; k < 20; k++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = Math.random() * 6 + 2;
                    this.particles.push({
                        x: r.x,
                        y: r.y,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd,
                        color: Math.random() < 0.5 ? '#ffd700' : '#ff9100',
                        size: Math.random() * 5 + 3,
                        life: 25
                    });
                }
                this.antiAirRockets.splice(i, 1);
            }
        }

        // 대공 방공망 자동 요격 처리
        if (this.pig3AntiAirTimer > 0) {
            this.pig3AntiAirTimer -= dt;
            this.pig3AntiAirAutoTimer = (this.pig3AntiAirAutoTimer || 0) + dt;
            if (this.pig3AntiAirAutoTimer >= 800) {
                this.pig3AntiAirAutoTimer = 0;
                const flying = this.enemies.find(e => ((e instanceof BalloonWolf || e.wolfTypeKey === 'balloon') || (e instanceof UmbrellaWolf || e.wolfTypeKey === 'umbrella')) && e.isFlying && !e.dead);
                if (flying) {
                    this.launchAntiAirRocket(flying);
                    this.floatingTexts.push({
                        text: '🎯 [방공망 자동요격 발사]',
                        x: this.house.x + this.house.w,
                        y: this.house.y + 20,
                        color: '#38bdf8',
                        alpha: 1.0,
                        duration: 600,
                        elapsed: 0
                    });
                }
            }
        }

        // 공중 낙하 도토리 폭탄 업데이트
        for (let i = this.fallingBombs.length - 1; i >= 0; i--) {
            const b = this.fallingBombs[i];
            b.x += b.vx;
            b.y += b.vy;
            b.currentFrame++;

            // 도화선 연기 및 스파크 파티클 방출
            if (Math.random() < 0.8) {
                const sparkCol = b.rank === 3 ? '#ff1744' : (b.rank === 2 ? '#ff9800' : '#ffd700');
                this.particles.push({
                    x: b.x - b.vx * 0.35,
                    y: b.y - b.vy * 0.35 - 12,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3 - 0.5,
                    color: sparkCol,
                    size: 3 + Math.random() * 2,
                    life: 14
                });
            }

            // 공중 낙하 중 풍선늑대(상단 풍선 또는 조종사 본체)와의 직격 충돌 검사
            let directAirHit = false;
            for (let eIdx = 0; eIdx < this.enemies.length; eIdx++) {
                const enemy = this.enemies[eIdx];
                if (!enemy || enemy.isDead || enemy.hp <= 0) continue;
                if (enemy instanceof BalloonWolf || enemy.wolfTypeKey === 'balloon') {
                    const balloonX = enemy.x + 2;
                    const balloonCenterY = enemy.y - 196;
                    const distBalloon = Math.hypot(b.x - balloonX, b.y - balloonCenterY);
                    const distBody = Math.hypot(b.x - enemy.x, b.y - (enemy.y - 45));
                    // 풍선 반경 60 또는 본체 반경 50 내에 폭탄이 닿으면 공중 직격 격발! (30% 확대)
                    if ((enemy.isFlying && (distBalloon <= 60 || distBody <= 50)) || (!enemy.isFlying && distBody <= 52)) {
                        this.triggerAcornDetonation(b.x, b.y, b.radius, b.damage, b.rank, b.isStun);
                        this.fallingBombs.splice(i, 1);
                        directAirHit = true;
                        break;
                    }
                }
            }
            if (directAirHit) continue;

            // 지면 또는 목표점 도달 시 착탄 및 만화 폭발 격발
            if (b.currentFrame >= b.flightFrames || b.y >= b.destY) {
                this.triggerAcornDetonation(b.destX, b.destY, b.radius, b.damage, b.rank, b.isStun);
                this.fallingBombs.splice(i, 1);
            }
        }

        // 만화 폭발 버섯구름 & 충격파 업데이트
        for (let i = this.comicExplosions.length - 1; i >= 0; i--) {
            const exp = this.comicExplosions[i];
            exp.life -= dt / 16.6;
            exp.shockwaveRadius += (exp.shockwaveMax - exp.shockwaveRadius) * (1 - Math.pow(0.78, dt / 16.6));
            if (exp.life <= 0) {
                this.comicExplosions.splice(i, 1);
            }
        }

        // 보스 투척 바위 및 중간보스 도끼 & 바람늑대 돌풍 업데이트
        for (let i = this.boulders.length - 1; i >= 0; i--) {
            const bld = this.boulders[i];
            if (bld.isBossMeteor) {
                this.updateBossMeteor(bld, dt);
            } else {
                bld.x += bld.vx * (dt / 16.6);
                bld.y += bld.vy * (dt / 16.6);
            }
            if (!bld.isWind && !bld.isBossMeteor) {
                bld.vy += 0.05 * (dt / 16.6); // 중력 적용 (바람은 중력 없이 수평 비행)
            } else if (bld.isWind) {
                // 바람 미세 기류 파티클
                bld.trailTimer = (bld.trailTimer || 0) + dt;
                if (bld.trailTimer >= 50) {
                    bld.trailTimer = 0;
                    this.particles.push({
                        x: bld.x + (Math.random() - 0.5) * 12,
                        y: bld.y + (Math.random() - 0.5) * 16,
                        vx: Math.random() * 2 + 1,
                        vy: (Math.random() - 0.5) * 1.5,
                        color: Math.random() < 0.5 ? '#b2ebf2' : '#e0f7fa',
                        size: Math.random() * 4 + 2,
                        life: 16
                    });
                }
            }
            bld.rotation += bld.isAxe ? 0.28 : bld.isWind ? 0.22 : 0.08;

            if (bld.isBossMeteor ? bld.impacted : bld.x <= this.house.x + this.house.w) {
                // 집 충돌!
                let dmg = bld.damage;
                if (this.house.invincibleTimer > 0) {
                    dmg = 0;
                    this.floatingTexts.push({
                        text: '무적 방어막!',
                        x: this.house.x + this.house.w * 0.5,
                        y: this.house.y + 40,
                        color: '#00e5ff',
                        alpha: 1.0,
                        duration: 600,
                        elapsed: 0
                    });
                } else if (bld.isWind) {
                    // 바람 공격은 집 티어에 따라 특화 감쇄 (동화 원작 반영: 짚집에 치명적, 벽돌집은 견딤)
                    if (this.house.tier === 3) dmg = 4;
                    else if (this.house.tier === 2) dmg = 10;
                    else dmg = 18;
                    this.floatingTexts.push({
                        text: `💨 돌풍 강타! -${dmg}`,
                        x: this.house.x + this.house.w * 0.5,
                        y: this.house.y + 40,
                        color: '#81d4fa',
                        alpha: 1.0,
                        duration: 1000,
                        elapsed: 0,
                        scale: 1.4
                    });
                } else {
                    if (this.house.tier === 3) dmg *= 0.35;
                    else if (this.house.tier === 2) dmg *= 0.65;
                }
                this.house.hp -= dmg;
                this.house.shake = bld.isWind ? 10 : 18;
                if (bld.isWind) soundEngine.wolfWind();
                else soundEngine.explosion();

                for (let k = 0; k < (bld.isWind ? 16 : 25); k++) {
                    this.particles.push({
                        x: bld.x,
                        y: bld.y,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        color: bld.isWind ? (Math.random() < 0.5 ? '#e0f7fa' : '#80deea') : '#5d4037',
                        size: Math.random() * 6 + 2,
                        life: 30
                    });
                }
                this.boulders.splice(i, 1);
            } else if (bld.y > V_HEIGHT + 50 || bld.x < -100) {
                this.boulders.splice(i, 1);
            }
        }

        // 짚단 굴리기 업데이트
        for (let i = this.strawRolls.length - 1; i >= 0; i--) {
            const roll = this.strawRolls[i];
            roll.x += roll.vx;
            roll.rotation += 0.15;

            // 🌾 첫째 돼지 콤보: 화염 가시 장판 잔류 (1단계: 화염 장판, 2단계: 황금 가시밭)
            if (this.pigComboSkills && this.pigComboSkills[1] >= 1) {
                if (!roll.lastTrailX || roll.x - roll.lastTrailX >= 48) {
                    roll.lastTrailX = roll.x;
                    const cTier = this.pigComboSkills[1];
                    this.groundFireTrails.push({
                        x: roll.x - 30,
                        y: 474,
                        w: 64,
                        h: 26,
                        tier: cTier,
                        life: cTier === 2 ? 8000 : 4000,
                        maxLife: cTier === 2 ? 8000 : 4000,
                        damageTimer: 0
                    });
                }
            }

            // 짚단 성급별 고유 파티클 방출
            const rank = roll.rank || 1;
            if (rank === 2) {
                // 2성: 화염 & 숯불 불티 파티클 방출 🔥
                if (Math.random() < 0.7) {
                    this.particles.push({
                        x: roll.x - roll.radius * 0.4 + (Math.random() - 0.5) * 20,
                        y: roll.y + roll.radius * 0.5 + (Math.random() - 0.5) * 15,
                        vx: -Math.random() * 4 - 1,
                        vy: -Math.random() * 4 - 1,
                        color: Math.random() < 0.6 ? '#ff5722' : '#ff9800',
                        size: 4 + Math.random() * 4,
                        life: 22
                    });
                }
            } else if (rank === 3) {
                // 3성: 황금 돌풍 & 스파크 방출 👑
                if (Math.random() < 0.8) {
                    this.particles.push({
                        x: roll.x + (Math.random() - 0.5) * roll.radius * 1.4,
                        y: roll.y + (Math.random() - 0.5) * roll.radius * 1.4,
                        vx: -Math.random() * 3 + 1,
                        vy: (Math.random() - 0.5) * 5,
                        color: Math.random() < 0.5 ? '#ffd700' : '#fff59d',
                        size: 4 + Math.random() * 3,
                        life: 20
                    });
                }
            } else {
                // 1성: 황금 볏짚 가닥 파티클
                if (Math.random() < 0.45) {
                    this.particles.push({
                        x: roll.x,
                        y: roll.y + roll.radius - 5,
                        vx: -Math.random() * 3,
                        vy: -Math.random() * 2,
                        color: '#f5c542',
                        size: 4,
                        life: 20
                    });
                }
            }

            // 적 넉백 및 감속 (스킬 무시 판정 연동, 풍선 비행 늑대는 스킬 완전 면역!)
            this.enemies.forEach(e => {
                if (e instanceof BalloonWolf && e.isFlying) return;
                if (!roll.hitEnemies.has(e) && Math.abs(e.x - roll.x) < roll.radius + 20) {
                    roll.hitEnemies.add(e);
                    const damaged = e.takeDamage(roll.damage, this, true);
                    if (damaged !== false) {
                        e.x += (e instanceof BossWolf ? 35 : 120); // 대형 넉백
                        e.slowTimer = 3000; // 3초 슬로우
                        soundEngine.hit();
                    }
                }
            });

            if (roll.x > V_WIDTH + 100) {
                this.strawRolls.splice(i, 1);
            }
        }

        // 전설의 궁극기: 천지개벽 대회오리 폭풍 (늑대 공중 비행 & 날려버리기 물리)
        for (let i = this.cosmicStorms.length - 1; i >= 0; i--) {
            const storm = this.cosmicStorms[i];
            storm.x += storm.vx;
            storm.angle += 0.35;
            storm.life--;

            // 회오리 전진 시 휘날리는 나뭇잎 & 바람 스파크 파티클 지속 생성
            if (this.particles.length < 85) {
                // 초록/단풍 나뭇잎 🍃🍂
                this.particles.push({
                    x: storm.x + (Math.random() - 0.5) * (storm.w * 0.4),
                    y: 100 + Math.random() * 500,
                    vx: 2 + Math.random() * 6,
                    vy: -3 + (Math.random() - 0.5) * 6,
                    color: Math.random() < 0.5 ? '#22c55e' : (Math.random() < 0.75 ? '#f97316' : '#38bdf8'),
                    size: 4 + Math.random() * 3,
                    life: 20
                });
            }

            let hitAnyThisFrame = false;
            const left = storm.x - storm.w / 2;
            const right = storm.x + storm.w / 2;

            // 적 충돌 및 공중 날리기 검사
            for (let j = 0; j < this.enemies.length; j++) {
                const e = this.enemies[j];
                if (storm.hitEnemies.has(e)) continue;

                if (e.x >= left && e.x <= right) {
                    storm.hitEnemies.add(e);
                    hitAnyThisFrame = true;

                    // 🎈 풍선늑대: 천지개벽 대회오리 거대 회오리 강풍에 풍선이 즉시 폭발하고 요격됨!
                    const isBalloon = (e instanceof BalloonWolf || e.wolfTypeKey === 'balloon');
                    if (isBalloon) {
                        if (e.isFlying) {
                            e.popBalloon(this);
                        }
                        e.isFalling = false;
                        if (this.floatingTexts.length < 35) {
                            this.floatingTexts.push({
                                text: '🎈💥 대회오리 강풍에 풍선 폭파!!',
                                x: e.x,
                                y: e.y - 120,
                                color: '#00e5ff',
                                alpha: 1.0,
                                duration: 900,
                                elapsed: 0
                            });
                        }
                    }

                    const damaged = e.takeDamage(storm.damage, this, true, true);
                    if (damaged !== false) {
                        const isBoss = (e instanceof BossWolf);
                        const isMidBoss = (e instanceof MidBossWolf);

                        if (isBoss || isMidBoss) {
                            // 보스 / 중간보스: 육중한 체구로 가볍게 뜨고 강력하게 밀림
                            e.tornadoState = {
                                active: true,
                                vx: 11 + Math.random() * 3,
                                vy: -10 - Math.random() * 3,
                                gravity: 0.52,
                                rot: 0,
                                rotSpeed: (Math.random() < 0.5 ? -1 : 1) * 0.18,
                                origY: e.y
                            };
                            if (storm.knockbackTextCount < 3) {
                                this.createFloatingText('🌪️ 보스 대회오리 넉백!', e.x, e.y - 60, '#facc15');
                                storm.knockbackTextCount++;
                            }
                        } else {
                            // 일반 늑대들 & 풍선 늑대: 보스늑대처럼 회오리바람에 휘말려 하늘 높이 솟구치며 360도 회전 비행!
                            const screams = isBalloon ? [
                                '내 풍선 터졌다아악~!! 🎈💥',
                                '풍선 터지고 날아간다~!! 🌪️',
                                '살려줘요오오옥~!! 🌪️'
                            ] : [
                                '으아악~ 날아간다~!! 🌪️',
                                '엄마야 살려줘~!! 🐺💨',
                                '하늘을 날고 있어~!! 🌀',
                                '내 스케이트보드~!! 🛹',
                                '빙글빙글 어지러워~!! 💫',
                                '살려줘요오오옥~!! 🌪️'
                            ];
                            const chosenScream = screams[Math.floor(Math.random() * screams.length)];

                            // 보스늑대가 날아가는 것처럼 자연스럽고 호쾌하게 포물선을 그리며 공중 회전 비행!
                            e.tornadoState = {
                                active: true,
                                vx: 12 + Math.random() * 4, // 보스처럼 우측 후방으로 호쾌하게 비행
                                vy: -13 - Math.random() * 4, // 하늘 높이 치솟아 우아한 포물선 비행
                                gravity: 0.55,
                                rot: 0,
                                rotSpeed: (Math.random() < 0.5 ? -1 : 1) * (0.24 + Math.random() * 0.16),
                                origY: isBalloon ? 474 : e.y
                            };

                            // 익살 비명 말풍선 팝업
                            if (this.floatingTexts.length < 35) {
                                this.floatingTexts.push({
                                    text: chosenScream,
                                    x: e.x,
                                    y: e.y - e.h - 20,
                                    color: '#fef08a',
                                    alpha: 1.0,
                                    duration: 1100,
                                    elapsed: 0
                                });
                            }
                        }

                        // 피격 애니메이션(hurt) 재생으로 공중에서 입 벌리고 놀란 표정 연출
                        if (e.animator) {
                            e.animator.playAction('hurt', false);
                        }
                    }
                }
            }

            // 한 프레임에 여러 마리를 맞아도 타격음은 단 1회만 재생 (오디오 병목 방지)
            if (hitAnyThisFrame) {
                soundEngine.hit();
            }

            if (storm.x - storm.w / 2 > V_WIDTH + 150 || storm.life <= 0) {
                this.cosmicStorms.splice(i, 1);
            }
        }

        // 적 업데이트 (회오리바람에 날아가는 중인 늑대는 사망 상태라도 비행이 끝날 때까지 보존)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if ((e.isDead || e.hp <= 0) && (!e.tornadoState || !e.tornadoState.active)) {
                this.enemies.splice(i, 1);
                continue;
            }
            e.update(dt, this);
            if ((e.isDead || e.hp <= 0) && (!e.tornadoState || !e.tornadoState.active)) {
                this.enemies.splice(i, 1);
            }
        }

        // 동전 집 안으로 직행 이동 (뱅뱅 도는 현상 방지)
        const targetX = this.house.x + this.house.w * 0.5;
        const targetY = this.house.y + this.house.h * 0.6;

        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            const dx = targetX - c.x;
            const dy = targetY - c.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 25) {
                // 집 안으로 쏙 들어감!
                this.gold += c.val;
                soundEngine.coin();

                // 집 안에서 터지는 황금 반짝이 파티클
                for (let p = 0; p < 6; p++) {
                    this.particles.push({
                        x: targetX,
                        y: targetY,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -Math.random() * 3 - 1,
                        color: '#ffd700',
                        size: 4,
                        life: 25
                    });
                }

                // 집 위에 골드 획득 텍스트
                const bonusSuffix = this.metaGoldBonus > 0 ? ` (+${this.metaGoldBonus}%)` : '';
                this.floatingTexts.push({
                    text: `+${c.val}G${bonusSuffix}`,
                    x: targetX + (Math.random() - 0.5) * 30,
                    y: targetY - 30,
                    color: '#ffc107',
                    alpha: 1.0,
                    duration: 700,
                    elapsed: 0
                });

                this.coins.splice(i, 1);
            } else {
                // 속도를 거리에 비례하여 부드럽고 시원하게 집 안으로 직행
                const speed = Math.max(14, dist * 0.08 + 4);
                c.x += (dx / dist) * speed * (dt / 16.6);
                c.y += (dy / dist) * speed * (dt / 16.6);
            }
        }

        // 아기돼지 삼형제 말풍선 타이머 업데이트
        for (let i = this.pigSpeeches.length - 1; i >= 0; i--) {
            const sp = this.pigSpeeches[i];
            sp.life -= dt;
            if (sp.life <= 0) {
                this.pigSpeeches.splice(i, 1);
            }
        }

        // 파티클 업데이트 (🚀 swap-remove O(1) - splice 배열 재정렬 완전 제거)
        let pi = this.particles.length - 1;
        while (pi >= 0) {
            const pt = this.particles[pi];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.life--;
            if (pt.life <= 0) {
                // 마지막 요소와 교체 후 pop - O(1) 삭제
                this.particles[pi] = this.particles[this.particles.length - 1];
                this.particles.pop();
            }
            pi--;
        }

        // 플로팅 텍스트 업데이트 (🚀 swap-remove O(1))
        let fi = this.floatingTexts.length - 1;
        while (fi >= 0) {
            const ft = this.floatingTexts[fi];
            ft.elapsed += dt;
            ft.y -= 0.6;
            ft.alpha = 1 - (ft.elapsed / ft.duration);
            if (ft.elapsed >= ft.duration) {
                this.floatingTexts[fi] = this.floatingTexts[this.floatingTexts.length - 1];
                this.floatingTexts.pop();
            }
            fi--;
        }

        // 집 흔들림 감쇠 및 피격 파편 파티클
        if (this.house.shake > 0) {
            if (this.house.shake > 3 && Math.random() < 0.35) {
                const debrisColor = this.house.tier === 3 ? '#b0bec5' : (this.house.tier === 2 ? '#8d6e63' : '#ffe082');
                this.particles.push({
                    x: this.house.x + Math.random() * this.house.w,
                    y: this.house.y + 40 + Math.random() * (this.house.h - 60),
                    vx: (Math.random() - 0.5) * 4,
                    vy: Math.random() * 2 + 1,
                    color: debrisColor,
                    size: 2 + Math.random() * 2.5,
                    life: 18 + Math.random() * 10
                });
            }
            this.house.shake *= 0.85;
        }

        // 게임오버 체크
        if (this.house.hp <= 0) {
            this.triggerGameOver();
        }

        this.performanceManager.trimEffects(this);
        this.updateHUD();
    }

    // 보스 불타는 거대 마그마 운석 투척 헬퍼
    throwBossBoulder(startX, startY, damageMul = 1.0) {
        soundEngine.explosion();
        this.showBanner("🔥 [보스 패턴] 거대 마그마 운석 투척! 집중 사격하여 공중 요격하세요!", "#ff5722");
        this.boulders.push({
            x: startX,
            y: startY,
            isBossMeteor: true,
            phase: 'rise',
            targetX: this.house.x + this.house.w,
            targetY: this.house.y + 40,
            apexY: Math.max(42, startY - 100),
            vx: 0,
            vy: -9,
            radius: 34,
            hp: 65,
            maxHp: 65,
            damage: 46 * damageMul,
            rotation: 0
        });
    }

    updateBossMeteor(bld, dt) {
        // 남은 시간을 다음 구간으로 넘겨 프레임 속도와 무관하게 같은 궤적을 따른다.
        let remaining = dt / 16.6;
        for (let phase = 0; phase < 3 && remaining > 0 && !bld.impacted; phase++) {
            const diveX = bld.targetX + (bld.targetY - bld.apexY) / Math.tan(75 * Math.PI / 180);
            let endX, endY, speed;
            if (bld.phase === 'rise') {
                endX = bld.x; endY = bld.apexY; speed = 9;
            } else if (bld.phase === 'aim') {
                endX = diveX; endY = bld.apexY; speed = 20;
            } else {
                endX = bld.targetX; endY = bld.targetY; speed = 15;
            }
            const dx = endX - bld.x, dy = endY - bld.y;
            const distance = Math.hypot(dx, dy);
            bld.vx = distance ? dx / distance * speed : 0;
            bld.vy = distance ? dy / distance * speed : 0;
            if (distance > speed * remaining) {
                bld.x += bld.vx * remaining;
                bld.y += bld.vy * remaining;
                break;
            }
            bld.x = endX; bld.y = endY;
            remaining -= distance / speed;
            if (bld.phase === 'rise') bld.phase = 'aim';
            else if (bld.phase === 'aim') bld.phase = 'dive';
            else bld.impacted = true;
        }
    }

    // 중간보스 2연속 회전 쌍도끼 투척 헬퍼
    throwMidBossTwinAxes(startX, startY, damageMul = 1.0) {
        soundEngine.playNoise(0.3, 0.2, 500);
        this.showBanner("🪓 [중간보스] 2연속 회전 쌍도끼 일제 투척! 공중에서 요격하세요!", "#ff9800");

        // 1) 상단 비행 도끼 (높은 포물선 궤적)
        this.boulders.push({
            x: startX,
            y: startY - 12,
            vx: -5.8,
            vy: -3.2,
            radius: 22,
            hp: 30,
            maxHp: 30,
            damage: 20 * damageMul,
            rotation: 0,
            isAxe: true,
            isUpperAxe: true
        });

        // 2) 하단 돌격 도끼 (0.15초 후 빠른 직선 궤적)
        setTimeout(() => {
            if (this.state !== GameState.PLAYING) return;
            soundEngine.whoosh();
            this.boulders.push({
                x: startX + 15,
                y: startY + 12,
                vx: -7.5,
                vy: -0.6,
                radius: 22,
                hp: 30,
                maxHp: 30,
                damage: 20 * damageMul,
                rotation: 0,
                isAxe: true,
                isUpperAxe: false
            });
        }, 150);
    }

    // 하위 호환
    throwMidBossAxe(startX, startY, damageMul = 1.0) {
        this.throwMidBossTwinAxes(startX, startY, damageMul);
    }

    // 바람늑대 원거리 돌풍 투사체 발사 (화면 60% 지점에서 집을 향해 직진 발사)
    shootWolfWind(startX, startY, damageMul = 1.0) {
        soundEngine.wolfWind();
        this.showBanner("💨 [바람늑대] 거대 나선 회오리 돌풍 발사! 사격하여 요격하세요!", "#81d4fa");
        this.boulders.push({
            x: startX,
            y: startY,
            vx: -6.8, // 시원하게 날아가는 거대 회오리 돌풍
            vy: 0,
            radius: 36, // 거대화
            hp: 32,   // 도토리 2~3발로 요격 가능
            maxHp: 32,
            damage: 18 * damageMul,
            rotation: 0,
            isWind: true,
            trailTimer: 0
        });
    }

    triggerScreenShake(magnitude = 15) {
        this.house.shake = Math.max(this.house.shake, magnitude);
    }

    // 축하 폭죽 및 색종이 효과 생성
    triggerConfetti() {
        this.confetti = [];
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800', '#ffd700'];
        for (let i = 0; i < 180; i++) {
            this.confetti.push({
                x: Math.random() * V_WIDTH,
                y: -10 - Math.random() * 200,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 4 + 2,
                gravity: 0.08,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 9 + 6,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                life: 300
            });
        }
    }

    // 엔딩 컷씬 발동 (10웨이브 클리어)
    triggerVictoryEnding() {
        this.state = GameState.VICTORY;
        soundEngine.stopBGM();
        soundEngine.victory();

        const bossHud = document.getElementById('boss-hud-container');
        if (bossHud) bossHud.classList.add('hidden');

        // 폭죽 / 축하 파티클 활성화
        this.triggerConfetti();

        const savedGold = this.gold;
        if (savedGold > 0) {
            this.metaBankGold += savedGold;
            localStorage.setItem('pigs_meta_bank_gold', this.metaBankGold);
            this.gold = 0;
        }
        const savedValEl = document.getElementById('ending-saved-gold-val');
        if (savedValEl) savedValEl.innerText = `${savedGold.toLocaleString()}G`;

        const modal = document.getElementById('ending-modal');
        modal.classList.add('active');

        const cfg = DIFFICULTY_CONFIG[this.currentDiff || 'easy'];
        document.getElementById('ending-diff-name').innerText = cfg.name;
        document.getElementById('ending-score-text').innerText = `최종 점수: ${this.score.toLocaleString()}점 / 저축된 골드: +${savedGold.toLocaleString()}G (총 금고: ${this.metaBankGold.toLocaleString()}G)`;

        const nextBtn = document.getElementById('next-diff-btn');
        const endlessBtn = document.getElementById('endless-btn');
        const rankRow = document.getElementById('ending-rank-row');
        const unlockNotice = document.getElementById('ending-unlock-notice');
        const title = document.getElementById('ending-modal-title');
        const desc = document.getElementById('ending-desc-text');

        if (this.currentDiff === 'easy') {
            this.unlockDifficulty('normal');
            title.innerText = '🎉 [쉬움 난이도 정복 성공!] 🎉';
            desc.innerHTML = '늑대 군단의 1차 공세를 훌륭하게 막아냈습니다!<br>더 빠르고 거센 공격이 몰아치는 <strong>[보통 난이도]</strong>가 해금되었습니다!';
            if (nextBtn) {
                nextBtn.classList.remove('hidden');
                nextBtn.innerText = '보통 난이도로 진격! ⚔️';
            }
            if (endlessBtn) endlessBtn.classList.add('hidden');
            if (rankRow) rankRow.classList.add('hidden');
            if (unlockNotice) unlockNotice.classList.add('hidden');
        } else if (this.currentDiff === 'normal') {
            this.unlockDifficulty('hard');
            title.innerText = '🎉 [보통 난이도 정복 성공!] 🎉';
            desc.innerHTML = '정예 늑대 군단마저 물리쳤습니다!<br>이제 늑대 제왕의 진정한 총본산, <strong>[어려움 난이도 (최종 결전)]</strong>에 도전하세요!';
            if (nextBtn) {
                nextBtn.classList.remove('hidden');
                nextBtn.innerText = '어려움 난이도 (최종 결전)! 🔥';
            }
            if (endlessBtn) endlessBtn.classList.add('hidden');
            if (rankRow) rankRow.classList.add('hidden');
            if (unlockNotice) unlockNotice.classList.add('hidden');
        } else if (this.currentDiff === 'hard') {
            this.unlockDifficulty('endless');
            title.innerText = '👑 대승리! 돼지 왕국의 전설적인 영웅! 👑';
            desc.innerHTML = '사악한 늑대 제왕과 전 대군단이 완전히 궤멸되었습니다!<br>아기돼지 삼형제의 철통 요새는 영원히 기억될 전설이 되었습니다!';
            if (nextBtn) nextBtn.classList.add('hidden');
            if (endlessBtn) endlessBtn.classList.remove('hidden');
            if (rankRow) rankRow.classList.remove('hidden');
            if (unlockNotice) unlockNotice.classList.remove('hidden');
        } else {
            // 무한 모드 클리어
            title.innerText = '🔥 무한 서바이벌 웨이브 클리어! 🔥';
            desc.innerHTML = '끝없는 늑대 군단을 상대로 압도적인 방어를 이어가고 있습니다!';
            if (nextBtn) nextBtn.classList.add('hidden');
            if (endlessBtn) {
                endlessBtn.classList.remove('hidden');
                endlessBtn.innerText = '다음 무한 웨이브 계속하기 🚀';
            }
        }
    }

    // 게임오버 발동
    triggerGameOver() {
        this.state = GameState.GAMEOVER;
        soundEngine.stopBGM();
        soundEngine.gameover();
        const bossHud = document.getElementById('boss-hud-container');
        if (bossHud) bossHud.classList.add('hidden');

        // 사망 시 이번 판의 인게임 골드는 초기화되지만, 영구 금고에 저축된 골드와 버프는 안전하게 보존됩니다.
        this.gold = 0;

        // 집, 스펙 업그레이드, 삼형제 승급 등 완전 초기화
        this.resetHouse();

        const bonusValEl = document.getElementById('gameover-bonus-val');
        if (bonusValEl) bonusValEl.innerText = this.metaGoldBonus;

        document.getElementById('gameover-modal').classList.add('active');
        document.getElementById('gameover-score-text').innerText = `도달 웨이브: ${this.wave} / 점수: ${this.score.toLocaleString()}`;

        this.renderMenuMetaUI();
        this.renderShopUI();
        this.updateHUD();
    }


    // 메인 렌더링 루프 (모듈화된 렌더러를 통한 고성능 분산 드로잉)
    draw() {
        ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

        // 1. 오프스크린 가속 동화 배경 드로잉 (98% 렌더링 시간 단축)
        this.bgRenderer.drawBackground();

        // 2. 가마솥 & 집 & 아기돼지 삼형제 드로잉
        this.houseRenderer.draw(ctx);

        // 3. 지면 바닥 장판 이펙트 드로잉 (화염 가시 장판, 지진파, 유황 지뢰 - 늑대 발밑)
        this.effectsRenderer.drawGroundLayer(ctx);

        // 4. 적 (늑대 군단) 드로잉 (공중 회전 비행 연출 지원)
        this.drawEnemies(ctx);

        // 5. 스킬 비주얼 이펙트 최상위 레이어 드로잉 (도토리, 황금태풍 짚단, 대회오리, 핵도토리, 대공요격포, 폭발, 번개 등 맨 위 표시)
        this.effectsRenderer.drawTopLayer(ctx);

        // 6. 마우스 에임 조준선 (Playing 상태일 때)
        if (this.state === GameState.PLAYING) {
            this.drawCrosshair();
        }
    }

    // 적 (늑대 군단) 드로잉 (불필요한 save/restore 제거 및 인덱스 루프 최적화)
    drawEnemies(ctx) {
        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            // 스폰 대기/퇴장 중인 화면 밖 적은 비싼 스프라이트 합성을 생략한다.
            if (e.x < -180 || e.x > V_WIDTH + 240 || e.y < -260 || e.y > V_HEIGHT + 180) continue;
            if (e.tornadoState && e.tornadoState.active) {
                ctx.save();
                // 늑대 중심점 기준 공중 360도 회전
                ctx.translate(e.x, e.y - e.h / 2);
                ctx.rotate(e.tornadoState.rot);
                ctx.translate(-e.x, -(e.y - e.h / 2));

                // 공중 회전 중 어지럼증 별 이펙트 💫
                if (this.performanceManager.quality > 0) {
                    const starPhase = performance.now() * 0.012;
                    ctx.fillStyle = '#fde047';
                    for (let s = 0; s < 3; s++) {
                        const sAng = starPhase + (s * Math.PI * 2 / 3);
                        const sx = e.x + Math.cos(sAng) * 26;
                        const sy = (e.y - e.h * 0.9) + Math.sin(sAng) * 12;
                        ctx.beginPath();
                        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                e.draw(ctx, this);
                ctx.restore();
            } else {
                e.draw(ctx, this);
            }
        }
    }

    // 하위 호환 델리게이트 메서드
    updateEnvParticles(dt) {
        if (this.bgRenderer) this.bgRenderer.updateEnvParticles(dt);
    }
    drawBackground() {
        if (this.bgRenderer) this.bgRenderer.drawBackground();
    }
    drawHouseAndPigs() {
        if (this.houseRenderer) this.houseRenderer.drawHouseAndPigs(ctx);
    }
    drawPigSpeeches() {
        if (this.houseRenderer) this.houseRenderer.drawPigSpeeches(ctx);
    }
    drawUltimateCinematic(ctx) {
        if (this.effectsRenderer) this.effectsRenderer.drawUltimateCinematic(ctx);
    }

    // 마우스 에임 조준선 드로잉
    drawCrosshair() {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(this.mouse.x, this.mouse.y, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.mouse.x - 20, this.mouse.y);
        ctx.lineTo(this.mouse.x + 20, this.mouse.y);
        ctx.moveTo(this.mouse.x, this.mouse.y - 20);
        ctx.lineTo(this.mouse.x, this.mouse.y + 20);
        ctx.stroke();

        ctx.restore();
    }
}

// -------------------------------------------------------------
// 메인 게임 인스턴스 생성 및 렌더링 루프 가동
// -------------------------------------------------------------
const game = new Game();
if (typeof window !== 'undefined') {
    window.game = game;
}

function gameLoop(timestamp) {
    try {
        const dt = Math.min(50, timestamp - game.lastTime);
        game.lastTime = timestamp;

        game.performanceManager.beginFrame(timestamp);
        game.effectsRenderer.update(dt);
        game.update(dt);
        if (game.performanceManager.shouldRender(timestamp)) game.draw();
    } catch (err) {
        console.error('GameLoop error safely caught:', err);
    } finally {
        requestAnimationFrame(gameLoop);
    }
}

requestAnimationFrame(gameLoop);
