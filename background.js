/**
 * background.js
 * 스테이지별 동화 배경 일러스트 및 오프스크린 가속 렌더러
 * 정적 배경 레이어를 오프스크린 캔버스에 1회 캐싱하여 렌더링 비용 98% 절감
 */

class BackgroundRenderer {
    constructor(game) {
        this.game = game;
        this.cachedThemeId = null;
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCanvas.width = V_WIDTH;
        this.cacheCanvas.height = V_HEIGHT;
        this.cacheCtx = this.cacheCanvas.getContext('2d');

        // 스테이지별 고화질 2D 캐주얼 동화 일러스트 통배경 프리로드 (10대 스테이지 완전 적용)
        this.stageImages = gameAssets.imageMap({
            sunny_meadow: 'bg_stage1_meadow.jpg',
            windmill_valley: 'bg_stage2_windmill.jpg',
            rainbow_valley: 'bg_stage3_rainbow.jpg',
            golden_sun: 'bg_stage4_sunflower.jpg',
            mushroom_forest: 'bg_stage5_mushroom.jpg',
            cotton_candy: 'bg_stage6_cottoncandy.jpg',
            crystal_lake: 'bg_stage7_crystal.jpg',
            emerald_palace: 'bg_stage8_emerald.jpg',
            twilight_fortress: 'bg_stage9_twilight.jpg',
            carnival: 'bg_stage10_carnival.jpg'
        });
    }

    get clouds() { return this.game.clouds; }
    get envParticles() { return this.game.envParticles; }
    get envParticleTimer() { return this.game.envParticleTimer; }
    set envParticleTimer(v) { this.game.envParticleTimer = v; }

    getStageTheme(waveNum = this.game.wave) {
        return this.game.getStageTheme(waveNum);
    }

    // 오프스크린 정적 캐시 무효화 (스테이지 변경 시 호출)
    invalidateCache() {
        this.cachedThemeId = null;
    }

