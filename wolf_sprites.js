/**
 * =========================================================================================
 * 🐺 wolf_sprites.js - 늑대 군단 7종 Sprite Sheet 기반 프레임 애니메이션 엔진
 * =========================================================================================
 * [지원 늑대 목록 및 액션 명세]
 * 1. 일반 늑대 (normal): run(8프레임), bite(6프레임), hurt(4프레임)
 * 2. 스케이트 늑대 (skater): skate(8프레임), jump_attack(6프레임), hurt(4프레임)
 * 3. 할머니 늑대 (granny): walk(8프레임), reveal_bite(8프레임), hurt(4프레임)
 * 4. 풍선 폭격수 늑대 (balloon): float(6프레임), drop_bomb(6프레임), pop_fall(6프레임)
 * 5. 바람 늑대 (blower): walk(6프레임), inhale(6프레임), blow_tornado(8프레임)
 * 6. 중간보스 돌격대장 (midboss): march(8프레임), charge(6프레임), axe_throw(8프레임), hurt(4프레임)
 * 7. 빅 배드 울프 제왕 (boss): emperor_walk(8프레임), laser_roar(8프레임), claw_slash(6프레임), boulder_throw(8프레임)
 * =========================================================================================
 */

(function (window) {
    'use strict';

    const FRAME_SIZE = 192; // 대폭 확대된 고화질 표준 프레임 해상도
    const BOSS_FRAME_SIZE = 256; // 웅장한 보스급 대형 프레임 해상도

    // 늑대 군단 메타데이터 및 애니메이션 액션 정의
    const WOLF_CONFIGS = {
        normal: {
            name: '일반 늑대',
            frameW: FRAME_SIZE,
            frameH: FRAME_SIZE,
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 3 * FRAME_SIZE,
            actions: {
                run: { row: 0, frameCount: 8, fps: 13, loop: true },
                bite: { row: 1, frameCount: 6, fps: 12, loop: false },
                hurt: { row: 2, frameCount: 4, fps: 10, loop: false }
            }
        },
        skater: {
            name: '스케이트 늑대',
            frameW: FRAME_SIZE,
            frameH: FRAME_SIZE,
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 3 * FRAME_SIZE,
            actions: {
                skate: { row: 0, frameCount: 8, fps: 14, loop: true },
                jump_attack: { row: 1, frameCount: 6, fps: 12, loop: false },
                hurt: { row: 2, frameCount: 4, fps: 10, loop: false }
            }
        },
        granny: {
            name: '할머니 늑대',
            frameW: FRAME_SIZE,
            frameH: FRAME_SIZE,
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 4 * FRAME_SIZE,
            actions: {
                walk: { row: 0, frameCount: 8, fps: 8, loop: true },
                scary_rush: { row: 1, frameCount: 8, fps: 13, loop: true },
                scary_bite: { row: 2, frameCount: 6, fps: 12, loop: false },
                reveal_bite: { row: 2, frameCount: 6, fps: 12, loop: false },
                hurt: { row: 3, frameCount: 4, fps: 10, loop: false }
            }
        },
        balloon: {
            name: '풍선 폭격수 늑대',
            frameW: FRAME_SIZE,
            frameH: FRAME_SIZE,
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 5 * FRAME_SIZE,
            actions: {
                float: { row: 0, frameCount: 6, fps: 7, loop: true },
                drop_bomb: { row: 1, frameCount: 6, fps: 10, loop: false },
                pop_fall: { row: 2, frameCount: 6, fps: 12, loop: false },
                ground_run: { row: 3, frameCount: 8, fps: 11, loop: true },
                ground_attack: { row: 4, frameCount: 6, fps: 12, loop: false },
                hurt: { row: 2, frameCount: 4, fps: 10, loop: false }
            }
        },
        blower: {
            name: '바람 늑대',
            frameW: FRAME_SIZE,
            frameH: FRAME_SIZE,
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 3 * FRAME_SIZE,
            actions: {
                walk: { row: 0, frameCount: 6, fps: 7, loop: true },
                inhale: { row: 1, frameCount: 6, fps: 8, loop: true },
                blow_tornado: { row: 2, frameCount: 8, fps: 14, loop: true }
            }
        },
        midboss: {
            name: '늑대 선봉 돌격대장',
            frameW: BOSS_FRAME_SIZE,
            frameH: BOSS_FRAME_SIZE,
            sheetWidth: 8 * BOSS_FRAME_SIZE,
            sheetHeight: 4 * BOSS_FRAME_SIZE,
            actions: {
                march: { row: 0, frameCount: 8, fps: 8, loop: true },
                charge: { row: 1, frameCount: 6, fps: 15, loop: true },
                axe_throw: { row: 2, frameCount: 8, fps: 12, loop: false },
                hurt: { row: 3, frameCount: 4, fps: 10, loop: false }
            }
        },
        boss: {
            name: '빅 배드 울프 제왕',
            frameW: BOSS_FRAME_SIZE,
            frameH: BOSS_FRAME_SIZE,
            sheetWidth: 8 * BOSS_FRAME_SIZE,
            sheetHeight: 4 * BOSS_FRAME_SIZE,
            actions: {
                emperor_walk: { row: 0, frameCount: 8, fps: 7, loop: true },
                laser_roar: { row: 1, frameCount: 8, fps: 12, loop: false },
                claw_slash: { row: 2, frameCount: 6, fps: 12, loop: false },
                boulder_throw: { row: 3, frameCount: 8, fps: 10, loop: false }
            }
        },
        shield: {
            name: '양철 방패 늑대',
            frameW: FRAME_SIZE,
            frameH: FRAME_SIZE,
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 3 * FRAME_SIZE,
            actions: {
                run: { row: 0, frameCount: 8, fps: 13, loop: true },
                bite: { row: 1, frameCount: 6, fps: 12, loop: false },
                hurt: { row: 2, frameCount: 4, fps: 10, loop: false }
            }
        },
        shield_broken: {
            name: '방패 파괴 늑대',
            frameW: FRAME_SIZE,
            frameH: FRAME_SIZE,
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 2 * FRAME_SIZE,
            actions: {
                run: { row: 0, frameCount: 8, fps: 16, loop: true },
                hurt: { row: 1, frameCount: 4, fps: 10, loop: false }
            }
        },
        umbrella: {
            name: '우산공수 늑대',
            frameW: FRAME_SIZE,
            frameH: FRAME_SIZE,
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 3 * FRAME_SIZE,
            actions: {
                run: { row: 0, frameCount: 8, fps: 13, loop: true },
                bite: { row: 1, frameCount: 6, fps: 12, loop: false },
                hurt: { row: 2, frameCount: 4, fps: 10, loop: false }
            }
        },
        miniwolf: {
            name: '미니태엽 로봇 늑대',
            frameW: FRAME_SIZE,
            frameH: FRAME_SIZE,
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 3 * FRAME_SIZE,
            actions: {
                run: { row: 0, frameCount: 8, fps: 13, loop: true },
                bite: { row: 1, frameCount: 6, fps: 12, loop: false },
                hurt: { row: 2, frameCount: 4, fps: 10, loop: false }
            }
        },
        miniwolf_para: {
            name: '미니태엽 낙하산 늑대',
            frameW: FRAME_SIZE,
            frameH: FRAME_SIZE,
            sheetWidth: 6 * FRAME_SIZE,
            sheetHeight: 1 * FRAME_SIZE,
            actions: {
                fall: { row: 0, frameCount: 6, fps: 7, loop: true }
            }
        },

    };

    /**
     * 🎨 WolfSpriteSheetGenerator: 각 늑대별 오프스크린 캔버스에 스프라이트 시트 사전 베이킹
     */
    class WolfSpriteSheetGenerator {
        constructor() {
            this.canvases = {};
            this.contexts = {};
            this.baseImages = {};
            this.isReady = {};

            const types = ['normal', 'skater', 'granny', 'balloon', 'blower', 'midboss', 'boss', 'balloon_ground', 'granny_revealed', 'shield', 'shield_attack', 'shield_broken', 'umbrella', 'miniwolf', 'miniwolf_para'];
            types.forEach(t => {
                this.baseImages[t] = null;
                this.isReady[t] = false;
            });

            // 초기 생성 즉시 모든 늑대 캔버스를 벡터 폴백으로 1회 사전 베이킹 -> 네트워크 로딩 중에도 투명화/증발 100% 방지!
            const mainWolfTypes = ['normal', 'skater', 'granny', 'balloon', 'blower', 'midboss', 'boss', 'shield', 'shield_broken', 'umbrella', 'miniwolf', 'miniwolf_para'];
            mainWolfTypes.forEach(t => {
                this.bakeSheet(t);
                this.isReady[t] = true;
            });

            this.loadBaseImages();
        }

        loadBaseImages() {
            const types = ['normal', 'skater', 'granny', 'balloon', 'blower', 'midboss', 'boss', 'balloon_ground', 'granny_revealed', 'shield', 'shield_attack', 'shield_broken', 'umbrella', 'miniwolf', 'miniwolf_para'];
            types.forEach(t => {
                const src = `assets/wolf_${t}.png`;
                const img = window.gameAssets ? window.gameAssets.image(src) : new Image();
                const onLoad = () => {
                    this.baseImages[t] = img;
                    if (t === 'balloon_ground') {
                        this.bakeSheet('balloon');
                    } else if (t === 'granny_revealed') {
                        this.bakeSheet('granny');
                    } else if (t === 'shield_attack') {
                        this.bakeSheet('shield');
                    } else {
                        this.bakeSheet(t);
                    }
                };
                const onError = () => {
                    // 이미지 미존재 시에도 고화질 벡터 기반 즉시 베이킹
                    if (t === 'balloon_ground') {
                        this.bakeSheet('balloon');
                    } else if (t === 'granny_revealed') {
                        this.bakeSheet('granny');
                    } else if (t === 'shield_attack') {
                        this.bakeSheet('shield');
                    } else {
                        this.bakeSheet(t);
                    }
                };
                if (!img.src) img.src = src;
                if (img.complete) {
                    if (img.naturalWidth > 0) onLoad();
                    else onError();
                } else {
                    img.addEventListener('load', onLoad, { once: true });
                    img.addEventListener('error', onError, { once: true });
                }
            });
        }

        getCanvas(wolfType) {
            if (!this.canvases[wolfType]) {
                const cfg = WOLF_CONFIGS[wolfType];
                const c = document.createElement('canvas');
                c.width = cfg.sheetWidth;
                c.height = cfg.sheetHeight;
                this.canvases[wolfType] = c;
                this.contexts[wolfType] = c.getContext('2d');
            }
            return this.canvases[wolfType];
        }

        bakeSheet(wolfType) {
            const canvas = this.getCanvas(wolfType);
            const ctx = this.contexts[wolfType];
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            switch (wolfType) {
                case 'normal':
                    this.bakeNormalWolf(ctx);
                    break;
                case 'skater':
                    this.bakeSkaterWolf(ctx);
                    break;
                case 'granny':
                    this.bakeGrannyWolf(ctx);
                    break;
                case 'balloon':
                    this.bakeBalloonWolf(ctx);
                    break;
                case 'blower':
                    this.bakeBlowerWolf(ctx);
                    break;
                case 'midboss':
                    this.bakeMidBossWolf(ctx);
                    break;
                case 'boss':
                    this.bakeBossWolf(ctx);
                    break;
                case 'shield':
                    this.bakeShieldWolf(ctx);
                    break;
                case 'shield_broken':
                    this.bakeShieldBrokenWolf(ctx);
                    break;
                case 'umbrella':
                    this.bakeUmbrellaWolf(ctx);
                    break;
                case 'miniwolf':
                    this.bakeMiniWolf(ctx);
                    break;
                case 'miniwolf_para':
                    this.bakeMiniWolfPara(ctx);
                    break;
            }
            this.isReady[wolfType] = true;
        }

        // 이미지 또는 벡터 늑대 렌더링 헬퍼
        drawWolfTexture(ctx, wolfType, cx, cy, targetW, targetH, options = {}) {
            const { scaleX = 1, scaleY = 1, rot = 0, offsetX = 0, offsetY = 0, alpha = 1.0 } = options;
            ctx.save();
            ctx.translate(cx + offsetX, cy + offsetY);
            ctx.rotate(rot);
            ctx.scale(scaleX, scaleY);
            ctx.globalAlpha = alpha;

            const img = this.baseImages[wolfType];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
            } else {
                this.drawFallbackWolf(ctx, wolfType, targetW, targetH);
            }
            ctx.restore();
        }

        // 벡터 폴백 렌더링
        drawFallbackWolf(ctx, wolfType, w, h) {
            ctx.save();
            if (wolfType === 'normal') {
                ctx.fillStyle = '#263238';
                ctx.beginPath();
                ctx.ellipse(0, 0, w * 0.4, h * 0.28, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#00e5ff';
                ctx.beginPath();
                ctx.arc(-w * 0.22, -h * 0.1, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (wolfType === 'skater') {
                ctx.fillStyle = '#37474f';
                ctx.beginPath();
                ctx.ellipse(0, -h * 0.1, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
                ctx.fill();
                // 스케이트보드
                ctx.fillStyle = '#ff5722';
                ctx.fillRect(-w * 0.35, h * 0.3, w * 0.7, 6);
                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.arc(-w * 0.2, h * 0.36, 4, 0, Math.PI * 2);
                ctx.arc(w * 0.2, h * 0.36, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (wolfType === 'granny') {
                ctx.fillStyle = '#78909c';
                ctx.beginPath();
                ctx.ellipse(0, 0, w * 0.35, h * 0.38, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#e91e63';
                ctx.beginPath();
                ctx.arc(-w * 0.1, -h * 0.2, 16, 0, Math.PI * 2);
                ctx.fill();
            } else if (wolfType === 'balloon') {
                ctx.fillStyle = '#fbc02d';
                ctx.beginPath();
                ctx.arc(0, -h * 0.25, 22, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#6d4c41';
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.25 + 22);
                ctx.lineTo(0, 0);
                ctx.stroke();
                ctx.fillStyle = '#c62828';
                ctx.beginPath();
                ctx.ellipse(0, h * 0.15, w * 0.25, h * 0.25, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (wolfType === 'blower') {
                ctx.fillStyle = '#455a64';
                ctx.beginPath();
                ctx.ellipse(0, 0, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#607d8b';
                ctx.beginPath();
                ctx.arc(-w * 0.25, -h * 0.1, 14, 0, Math.PI * 2);
                ctx.fill();
            } else if (wolfType === 'midboss') {
                // 🐺 늑대 선봉 돌격대장 (고화질 절차적 벡터 렌더링)
                // 1. 펄럭이는 붉은 전투 망토 (등 뒤)
                ctx.fillStyle = '#b71c1c';
                ctx.beginPath();
                ctx.moveTo(w * 0.05, -h * 0.15);
                ctx.quadraticCurveTo(w * 0.38, -h * 0.25, w * 0.42, h * 0.3);
                ctx.lineTo(w * 0.28, h * 0.35);
                ctx.lineTo(w * 0.18, h * 0.18);
                ctx.lineTo(0, 0);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#d32f2f';
                ctx.lineWidth = 3;
                ctx.stroke();

                // 2. 늑대 몸체 (다크 차콜 슬레이트 털)
                ctx.fillStyle = '#263238';
                ctx.beginPath();
                ctx.ellipse(0, h * 0.05, w * 0.32, h * 0.32, 0, 0, Math.PI * 2);
                ctx.fill();

                // 풍성한 가슴 갈기
                ctx.fillStyle = '#37474f';
                ctx.beginPath();
                ctx.moveTo(-w * 0.1, -h * 0.1);
                ctx.lineTo(-w * 0.25, h * 0.1);
                ctx.lineTo(-w * 0.12, h * 0.28);
                ctx.lineTo(0, h * 0.2);
                ctx.closePath();
                ctx.fill();

                // 3. 앞발 & 뒷발
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(-w * 0.18, h * 0.2, w * 0.09, h * 0.22);
                ctx.fillRect(w * 0.08, h * 0.18, w * 0.1, h * 0.24);
                // 검은 발톱
                ctx.fillStyle = '#111';
                for (let c = 0; c < 3; c++) {
                    ctx.fillRect(-w * 0.22 + c * 5, h * 0.4, 4, 6);
                }

                // 4. 사나운 늑대 머리통 & 귀
                ctx.fillStyle = '#263238';
                ctx.beginPath();
                ctx.arc(-w * 0.16, -h * 0.16, w * 0.18, 0, Math.PI * 2);
                ctx.fill();
                // 뾰족한 야수 귀
                ctx.fillStyle = '#10171a';
                ctx.beginPath();
                ctx.moveTo(-w * 0.1, -h * 0.28);
                ctx.lineTo(-w * 0.06, -h * 0.46);
                ctx.lineTo(-w * 0.02, -h * 0.26);
                ctx.closePath();
                ctx.fill();

                // 5. 벌어진 주둥이와 날카로운 이빨
                ctx.fillStyle = '#7f0000';
                ctx.beginPath();
                ctx.moveTo(-w * 0.18, -h * 0.14);
                ctx.lineTo(-w * 0.44, -h * 0.12);
                ctx.lineTo(-w * 0.4, 0);
                ctx.lineTo(-w * 0.18, -h * 0.04);
                ctx.closePath();
                ctx.fill();
                // 윗턱 & 검은 코
                ctx.fillStyle = '#263238';
                ctx.beginPath();
                ctx.moveTo(-w * 0.2, -h * 0.22);
                ctx.lineTo(-w * 0.46, -h * 0.14);
                ctx.lineTo(-w * 0.2, -h * 0.12);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#111';
                ctx.fillRect(-w * 0.47, -h * 0.16, 6, 6);
                // 백색 송곳니
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(-w * 0.42, -h * 0.12);
                ctx.lineTo(-w * 0.39, -h * 0.02);
                ctx.lineTo(-w * 0.36, -h * 0.12);
                ctx.closePath();
                ctx.fill();

                // 6. 이마의 붉은 전사의 머리띠 & 펄럭이는 띠
                ctx.fillStyle = '#d50000';
                ctx.fillRect(-w * 0.26, -h * 0.26, w * 0.2, 7);
                ctx.beginPath();
                ctx.moveTo(-w * 0.06, -h * 0.26);
                ctx.lineTo(w * 0.12, -h * 0.32);
                ctx.lineTo(w * 0.1, -h * 0.22);
                ctx.closePath();
                ctx.fill();

                // 7. 황금빛 안광 & 흉터
                ctx.fillStyle = '#ffb300';
                ctx.beginPath();
                ctx.arc(-w * 0.24, -h * 0.18, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#b71c1c';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(-w * 0.27, -h * 0.26);
                ctx.lineTo(-w * 0.21, -h * 0.1);
                ctx.stroke();

                // 8. 강철 스파이크 견갑 (어깨)
                ctx.fillStyle = '#546e7a';
                ctx.beginPath();
                ctx.arc(-w * 0.02, -h * 0.1, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#cfd8dc';
                ctx.lineWidth = 2;
                ctx.stroke();
                // 은빛 스파이크
                ctx.fillStyle = '#eceff1';
                ctx.beginPath();
                ctx.moveTo(-w * 0.04, -h * 0.18);
                ctx.lineTo(-w * 0.06, -h * 0.32);
                ctx.lineTo(w * 0.02, -h * 0.18);
                ctx.closePath();
                ctx.fill();

                // 9. 거대한 쌍날 전투 도끼
                ctx.fillStyle = '#4e342e';
                ctx.fillRect(-w * 0.36, -h * 0.3, 5, h * 0.65);
                ctx.fillStyle = '#78909c';
                ctx.fillRect(-w * 0.44, -h * 0.15, 22, 16);
                ctx.fillStyle = '#cfd8dc';
                ctx.beginPath();
                ctx.arc(-w * 0.44, -h * 0.07, 10, -Math.PI * 0.5, Math.PI * 0.5, true);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-w * 0.22, -h * 0.07, 10, -Math.PI * 0.5, Math.PI * 0.5, false);
                ctx.fill();
                ctx.fillStyle = '#ffb300';
                ctx.beginPath();
                ctx.arc(-w * 0.33, -h * 0.07, 4, 0, Math.PI * 2);
                ctx.fill();

            } else if (wolfType === 'boss') {
                // 👑 빅 배드 울프 제왕 (고화질 절차적 벡터 렌더링)
                // 1. 제왕의 로열 벨벳 & 어민 모피 망토
                ctx.fillStyle = '#4a148c';
                ctx.beginPath();
                ctx.moveTo(w * 0.05, -h * 0.2);
                ctx.quadraticCurveTo(w * 0.42, -h * 0.28, w * 0.46, h * 0.32);
                ctx.lineTo(w * 0.3, h * 0.38);
                ctx.lineTo(w * 0.18, h * 0.18);
                ctx.lineTo(0, 0);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3.5;
                ctx.stroke();

                // 어민 모피 깃 (White Ermine Collar)
                ctx.fillStyle = '#f5f5f5';
                ctx.beginPath();
                ctx.ellipse(w * 0.08, -h * 0.12, 16, 10, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#111';
                ctx.fillRect(w * 0.06, -h * 0.12, 4, 5);

                // 2. 제왕의 육중한 흑청색 몸체
                ctx.fillStyle = '#10171a';
                ctx.beginPath();
                ctx.ellipse(0, h * 0.06, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
                ctx.fill();

                // 3. 앞발 & 황금 건틀릿 발톱
                ctx.fillStyle = '#0a0f12';
                ctx.fillRect(-w * 0.2, h * 0.2, w * 0.1, h * 0.24);
                ctx.fillRect(w * 0.08, h * 0.18, w * 0.1, h * 0.26);
                // 황금 발톱 3개
                ctx.fillStyle = '#ffd700';
                for (let c = 0; c < 3; c++) {
                    ctx.beginPath();
                    ctx.moveTo(-w * 0.25 + c * 6, h * 0.42);
                    ctx.lineTo(-w * 0.29 + c * 6, h * 0.48);
                    ctx.lineTo(-w * 0.22 + c * 6, h * 0.45);
                    ctx.closePath();
                    ctx.fill();
                }

                // 4. 황금 흉갑 (Golden Chestplate) & 붉은 영혼석
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(-w * 0.15, -h * 0.08);
                ctx.lineTo(w * 0.08, -h * 0.06);
                ctx.lineTo(w * 0.04, h * 0.16);
                ctx.lineTo(-w * 0.12, h * 0.18);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#b78103';
                ctx.lineWidth = 2;
                ctx.stroke();
                // 붉은 영혼석
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.arc(-w * 0.03, h * 0.04, 6, 0, Math.PI * 2);
                ctx.fill();

                // 5. 포효하는 제왕 머리통
                ctx.fillStyle = '#10171a';
                ctx.beginPath();
                ctx.arc(-w * 0.18, -h * 0.18, w * 0.2, 0, Math.PI * 2);
                ctx.fill();

                // 거대한 주둥이와 황금 송곳니
                ctx.fillStyle = '#5c0000';
                ctx.beginPath();
                ctx.moveTo(-w * 0.2, -h * 0.16);
                ctx.lineTo(-w * 0.48, -h * 0.12);
                ctx.lineTo(-w * 0.42, h * 0.04);
                ctx.lineTo(-w * 0.2, -h * 0.04);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(-w * 0.46, -h * 0.12);
                ctx.lineTo(-w * 0.42, 0);
                ctx.lineTo(-w * 0.38, -h * 0.12);
                ctx.closePath();
                ctx.fill();

                // 6. 붉게 타오르는 마왕의 안광 (Demon Eyes)
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.arc(-w * 0.26, -h * 0.2, 5, 0, Math.PI * 2);
                ctx.fill();
                // 안광 궤적
                ctx.strokeStyle = 'rgba(255, 23, 68, 0.8)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-w * 0.26, -h * 0.2);
                ctx.lineTo(-w * 0.08, -h * 0.26);
                ctx.stroke();

                // 7. 화려한 5갈래 황금 제왕 왕관 (Imperial Crown with Rubies)
                ctx.fillStyle = '#ffc107';
                ctx.beginPath();
                ctx.moveTo(-w * 0.26, -h * 0.32);
                ctx.lineTo(-w * 0.28, -h * 0.48); // 1
                ctx.lineTo(-w * 0.2, -h * 0.38);
                ctx.lineTo(-w * 0.14, -h * 0.55); // 2 중앙 최고점
                ctx.lineTo(-w * 0.08, -h * 0.38);
                ctx.lineTo(-w * 0.02, -h * 0.48); // 3
                ctx.lineTo(0, -h * 0.32);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // 왕관 보석들
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.arc(-w * 0.14, -h * 0.42, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#00e5ff';
                ctx.beginPath();
                ctx.arc(-w * 0.22, -h * 0.36, 2.5, 0, Math.PI * 2);
                ctx.arc(-w * 0.06, -h * 0.36, 2.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (wolfType === 'balloon_ground') {
                // 추락한 파일럿 늑대 폴백
                ctx.fillStyle = '#d32f2f';
                ctx.beginPath();
                ctx.ellipse(0, 0, w * 0.35, h * 0.32, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#212121';
                ctx.fillRect(-w * 0.22, -h * 0.22, w * 0.35, 7);
                ctx.fillStyle = '#00e5ff';
                ctx.beginPath();
                ctx.arc(-w * 0.15, -h * 0.18, 5, 0, Math.PI * 2);
                ctx.fill();
            } else if (wolfType === 'granny_revealed') {
                // 변신한 무서운 야수 늑대 폴백
                ctx.fillStyle = '#1e293b';
                ctx.beginPath();
                ctx.ellipse(0, 0, w * 0.38, h * 0.32, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.arc(-w * 0.2, -h * 0.12, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (wolfType === 'shield') {
                // 고철 쓰레기통 뚜껑 방패 늑대 폴백 (PNG 로딩 전)
                // 1. 갈회색 늑대 몸체 & 머리
                ctx.fillStyle = '#5d534f';
                ctx.beginPath();
                ctx.ellipse(w * 0.05, h * 0.06, w * 0.35, h * 0.28, -0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-w * 0.14, -h * 0.15, w * 0.18, 0, Math.PI * 2);
                ctx.fill();
                // 2. 냄비 헬멧
                ctx.fillStyle = '#78909c';
                ctx.beginPath();
                ctx.ellipse(-w * 0.14, -h * 0.28, w * 0.2, h * 0.12, 0.08, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#455a64'; ctx.lineWidth = 1.5; ctx.stroke();
                // 3. 눈과 이빨
                ctx.fillStyle = '#ffd54f';
                ctx.beginPath(); ctx.arc(-w * 0.18, -h * 0.15, 4.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#212121';
                ctx.beginPath(); ctx.arc(-w * 0.2, -h * 0.15, 2.5, 0, Math.PI * 2); ctx.fill();
                // 4. 누런 황동빛 둥근 고철 쓰레기통 뚜껑 방패 (전방 가드)
                ctx.fillStyle = '#c59b27';
                ctx.beginPath();
                ctx.ellipse(-w * 0.28, h * 0.04, w * 0.22, h * 0.35, -0.05, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#826514'; ctx.lineWidth = 2.5; ctx.stroke();
                // 뚜껑 동심원 리지
                ctx.strokeStyle = 'rgba(255, 235, 59, 0.4)'; ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(-w * 0.28, h * 0.04, w * 0.14, h * 0.23, -0.05, 0, Math.PI * 2);
                ctx.stroke();
                // 뚜껑 손잡이
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(-w * 0.33, -h * 0.02, 6, 16);
            } else if (wolfType === 'shield_broken') {
                // 방패 파괴 맨몸 늑대 폴백
                ctx.fillStyle = '#5d534f';
                ctx.beginPath();
                ctx.ellipse(w * 0.05, h * 0.08, w * 0.35, h * 0.28, -0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-w * 0.14, -h * 0.15, w * 0.18, 0, Math.PI * 2);
                ctx.fill();
                // 냄비 헬멧
                ctx.fillStyle = '#78909c';
                ctx.beginPath();
                ctx.ellipse(-w * 0.14, -h * 0.28, w * 0.2, h * 0.12, 0.08, 0, Math.PI * 2);
                ctx.fill();
                // 당황한 큰 눈
                ctx.fillStyle = '#ffd54f';
                ctx.beginPath(); ctx.arc(-w * 0.18, -h * 0.15, 5.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#212121';
                ctx.beginPath(); ctx.arc(-w * 0.2, -h * 0.15, 2.5, 0, Math.PI * 2); ctx.fill();
                // 허우적거리는 앞발
                ctx.strokeStyle = '#5d534f'; ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(-w * 0.1, -h * 0.02); ctx.lineTo(-w * 0.35, -h * 0.1);
                ctx.moveTo(-w * 0.05, h * 0.08); ctx.lineTo(-w * 0.3, h * 0.15);
                ctx.stroke();
            } else if (wolfType === 'umbrella') {
                // 우산공수 늑대 폴백 (PNG 로딩 전)
                ctx.fillStyle = '#455a64';
                ctx.beginPath();
                ctx.ellipse(0, h * 0.05, w * 0.32, h * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                // 우산 캐노피
                const panels3 = ['#e91e63', '#ffeb3b', '#00bcd4', '#76ff03'];
                panels3.forEach((col, i) => {
                    ctx.fillStyle = col;
                    ctx.beginPath();
                    const sa = Math.PI + (i * Math.PI) / 4;
                    const ea = Math.PI + ((i + 1) * Math.PI) / 4;
                    ctx.arc(-w * 0.1, -h * 0.45, w * 0.38, sa, ea);
                    ctx.lineTo(-w * 0.1, -h * 0.45);
                    ctx.closePath();
                    ctx.fill();
                });
                // 우산대
                ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-w * 0.1, -h * 0.45);
                ctx.lineTo(-w * 0.1, h * 0.2);
                ctx.stroke();
            } else if (wolfType === 'miniwolf') {
                // 미니태엽 로봇 늑대 폴백 (PNG 로딩 전)
                ctx.fillStyle = '#607d8b';
                ctx.beginPath();
                ctx.ellipse(0, 0, w * 0.28, h * 0.22, 0, 0, Math.PI * 2);
                ctx.fill();
                // 머리
                ctx.beginPath();
                ctx.arc(-w * 0.18, -h * 0.2, w * 0.2, 0, Math.PI * 2);
                ctx.fill();
                // 태엽 키
                ctx.fillStyle = '#ffd54f';
                ctx.fillRect(w * 0.08, -h * 0.2, 6, 12);
                ctx.beginPath();
                ctx.arc(w * 0.11, -h * 0.24, 7, 0, Math.PI * 2);
                ctx.fill();
                // LED 눈
                ctx.fillStyle = '#00e5ff';
                ctx.beginPath();
                ctx.arc(-w * 0.22, -h * 0.2, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (wolfType === 'miniwolf_para') {
                // 미니태엽 낙하산 늑대 폴백 (PNG 로딩 전)
                // 1. 낙하산 돔
                const pColors = ['#ff5252', '#ffffff', '#ff5252', '#ffffff', '#ff5252'];
                for (let i = 0; i < 5; i++) {
                    ctx.fillStyle = pColors[i];
                    ctx.beginPath();
                    const sa = Math.PI + (i * Math.PI) / 5;
                    const ea = Math.PI + ((i + 1) * Math.PI) / 5;
                    ctx.arc(0, -h * 0.15, w * 0.35, sa, ea);
                    ctx.lineTo(0, -h * 0.15);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(0, -h * 0.15, w * 0.35, Math.PI, Math.PI * 2); ctx.stroke();
                // 2. 낙하산 줄
                ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 1.2;
                [-w * 0.3, -w * 0.1, w * 0.1, w * 0.3].forEach(lx => {
                    ctx.beginPath(); ctx.moveTo(lx, -h * 0.15); ctx.lineTo(0, h * 0.12); ctx.stroke();
                });
                // 3. 매달린 미니 태엽 늑대 몸체
                ctx.fillStyle = '#607d8b';
                ctx.beginPath(); ctx.ellipse(0, h * 0.18, w * 0.22, h * 0.16, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(-w * 0.12, h * 0.1, w * 0.14, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#00e5ff';
                ctx.beginPath(); ctx.arc(-w * 0.16, h * 0.08, 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffd54f';
                ctx.fillRect(w * 0.05, h * 0.05, 5, 10);
            }
            ctx.restore();
        }

        // =========================================================================
        // 1. 일반 늑대 (Normal Wolf) 시트 베이킹 - "어설픈 허당 악당"
        // =========================================================================
        bakeNormalWolf(ctx) {
            const F = FRAME_SIZE;
            const targetW = 150;
            const targetH = 92;

            // Row 0: run (8 frames) - 의욕 과다 4발 허둥지둥 전력 질주
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const phase = (f / 8) * Math.PI * 2;
                const bob = Math.sin(phase) * 5;
                const squash = 1 + Math.sin(phase) * 0.09;
                const stretch = 1 - Math.sin(phase) * 0.09;
                const rot = Math.cos(phase) * 0.08;

                this.drawWolfTexture(ctx, 'normal', cx, cy + bob, targetW, targetH, {
                    scaleX: stretch,
                    scaleY: squash,
                    rot: rot
                });

                // 발밑 우당탕탕 만화 흙먼지 소용돌이 (프레임 1, 3, 5, 7)
                if (f % 2 === 1) {
                    const dustX = cx + 28 + (f === 3 || f === 7 ? 6 : 0);
                    const dustY = cy + 24;
                    ctx.fillStyle = 'rgba(215, 204, 200, 0.8)';
                    ctx.strokeStyle = '#8d6e63';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(dustX, dustY, 6, 0, Math.PI * 2);
                    ctx.arc(dustX + 8, dustY - 3, 4.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }

            // Row 1: bite (6 frames) - 턱을 쩍 벌렸다가 이빨 딱! 부딪히는 만화적 일격
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 1 * F + F / 2;
                let offX = 0, offY = 0, rot = 0, scale = 1.0;

                if (f === 0) { offX = 6; rot = -0.1; }
                else if (f === 1) { offX = 14; rot = -0.22; } // 뒤로 잔뜩 젖히기
                else if (f === 2) { offX = -20; rot = 0.16; scale = 1.14; } // 전방 덥석 돌진!
                else if (f === 3) { offX = -12; rot = 0.08; } // 이빨 딱! 충돌
                else if (f === 4) { offX = -4; rot = 0.02; }
                else if (f === 5) { offX = 0; rot = 0; }

                this.drawWolfTexture(ctx, 'normal', cx + offX, cy + offY, targetW, targetH, {
                    rot: rot,
                    scaleX: scale,
                    scaleY: scale
                });

                // 이빨 딱! 부딪힐 때 터지는 만화 충돌 별 & 스파크 (프레임 2, 3)
                if (f === 2 || f === 3) {
                    const sx = cx - 44;
                    const sy = cy - 2;
                    ctx.fillStyle = '#ffeb3b';
                    ctx.strokeStyle = '#ff9800';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    for (let s = 0; s < 8; s++) {
                        const r = (s % 2 === 0) ? (f === 2 ? 14 : 9) : 4;
                        const a = (s / 8) * Math.PI * 2 + (f === 2 ? 0 : 0.4);
                        const px = sx + Math.cos(a) * r;
                        const py = sy + Math.sin(a) * r;
                        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // 이빨 충돌 스파크선
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(sx - 8, sy - 8);
                    ctx.lineTo(sx - 16, sy - 14);
                    ctx.moveTo(sx - 8, sy + 8);
                    ctx.lineTo(sx - 16, sy + 14);
                    ctx.stroke();
                }
            }

            // Row 2: hurt (4 frames) - 허당 악당 피격 (빙글빙글 나선 눈 & 맴도는 별)
            for (let f = 0; f < 4; f++) {
                const cx = f * F + F / 2;
                const cy = 2 * F + F / 2;
                const recoil = (f === 0 ? 12 : (f === 1 ? 20 : (f === 2 ? 8 : 0)));
                const rot = (f < 2 ? 0.22 : 0.05);
                const alpha = (f === 1 ? 0.7 : 1.0);

                this.drawWolfTexture(ctx, 'normal', cx + recoil, cy, targetW, targetH, {
                    rot: rot,
                    alpha: alpha
                });

                // 코믹 어지럼증 빙글빙글 나선 눈 & 별 (@_@)
                if (f <= 2) {
                    const eyeX = cx + recoil - 32;
                    const eyeY = cy - 14;
                    ctx.strokeStyle = '#00e5ff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    for (let th = 0; th < Math.PI * 3.5; th += 0.3) {
                        const r = th * 1.4;
                        const px = eyeX + Math.cos(th + f * 1.5) * r;
                        const py = eyeY + Math.sin(th + f * 1.5) * r;
                        if (th === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.stroke();

                    // 머리 위 맴도는 작은 노랑 별 2개
                    const starAngle = (f * 1.4);
                    for (let st = 0; st < 2; st++) {
                        const sa = starAngle + st * Math.PI;
                        const sx = cx + recoil - 12 + Math.cos(sa) * 20;
                        const sy = cy - 38 + Math.sin(sa) * 7;
                        ctx.fillStyle = '#ffeb3b';
                        ctx.strokeStyle = '#f57f17';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            }
        }

        // =========================================================================
        // 2. 스케이트 늑대 (Skater Wolf) 시트 베이킹 - "로켓 폭죽 폭주 스케이터"
        // =========================================================================
        bakeSkaterWolf(ctx) {
            const F = FRAME_SIZE;
            const targetW = 140;
            const targetH = 140;

            // Row 0: skate (8 frames) - 보드 뒤 폭죽 로켓 실시간 분사 & 킥푸시
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const phase = (f / 8) * Math.PI * 2;
                const boardTilt = Math.sin(phase) * 0.07;
                const bob = Math.abs(Math.sin(phase)) * 4;

                this.drawWolfTexture(ctx, 'skater', cx, cy - bob, targetW, targetH, {
                    rot: boardTilt
                });

                // 로켓 부스터 실시간 화염 & 연기 펄스 (보드 뒤 x=+46, y=+30)
                const rx = cx + 46;
                const ry = cy - bob + 30;
                const flamePulse = 10 + Math.sin(phase * 3) * 6;

                // 역동적인 분사 불꽃
                ctx.fillStyle = '#ff5722';
                ctx.beginPath();
                ctx.moveTo(rx, ry - 5);
                ctx.lineTo(rx + flamePulse + 8, ry);
                ctx.lineTo(rx, ry + 5);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.moveTo(rx, ry - 3);
                ctx.lineTo(rx + flamePulse * 0.6 + 4, ry);
                ctx.lineTo(rx, ry + 3);
                ctx.closePath();
                ctx.fill();

                // 퐁퐁 뒤로 밀려나는 만화 연기 고리
                const smokePhase = ((f * 5) % 18);
                ctx.fillStyle = 'rgba(238, 238, 238, 0.75)';
                ctx.beginPath();
                ctx.arc(rx + flamePulse + 6 + smokePhase, ry + Math.sin(f) * 2, 4 + (smokePhase * 0.15), 0, Math.PI * 2);
                ctx.fill();

                // 스피드 바람선 (프레임 2~4)
                if (f >= 2 && f <= 4) {
                    ctx.strokeStyle = 'rgba(255, 152, 0, 0.8)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(cx + 25, cy + 28);
                    ctx.lineTo(cx + 42, cy + 28);
                    ctx.stroke();
                }
            }

            // Row 1: jump_attack (6 frames) - 로켓 부스트 슈퍼 점프 어택
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 1 * F + F / 2;
                let jumpY = 0, rot = 0;

                if (f === 0) { jumpY = 4; rot = 0.05; } // 점프 준비
                else if (f === 1) { jumpY = -16; rot = -0.2; } // 도약
                else if (f === 2) { jumpY = -28; rot = -0.4; } // 최고 정점 & 보드 회전
                else if (f === 3) { jumpY = -20; rot = -0.15; }
                else if (f === 4) { jumpY = 2; rot = 0.1; } // 착지 충격
                else if (f === 5) { jumpY = 0; rot = 0; }

                this.drawWolfTexture(ctx, 'skater', cx, cy + jumpY, targetW, targetH, {
                    rot: rot
                });

                // 도약 시(1~3프레임) 로켓 대폭발 제트 분사 이펙트
                if (f >= 1 && f <= 3) {
                    const jetX = cx + 38;
                    const jetY = cy + jumpY + 34;
                    ctx.fillStyle = 'rgba(255, 87, 34, 0.9)';
                    ctx.beginPath();
                    ctx.moveTo(jetX, jetY - 6);
                    ctx.lineTo(jetX + 28, jetY + 12);
                    ctx.lineTo(jetX - 4, jetY + 14);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#ffeb3b';
                    ctx.beginPath();
                    ctx.arc(jetX + 6, jetY + 4, 6, 0, Math.PI * 2);
                    ctx.fill();
                }

                // 착지 충격 먼지 & 스파크 (프레임 4)
                if (f === 4) {
                    ctx.fillStyle = '#ffeb3b';
                    ctx.beginPath();
                    ctx.arc(cx - 22, cy + 34, 5, 0, Math.PI * 2);
                    ctx.arc(cx + 22, cy + 34, 5, 0, Math.PI * 2);
                    ctx.fill();
                    // 충격 먼지 구름
                    ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
                    ctx.beginPath();
                    ctx.arc(cx - 32, cy + 36, 7, 0, Math.PI * 2);
                    ctx.arc(cx + 34, cy + 36, 7, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Row 2: hurt (4 frames) - 보드 위에서 휘청거리며 로켓 불발 검은 연기
            for (let f = 0; f < 4; f++) {
                const cx = f * F + F / 2;
                const cy = 2 * F + F / 2;
                const wobble = (f === 0 ? 0.3 : (f === 1 ? -0.25 : (f === 2 ? 0.1 : 0)));
                this.drawWolfTexture(ctx, 'skater', cx + (f < 2 ? 14 : 4), cy, targetW, targetH, {
                    rot: wobble
                });

                // 로켓 불발: 푸쉭! 검은 만화 연기 뿜뿜 (프레임 0~2)
                if (f <= 2) {
                    const nozX = cx + (f < 2 ? 14 : 4) + 45;
                    const nozY = cy + 28;
                    ctx.fillStyle = 'rgba(55, 71, 79, 0.85)';
                    ctx.beginPath();
                    ctx.arc(nozX + f * 8, nozY - f * 4, 5 + f * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // =========================================================================
        // 3. 할머니/빨간모자 늑대 (Granny Wolf) 시트 베이킹
        // =========================================================================
        drawScaryRevealedWolf(ctx, cx, cy, w, h, options = {}) {
            const { rot = 0, scaleX = 1, scaleY = 1, lunge = 0, mouthOpen = 1.0, clawSlash = false } = options;
            ctx.save();
            ctx.translate(cx + lunge, cy);
            ctx.rotate(rot);
            ctx.scale(scaleX, scaleY);

            // 1. 펄럭이며 찢겨 날아가는 핑크 두건 & 붉은 리본 조각 (변장을 찢어발긴 흔적!)
            ctx.fillStyle = '#f06292';
            ctx.beginPath();
            ctx.moveTo(w * 0.15, -h * 0.2);
            ctx.lineTo(w * 0.35, -h * 0.35);
            ctx.lineTo(w * 0.28, -h * 0.15);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#e91e63';
            ctx.beginPath();
            ctx.moveTo(w * 0.1, -h * 0.1);
            ctx.lineTo(w * 0.32, -h * 0.05);
            ctx.lineTo(w * 0.22, 0);
            ctx.closePath();
            ctx.fill();

            // 2. 사납고 덥수룩한 늑대 꼬리 (곤두선 털)
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(w * 0.25, -h * 0.05);
            ctx.quadraticCurveTo(w * 0.45, -h * 0.25, w * 0.52, -h * 0.05);
            ctx.quadraticCurveTo(w * 0.42, h * 0.1, w * 0.22, h * 0.05);
            ctx.closePath();
            ctx.fill();

            // 3. 근육질의 거대한 다크 그레이 늑대 몸통 (사냥 태세)
            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.ellipse(0, -h * 0.02, w * 0.3, h * 0.24, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // 4. 등줄기와 목덜미의 곤두선 갈기털
            ctx.fillStyle = '#10171a';
            ctx.beginPath();
            ctx.moveTo(-w * 0.05, -h * 0.25);
            ctx.lineTo(0, -h * 0.15);
            ctx.lineTo(w * 0.05, -h * 0.23);
            ctx.lineTo(w * 0.12, -h * 0.14);
            ctx.lineTo(w * 0.18, -h * 0.2);
            ctx.lineTo(w * 0.22, -h * 0.05);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();

            // 5. 뒷다리와 날카로운 발톱
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.ellipse(w * 0.16, h * 0.16, w * 0.1, h * 0.16, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // 6. 앞다리 (앞으로 길게 뻗은 공격적인 발)
            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.ellipse(-w * 0.12, h * 0.14, w * 0.09, h * 0.18, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // 7. 섬뜩한 검은 앞발톱 3개
            ctx.fillStyle = '#111111';
            for (let c = 0; c < 3; c++) {
                ctx.beginPath();
                ctx.moveTo(-w * 0.22 - c * 5, h * 0.25);
                ctx.lineTo(-w * 0.32 - c * 5, h * 0.28);
                ctx.lineTo(-w * 0.24 - c * 5, h * 0.32);
                ctx.closePath();
                ctx.fill();
            }

            // 8. 맹수의 사나운 머리통
            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.arc(-w * 0.18, -h * 0.16, w * 0.2, 0, Math.PI * 2);
            ctx.fill();

            // 9. 뾰족하게 곤두선 야수 귀
            ctx.fillStyle = '#10171a';
            ctx.beginPath();
            ctx.moveTo(-w * 0.12, -h * 0.3);
            ctx.lineTo(-w * 0.08, -h * 0.48);
            ctx.lineTo(-w * 0.02, -h * 0.28);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.moveTo(-w * 0.22, -h * 0.3);
            ctx.lineTo(-w * 0.2, -h * 0.5);
            ctx.lineTo(-w * 0.12, -h * 0.28);
            ctx.closePath();
            ctx.fill();

            // 귀 속 붉은 살기
            ctx.fillStyle = '#d32f2f';
            ctx.beginPath();
            ctx.moveTo(-w * 0.2, -h * 0.32);
            ctx.lineTo(-w * 0.18, -h * 0.45);
            ctx.lineTo(-w * 0.14, -h * 0.3);
            ctx.closePath();
            ctx.fill();

            // 10. 크게 벌어진 포식자의 턱과 이빨
            const jawDrop = mouthOpen * 14;
            // 입 내부 (피빛 암적색)
            ctx.fillStyle = '#7f0000';
            ctx.beginPath();
            ctx.moveTo(-w * 0.16, -h * 0.14);
            ctx.lineTo(-w * 0.45, -h * 0.18);
            ctx.lineTo(-w * 0.4, -h * 0.02 + jawDrop);
            ctx.lineTo(-w * 0.16, -h * 0.06);
            ctx.closePath();
            ctx.fill();

            // 윗턱
            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.moveTo(-w * 0.22, -h * 0.24);
            ctx.lineTo(-w * 0.48, -h * 0.18);
            ctx.lineTo(-w * 0.46, -h * 0.12);
            ctx.lineTo(-w * 0.2, -h * 0.12);
            ctx.closePath();
            ctx.fill();

            // 검은 코
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.ellipse(-w * 0.48, -h * 0.18, 5, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // 아랫턱
            ctx.fillStyle = '#10171a';
            ctx.beginPath();
            ctx.moveTo(-w * 0.2, -h * 0.06);
            ctx.lineTo(-w * 0.42, -h * 0.02 + jawDrop);
            ctx.lineTo(-w * 0.22, h * 0.06 + jawDrop * 0.8);
            ctx.closePath();
            ctx.fill();

            // 날카로운 거대 백색 송곳니 (위/아래)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-w * 0.44, -h * 0.14);
            ctx.lineTo(-w * 0.41, -h * 0.02);
            ctx.lineTo(-w * 0.38, -h * 0.14);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-w * 0.36, -h * 0.14);
            ctx.lineTo(-w * 0.33, -h * 0.04);
            ctx.lineTo(-w * 0.3, -h * 0.14);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-w * 0.39, -h * 0.04 + jawDrop);
            ctx.lineTo(-w * 0.36, -h * 0.14 + jawDrop);
            ctx.lineTo(-w * 0.33, -h * 0.04 + jawDrop);
            ctx.closePath();
            ctx.fill();

            // 11. 붉게 타오르는 마성의 안광
            ctx.save();
            ctx.shadowColor = '#ff1744';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            ctx.ellipse(-w * 0.27, -h * 0.22, 6, 4, -0.3, 0, Math.PI * 2);
            ctx.fill();
            // 안광 잔상
            ctx.strokeStyle = 'rgba(255, 23, 68, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-w * 0.27, -h * 0.22);
            ctx.quadraticCurveTo(-w * 0.18, -h * 0.26, -w * 0.06, -h * 0.24);
            ctx.stroke();
            ctx.restore();

            // 12. 공격 시 할퀴는 붉은 참격 이펙트
            if (clawSlash) {
                ctx.save();
                ctx.strokeStyle = '#ff1744';
                ctx.lineWidth = 3.5;
                for (let s = 0; s < 3; s++) {
                    ctx.beginPath();
                    ctx.moveTo(-w * 0.5 - s * 8, -h * 0.3 + s * 14);
                    ctx.lineTo(-w * 0.75 - s * 6, h * 0.1 + s * 14);
                    ctx.stroke();
                }
                ctx.restore();
            }

            ctx.restore();
        }

        // 풍선늑대 지상 에비에이터 파일럿 렌더러
        drawAviatorPilotWolf(ctx, cx, cy, w, h, options = {}) {
            const { rot = 0, scaleX = 1, scaleY = 1, stepPhase = 0, isAttacking = false } = options;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);
            ctx.scale(scaleX, scaleY);

            const bob = Math.sin(stepPhase) * 4;
            const legSwing = Math.sin(stepPhase) * 10;

            // 1. 풍성한 회색 늑대 꼬리
            ctx.fillStyle = '#607d8b';
            ctx.beginPath();
            ctx.moveTo(w * 0.2, -h * 0.05 + bob);
            ctx.quadraticCurveTo(w * 0.38, -h * 0.2 + bob, w * 0.45, -h * 0.02 + bob);
            ctx.quadraticCurveTo(w * 0.35, h * 0.15 + bob, w * 0.18, h * 0.08 + bob);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#eceff1';
            ctx.beginPath();
            ctx.arc(w * 0.43, -h * 0.04 + bob, 5, 0, Math.PI * 2);
            ctx.fill();

            // 2. 달리는 다리와 부츠
            ctx.fillStyle = '#37474f';
            ctx.beginPath();
            ctx.ellipse(w * 0.12 - legSwing * 0.4, h * 0.28, 6, 12, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(-w * 0.1 + legSwing * 0.4, h * 0.28, 6, 12, -0.2, 0, Math.PI * 2);
            ctx.fill();

            // 3. 레드 에비에이터 비행 점퍼
            ctx.fillStyle = '#d32f2f';
            ctx.beginPath();
            ctx.ellipse(0, -h * 0.02 + bob, w * 0.24, h * 0.22, -0.1, 0, Math.PI * 2);
            ctx.fill();

            // 점퍼 지퍼 & 벨트
            ctx.strokeStyle = '#b71c1c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-w * 0.05, -h * 0.15 + bob);
            ctx.lineTo(-w * 0.02, h * 0.15 + bob);
            ctx.stroke();

            ctx.fillStyle = '#424242';
            ctx.fillRect(-w * 0.2, h * 0.06 + bob, w * 0.4, 5);
            ctx.fillStyle = '#ffd54f';
            ctx.fillRect(-w * 0.06, h * 0.04 + bob, 8, 8);

            // 4. 폭신폭신한 양털 칼라
            ctx.fillStyle = '#fff9c4';
            ctx.beginPath();
            ctx.arc(-w * 0.08, -h * 0.18 + bob, 9, 0, Math.PI * 2);
            ctx.arc(0, -h * 0.2 + bob, 8, 0, Math.PI * 2);
            ctx.arc(w * 0.08, -h * 0.16 + bob, 9, 0, Math.PI * 2);
            ctx.fill();

            // 5. 귀여운 파일럿 늑대 머리통
            ctx.fillStyle = '#78909c';
            ctx.beginPath();
            ctx.arc(-w * 0.14, -h * 0.28 + bob, w * 0.18, 0, Math.PI * 2);
            ctx.fill();

            // 6. 브라운 가죽 비행모
            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            ctx.arc(-w * 0.14, -h * 0.32 + bob, w * 0.18, Math.PI * 0.8, Math.PI * 2.1);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-w * 0.18, -h * 0.3 + bob);
            ctx.lineTo(-w * 0.2, -h * 0.15 + bob);
            ctx.lineTo(-w * 0.12, -h * 0.18 + bob);
            ctx.closePath();
            ctx.fill();

            // 7. 쫑긋 솟은 늑대 귀
            ctx.fillStyle = '#546e7a';
            ctx.beginPath();
            ctx.moveTo(-w * 0.2, -h * 0.42 + bob);
            ctx.lineTo(-w * 0.18, -h * 0.6 + bob);
            ctx.lineTo(-w * 0.1, -h * 0.4 + bob);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ff80ab';
            ctx.beginPath();
            ctx.moveTo(-w * 0.18, -h * 0.44 + bob);
            ctx.lineTo(-w * 0.16, -h * 0.55 + bob);
            ctx.lineTo(-w * 0.12, -h * 0.42 + bob);
            ctx.closePath();
            ctx.fill();

            // 8. 반짝이는 황금 에비에이터 고글
            ctx.fillStyle = '#ffb300';
            ctx.beginPath();
            ctx.roundRect(-w * 0.28, -h * 0.45 + bob, 15, 11, 3);
            ctx.roundRect(-w * 0.13, -h * 0.45 + bob, 15, 11, 3);
            ctx.fill();
            ctx.strokeStyle = '#ffd54f';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 렌즈 유리 반사광
            ctx.fillStyle = '#80deea';
            ctx.beginPath();
            ctx.arc(-w * 0.21, -h * 0.4 + bob, 4.5, 0, Math.PI * 2);
            ctx.arc(-w * 0.06, -h * 0.4 + bob, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-w * 0.22, -h * 0.42 + bob, 1.5, 0, Math.PI * 2);
            ctx.arc(-w * 0.07, -h * 0.42 + bob, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // 고글 스트랩
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-w * 0.28, -h * 0.4 + bob);
            ctx.lineTo(w * 0.02, -h * 0.35 + bob);
            ctx.stroke();

            // 9. 길쭉하고 앙증맞은 주둥이와 코
            ctx.fillStyle = '#cfd8dc';
            ctx.beginPath();
            ctx.moveTo(-w * 0.18, -h * 0.28 + bob);
            ctx.lineTo(-w * 0.36, -h * 0.25 + bob);
            ctx.lineTo(-w * 0.36, -h * 0.18 + bob);
            ctx.lineTo(-w * 0.18, -h * 0.18 + bob);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#212121';
            ctx.beginPath();
            ctx.ellipse(-w * 0.36, -h * 0.24 + bob, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(-w * 0.3, -h * 0.18 + bob);
            ctx.lineTo(-w * 0.28, -h * 0.12 + bob);
            ctx.lineTo(-w * 0.26, -h * 0.18 + bob);
            ctx.closePath();
            ctx.fill();

            // 10. 똘망똘망한 눈
            ctx.fillStyle = '#ffc107';
            ctx.beginPath();
            ctx.arc(-w * 0.22, -h * 0.3 + bob, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-w * 0.23, -h * 0.3 + bob, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-w * 0.24, -h * 0.31 + bob, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // 11. 공격 시 박치기 바람선
            if (isAttacking) {
                ctx.strokeStyle = '#ffd54f';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(-w * 0.38, -h * 0.3);
                ctx.lineTo(-w * 0.48, -h * 0.2);
                ctx.stroke();
            }

            // 12. 머리 위로 치켜든 붉은 다이너마이트 묶음 🧨 (폭탄마 액션)
            const dynX = -w * 0.12;
            const dynY = -h * 0.52 + bob;

            // 붉은 다이너마이트 막대 묶음
            ctx.fillStyle = '#d32f2f';
            ctx.fillRect(dynX - 12, dynY - 7, 24, 14);
            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 1;
            ctx.strokeRect(dynX - 12, dynY - 7, 24, 14);

            // 검은색 밴드 테이프 2줄
            ctx.fillStyle = '#212121';
            ctx.fillRect(dynX - 8, dynY - 8, 3, 16);
            ctx.fillRect(dynX + 5, dynY - 8, 3, 16);

            // 심지와 불꽃 스파크 ✨
            ctx.strokeStyle = '#795548';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(dynX - 12, dynY);
            ctx.quadraticCurveTo(dynX - 18, dynY - 8, dynX - 22, dynY - 5);
            ctx.stroke();

            // 타들어가는 불꽃 스파크
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(dynX - 22, dynY - 5, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff3d00';
            ctx.beginPath();
            ctx.arc(dynX - 22, dynY - 5, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // 다이너마이트를 쥐고 있는 장갑 낀 양손
            ctx.fillStyle = '#455a64';
            ctx.beginPath();
            ctx.arc(dynX - 4, dynY + 8, 5, 0, Math.PI * 2);
            ctx.arc(dynX + 5, dynY + 8, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        bakeGrannyWolf(ctx) {
            const F = FRAME_SIZE;
            const targetW = 130;
            const targetH = 145;

            // Row 0: walk (8 frames) - 바구니 흔들며 능청스럽게 손인사 보행
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const phase = (f / 8) * Math.PI * 2;
                const bob = Math.sin(phase) * 3;
                const sway = Math.sin(phase) * 0.06;

                this.drawWolfTexture(ctx, 'granny', cx, cy + bob, targetW, targetH, {
                    rot: sway
                });

                // 능청스러운 인사 반짝이 하트/음표 (프레임 1, 5)
                if (f === 1 || f === 5) {
                    ctx.fillStyle = '#e91e63';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('♥', cx + 18, cy - 26 + bob);
                }
            }

            // Row 1: scary_rush (8 frames) - 변장을 찢어발기고 맹렬하게 무섭게 달려드는 늑대 본체!
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 1 * F + F / 2;
                const phase = (f / 8) * Math.PI * 2;
                const bob = Math.abs(Math.sin(phase)) * 6;
                const tilt = Math.sin(phase) * 0.08 - 0.04;
                const strideLunge = (f % 2 === 0 ? -4 : 6);

                if (this.baseImages['granny_revealed']) {
                    this.drawWolfTexture(ctx, 'granny_revealed', cx + strideLunge, cy - bob, 155, 125, {
                        rot: tilt
                    });
                } else {
                    this.drawScaryRevealedWolf(ctx, cx + strideLunge, cy - bob, targetW + 15, targetH - 25, {
                        rot: tilt,
                        mouthOpen: 0.8 + Math.sin(phase) * 0.4
                    });
                }

                // 돌격 먼지 이펙트 (프레임 2, 6)
                if (f === 2 || f === 6) {
                    ctx.fillStyle = '#8d6e63';
                    ctx.beginPath();
                    ctx.arc(cx + 36, cy + 42, 5, 0, Math.PI * 2);
                    ctx.arc(cx + 46, cy + 44, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Row 2: scary_bite (6 frames) - 야수 돌진 물어뜯기 & 참격
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 2 * F + F / 2;
                let lunge = 0, scale = 1.0, rot = 0;

                if (f === 0) { lunge = 6; rot = -0.1; }
                else if (f === 1) { lunge = -10; rot = 0.12; scale = 1.08; }
                else if (f === 2) { lunge = -26; rot = 0.22; scale = 1.2; } // 물어뜯기 참격!
                else if (f === 3) { lunge = -18; rot = 0.15; scale = 1.15; }
                else if (f === 4) { lunge = -8; rot = 0.06; scale = 1.05; }
                else { lunge = 0; rot = 0; }

                if (this.baseImages['granny_revealed']) {
                    this.drawWolfTexture(ctx, 'granny_revealed', cx + lunge, cy, 155, 125, {
                        lunge: lunge,
                        rot: rot,
                        scaleX: scale,
                        scaleY: scale
                    });
                    // 붉은 참격 이펙트 (프레임 2, 3)
                    if (f === 2 || f === 3) {
                        ctx.save();
                        ctx.strokeStyle = '#ff1744';
                        ctx.lineWidth = 3.5;
                        for (let s = 0; s < 3; s++) {
                            ctx.beginPath();
                            ctx.moveTo(cx - 45 - s * 8, cy - 25 + s * 14);
                            ctx.lineTo(cx - 75 - s * 6, cy + 15 + s * 14);
                            ctx.stroke();
                        }
                        ctx.restore();
                    }
                } else {
                    this.drawScaryRevealedWolf(ctx, cx, cy, targetW + 15, targetH - 25, {
                        lunge: lunge,
                        rot: rot,
                        scaleX: scale,
                        scaleY: scale,
                        mouthOpen: (f >= 2 ? 1.8 : 0.8),
                        clawSlash: f === 2 || f === 3
                    });
                }
            }

            // Row 3: hurt (4 frames) - 피격 리액션
            for (let f = 0; f < 4; f++) {
                const cx = f * F + F / 2;
                const cy = 3 * F + F / 2;
                const recoil = (f === 0 ? 12 : (f === 1 ? 18 : 6));
                if (this.baseImages['granny_revealed']) {
                    this.drawWolfTexture(ctx, 'granny_revealed', cx + recoil, cy, 155, 125, {
                        rot: 0.15
                    });
                } else {
                    this.drawScaryRevealedWolf(ctx, cx, cy, targetW + 15, targetH - 25, {
                        lunge: recoil,
                        rot: 0.2,
                        mouthOpen: 1.6
                    });
                }
            }
        }

        // =========================================================================
        // 4. 풍선 폭격수 늑대 (Balloon Wolf) 시트 베이킹
        // =========================================================================
        bakeBalloonWolf(ctx) {
            const F = FRAME_SIZE;
            const targetW = 145;
            const targetH = 195;

            // Row 0: float (6 frames) - 풍선 흔들림 & 대롱대롱 부유
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const phase = (f / 6) * Math.PI * 2;
                const floatY = Math.sin(phase) * 6;
                const swayRot = Math.sin(phase) * 0.08;

                this.drawWolfTexture(ctx, 'balloon', cx, cy + floatY, targetW, targetH, {
                    rot: swayRot
                });
            }

            // Row 1: drop_bomb (6 frames) - 도화선 폭탄 투하 액션
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 1 * F + F / 2;

                this.drawWolfTexture(ctx, 'balloon', cx, cy, targetW, targetH);

                // 떨어지는 폭탄 애니메이션
                if (f >= 2) {
                    const bombY = cy + 10 + (f - 2) * 14;
                    ctx.fillStyle = '#212121';
                    ctx.beginPath();
                    ctx.arc(cx - 10, bombY, 8, 0, Math.PI * 2);
                    ctx.fill();

                    // 도화선 불꽃
                    ctx.fillStyle = '#ff9800';
                    ctx.beginPath();
                    ctx.arc(cx - 6, bombY - 9, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Row 2: pop_fall (6 frames) - 풍선 터짐 & 파일럿 늑대 추락
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 2 * F + F / 2;
                const fallY = f * 8;
                const spinRot = Math.sin(f * 0.8) * 0.25;

                const texKey = this.baseImages['balloon_ground'] ? 'balloon_ground' : 'balloon';
                const texSize = this.baseImages['balloon_ground'] ? 145 : targetW;
                this.drawWolfTexture(ctx, texKey, cx, cy + fallY, texSize, texSize, {
                    rot: spinRot,
                    scaleX: 1 - f * 0.04,
                    scaleY: 1 - f * 0.04
                });

                // 풍선 터짐 파편 (프레임 0, 1)
                if (f === 0 || f === 1) {
                    ctx.fillStyle = '#ffd600';
                    for (let p = 0; p < 8; p++) {
                        const ang = (p / 8) * Math.PI * 2;
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(ang) * (30 + f * 10), cy - 40 + Math.sin(ang) * (30 + f * 10), 3.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            // Row 3: ground_run (8 frames) - 풍선 격추 후 파일럿 늑대 캐릭터 그대로 지상 질주!
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 3 * F + F / 2;
                const stepPhase = (f / 8) * Math.PI * 2;
                const bob = Math.sin(stepPhase) * 4;
                const tilt = Math.sin(stepPhase) * 0.06;

                if (this.baseImages['balloon_ground']) {
                    this.drawWolfTexture(ctx, 'balloon_ground', cx, cy + bob, 180, 150, {
                        rot: tilt
                    });
                } else {
                    this.drawAviatorPilotWolf(ctx, cx, cy, 175, 130, {
                        stepPhase: stepPhase,
                        rot: -0.06
                    });
                }

                // 발밑 흙먼지 파티클 (프레임 2, 6)
                if (f === 2 || f === 6) {
                    ctx.fillStyle = '#8d6e63';
                    ctx.beginPath();
                    ctx.arc(cx + 25, cy + 38, 4, 0, Math.PI * 2);
                    ctx.arc(cx + 34, cy + 40, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Row 4: ground_attack (6 frames) - 파일럿 몸통 박치기 / 시한폭탄 자폭 돌격
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 4 * F + F / 2;
                let lunge = 0, scale = 1.0, rot = 0;

                if (f === 0) { lunge = 4; rot = 0.05; }
                else if (f === 1) { lunge = -10; rot = -0.12; scale = 1.08; }
                else if (f === 2) { lunge = -22; rot = -0.2; scale = 1.15; } // 폭탄 자폭 돌격!
                else if (f === 3) { lunge = -16; rot = -0.12; scale = 1.1; }
                else { lunge = 0; rot = 0; }

                if (this.baseImages['balloon_ground']) {
                    this.drawWolfTexture(ctx, 'balloon_ground', cx + lunge, cy, 180, 150, {
                        rot: rot,
                        scaleX: scale,
                        scaleY: scale
                    });
                    // 폭탄 점화 불꽃 & 충격파 스파크 (프레임 2, 3)
                    if (f === 2 || f === 3) {
                        ctx.fillStyle = '#ff9800';
                        ctx.beginPath();
                        ctx.arc(cx - 40, cy + 5, 8, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(cx - 40, cy + 5, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else {
                    this.drawAviatorPilotWolf(ctx, cx + lunge, cy, 175, 130, {
                        stepPhase: 0,
                        rot: rot,
                        scaleX: scale,
                        scaleY: scale,
                        isAttacking: f >= 2 && f <= 4
                    });
                }
            }
        }

        // =========================================================================
        // 5. 바람 늑대 (Blower Wolf) 시트 베이킹
        // =========================================================================
        bakeBlowerWolf(ctx) {
            const F = FRAME_SIZE;
            const targetW = 175;
            const targetH = 130;

            // Row 0: walk (6 frames) - 성큼성큼 보행 (회오리바람 없이 깨끗한 본체 보행)
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const phase = (f / 6) * Math.PI * 2;
                const bob = Math.sin(phase) * 3;

                this.drawWolfTexture(ctx, 'blower', cx, cy + bob, targetW, targetH);
            }

            // Row 1: inhale (6 frames) - 볼을 거대하게 부풀리며 흡기
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 1 * F + F / 2;
                const puffScale = 1.0 + (f / 5) * 0.18; // 볼 빵빵

                this.drawWolfTexture(ctx, 'blower', cx, cy, targetW, targetH, {
                    scaleX: puffScale,
                    scaleY: puffScale
                });

                // 흡기 소용돌이선 (입 안으로 빨려들어가는 푸른 기류)
                ctx.strokeStyle = 'rgba(129, 212, 250, 0.7)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx - 36, cy - 8, 12 - f * 1.5, 0, Math.PI * 1.5);
                ctx.stroke();
            }

            // Row 2: blow_tornado (8 frames) - 거대한 하얀 회오리 돌풍 발사!
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 2 * F + F / 2;
                const recoil = Math.sin((f / 8) * Math.PI) * 6;

                this.drawWolfTexture(ctx, 'blower', cx + recoil, cy, targetW, targetH);

                // 고화질 다이내믹 회오리바람 이펙트 (입에서 전방으로 길게 뿜어져 나옴)
                const gustLen = 45 + f * 9;
                ctx.save();
                ctx.translate(cx - 45, cy - 8);

                // 1. 회오리 중심 코어 소용돌이
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                for (let x = 0; x < gustLen; x += 3) {
                    const wave = Math.sin((x * 0.22) + (f * 1.0)) * (7 + x * 0.22);
                    if (x === 0) ctx.moveTo(-x, wave);
                    else ctx.lineTo(-x, wave);
                }
                ctx.stroke();

                // 2. 푸른빛 외곽 돌풍 기류
                ctx.strokeStyle = 'rgba(178, 235, 242, 0.75)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                for (let x = 0; x < gustLen; x += 4) {
                    const wave = Math.cos((x * 0.22) + (f * 1.0)) * (9 + x * 0.26);
                    if (x === 0) ctx.moveTo(-x, wave);
                    else ctx.lineTo(-x, wave);
                }
                ctx.stroke();

                // 3. 전방 회전 원형 돌풍 링 (프레임별 이동)
                const ringX = -15 - (f * 10);
                const ringR = 10 + f * 3.5;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.ellipse(ringX, 0, ringR * 0.5, ringR, 0, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            }
        }

        // =========================================================================
        // 6. 중간보스 돌격대장 (MidBoss Wolf) 시트 베이킹 (160x160 대형)
        // =========================================================================
        bakeMidBossWolf(ctx) {
            const F = BOSS_FRAME_SIZE;
            const targetW = 205;
            const targetH = 195;

            // Row 0: march (8 frames) - 묵직한 흑기사 행진
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const phase = (f / 8) * Math.PI * 2;
                const bob = Math.sin(phase) * 4;
                const capeWave = Math.cos(phase) * 0.08;

                this.drawWolfTexture(ctx, 'midboss', cx, cy + bob, targetW, targetH, {
                    rot: capeWave
                });
            }

            // Row 1: charge (6 frames) - 맹렬한 흑기사 돌진 & 흙먼지 폭풍
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 1 * F + F / 2;
                const forward = -14 + (f % 2 === 0 ? 3 : -3);

                // 불타는 돌진 잔상
                this.drawWolfTexture(ctx, 'midboss', cx + 18, cy, targetW, targetH, {
                    alpha: 0.35,
                    rot: 0.12
                });
                this.drawWolfTexture(ctx, 'midboss', cx + forward, cy, targetW, targetH, {
                    rot: 0.15,
                    scaleX: 1.08,
                    scaleY: 0.95
                });

                // 발밑 흙먼지
                ctx.fillStyle = '#8d6e63';
                ctx.beginPath();
                ctx.arc(cx + 36, cy + 34, 8, 0, Math.PI * 2);
                ctx.arc(cx + 48, cy + 30, 6, 0, Math.PI * 2);
                ctx.fill();
            }

            // Row 2: axe_throw (8 frames) - 쌍날 전투 도끼 호쾌한 투척
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 2 * F + F / 2;
                let rot = 0, offX = 0;

                if (f < 3) { rot = -0.25; offX = 10; } // 와인드업
                else if (f === 3) { rot = 0.3; offX = -20; } // 투척 릴리즈!
                else if (f === 4) { rot = 0.2; offX = -12; }
                else { rot = 0; offX = 0; }

                this.drawWolfTexture(ctx, 'midboss', cx + offX, cy, targetW, targetH, {
                    rot: rot
                });

                // 날아가는 회전 도끼 궤적 (프레임 3~5)
                if (f >= 3 && f <= 5) {
                    const axeX = cx - 35 - (f - 3) * 22;
                    ctx.save();
                    ctx.translate(axeX, cy - 10);
                    ctx.rotate((f * 1.8));
                    ctx.fillStyle = '#78909c';
                    ctx.fillRect(-4, -14, 8, 28);
                    ctx.fillRect(-14, -6, 28, 12);
                    ctx.restore();
                }
            }

            // Row 3: hurt (4 frames) - 갑옷 튕겨내기 방어
            for (let f = 0; f < 4; f++) {
                const cx = f * F + F / 2;
                const cy = 3 * F + F / 2;
                this.drawWolfTexture(ctx, 'midboss', cx + (f < 2 ? 10 : 2), cy, targetW, targetH);
                if (f === 0 || f === 1) {
                    ctx.fillStyle = '#00e5ff';
                    ctx.fillRect(cx - 20, cy - 20, 8, 8);
                }
            }
        }

        // =========================================================================
        // 7. 빅 배드 울프 제왕 (Boss Wolf) 시트 베이킹 (160x160 대형)
        // =========================================================================
        bakeBossWolf(ctx) {
            const F = BOSS_FRAME_SIZE;
            const targetW = 235;
            const targetH = 235;

            // Row 0: emperor_walk (8 frames) - 제왕의 위엄 있는 전진
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const phase = (f / 8) * Math.PI * 2;
                const bob = Math.sin(phase) * 3;
                const capeWave = Math.sin(phase) * 0.05;

                this.drawWolfTexture(ctx, 'boss', cx, cy + bob, targetW, targetH, {
                    rot: capeWave
                });

                // 왕관 보석 반짝임 (프레임 0, 4)
                if (f === 0 || f === 4) {
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(cx - 24, cy - 48 + bob, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Row 1: laser_roar (8 frames) - 붉은 제왕의 파괴 레이저 포효
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 1 * F + F / 2;
                let rot = 0;

                if (f < 2) { rot = -0.15; } // 기 모으기
                else if (f >= 2 && f <= 5) { rot = 0.1; } // 레이저 발사!
                else { rot = 0; }

                this.drawWolfTexture(ctx, 'boss', cx, cy, targetW, targetH, {
                    rot: rot
                });

                // 광선은 EffectsRenderer에서 가슴 보석부터 집까지 실시간으로 그린다.
            }

            // Row 2: claw_slash (6 frames) - 거대 황금 발톱의 참격
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 2 * F + F / 2;
                let offX = 0, rot = 0;

                if (f === 0) { offX = 6; rot = -0.2; }
                else if (f === 1) { offX = -20; rot = 0.25; } // 할퀴기!
                else if (f === 2) { offX = -12; rot = 0.15; }
                else { offX = 0; rot = 0; }

                    this.drawWolfTexture(ctx, 'boss', cx + offX, cy, targetW, targetH, {
                        rot: rot
                    });

                    // 황금빛 3연속 발톱 검기 (프레임 1, 2)
                    if (f === 1 || f === 2) {
                        ctx.strokeStyle = '#ffd700';
                        ctx.lineWidth = 3.5;
                        for (let c = 0; c < 3; c++) {
                            ctx.beginPath();
                            ctx.moveTo(cx - 45 + c * 5, cy - 30 + c * 14);
                            ctx.lineTo(cx - 70 + c * 5, cy - 10 + c * 14);
                            ctx.stroke();
                        }
                    }
                }

                // Row 3: boulder_throw (8 frames) - 거대 암석 번쩍 들어 투척
                for (let f = 0; f < 8; f++) {
                    const cx = f * F + F / 2;
                    const cy = 3 * F + F / 2;

                    this.drawWolfTexture(ctx, 'boss', cx, cy, targetW, targetH);

                    // 암석 투척 애니메이션
                    if (f < 3) {
                        // 머리 위로 들어올림
                        ctx.fillStyle = '#5d4037';
                        ctx.beginPath();
                        ctx.arc(cx - 15, cy - 45 - f * 4, 18, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (f >= 3 && f <= 5) {
                        // 전방으로 포물선 투척
                        const bX = cx - 35 - (f - 3) * 20;
                        const bY = cy - 40 + (f - 3) * 12;
                        ctx.fillStyle = '#5d4037';
                        ctx.beginPath();
                        ctx.arc(bX, bY, 18, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

        // =========================================================================
        // 8. 양철 방패 탱커 늑대 (Shield Wolf) 시트 베이킹
        // =========================================================================
        bakeShieldWolf(ctx) {
            const F = FRAME_SIZE;
            const targetW = 165;
            const targetH = 150;

            // Row 0: run (8프레임) - 방패를 앞세우고 묵직하게 돌격
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const phase = (f / 8) * Math.PI * 2;
                const bob = Math.sin(phase) * 4;
                const tilt = Math.sin(phase) * 0.05;

                // 새 고화질 PNG 이미지 (황동빛 둥근 뚜껑 방패를 들고 왼쪽으로 돌격)
                this.drawWolfTexture(ctx, 'shield', cx, cy + bob, targetW, targetH, {
                    rot: tilt
                });

                // 뒤쪽(오른쪽) 발밑 질주 먼지
                if (f % 2 === 1) {
                    ctx.fillStyle = 'rgba(215,204,200,0.65)';
                    ctx.beginPath();
                    ctx.ellipse(cx + 38, cy + 28 + bob * 0.5, 14, 6, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Row 1: bite (6프레임) - 전용 방패 배쉬 돌진 및 강타 (wolf_shield_attack.png 사용!)
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 1 * F + F / 2;
                let offX = 0, rot = 0;
                if (f === 1) { offX = 14; rot = -0.15; }
                else if (f === 2) { offX = -28; rot = 0.2; }
                else if (f === 3) { offX = -16; rot = 0.1; }

                // 전용 공격 이미지(shield_attack)가 있으면 전방 배쉬 포즈로 전환!
                const attackType = (this.baseImages['shield_attack'] && this.baseImages['shield_attack'].complete) ? 'shield_attack' : 'shield';
                this.drawWolfTexture(ctx, attackType, cx + offX, cy, targetW, targetH, { rot });

                // 전방(왼쪽) 충돌 충격파 이펙트 (f=2)
                if (f === 2) {
                    ctx.save();
                    ctx.translate(cx + offX - 52, cy - 8);
                    ctx.fillStyle = '#ffeb3b';
                    for (let s = 0; s < 8; s++) {
                        const r = s % 2 === 0 ? 16 : 6;
                        const a = (s / 8) * Math.PI * 2;
                        s === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                                : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Row 2: hurt (4프레임) - 피격 경직 및 반동
            for (let f = 0; f < 4; f++) {
                const cx = f * F + F / 2;
                const cy = 2 * F + F / 2;
                const recoil = f < 2 ? (f === 0 ? 14 : 22) : (f === 2 ? 8 : 0);
                this.drawWolfTexture(ctx, 'shield', cx + recoil, cy, targetW, targetH, {
                    rot: f < 2 ? 0.18 : 0.04
                });
                // 피격 스파크
                if (f === 0 || f === 1) {
                    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(cx + recoil - 45, cy - 14); ctx.lineTo(cx + recoil - 56, cy - 24);
                    ctx.moveTo(cx + recoil - 45, cy + 8); ctx.lineTo(cx + recoil - 56, cy + 18);
                    ctx.stroke();
                }
            }
        }

        // =========================================================================
        // 8-2. 방패 파괴 맨몸 늑대 (Shield Broken Wolf) 시트 베이킹
        // =========================================================================
        bakeShieldBrokenWolf(ctx) {
            const F = FRAME_SIZE;
            const targetW = 160;
            const targetH = 145;

            // Row 0: run (8프레임) - 방패 없이 양손 허우적거리며 헐레벌떡 전력 질주
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const phase = (f / 8) * Math.PI * 2;
                const hop = Math.abs(Math.sin(phase)) * 6;
                const tilt = Math.sin(phase) * 0.08;

                // wolf_shield_broken.png 렌더링
                const brokenType = (this.baseImages['shield_broken'] && this.baseImages['shield_broken'].complete) ? 'shield_broken' : 'normal';
                this.drawWolfTexture(ctx, brokenType, cx, cy - hop, targetW, targetH, { rot: tilt });

                // 발밑 헐레벌떡 모래먼지 (홀수 프레임)
                if (f % 2 === 1) {
                    ctx.fillStyle = 'rgba(215,204,200,0.65)';
                    ctx.beginPath();
                    ctx.ellipse(cx + 32, cy + 26 - hop * 0.5, 12, 5, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Row 1: hurt (4프레임) - 피격 경직
            for (let f = 0; f < 4; f++) {
                const cx = f * F + F / 2;
                const cy = 1 * F + F / 2;
                const recoil = f < 2 ? (f === 0 ? 12 : 20) : (f === 2 ? 6 : 0);
                const brokenType = (this.baseImages['shield_broken'] && this.baseImages['shield_broken'].complete) ? 'shield_broken' : 'normal';
                this.drawWolfTexture(ctx, brokenType, cx + recoil, cy, targetW, targetH, {
                    rot: f < 2 ? 0.2 : 0.05
                });
            }
        }

        // =========================================================================
        // 9. 우산 공수 늑대 (Umbrella Wolf) 시트 베이킹
        // =========================================================================
        bakeUmbrellaWolf(ctx) {
            const F = FRAME_SIZE;
            const targetW = 140;
            const targetH = 180;

            // Row 0: run (8프레임) - 우산을 들고 공중 활강
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const phase = (f / 8) * Math.PI * 2;
                const bob = Math.sin(phase) * 4.5;
                const sway = Math.cos(phase) * 0.06;

                // PNG 이미지 (우산+늑대 전체 포함, 위쪽 여유 공간)
                this.drawWolfTexture(ctx, 'umbrella', cx, cy + bob - 20, targetW, targetH, { rot: sway });

                // 활강 기류선 효과 (f 2~5)
                if (f >= 2 && f <= 5) {
                    ctx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
                    ctx.lineWidth = 1.5;
                    for (let l = 0; l < 3; l++) {
                        ctx.beginPath();
                        ctx.moveTo(cx + 28, cy + bob - 10 + l * 14);
                        ctx.lineTo(cx + 46, cy + bob - 10 + l * 14);
                        ctx.stroke();
                    }
                }
            }

            // Row 1: bite (6프레임) - 우산 몽둥이 공격
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 1 * F + F / 2;
                let offX = 0, rot = 0;
                if (f === 1) { offX = 10; rot = -0.2; }
                else if (f === 2) { offX = -20; rot = 0.25; }
                else if (f === 3) { offX = -10; rot = 0.1; }

                this.drawWolfTexture(ctx, 'umbrella', cx + offX, cy, targetW, targetH, { rot });

                // 우산(뒤집힌 몽둥이)
                ctx.save();
                ctx.translate(cx + offX - 14, cy - 28);
                ctx.rotate(-0.5 + rot * 0.8);
                ctx.strokeStyle = '#37474f'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, 18); ctx.stroke();
                ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 5;
                ctx.beginPath(); ctx.arc(-5, 20, 5, 0, Math.PI); ctx.stroke();
                ctx.restore();

                if (f === 2) {
                    ctx.fillStyle = '#ffeb3b';
                    ctx.beginPath();
                    ctx.arc(cx + offX - 44, cy - 6, 12, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Row 2: hurt (4프레임)
            for (let f = 0; f < 4; f++) {
                const cx = f * F + F / 2;
                const cy = 2 * F + F / 2;
                const recoil = f === 0 ? 12 : f === 1 ? 20 : f === 2 ? 8 : 0;
                this.drawWolfTexture(ctx, 'umbrella', cx + recoil, cy, targetW, targetH, {
                    rot: f < 2 ? 0.2 : 0.04
                });
            }
        }

        // =========================================================================
        // 10. 미니 태엽 로봇 늑대 (Mini Wolf) 시트 베이킹
        // =========================================================================
        bakeMiniWolf(ctx) {
            const F = FRAME_SIZE;
            const targetW = 150;
            const targetH = 145;

            // Row 0: run (8프레임) - PNG 이미지 통통 달리기
            for (let f = 0; f < 8; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const phase = (f / 8) * Math.PI * 2;
                const hop = Math.abs(Math.sin(phase)) * 6;
                const tilt = Math.sin(phase) * 0.05;

                // PNG 이미지 (또는 폴백)
                this.drawWolfTexture(ctx, 'miniwolf', cx, cy - hop, targetW, targetH, { rot: tilt });

                // 발밑 질주 먼지 파티클 (홀수 프레임)
                if (f % 2 === 1) {
                    ctx.fillStyle = 'rgba(215,204,200,0.6)';
                    ctx.beginPath();
                    ctx.ellipse(cx + 25, cy + 28 - hop * 0.5, 12, 5, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Row 1: bite (6프레임) - 물기 PNG + 임팩트 이펙트
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 1 * F + F / 2;
                let offX = 0, rot = 0;
                if (f === 1) { offX = 8; rot = -0.12; }
                else if (f === 2) { offX = -14; rot = 0.18; }
                else if (f === 3) { offX = -8; rot = 0.08; }

                this.drawWolfTexture(ctx, 'miniwolf', cx + offX, cy, targetW, targetH, { rot });

                // 임팩트 이펙트 (f=2 전방 물기)
                if (f === 2) {
                    ctx.save();
                    ctx.translate(cx + offX - 45, cy - 10);
                    ctx.fillStyle = '#ffeb3b';
                    for (let s = 0; s < 8; s++) {
                        const r = s % 2 === 0 ? 12 : 5;
                        const a = (s / 8) * Math.PI * 2;
                        s === 0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r)
                                : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Row 2: hurt (4프레임) - 피격 경직 PNG + 별 이펙트
            for (let f = 0; f < 4; f++) {
                const cx = f * F + F / 2;
                const cy = 2 * F + F / 2;
                const recoil = f === 0 ? 10 : f === 1 ? 18 : f === 2 ? 6 : 0;
                const rot = f < 2 ? 0.2 : 0.04;

                this.drawWolfTexture(ctx, 'miniwolf', cx + recoil, cy, targetW, targetH, { rot });

                // 어지럼증 별
                if (f <= 1) {
                    ctx.save();
                    ctx.translate(cx + recoil - 10, cy - 45);
                    ctx.fillStyle = '#ffeb3b';
                    ctx.beginPath();
                    ctx.arc(Math.cos(f * 2.1) * 14, Math.sin(f * 2.1) * 6, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
        }

        // =========================================================================
        // 11. 미니 태엽 낙하산 늑대 (MiniWolf Parachute) 시트 베이킹
        // =========================================================================
        bakeMiniWolfPara(ctx) {
            const F = FRAME_SIZE;
            const targetW = 168;
            const targetH = 168;

            // Row 0: fall (6프레임) - 낙하산 타고 흔들리며 하강
            for (let f = 0; f < 6; f++) {
                const cx = f * F + F / 2;
                const cy = 0 * F + F / 2;
                const sway = Math.sin((f / 6) * Math.PI * 2) * 0.08;

                // PNG 이미지 (낙하산+로봇 늑대 전체)
                this.drawWolfTexture(ctx, 'miniwolf_para', cx, cy, targetW, targetH, { rot: sway });

                // 흔들림 기류선
                if (f % 2 === 0) {
                    ctx.strokeStyle = 'rgba(200,240,255,0.4)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(cx + 30, cy - 30);
                    ctx.lineTo(cx + 42, cy - 40);
                    ctx.stroke();
                }
            }
        }

    // 싱글톤 시트 생성기 인스턴스
    }
    const generator = new WolfSpriteSheetGenerator();


    /**
     * 🎬 WolfAnimator: 개별 늑대 인스턴스에 탑재되는 프레임 애니메이터
     */
    class WolfAnimator {
        constructor(wolfType) {
            this.wolfType = wolfType;
            this.config = WOLF_CONFIGS[wolfType] || WOLF_CONFIGS.normal;
            this.defaultAction = null;
            this.currentAction = this.getDefaultAction();
            this.frameIndex = 0;
            this.timer = 0;
            this.speedMultiplier = 1.0;
            this.customFps = null;
            this.customLoop = null;
            this.isFinished = false;
            this.onCompleteCallback = null;
        }

        getDefaultAction() {
            if (this.defaultAction && this.config.actions && this.config.actions[this.defaultAction]) return this.defaultAction;
            if (this.wolfType === 'normal') return 'run';
            if (this.wolfType === 'skater') return 'skate';
            if (this.wolfType === 'granny') return 'walk';
            if (this.wolfType === 'balloon') return 'float';
            if (this.wolfType === 'blower') return 'walk';
            if (this.wolfType === 'midboss') return 'march';
            if (this.wolfType === 'boss') return 'emperor_walk';
            if (this.wolfType === 'shield') return 'run';
            if (this.wolfType === 'umbrella') return 'run';
            if (this.wolfType === 'miniwolf') return 'run';
            if (this.wolfType === 'miniwolf_para') return 'fall';
            if (this.config && this.config.actions) {
                const firstKey = Object.keys(this.config.actions)[0];
                if (firstKey) return firstKey;
            }
            return 'run';
        }

        playAction(actionName, loop = null, onComplete = null, customFps = null, forceRestart = false) {
            if (!this.config.actions[actionName]) return;
            if (this.currentAction === actionName && !this.isFinished && !forceRestart) return;

            this.currentAction = actionName;
            this.frameIndex = 0;
            this.timer = 0;
            this.isFinished = false;
            this.customLoop = loop;
            this.onCompleteCallback = onComplete;
            this.customFps = customFps;
        }

        update(dt) {
            const act = this.config.actions[this.currentAction];
            if (!act) return;

            const baseFps = this.customFps || act.fps;
            const effectiveFps = baseFps * (this.speedMultiplier || 1.0);
            const frameDuration = 1000 / effectiveFps;
            this.timer += dt * 1000;

            const shouldLoop = (this.customLoop !== null && this.customLoop !== undefined) ? this.customLoop : act.loop;

            if (this.timer >= frameDuration) {
                this.timer -= frameDuration;
                this.frameIndex++;

                if (this.frameIndex >= act.frameCount) {
                    if (shouldLoop) {
                        this.frameIndex = 0;
                    } else {
                        this.frameIndex = act.frameCount - 1;
                        this.isFinished = true;
                        if (this.onCompleteCallback) {
                            const cb = this.onCompleteCallback;
                            this.onCompleteCallback = null;
                            cb();
                        }
                        // 기본 기본 액션으로 자연스러운 복귀
                        this.currentAction = this.getDefaultAction();
                        this.frameIndex = 0;
                        this.timer = 0;
                        this.customFps = null;
                        this.customLoop = null;
                    }
                }
            }
        }

        draw(ctx, destX, destY, destW, destH) {
            const canvas = generator.getCanvas(this.wolfType);
            if (!canvas) return;
            const defAct = this.getDefaultAction();
            const act = (this.config.actions && this.config.actions[this.currentAction])
                     || (this.config.actions && this.config.actions[defAct])
                     || (this.config.actions && Object.values(this.config.actions)[0]);
            if (!act) return;
            const frameW = this.config.frameW;
            const frameH = this.config.frameH;

            const safeFrame = (this.frameIndex || 0) % (act.frameCount || 1);
            const sx = safeFrame * frameW;
            const sy = (act.row || 0) * frameH;

            ctx.drawImage(
                canvas,
                sx, sy, frameW, frameH,
                destX - destW / 2, destY - destH / 2, destW, destH
            );
        }

        get isReady() {
            return generator.isReady[this.wolfType] === true;
        }
    }

    // 전역 시스템 등록
    window.WolfSpriteSystem = {
        generator,
        WolfAnimator,
        WOLF_CONFIGS
    };

})(window);