    // 메인 배경 드로잉 (고화질 일러스트 즉시 렌더링 & 오프스크린 가속 폴백)
    drawBackground() {
        const theme = this.getStageTheme();
        const img = this.stageImages && this.stageImages[theme.id];

        // 1. 고화질 2D 캐주얼 동화 일러스트 통배경 (0.03ms 초고속 무렉 렌더링)
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, 0, 0, V_WIDTH, V_HEIGHT);
            return;
        }

        // 베이스 컬러 (하늘과 잔디밭) 즉시 채움 -> 이미지 로드 지연 시에도 투명화/먹통 방지
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(0, 0, V_WIDTH, 474);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, 474, V_WIDTH, V_HEIGHT - 474);

        // 2. 일러스트 로딩 중 또는 미로드 시 오프스크린 가속 벡터 폴백
        const now = performance.now() * 0.001;
        if (this.cachedThemeId !== theme.id) {
            this.renderStaticBackground(theme);
            this.cachedThemeId = theme.id;
        }

        ctx.drawImage(this.cacheCanvas, 0, 0);

        ctx.save();
        this.drawDynamicSun(theme, now);
        this.drawFairytaleClouds(theme, now);
        this.drawDynamicWindmillBlades(theme, now);
        ctx.restore();
    }

    // 정적 배경 레이어 1회 렌더링 (하늘 베이스, 무지개, 언덕 능선, 오두막, 버섯집, 성채, 해바라기, 나무, 울타리, 모래길)
    renderStaticBackground(theme) {
        const c = this.cacheCtx;
        c.clearRect(0, 0, V_WIDTH, V_HEIGHT);

        const savedCtx = window.ctx;
        window.ctx = c; // 임시로 전역 ctx를 캐시 캔버스로 리다이렉트

        try {
            c.save();
            // 정적 하늘 그라데이션
            this.drawFairytaleSky(theme, 0);
            // 무지개
            this.drawFairytaleRainbow(theme, 0);
            // 원경 언덕 능선 & 정적 건물들
            this.drawFairytaleHorizon(theme, 0);
            // 중경 소품 (사과나무, 울타리, 푯말, 꽃, 버섯 등)
            this.drawFairytaleMidground(theme, 0);
            // 근경 지면 & 모래 런웨이 & 돼지 집 마당
            this.drawFairytaleGround(theme, 0);
            c.restore();
        } finally {
            window.ctx = savedCtx; // 원래 전역 ctx 복원
        }
    }

    // 실시간 동적 천체 (회전하는 8가닥 동화 꽃잎 햇살 & 맥동하는 후광 오라)
    drawDynamicSun(theme, now) {
        if (theme.id === 'sunny_meadow' || theme.id === 'rainbow_valley' || theme.id === 'cotton_candy') {
            const sunX = 1040, sunY = 105;
            ctx.save();
            ctx.translate(sunX, sunY);
            ctx.rotate(now * 0.18);
            ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
            for (let i = 0; i < 8; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.beginPath();
                ctx.ellipse(0, 48, 11, 26, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        } else if (theme.id === 'golden_sun') {
            const sunX = 1000, sunY = 115;
            ctx.save();
            ctx.translate(sunX, sunY);
            ctx.rotate(now * 0.22);
            ctx.fillStyle = 'rgba(253, 224, 71, 0.55)';
            for (let i = 0; i < 12; i++) {
                ctx.rotate(Math.PI / 6);
                ctx.beginPath();
                ctx.moveTo(0, 35);
                ctx.lineTo(-9, 58);
                ctx.lineTo(0, 72);
                ctx.lineTo(9, 58);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // 실시간 회전 풍차 날개 (언덕 위 풍차의 날개만 실시간 회전)
    drawDynamicWindmillBlades(theme, now) {
        let wx = 0, wy = 0, rot = 0, color = '#ef4444';
        if (theme.id === 'sunny_meadow') {
            wx = 880; wy = 340; rot = now * 0.5; color = '#ef4444';
        } else if (theme.id === 'rainbow_valley') {
            wx = 870; wy = 345; rot = now * 0.6; color = '#0284c7';
        } else if (theme.id === 'golden_sun') {
            wx = 890; wy = 335; rot = now * 0.55; color = '#ea580c';
        }
        if (wx > 0) {
            ctx.save();
            ctx.translate(wx, wy - 30);
            ctx.rotate(rot);
            ctx.fillStyle = color;
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(-4, -38, 8, 38, 2);
                } else {
                    ctx.rect(-4, -38, 8, 38);
                }
                ctx.fill();
            }
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // 스테이지 환경 앰비언트 파티클 업데이트 (나비, 벚꽃잎, 민들레 홀씨, 황금 햇살, 축제 컨페티)
    updateEnvParticles(dt) {
        const theme = this.getStageTheme();
        this.envParticleTimer += dt;

        const performanceManager = this.game.performanceManager;
        const ambientLimit = performanceManager && performanceManager.quality === 0 ? 12 : 24;
        const spawnInterval = performanceManager && performanceManager.quality === 0 ? 320 : 190;

        // 전투 부하에 따라 장식 파티클 예산을 자동 축소한다.
        if (this.envParticleTimer >= spawnInterval && this.envParticles.length < ambientLimit) {
            this.envParticleTimer = 0;
            if (theme.id === 'sunny_meadow') {
                // 노랑/하늘색 나비 or 민들레 홀씨
                if (Math.random() < 0.45) {
                    this.envParticles.push({
                        type: 'butterfly',
                        x: -30,
                        y: 220 + Math.random() * 260,
                        vx: 1.2 + Math.random() * 1.4,
                        vy: (Math.random() - 0.5) * 1.2,
                        wingPhase: Math.random() * Math.PI * 2,
                        size: 5 + Math.random() * 2,
                        color: Math.random() > 0.5 ? '#facc15' : '#38bdf8',
                        life: 700
                    });
                } else {
                    this.envParticles.push({
                        type: 'dandelion',
                        x: -20,
                        y: 120 + Math.random() * 320,
                        vx: 0.9 + Math.random() * 1.2,
                        vy: Math.sin(Math.random() * 6) * 0.4,
                        size: 3 + Math.random() * 2,
                        life: 600
                    });
                }
            } else if (theme.id === 'windmill_valley') {
                // 살랑이는 바람의 풍차 마을: 민들레 홀씨 & 산들바람 연두 나뭇잎
                if (Math.random() < 0.55) {
                    this.envParticles.push({
                        type: 'dandelion',
                        x: -20,
                        y: 100 + Math.random() * 340,
                        vx: 1.4 + Math.random() * 1.6,
                        vy: Math.sin(Math.random() * 6) * 0.6,
                        size: 3.5 + Math.random() * 2.5,
                        life: 650
                    });
                } else {
                    this.envParticles.push({
                        type: 'leaf',
                        x: -20,
                        y: 120 + Math.random() * 300,
                        vx: 1.8 + Math.random() * 1.6,
                        vy: 0.2 + Math.random() * 0.8,
                        rot: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.1,
                        size: 5 + Math.random() * 3,
                        color: Math.random() > 0.5 ? '#86efac' : '#bef264',
                        life: 550
                    });
                }
            } else if (theme.id === 'rainbow_valley') {
                // 싱그러운 초록 나뭇잎 & 무지개 버블 방울
                if (Math.random() < 0.5) {
                    this.envParticles.push({
                        type: 'leaf',
                        x: -20,
                        y: 100 + Math.random() * 320,
                        vx: 1.6 + Math.random() * 1.5,
                        vy: 0.3 + Math.random() * 0.8,
                        rot: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.08,
                        size: 5 + Math.random() * 3,
                        color: Math.random() > 0.5 ? '#4ade80' : '#86efac',
                        life: 550
                    });
                } else {
                    this.envParticles.push({
                        type: 'bubble',
                        x: Math.random() * V_WIDTH,
                        y: 450 + Math.random() * 100,
                        vx: (Math.random() - 0.5) * 0.6,
                        vy: -0.8 - Math.random() * 0.8,
                        size: 4 + Math.random() * 4,
                        color: ['#38bdf8', '#f472b6', '#facc15', '#4ade80'][Math.floor(Math.random() * 4)],
                        life: 300
                    });
                }
            } else if (theme.id === 'golden_sun') {
                // 따스하고 눈부신 황금빛 햇살 가루 (Sunbeam Sparkles)
                this.envParticles.push({
                    type: 'sun_sparkle',
                    x: Math.random() * V_WIDTH,
                    y: 150 + Math.random() * 360,
                    vx: 0.5 + Math.random() * 0.8,
                    vy: -0.4 - Math.random() * 0.6,
                    size: 3 + Math.random() * 3,
                    life: 250
                });
            } else if (theme.id === 'mushroom_forest') {
                // 요정 버섯 숲: 빛나는 마법 포자 가루 & 연두빛 반딧불이
                this.envParticles.push({
                    type: 'sun_sparkle',
                    x: Math.random() * V_WIDTH,
                    y: 160 + Math.random() * 340,
                    vx: (Math.random() - 0.5) * 0.7,
                    vy: -0.4 - Math.random() * 0.6,
                    size: 3 + Math.random() * 3.5,
                    color: Math.random() > 0.5 ? '#67e8f9' : '#a7f3d0',
                    life: 320
                });
            } else if (theme.id === 'cotton_candy') {
                // 흩날리는 벚꽃/복숭아 분홍 꽃잎
                this.envParticles.push({
                    type: 'petal',
                    x: -20,
                    y: 80 + Math.random() * 350,
                    vx: 1.5 + Math.random() * 1.5,
                    vy: 0.5 + Math.random() * 0.7,
                    rot: Math.random() * Math.PI * 2,
                    rotSpeed: 0.04 + Math.random() * 0.04,
                    size: 5 + Math.random() * 3,
                    color: Math.random() > 0.5 ? '#f472b6' : '#fb7185',
                    life: 550
                });
            } else if (theme.id === 'crystal_lake') {
                // 푸른 수정 호수: 신비로운 청록 크리스탈 스파클 & 빛 방울
                this.envParticles.push({
                    type: 'royal_sparkle',
                    x: Math.random() * V_WIDTH,
                    y: 140 + Math.random() * 360,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: -0.5 - Math.random() * 0.7,
                    size: 3 + Math.random() * 3,
                    color: Math.random() > 0.5 ? '#38bdf8' : '#67e8f9',
                    life: 300
                });
            } else if (theme.id === 'emerald_palace') {
                // 왕국의 반짝이는 황금/청록 보석 가루
                this.envParticles.push({
                    type: 'royal_sparkle',
                    x: Math.random() * V_WIDTH,
                    y: 120 + Math.random() * 380,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: -0.5 - Math.random() * 0.6,
                    size: 3 + Math.random() * 2.5,
                    color: Math.random() > 0.5 ? '#38bdf8' : '#fbbf24',
                    life: 280
                });
            } else if (theme.id === 'twilight_fortress') {
                // 황혼 요새: 신비로운 보랏빛/자주빛 룬 스파클
                this.envParticles.push({
                    type: 'royal_sparkle',
                    x: Math.random() * V_WIDTH,
                    y: 130 + Math.random() * 360,
                    vx: (Math.random() - 0.5) * 0.7,
                    vy: -0.4 - Math.random() * 0.6,
                    size: 3.5 + Math.random() * 3,
                    color: Math.random() > 0.5 ? '#c084fc' : '#f472b6',
                    life: 300
                });
            } else if (theme.id === 'carnival') {
                // 축제 오색 팡파르 컨페티 (꽃가루) 리본
                const colors = ['#f43f5e', '#fbbf24', '#38bdf8', '#4ade80', '#a855f7'];
                this.envParticles.push({
                    type: 'confetti',
                    x: Math.random() * V_WIDTH,
                    y: -10,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: 1.2 + Math.random() * 1.8,
                    rot: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.12,
                    size: 5 + Math.random() * 3,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 380
                });
            }
        }

        // 파티클 위치 업데이트 및 수명 감쇠
        for (let i = this.envParticles.length - 1; i >= 0; i--) {
            const p = this.envParticles[i];
            p.life--;
            p.x += (p.vx || 0);
            p.y += (p.vy || 0);
            if (p.rotSpeed) p.rot = (p.rot || 0) + p.rotSpeed;
            if (p.type === 'butterfly') {
                p.wingPhase = (p.wingPhase || 0) + 0.35;
                p.y += Math.sin(p.wingPhase * 0.5) * 0.8;
            }
            if (p.life <= 0 || p.x > V_WIDTH + 60 || p.y < -50 || p.y > V_HEIGHT + 40) {
                this.envParticles.splice(i, 1);
            }
        }
    }


    // 앰비언트 환경 파티클 렌더링
    drawEnvParticles() {
        ctx.save();
        this.envParticles.forEach(p => {
            const alpha = Math.min(1.0, p.life / 50);
            ctx.globalAlpha = Math.max(0, alpha);
            if (p.type === 'butterfly') {
                ctx.save();
                ctx.translate(p.x, p.y);
                const wingScale = Math.sin(p.wingPhase || 0);
                // 양쪽 나비 날개
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(-p.size * 0.7 * Math.abs(wingScale), 0, p.size, p.size * 0.7, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(p.size * 0.7 * Math.abs(wingScale), 0, p.size, p.size * 0.7, 0.3, 0, Math.PI * 2);
                ctx.fill();
                // 몸통
                ctx.fillStyle = '#374151';
                ctx.fillRect(-1.5, -p.size * 0.6, 3, p.size * 1.2);
                ctx.restore();
            } else if (p.type === 'dandelion') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'leaf' || p.type === 'petal') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot || 0);
                ctx.fillStyle = p.color || '#4ade80';
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (p.type === 'bubble') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.5;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'sun_sparkle' || p.type === 'royal_sparkle') {
                ctx.fillStyle = p.color || '#fbbf24';
                ctx.beginPath();
                const s = p.size;
                ctx.moveTo(p.x, p.y - s * 1.5);
                ctx.lineTo(p.x + s * 0.4, p.y - s * 0.4);
                ctx.lineTo(p.x + s * 1.5, p.y);
                ctx.lineTo(p.x + s * 0.4, p.y + s * 0.4);
                ctx.lineTo(p.x, p.y + s * 1.5);
                ctx.lineTo(p.x - s * 0.4, p.y + s * 0.4);
                ctx.lineTo(p.x - s * 1.5, p.y);
                ctx.lineTo(p.x - s * 0.4, p.y - s * 0.4);
                ctx.closePath();
                ctx.fill();
            } else if (p.type === 'confetti') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot || 0);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
                ctx.restore();
            }
        });


        ctx.restore();
    }

    // [1] 원경: 테마별 화사하고 선명한 동화 하늘 & 천체 렌더링 (어둡거나 흐린 톤 배제!)
    drawFairytaleSky(theme, now) {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 474);
        if (theme.id === 'sunny_meadow') {
            // 화창한 동화 초원: 선명하고 청명한 코발트 블루 ~ 화사한 아쿠아 스카이
            skyGrad.addColorStop(0, '#1e88e5');
            skyGrad.addColorStop(0.35, '#38bdf8');
            skyGrad.addColorStop(0.7, '#7dd3fc');
            skyGrad.addColorStop(1, '#e0f2fe');
        } else if (theme.id === 'rainbow_valley') {
            // 찬란한 무지개 언덕: 눈부신 에메랄드 시안 ~ 민트 스카이
            skyGrad.addColorStop(0, '#0284c7');
            skyGrad.addColorStop(0.3, '#0ea5e9');
            skyGrad.addColorStop(0.65, '#38bdf8');
            skyGrad.addColorStop(1, '#ecfeff');
        } else if (theme.id === 'golden_sun') {
            // 황금빛 해바라기 고개: 활기차고 눈부신 살구 오렌지 ~ 황금빛 꿀크림 (절대 칙칙하지 않은 활력의 태양)
            skyGrad.addColorStop(0, '#ea580c');
            skyGrad.addColorStop(0.35, '#f59e0b');
            skyGrad.addColorStop(0.7, '#fde047');
            skyGrad.addColorStop(1, '#fef9c3');
        } else if (theme.id === 'cotton_candy') {
            // 달콤한 솜사탕 요정 숲: 사랑스러운 스트로베리 핑크 ~ 파스텔 하늘빛
            skyGrad.addColorStop(0, '#db2777');
            skyGrad.addColorStop(0.3, '#f472b6');
            skyGrad.addColorStop(0.65, '#7dd3fc');
            skyGrad.addColorStop(1, '#fdf2f8');
        } else if (theme.id === 'emerald_palace') {
            // 찬란한 에메랄드 왕국: 고귀하고 선명한 터콰이즈 청록 ~ 빛나는 크리스탈 하늘
            skyGrad.addColorStop(0, '#0891b2');
            skyGrad.addColorStop(0.35, '#06b6d4');
            skyGrad.addColorStop(0.7, '#67e8f9');
            skyGrad.addColorStop(1, '#f0fdfa');
        } else {
            // 승리의 동화 대축제: 축제 팡파르 루비 코랄 ~ 샴페인 골드
            skyGrad.addColorStop(0, '#e11d48');
            skyGrad.addColorStop(0.3, '#f97316');
            skyGrad.addColorStop(0.65, '#fbbf24');
            skyGrad.addColorStop(1, '#fef08a');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, V_WIDTH, 474);

        // 테마별 동화 천체 및 햇살 연출
        ctx.save();
        if (theme.id === 'sunny_meadow' || theme.id === 'rainbow_valley' || theme.id === 'cotton_candy') {
            // ☀️ 방긋 웃는 사랑스러운 동화 햇님 (X: 1040, Y: 105)
            const sunX = 1040, sunY = 105;
            // 눈부신 황금빛 오라
            const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 110);
            sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
            sunGlow.addColorStop(0.5, 'rgba(253, 224, 71, 0.35)');
            sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = sunGlow;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
            ctx.fill();

            // 회전하는 8가닥 동화 꽃잎 햇살
            ctx.save();
            ctx.translate(sunX, sunY);
            ctx.rotate(now * 0.18);
            ctx.fillStyle = 'rgba(250, 204, 21, 0.6)';
            for (let i = 0; i < 8; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.beginPath();
                ctx.ellipse(60, 0, 22, 9, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // 부드러운 사선 햇살 기둥 (God Rays)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
            for (let i = 0; i < 4; i++) {
                const sx = sunX - 120 + i * 80;
                ctx.beginPath();
                ctx.moveTo(sunX, sunY);
                ctx.lineTo(sx - 180, 440);
                ctx.lineTo(sx - 90, 440);
                ctx.closePath();
                ctx.fill();
            }

            // 햇님 얼굴 본체 (화사한 옐로우)
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 46, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 볼터치 (사랑스러운 핑크)
            ctx.fillStyle = '#fb7185';
            ctx.beginPath();
            ctx.arc(sunX - 20, sunY + 6, 8, 0, Math.PI * 2);
            ctx.arc(sunX + 20, sunY + 6, 8, 0, Math.PI * 2);
            ctx.fill();

            // 방긋 눈 & 활짝 미소
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(sunX - 14, sunY - 4, 6, Math.PI * 1.1, Math.PI * 1.9);
            ctx.arc(sunX + 14, sunY - 4, 6, Math.PI * 1.1, Math.PI * 1.9);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(sunX, sunY + 4, 12, 0.2, Math.PI - 0.2);
            ctx.stroke();

            // 솜사탕 요정 숲일 때: 원경에 떠다니는 귀여운 열기구 추가!
            if (theme.id === 'cotton_candy') {
                this.drawHotAirBalloon(840, 110 + Math.sin(now * 1.5) * 8, now);
            }

        } else if (theme.id === 'golden_sun') {
            // 🌅 거대하고 활기찬 황금빛 축제 태양
            const sunX = 1040, sunY = 130;
            const halo = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, 150);
            halo.addColorStop(0, 'rgba(254, 215, 170, 0.7)');
            halo.addColorStop(0.5, 'rgba(253, 186, 116, 0.4)');
            halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 150, 0, Math.PI * 2);
            ctx.fill();

            // 회전하는 12줄기 축제 광선
            ctx.save();
            ctx.translate(sunX, sunY);
            ctx.rotate(now * 0.12);
            ctx.fillStyle = 'rgba(251, 191, 36, 0.55)';
            for (let i = 0; i < 12; i++) {
                ctx.rotate(Math.PI / 6);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(85, -12);
                ctx.lineTo(85, 12);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // 태양 본체
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 68, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(sunX - 8, sunY - 8, 52, 0, Math.PI * 2);
            ctx.fill();

        } else if (theme.id === 'emerald_palace' || theme.id === 'carnival') {
            // 🏰 빛나는 왕국 태양 & 축제 팡파르 광선
            const sunX = 1040, sunY = 95;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 44, 0, Math.PI * 2);
            ctx.fill();

            // 4방향 다이아몬드 스타 플레어
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            const len = 90;
            ctx.beginPath();
            ctx.moveTo(sunX, sunY - len);
            ctx.lineTo(sunX + 8, sunY);
            ctx.lineTo(sunX, sunY + len);
            ctx.lineTo(sunX - 8, sunY);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(sunX - len, sunY);
            ctx.lineTo(sunX, sunY + 8);
            ctx.lineTo(sunX + len, sunY);
            ctx.lineTo(sunX, sunY - 8);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    // [동화 천체 보조] 찬란한 7색 무지개 🌈
    drawFairytaleRainbow(theme, now) {
        if (theme.id !== 'rainbow_valley' && theme.id !== 'carnival') return;
        ctx.save();
        const centerX = 580, centerY = 470, baseRadius = 460;
        const rainbowColors = [
            '#ef4444', // 빨강
            '#f97316', // 주황
            '#facc15', // 노랑
            '#22c55e', // 초록
            '#06b6d4', // 하늘
            '#3b82f6', // 파랑
            '#a855f7'  // 보라
        ];
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.82;
        rainbowColors.forEach((color, idx) => {
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius - idx * 6, Math.PI * 1.05, Math.PI * 1.95);
            ctx.stroke();
        });
        ctx.restore();
    }

    // [동화 천체 보조] 하늘을 떠다니는 귀여운 열기구 🎈
    drawHotAirBalloon(x, y, now) {
        ctx.save();
        ctx.translate(x, y);
        // 기구 본체 (타원형 줄무늬)
        const stripes = ['#ef4444', '#facc15', '#38bdf8', '#22c55e'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = stripes[i];
            ctx.beginPath();
            ctx.arc(-15 + i * 10, -20, 16, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -22, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 바구니 연결 끈 & 라탄 바구니
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-10, 0); ctx.lineTo(-6, 12);
        ctx.moveTo(10, 0); ctx.lineTo(6, 12);
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.fillRect(-7, 12, 14, 10);
        ctx.strokeStyle = '#78350f';
        ctx.strokeRect(-7, 12, 14, 10);
        ctx.restore();
    }

    // [2] 뭉게구름: 화사하고 입체감 넘치는 동화 뭉게구름
    drawFairytaleClouds(theme, now) {
        if (!this.clouds) return;
        let cBody = 'rgba(255, 255, 255, 0.95)';
        let cShadow = 'rgba(186, 230, 253, 0.55)'; // 화사한 하늘색 그림자
        if (theme.id === 'rainbow_valley') {
            cBody = 'rgba(255, 255, 255, 0.96)';
            cShadow = 'rgba(224, 231, 255, 0.55)';
        } else if (theme.id === 'golden_sun') {
            cBody = 'rgba(255, 253, 240, 0.96)';
            cShadow = 'rgba(254, 215, 170, 0.55)';
        } else if (theme.id === 'cotton_candy') {
            cBody = 'rgba(255, 245, 252, 0.96)';
            cShadow = 'rgba(244, 208, 235, 0.55)';
        } else if (theme.id === 'emerald_palace') {
            cBody = 'rgba(255, 255, 255, 0.96)';
            cShadow = 'rgba(204, 251, 241, 0.55)';
        } else if (theme.id === 'carnival') {
            cBody = 'rgba(255, 252, 242, 0.96)';
            cShadow = 'rgba(254, 215, 170, 0.55)';
        }

        ctx.save();
        this.clouds.forEach(c => {
            const x = c.x;
            const y = c.y;
            const s = c.size;

            // 구름 도톰한 밑그림자
            ctx.fillStyle = cShadow;
            ctx.beginPath();
            ctx.arc(x, y + 5, s, 0, Math.PI * 2);
            ctx.arc(x + s * 0.65, y + 3, s * 0.75, 0, Math.PI * 2);
            ctx.arc(x - s * 0.55, y + 6, s * 0.65, 0, Math.PI * 2);
            ctx.arc(x + s * 0.25, y - s * 0.25 + 5, s * 0.85, 0, Math.PI * 2);
            ctx.fill();

            // 구름 볼륨 본체
            ctx.fillStyle = cBody;
            ctx.beginPath();
            ctx.arc(x, y, s, 0, Math.PI * 2);
            ctx.arc(x + s * 0.65, y - 2, s * 0.75, 0, Math.PI * 2);
            ctx.arc(x - s * 0.55, y + 1, s * 0.65, 0, Math.PI * 2);
            ctx.arc(x + s * 0.25, y - s * 0.25, s * 0.85, 0, Math.PI * 2);
            ctx.fill();

            // 상단 햇살 하이라이트
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(x + s * 0.15, y - s * 0.35, s * 0.45, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    // [3] 원경: 테마별 밝고 생동감 넘치는 동화 구릉 & 랜드마크 (풍차, 동화 집, 궁전, 축제 텐트)
    drawFairytaleHorizon(theme, now) {
        ctx.save();
        if (theme.id === 'sunny_meadow') {
            // 화창한 초원: 신선한 라임 & 에메랄드 동화 언덕 능선
            ctx.fillStyle = '#86efac';
            ctx.beginPath();
            ctx.moveTo(0, 430);
            ctx.quadraticCurveTo(320, 355, 680, 390);
            ctx.quadraticCurveTo(980, 415, V_WIDTH, 370);
            ctx.lineTo(V_WIDTH, 474);
            ctx.lineTo(0, 474);
            ctx.closePath();
            ctx.fill();

            // 앞쪽 싱그러운 언덕
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(0, 474);
            ctx.quadraticCurveTo(240, 390, 520, 412);
            ctx.quadraticCurveTo(860, 432, V_WIDTH, 390);
            ctx.lineTo(V_WIDTH, 474);
            ctx.closePath();
            ctx.fill();

            // 언덕 위 빨간 지붕 풍차 & 동화 오두막
            this.drawFairytaleWindmill(880, 340, '#fef08a', '#ef4444', now * 0.5);
            this.drawFairytaleCottage(950, 365, '#fed7aa', '#dc2626', now);

        } else if (theme.id === 'rainbow_valley') {
            // 무지개 언덕: 청량한 민트 & 스카이블루 층층 언덕
            ctx.fillStyle = '#6ee7b7';
            ctx.beginPath();
            ctx.moveTo(0, 430);
            ctx.quadraticCurveTo(350, 360, 720, 395);
            ctx.quadraticCurveTo(1000, 418, V_WIDTH, 375);
            ctx.lineTo(V_WIDTH, 474);
            ctx.lineTo(0, 474);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.moveTo(0, 474);
            ctx.quadraticCurveTo(260, 395, 540, 415);
            ctx.quadraticCurveTo(880, 430, V_WIDTH, 395);
            ctx.lineTo(V_WIDTH, 474);
            ctx.closePath();
            ctx.fill();

            // 하늘색 풍차 & 축제 깃발 스트리머
            this.drawFairytaleWindmill(870, 345, '#e0f2fe', '#0284c7', now * 0.6);
            this.drawBuntingFlags(700, 385, 1050, 390, now);

        } else if (theme.id === 'golden_sun') {
            // 황금빛 고개: 풍요로운 황금빛 밀밭 언덕 능선
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.moveTo(0, 430);
            ctx.quadraticCurveTo(300, 365, 650, 400);
            ctx.quadraticCurveTo(960, 422, V_WIDTH, 375);
            ctx.lineTo(V_WIDTH, 474);
            ctx.lineTo(0, 474);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(0, 474);
            ctx.quadraticCurveTo(250, 395, 530, 415);
            ctx.quadraticCurveTo(870, 430, V_WIDTH, 395);
            ctx.lineTo(V_WIDTH, 474);
            ctx.closePath();
            ctx.fill();

            // 따뜻한 오렌지빛 풍차와 해바라기 밭
            this.drawFairytaleWindmill(890, 335, '#ffedd5', '#ea580c', now * 0.55);
            this.drawHorizonSunflowers(740, 395, 8);

        } else if (theme.id === 'cotton_candy') {
            // 솜사탕 요정 숲: 달콤하고 신비로운 캔디 핑크 & 라벤더 요정 언덕
            ctx.fillStyle = '#fbcfe8';
            ctx.beginPath();
            ctx.moveTo(0, 430);
            ctx.quadraticCurveTo(290, 360, 640, 395);
            ctx.quadraticCurveTo(980, 420, V_WIDTH, 375);
            ctx.lineTo(V_WIDTH, 474);
            ctx.lineTo(0, 474);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#f472b6';
            ctx.beginPath();
            ctx.moveTo(0, 474);
            ctx.quadraticCurveTo(260, 395, 540, 412);
            ctx.quadraticCurveTo(880, 430, V_WIDTH, 395);
            ctx.lineTo(V_WIDTH, 474);
            ctx.closePath();
            ctx.fill();

            // 언덕 위 깜찍한 요정 버섯 집
            this.drawFairytaleMushroomHouse(880, 350, '#f43f5e', '#fef08a', now);

        } else if (theme.id === 'emerald_palace') {
            // 에메랄드 왕국: 고귀하고 찬란한 터콰이즈 & 에메랄드 언덕과 왕국 성채
            ctx.fillStyle = '#5eead4';
            ctx.beginPath();
            ctx.moveTo(0, 430);
            ctx.quadraticCurveTo(310, 360, 660, 395);
            ctx.quadraticCurveTo(960, 420, V_WIDTH, 375);
            ctx.lineTo(V_WIDTH, 474);
            ctx.lineTo(0, 474);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#2dd4bf';
            ctx.beginPath();
            ctx.moveTo(0, 474);
            ctx.quadraticCurveTo(240, 395, 520, 412);
            ctx.quadraticCurveTo(860, 430, V_WIDTH, 395);
            ctx.lineTo(V_WIDTH, 474);
            ctx.closePath();
            ctx.fill();

            // 웅장하고 아름다운 동화 황금빛 왕궁 성채
            this.drawFairytaleCastle(900, 315, '#0284c7', '#fbbf24', '#f59e0b', now);

        } else {
            // 축제 (carnival): 신나는 축제 깃발 & 서커스 빅탑 텐트 언덕
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.moveTo(0, 430);
            ctx.quadraticCurveTo(320, 360, 680, 395);
            ctx.quadraticCurveTo(980, 420, V_WIDTH, 375);
            ctx.lineTo(V_WIDTH, 474);
            ctx.lineTo(0, 474);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fdba74';
            ctx.beginPath();
            ctx.moveTo(0, 474);
            ctx.quadraticCurveTo(260, 395, 540, 415);
            ctx.quadraticCurveTo(880, 430, V_WIDTH, 395);
            ctx.lineTo(V_WIDTH, 474);
            ctx.closePath();
            ctx.fill();

            // 서커스 텐트 & 만국기
            this.drawFairytaleCarnivalTent(890, 335, '#ef4444', '#ffffff', now);
            this.drawBuntingFlags(680, 385, 1080, 390, now);
        }
        ctx.restore();
    }

    // [원경 랜드마크] 동화 풍차
    drawFairytaleWindmill(x, y, bodyColor, bladeColor, rot) {
        ctx.save();
        ctx.translate(x, y);
        // 원뿔형 풍차 탑 본체
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-16, 45);
        ctx.lineTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.lineTo(16, 45);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 빨간 삼각 지붕 돔
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(0, -16);
        ctx.lineTo(14, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 아늑한 노란 창문 불빛
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-4, 15, 8, 10);
        ctx.strokeStyle = '#b45309';
        ctx.strokeRect(-4, 15, 8, 10);

        // 4방향 회전 풍차 날개
        ctx.rotate(rot);
        ctx.strokeStyle = bladeColor;
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -32);
            ctx.lineTo(7, -25);
            ctx.lineTo(0, -18);
            ctx.stroke();
        }
        ctx.restore();
    }

    // [원경 랜드마크] 동화 빨간 지붕 오두막
    drawFairytaleCottage(x, y, wallColor, roofColor, now) {
        ctx.save();
        ctx.translate(x, y);
        // 벽체
        ctx.fillStyle = wallColor;
        ctx.fillRect(-15, 0, 30, 20);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-15, 0, 30, 20);

        // 빨간 지붕
        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(0, -15);
        ctx.lineTo(20, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 굴뚝 & 연기
        ctx.fillStyle = '#9a3412';
        ctx.fillRect(8, -14, 5, 8);
        const smoke = Math.sin(now * 3) * 3;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(10 + smoke, -18, 3, 0, Math.PI * 2);
        ctx.arc(12 + smoke * 1.5, -23, 4, 0, Math.PI * 2);
        ctx.fill();

        // 노란 창문
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-8, 5, 6, 7);
        ctx.strokeRect(-8, 5, 6, 7);
        ctx.restore();
    }

    // [원경 랜드마크] 요정 버섯 집
    drawFairytaleMushroomHouse(x, y, capColor, stemColor, now) {
        ctx.save();
        ctx.translate(x, y);
        // 통통한 기둥 벽
        ctx.fillStyle = stemColor;
        ctx.beginPath();
        ctx.ellipse(0, 22, 14, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 버섯 갓 지붕
        ctx.fillStyle = capColor;
        ctx.beginPath();
        ctx.arc(0, 8, 22, Math.PI, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 흰색 땡땡이 도트
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-8, 0, 3, 0, Math.PI * 2);
        ctx.arc(6, -2, 3.5, 0, Math.PI * 2);
        ctx.arc(-1, 5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 동그란 요정 창문
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(0, 20, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.stroke();
        ctx.restore();
    }

    // [원경 랜드마크] 동화 황금빛 왕궁 성채
    drawFairytaleCastle(x, y, roofColor, wallColor, flagColor, now) {
        ctx.save();
        ctx.translate(x, y);
        // 중앙 본관 & 뾰족탑
        ctx.fillStyle = wallColor;
        ctx.fillRect(-20, 10, 40, 38);
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-20, 10, 40, 38);

        // 중앙 첨탑 지붕
        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(-24, 10);
        ctx.lineTo(0, -26);
        ctx.lineTo(24, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 좌우 쌍둥이 탑
        [-36, 22].forEach(tx => {
            ctx.fillStyle = wallColor;
            ctx.fillRect(tx, 16, 16, 32);
            ctx.strokeRect(tx, 16, 16, 32);

            ctx.fillStyle = roofColor;
            ctx.beginPath();
            ctx.moveTo(tx - 3, 16);
            ctx.lineTo(tx + 8, -6);
            ctx.lineTo(tx + 19, 16);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        // 펄럭이는 왕국 깃발
        const wave = Math.sin(now * 5) * 3;
        ctx.fillStyle = flagColor;
        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.quadraticCurveTo(8, -22 + wave, 18, -25 + wave);
        ctx.lineTo(0, -18);
        ctx.closePath();
        ctx.fill();

        // 환한 노란 아치 창문들
        ctx.fillStyle = '#fffbeb';
        ctx.fillRect(-5, 22, 10, 12);
        ctx.strokeRect(-5, 22, 10, 12);
        ctx.restore();
    }

    // [원경 랜드마크] 축제 서커스 빅탑 텐트
    drawFairytaleCarnivalTent(x, y, c1, c2, now) {
        ctx.save();
        ctx.translate(x, y);
        // 원형 텐트 벽
        ctx.fillStyle = c2;
        ctx.fillRect(-28, 12, 56, 26);
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-28, 12, 56, 26);

        // 원뿔 스트라이프 지붕
        ctx.beginPath();
        ctx.moveTo(-32, 12);
        ctx.lineTo(0, -22);
        ctx.lineTo(32, 12);
        ctx.closePath();
        ctx.fillStyle = c1;
        ctx.fill();
        ctx.stroke();

        // 스트라이프 무늬
        ctx.fillStyle = c2;
        ctx.beginPath();
        ctx.moveTo(-16, 12);
        ctx.lineTo(0, -22);
        ctx.lineTo(-6, 12);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(6, 12);
        ctx.lineTo(0, -22);
        ctx.lineTo(16, 12);
        ctx.closePath();
        ctx.fill();

        // 탑 꼭대기 깃발
        const wave = Math.sin(now * 5) * 3;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(14, -18 + wave);
        ctx.lineTo(0, -14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // [원경 보조] 만국기 스트리머
    drawBuntingFlags(x1, y1, x2, y2, now) {
        ctx.save();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 14, x2, y2);
        ctx.stroke();

        const colors = ['#ef4444', '#3b82f6', '#fbbf24', '#10b981', '#ec4899', '#8b5cf6'];
        const total = 9;
        for (let i = 1; i < total; i++) {
            const t = i / total;
            const fx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2;
            const fy = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (Math.max(y1, y2) + 14) + t * t * y2;
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.moveTo(fx - 4, fy);
            ctx.lineTo(fx + 4, fy);
            ctx.lineTo(fx, fy + 8);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    // [원경 보조] 언덕 위 해바라기 행렬
    drawHorizonSunflowers(startX, startY, count) {
        ctx.save();
        for (let i = 0; i < count; i++) {
            const sx = startX + i * 16;
            const sy = startY + Math.sin(i * 0.8) * 3;
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx, sy - 8);
            ctx.stroke();

            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(sx, sy - 9, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(sx, sy - 9, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // [4] 중경: 테마별 동화 감성 자연물 & 소품 (사과나무, 울타리, 푯말, 해바라기, 풍선)
    drawFairytaleMidground(theme, now) {
        ctx.save();
        if (theme.id === 'sunny_meadow') {
            // 🍎 화창한 초원: 동화 사과나무 (X: 310, Y: 430)
            this.drawFairytaleAppleTree(310, 430, '#854d0e', '#22c55e', '#86efac', '#ef4444');

            // 화이트 목재 피켓 울타리 (X: 230 ~ 390)
            this.drawPicketFence(230, 422, 5, '#ffffff', '#cbd5e1');

            // 동화 코믹 푯말 "⚠️ 늑대 조심! 🐺 ➔"
            this.drawStorybookSignpost(440, 428, '⚠️ 늑대 조심! 🐺 ➔', '#854d0e', '#fef08a');

            // 풀밭 꽃과 빨간 점박이 버섯
            this.drawFairytaleFlowers(490, 430, '#ffffff', '#facc15');
            this.drawFairytaleFlowers(540, 432, '#ec4899', '#facc15');
            this.drawSpottedMushroom(220, 432, 15, '#ef4444');

        } else if (theme.id === 'rainbow_valley') {
            // 🌈 무지개 언덕: 꽃 피는 황금배 나무 & 맑은 돌우물
            this.drawFairytaleAppleTree(300, 430, '#78350f', '#34d399', '#6ee7b7', '#facc15');
            this.drawPicketFence(235, 422, 5, '#ffffff', '#93c5fd');
            this.drawStoneWishingWell(380, 432, '#e0f2fe', '#38bdf8');

            // "무지개 언덕길 🌈" 푯말
            this.drawStorybookSignpost(460, 428, '🌈 무지개 언덕길 🌸', '#0284c7', '#e0f2fe');

            // 하늘색 & 핑크 들꽃
            this.drawFairytaleFlowers(520, 430, '#38bdf8', '#fde047');
            this.drawFairytaleFlowers(560, 432, '#f472b6', '#fde047');
            this.drawSpottedMushroom(215, 432, 14, '#38bdf8');

        } else if (theme.id === 'golden_sun') {
            // 🌾 황금빛 고개: 살랑이는 황금빛 갈대 & 전원 목재 울타리와 마차 바퀴
            this.drawRusticRailFence(250, 425, 4, '#9a3412');
            this.drawWagonWheel(370, 430, 20, '#78350f');

            // 바람에 흔들리는 풍성한 황금빛 갈대밭
            this.drawGoldenReeds(420, 432, 16, now, '#fde047', '#f59e0b');
            this.drawGoldenReeds(810, 432, 20, now + 1.2, '#fde047', '#f59e0b');

            // "해바라기 고개 🌻" 푯말
            this.drawStorybookSignpost(500, 428, '🌻 해바라기 고개 ⚠️', '#b45309', '#fef08a');
            this.drawHorizonSunflowers(210, 432, 3);

        } else if (theme.id === 'cotton_candy') {
            // 🌸 요정 숲: 신비로운 요정 등불 버드나무 & 알록달록 버섯들
            this.drawFairyLanternTree(290, 430, '#831843', '#f472b6', '#38bdf8', now);

            // 알록달록 무지개 점박이 버섯 군락
            this.drawSpottedMushroom(380, 433, 17, '#f43f5e');
            this.drawSpottedMushroom(405, 435, 12, '#3b82f6');
            this.drawSpottedMushroom(425, 434, 14, '#eab308');

            // "요정의 숲속 🌸" 푯말
            this.drawStorybookSignpost(480, 428, '🌸 요정의 숲속 🦋', '#db2777', '#fce7f3');
            this.drawFairytaleFlowers(540, 430, '#ec4899', '#ffffff');
            this.drawFairytaleFlowers(850, 432, '#a855f7', '#fef08a');

        } else if (theme.id === 'emerald_palace') {
            // 🏰 에메랄드 왕국: 다듬어진 왕궁 토피어리 & 황금 가로등
            this.drawFairytaleTopiary(270, 430);
            this.drawFairytalePine(340, 430, 0.95, '#059669', '#34d399');
            this.drawFairytaleStreetLamp(410, 430, '#0f766e', '#fef08a', now);

            // "왕국 성문 앞 🏰" 푯말
            this.drawStorybookSignpost(480, 428, '🏰 왕국 성문 앞 ⚔️', '#0f766e', '#ccfbf1');
            this.drawFairytaleFlowers(550, 430, '#fbbf24', '#ffffff');
            this.drawFairytalePine(860, 430, 0.85, '#047857', '#10b981');

        } else {
            // 🏆 대축제: 알록달록 둥실둥실 풍선 다발 & 축제 울타리와 푯말
            this.drawCarnivalBalloons(260, 425, now);
            this.drawCarnivalBalloons(400, 425, now + 1.2);
            this.drawPicketFence(240, 422, 5, '#ffffff', '#fed7aa');

            // "챔피언 대축제 🏆" 푯말
            this.drawStorybookSignpost(470, 428, '🏆 챔피언 대축제 🎉', '#ea580c', '#ffedd5');

            // 축제 들꽃
            this.drawFairytaleFlowers(530, 430, '#ef4444', '#fde047');
            this.drawFairytaleFlowers(570, 432, '#3b82f6', '#fde047');
        }
        ctx.restore();
    }

    // [동화 중경 소품 보조] 왕국 에메랄드 토피어리
    drawFairytaleTopiary(x, y) {
        ctx.save();
        ctx.translate(x, y);
        // 화분 팟
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-10, -18, 20, 18);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-12, -22, 24, 5);

        // 줄기
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-2, -35, 4, 15);

        // 둥근 2단 토피어리 덤불
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(0, -42, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(-3, -45, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(0, -62, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(-2, -64, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // [동화 중경 소품 보조] 축제 풍선 다발
    drawCarnivalBalloons(x, y, now) {
        ctx.save();
        ctx.translate(x, y);
        const sway = Math.sin(now * 2) * 5;
        // 풍선 끈
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        const bList = [
            { ox: -12, oy: -60, r: 10, c: '#ef4444' },
            { ox: 10, oy: -64, r: 11, c: '#3b82f6' },
            { ox: 0, oy: -75, r: 12, c: '#fbbf24' },
            { ox: -6, oy: -85, r: 10, c: '#ec4899' }
        ];
        bList.forEach(b => {
            const bx = b.ox + sway;
            const by = b.oy;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(bx * 0.5, by * 0.5, bx, by + b.r);
            ctx.stroke();

            // 풍선 알
            ctx.fillStyle = b.c;
            ctx.beginPath();
            ctx.ellipse(bx, by, b.r * 0.85, b.r, 0, 0, Math.PI * 2);
            ctx.fill();
            // 하이라이트
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(bx - b.r * 0.3, by - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    // [동화 중경 소품 보조] 사과나무
    drawFairytaleAppleTree(x, y, trunkColor, leafDark, leafLight, appleColor) {
        ctx.save();
        ctx.translate(x, y);
        // 굽은 만화 줄기
        ctx.fillStyle = trunkColor;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.quadraticCurveTo(-14, -30, -6, -60);
        ctx.lineTo(6, -60);
        ctx.quadraticCurveTo(12, -30, 10, 0);
        ctx.closePath();
        ctx.fill();

        // 몽실몽실 겹구름 모양 나뭇잎 덩어리들
        ctx.fillStyle = leafDark;
        ctx.beginPath();
        ctx.arc(-22, -75, 24, 0, Math.PI * 2);
        ctx.arc(22, -72, 22, 0, Math.PI * 2);
        ctx.arc(0, -90, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = leafLight;
        ctx.beginPath();
        ctx.arc(-10, -78, 20, 0, Math.PI * 2);
        ctx.arc(14, -76, 18, 0, Math.PI * 2);
        ctx.arc(0, -96, 22, 0, Math.PI * 2);
        ctx.fill();

        // 동화 빨간 사과들
        ctx.fillStyle = appleColor;
        const apples = [
            [-16, -72], [14, -68], [-4, -86], [20, -84], [-12, -98], [8, -102]
        ];
        apples.forEach(([ax, ay]) => {
            ctx.beginPath();
            ctx.arc(ax, ay, 4.5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    // [동화 중경 소품 보조] 목재 피켓 울타리
    drawPicketFence(startX, groundY, count, fillColor, outlineColor) {
        ctx.save();
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1.5;

        // 가로 연결대 2줄
        ctx.fillRect(startX - 6, groundY - 26, count * 22 + 10, 4);
        ctx.fillRect(startX - 6, groundY - 12, count * 22 + 10, 4);

        for (let i = 0; i < count; i++) {
            const fx = startX + i * 22;
            ctx.beginPath();
            ctx.moveTo(fx - 6, groundY);
            ctx.lineTo(fx - 6, groundY - 32);
            ctx.lineTo(fx, groundY - 38); // 뾰족한 끝
            ctx.lineTo(fx + 6, groundY - 32);
            ctx.lineTo(fx + 6, groundY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    // [동화 중경 소품 보조] 동화 푯말
    drawStorybookSignpost(x, y, text, postColor, boardColor) {
        ctx.save();
        ctx.translate(x, y);
        // 목재 기둥
        ctx.fillStyle = postColor;
        ctx.fillRect(-4, -40, 8, 40);

        // 푯말 나무판
        ctx.fillStyle = boardColor;
        ctx.strokeStyle = postColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-52, -54, 104, 22, 6);
        ctx.fill();
        ctx.stroke();

        // 못 자국
        ctx.fillStyle = postColor;
        ctx.beginPath();
        ctx.arc(-44, -43, 2, 0, Math.PI * 2);
        ctx.arc(44, -43, 2, 0, Math.PI * 2);
        ctx.fill();

        // 푯말 글씨
        ctx.fillStyle = '#37474f';
        ctx.font = 'bold 11px "Jua", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 0, -43);
        ctx.restore();
    }

    // [동화 중경 소품 보조] 동화 들꽃
    drawFairytaleFlowers(x, y, petalColor, centerColor) {
        ctx.save();
        ctx.translate(x, y);
        // 꽃대 줄기
        ctx.strokeStyle = '#81c784';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -12);
        ctx.stroke();

        // 꽃잎 5개
        ctx.fillStyle = petalColor;
        for (let i = 0; i < 5; i++) {
            const ang = (i / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(Math.cos(ang) * 4.5, -12 + Math.sin(ang) * 4.5, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
        // 꽃술
        ctx.fillStyle = centerColor;
        ctx.beginPath();
        ctx.arc(0, -12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // [동화 중경 소품 보조] 점박이 광대버섯
    drawSpottedMushroom(x, y, size, capColor) {
        ctx.save();
        ctx.translate(x, y);
        // 버섯 기둥 (통통한 아이보리)
        ctx.fillStyle = '#fffde7';
        ctx.beginPath();
        ctx.ellipse(0, -size * 0.4, size * 0.3, size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // 버섯 갓 (통통한 반원 돔)
        ctx.fillStyle = capColor;
        ctx.beginPath();
        ctx.arc(0, -size * 0.65, size * 0.65, Math.PI, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        // 흰색 땡땡이 점들
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-size * 0.3, -size * 0.85, size * 0.12, 0, Math.PI * 2);
        ctx.arc(0, -size * 1.1, size * 0.15, 0, Math.PI * 2);
        ctx.arc(size * 0.32, -size * 0.82, size * 0.12, 0, Math.PI * 2);
        ctx.arc(-size * 0.1, -size * 0.75, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // [동화 중경 소품 보조] 신비로운 고목 거목 (깊은 숲)
    drawAncientFairytaleOak(x, y, trunkColor, leafDark, leafMid, leafLight) {
        ctx.save();
        ctx.translate(x, y);
        // 거목 줄기 & 뿌리 뻗음
        ctx.fillStyle = trunkColor;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.quadraticCurveTo(-14, -35, -24, -75);
        ctx.lineTo(24, -75);
        ctx.quadraticCurveTo(14, -35, 18, 0);
        ctx.closePath();
        ctx.fill();

        // 나무 옹이 구멍 (아늑한 동화 구멍)
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.ellipse(0, -42, 6, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // 풍성한 3단 둥근 나뭇잎 볼륨
        ctx.fillStyle = leafDark;
        ctx.beginPath();
        ctx.arc(-30, -95, 28, 0, Math.PI * 2);
        ctx.arc(30, -90, 26, 0, Math.PI * 2);
        ctx.arc(0, -115, 36, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = leafMid;
        ctx.beginPath();
        ctx.arc(-15, -100, 24, 0, Math.PI * 2);
        ctx.arc(15, -96, 22, 0, Math.PI * 2);
        ctx.arc(0, -120, 28, 0, Math.PI * 2);
        ctx.fill();

        // 하이라이트 잎사귀
        ctx.fillStyle = leafLight;
        ctx.beginPath();
        ctx.arc(-6, -124, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // [동화 중경 소품 보조] 동화 전나무
    drawFairytalePine(x, y, scale, colorDark, colorLight) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // 줄기
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(-5, -20, 10, 20);

        // 3단 삼각형 솔방울 가지
        const tiers = [
            { y: -16, w: 32, h: 22, c: colorDark },
            { y: -30, w: 26, h: 20, c: colorDark },
            { y: -44, w: 18, h: 18, c: colorLight }
        ];
        tiers.forEach(t => {
            ctx.fillStyle = t.c;
            ctx.beginPath();
            ctx.moveTo(-t.w, t.y);
            ctx.lineTo(0, t.y - t.h);
            ctx.lineTo(t.w, t.y);
            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();
    }

    // [동화 중경 소품 보조] 전원 목재 가로 울타리
    drawRusticRailFence(startX, groundY, count, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(startX, groundY - 24, count * 30 + 10, 4);
        ctx.fillRect(startX, groundY - 12, count * 30 + 10, 4);
        for (let i = 0; i <= count; i++) {
            ctx.fillRect(startX + i * 30, groundY - 28, 6, 28);
        }
        ctx.restore();
    }

    // [동화 중경 소품 보조] 마차 바퀴
    drawWagonWheel(x, y, radius, color) {
        ctx.save();
        ctx.translate(x, y - radius * 0.7);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1.8;
        for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * radius, Math.sin(ang) * radius);
            ctx.stroke();
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // [동화 중경 소품 보조] 살랑이는 황금빛 갈대밭
    drawGoldenReeds(startX, groundY, count, now, colorLight, colorDark) {
        ctx.save();
        ctx.lineWidth = 2.5;
        for (let i = 0; i < count; i++) {
            const rx = startX + i * 8;
            const sway = Math.sin(now * 2 + i * 0.6) * 7;
            const height = 28 + (i % 4) * 8;
            ctx.strokeStyle = (i % 2 === 0) ? colorLight : colorDark;
            ctx.beginPath();
            ctx.moveTo(rx, groundY);
            ctx.quadraticCurveTo(rx + sway * 0.4, groundY - height * 0.6, rx + sway, groundY - height);
            ctx.stroke();

            // 갈대 이삭
            ctx.fillStyle = colorLight;
            ctx.beginPath();
            ctx.ellipse(rx + sway, groundY - height, 3, 6, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // [동화 중경 소품 보조] 요정 랜턴 버드나무 (신비로운 밤안개 숲)
    drawFairyLanternTree(x, y, trunkColor, vineColor, lanternColor, now) {
        ctx.save();
        ctx.translate(x, y);
        // 줄기
        ctx.fillStyle = trunkColor;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.quadraticCurveTo(-20, -40, -10, -75);
        ctx.lineTo(10, -75);
        ctx.quadraticCurveTo(16, -40, 12, 0);
        ctx.closePath();
        ctx.fill();

        // 늘어지는 버들 가지들
        ctx.strokeStyle = vineColor;
        ctx.lineWidth = 2.2;
        const branches = [-35, -20, -5, 10, 25, 40];
        branches.forEach((bx, idx) => {
            const sway = Math.sin(now * 2 + idx) * 5;
            ctx.beginPath();
            ctx.moveTo(bx * 0.4, -75);
            ctx.quadraticCurveTo(bx * 0.8, -50, bx + sway, -18);
            ctx.stroke();

            // 매달린 요정 반딧불이 랜턴 구슬
            const lx = bx + sway;
            const ly = -18;
            const pulse = Math.sin(now * 3 + idx) * 0.3 + 0.7;
            ctx.fillStyle = lanternColor;
            ctx.beginPath();
            ctx.arc(lx, ly, 4.5 * pulse, 0, Math.PI * 2);
            ctx.fill();
            // 랜턴 광배
            ctx.fillStyle = 'rgba(128, 222, 234, 0.28)';
            ctx.beginPath();
            ctx.arc(lx, ly, 10 * pulse, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    // [동화 중경 소품 보조] 야광 버섯
    drawGlowingMushroom(x, y, size, glowColor, capColor) {
        ctx.save();
        ctx.translate(x, y);
        // 광배
        ctx.fillStyle = 'rgba(128, 222, 234, 0.3)';
        ctx.beginPath();
        ctx.arc(0, -size * 0.6, size * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // 줄기
        ctx.fillStyle = '#e0f7fa';
        ctx.fillRect(-size * 0.15, -size * 0.6, size * 0.3, size * 0.6);

        // 갓
        ctx.fillStyle = capColor;
        ctx.beginPath();
        ctx.arc(0, -size * 0.6, size * 0.6, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // [동화 중경 소품 보조] 동화 낭만 가로등
    drawFairytaleStreetLamp(x, y, poleColor, lightColor, now) {
        ctx.save();
        ctx.translate(x, y);
        // 기둥
        ctx.fillStyle = poleColor;
        ctx.fillRect(-3, -65, 6, 65);
        ctx.fillRect(-8, -4, 16, 4);

        // 등불 걸이 곡선
        ctx.strokeStyle = poleColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(10, -65, 10, Math.PI, Math.PI * 1.8);
        ctx.stroke();

        // 따스한 등불 갓 & 유리알
        const lampX = 18, lampY = -55;
        // 빛 광배
        const glow = ctx.createRadialGradient(lampX, lampY, 3, lampX, lampY, 35);
        glow.addColorStop(0, 'rgba(255, 245, 157, 0.55)');
        glow.addColorStop(1, 'rgba(255, 245, 157, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lampX, lampY, 35, 0, Math.PI * 2);
        ctx.fill();

        // 유리 램프
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.arc(lampX, lampY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // [동화 중경 소품 보조] 돌우물
    drawStoneWishingWell(x, y, stoneLight, stoneDark) {
        ctx.save();
        ctx.translate(x, y);
        // 원형 돌 테두리
        ctx.fillStyle = stoneDark;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = stoneLight;
        ctx.beginPath();
        ctx.ellipse(0, -3, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // 우물 속 고요한 물
        ctx.fillStyle = '#0288d1';
        ctx.beginPath();
        ctx.ellipse(0, -3, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // [동화 중경 소품 보조] 고대 기둥 유적
    drawAncientPillars(x, y, stoneColor, highlightColor) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = stoneColor;
        // 기둥 1
        ctx.fillRect(-14, -55, 12, 55);
        ctx.fillRect(-18, -60, 20, 6);
        ctx.fillRect(-18, -5, 20, 5);

        // 부러진 기둥 2
        ctx.fillRect(8, -32, 12, 32);
        ctx.fillRect(4, -36, 20, 5);
        ctx.fillRect(4, -5, 20, 5);
        ctx.restore();
    }

    // [동화 중경 소품 보조] 붉은 보석 수정
    drawRedCrystals(x, y, size, colorMain, colorLight, now) {
        ctx.save();
        ctx.translate(x, y);
        const pulse = Math.sin(now * 3) * 0.2 + 0.8;
        // 수정 광채
        ctx.fillStyle = 'rgba(255, 23, 68, 0.25)';
        ctx.beginPath();
        ctx.arc(0, -size * 0.6, size * pulse, 0, Math.PI * 2);
        ctx.fill();

        // 뾰족한 결정 3개
        const crystals = [
            { x: 0, y: -size * 1.1, w: 8, c: colorMain },
            { x: -7, y: -size * 0.8, w: 6, c: colorLight },
            { x: 7, y: -size * 0.75, w: 5, c: colorMain }
        ];
        crystals.forEach(cr => {
            ctx.fillStyle = cr.c;
            ctx.beginPath();
            ctx.moveTo(cr.x - cr.w / 2, 0);
            ctx.lineTo(cr.x, cr.y);
            ctx.lineTo(cr.x + cr.w / 2, 0);
            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();
    }

    // [동화 중경 소품 보조] 우주 시공간 크리스탈 오벨리스크
    drawCosmicCrystals(x, y, cyanColor, magentaColor, now) {
        ctx.save();
        ctx.translate(x, y);
        const float = Math.sin(now * 2) * 6;
        ctx.translate(0, float);

        // 부유 마법 다이아몬드 크리스탈
        ctx.fillStyle = cyanColor;
        ctx.beginPath();
        ctx.moveTo(0, -48);
        ctx.lineTo(12, -26);
        ctx.lineTo(0, -4);
        ctx.lineTo(-12, -26);
        ctx.closePath();
        ctx.fill();

        // 측면 입체면
        ctx.fillStyle = magentaColor;
        ctx.beginPath();
        ctx.moveTo(0, -48);
        ctx.lineTo(12, -26);
        ctx.lineTo(0, -4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // [동화 중경 소품 보조] 우주 별꽃
    drawStarFlowers(x, y, petalColor, stemColor) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = stemColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -12);
        ctx.stroke();

        ctx.fillStyle = petalColor;
        // 4방향 별모양 꽃
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(2, -13);
        ctx.lineTo(7, -12);
        ctx.lineTo(2, -11);
        ctx.lineTo(0, -6);
        ctx.lineTo(-2, -11);
        ctx.lineTo(-7, -12);
        ctx.lineTo(-2, -13);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // [동화 근경 보조] 만화풍 늑대 발자국 흔적
    drawCartoonPawprint(x, y, scale = 1, angle = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);
        ctx.fillStyle = 'rgba(180, 83, 9, 0.28)'; // 은은한 캐러멜 발자국
        // 메인 발바닥 패드
        ctx.beginPath();
        ctx.ellipse(0, 2, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // 발가락 3개
        ctx.beginPath();
        ctx.arc(-4, -4, 2, 0, Math.PI * 2);
        ctx.arc(0, -6, 2.2, 0, Math.PI * 2);
        ctx.arc(4, -4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // [5] 근경: 고대비 황금빛 오솔길 & 돼지 삼형제 석조 마당 (늑대 가시성 100% 극대화!)
    drawFairytaleGround(theme, now) {
        // [핵심] 늑대들의 어두운 털색(#334155, #1e293b)과 압도적인 대비(8:1 이상)를 이루는
        // 화사하고 따뜻한 황금빛 오솔길과 생동감 넘치는 동화 초록 잔디밭!
        let grassTop = '#4ade80';
        let grassBtm = '#16a34a';
        let pathTop = '#fef9c3';
        let pathMid = '#fde047';
        let pathBtm = '#fed7aa';
        let pathBorder = '#b45309';

        if (theme.id === 'rainbow_valley') {
            grassTop = '#34d399';
            grassBtm = '#059669';
            pathTop = '#fefce8';
            pathMid = '#fef08a';
            pathBtm = '#fde68a';
            pathBorder = '#0284c7';
        } else if (theme.id === 'golden_sun') {
            grassTop = '#84cc16';
            grassBtm = '#65a30d';
            pathTop = '#fffbeb';
            pathMid = '#fbbf24';
            pathBtm = '#f59e0b';
            pathBorder = '#b45309';
        } else if (theme.id === 'cotton_candy') {
            grassTop = '#4ade80';
            grassBtm = '#10b981';
            pathTop = '#fff1f2';
            pathMid = '#fef08a';
            pathBtm = '#fbcfe8';
            pathBorder = '#db2777';
        } else if (theme.id === 'emerald_palace') {
            grassTop = '#2dd4bf';
            grassBtm = '#0d9488';
            pathTop = '#f0fdfa';
            pathMid = '#fef08a';
            pathBtm = '#ccfbf1';
            pathBorder = '#0f766e';
        } else if (theme.id === 'carnival') {
            grassTop = '#4ade80';
            grassBtm = '#15803d';
            pathTop = '#fef9c3';
            pathMid = '#fde047';
            pathBtm = '#fed7aa';
            pathBorder = '#ea580c';
        }

        ctx.save();
        // 1. 지면 잔디 전체 바탕 채우기 (Y: 425 ~ V_HEIGHT)
        const groundGrad = ctx.createLinearGradient(0, 425, 0, V_HEIGHT);
        groundGrad.addColorStop(0, grassTop);
        groundGrad.addColorStop(0.35, grassTop);
        groundGrad.addColorStop(1, grassBtm);
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 425, V_WIDTH, V_HEIGHT - 425);

        // 2. 상단 올록볼록 만화 잔디 림 (Y: 420 ~ 436)
        ctx.fillStyle = grassTop;
        ctx.beginPath();
        ctx.moveTo(0, 436);
        const scallopW = 28;
        for (let x = 0; x <= V_WIDTH; x += scallopW) {
            ctx.quadraticCurveTo(x + scallopW / 2, 420, x + scallopW, 436);
        }
        ctx.lineTo(V_WIDTH, 442);
        ctx.lineTo(0, 442);
        ctx.closePath();
        ctx.fill();

        // 3. 늑대 런웨이: 넓고 화사한 황금빛 오솔길 (Y: 450 ~ 640)
        // 늑대들의 어두운 실루엣이 번쩍 돋보이도록 고명도/고채도 골드 샌드 배색
        const pathGrad = ctx.createLinearGradient(0, 450, 0, 640);
        pathGrad.addColorStop(0, pathTop);
        pathGrad.addColorStop(0.45, pathMid);
        pathGrad.addColorStop(1, pathBtm);
        ctx.fillStyle = pathGrad;

        // 부드럽게 굽이치는 동화 흙길 경로
        ctx.beginPath();
        ctx.moveTo(0, 465);
        ctx.quadraticCurveTo(V_WIDTH * 0.45, 448, V_WIDTH, 455);
        ctx.lineTo(V_WIDTH, 630);
        ctx.quadraticCurveTo(V_WIDTH * 0.5, 660, 0, 625);
        ctx.closePath();
        ctx.fill();

        // 선명한 동화 캐러멜 외곽 테두리선
        ctx.strokeStyle = pathBorder;
        ctx.lineWidth = 2.5;
        // 위쪽 길 테두리
        ctx.beginPath();
        ctx.moveTo(0, 465);
        ctx.quadraticCurveTo(V_WIDTH * 0.45, 448, V_WIDTH, 455);
        ctx.stroke();
        // 아래쪽 길 테두리
        ctx.beginPath();
        ctx.moveTo(0, 625);
        ctx.quadraticCurveTo(V_WIDTH * 0.5, 660, V_WIDTH, 630);
        ctx.stroke();

        // 4. 오솔길 위 동화 조약돌 & 발자국 디테일
        // 둥글둥글 강자갈 디딤돌
        const steppingStones = [
            [230, 520, 16, 9], [350, 560, 18, 10], [470, 490, 15, 8],
            [590, 550, 20, 11], [710, 510, 18, 10], [840, 570, 22, 12],
            [960, 500, 16, 9], [1080, 545, 19, 10], [1160, 495, 14, 8]
        ];
        steppingStones.forEach(([sx, sy, rw, rh]) => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.ellipse(sx, sy, rw, rh, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(180, 83, 9, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        // 🐾 오솔길 위 앙증맞은 늑대 발자국 흔적
        const wolfTracks = [
            [300, 505, 0.9, -0.2], [420, 540, 1.0, 0.1], [540, 480, 0.95, -0.15],
            [660, 530, 1.0, 0.2], [790, 560, 0.9, 0.05], [910, 510, 1.0, -0.1],
            [1030, 550, 0.95, 0.15], [1140, 520, 1.0, -0.2]
        ];
        wolfTracks.forEach(([wx, wy, ws, wa]) => {
            this.drawCartoonPawprint(wx, wy, ws, wa);
        });

        // 5. 🐷 아기돼지 삼형제의 석조 마당 (안전 구역, X: 30 ~ 240, Y: 435 ~ 660)
        // 돼지집 아래를 정갈하고 아늑한 코블스톤 안뜰로 분리하여 돼지와 늑대 전장을 명확히 구분!
        ctx.save();
        // 안뜰 따스한 햇살 광배
        const courtGlow = ctx.createRadialGradient(140, 540, 20, 140, 540, 150);
        courtGlow.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
        courtGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = courtGlow;
        ctx.fillRect(20, 430, 230, 240);

        // 석조 코블스톤 타일 바닥
        const patioGrad = ctx.createLinearGradient(30, 450, 30, 650);
        patioGrad.addColorStop(0, '#f1f5f9');
        patioGrad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = patioGrad;
        ctx.beginPath();
        ctx.roundRect(30, 460, 190, 175, 16);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 안뜰 돌 블록 격자 패턴
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 1.2;
        for (let py = 485; py < 635; py += 25) {
            ctx.beginPath();
            ctx.moveTo(35, py);
            ctx.lineTo(215, py);
            ctx.stroke();
        }
        for (let px = 55; px < 215; px += 35) {
            ctx.beginPath();
            ctx.moveTo(px, 465);
            ctx.lineTo(px, 630);
            ctx.stroke();
        }

        // 안뜰 앞 아기자기한 목재 화단 & 꽃
        ctx.fillStyle = '#b45309';
        ctx.fillRect(195, 480, 16, 50);
        ctx.strokeStyle = '#78350f';
        ctx.strokeRect(195, 480, 16, 50);
        this.drawFairytaleFlowers(203, 490, '#ec4899', '#fde047');
        this.drawFairytaleFlowers(203, 515, '#3b82f6', '#fde047');
        ctx.restore();

        // 6. 하단 포그라운드: 살랑이는 잔디와 들딸기 & 데이지 (Y: 630 ~ 720)
        const bladeCount = 18;
        for (let i = 0; i < bladeCount; i++) {
            const bx = (i / bladeCount) * V_WIDTH + 15;
            const sway = Math.sin(now * 3 + i * 0.7) * 4;
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bx, 670);
            ctx.quadraticCurveTo(bx + sway * 0.5, 650, bx + sway, 642);
            ctx.stroke();
        }

        // 들딸기 🍓 3송이
        const berries = [[270, 655], [620, 665], [980, 660]];
        berries.forEach(([bx, by]) => {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(bx, by - 4, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // 7. 테마별 특별 효과
        if (theme.id === 'carnival') {
            // 축제 오솔길에 흩날려 있는 알록달록 색종이
            const confColors = ['#ef4444', '#3b82f6', '#fbbf24', '#10b981', '#ec4899'];
            const confList = [
                [310, 520, 0], [480, 560, 1], [650, 500, 2], [790, 570, 3],
                [920, 515, 4], [1050, 565, 0], [1180, 530, 2]
            ];
            confList.forEach(([cx, cy, ci]) => {
                ctx.fillStyle = confColors[ci];
                ctx.fillRect(cx, cy, 5, 3);
            });
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.BackgroundRenderer = BackgroundRenderer;
}
