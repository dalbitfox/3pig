/**
 * =========================================================================================
 * 🐷 pig_sprites.js - 아기돼지 삼형제 Sprite Sheet 기반 프레임 애니메이션 엔진
 * =========================================================================================
 * [기능 명세]
 * 1. 첫째 돼지 (1층):
 *    - idle: 편안한 호흡 및 볏짚 바운스 (6 프레임)
 *    - roll_straw: 짚다발을 양손으로 힘껏 밀어 굴리는 액션 (8 프레임)
 * 
 * 2. 둘째 돼지 (2층):
 *    - idle: 고글 착용 및 Y새총 견착 조준 (6 프레임)
 *    - slingshot_shoot: Y자 새총 고무줄을 힘껏 당겼다 놓는 스냅 사격 액션 (6 프레임)
 *    - bomb_throw: 다이너마이트/폭죽 폭탄에 불을 붙여 힘차게 와인드업 후 투척 (8 프레임)
 * 
 * 3. 셋째 돼지 (3층):
 *    - idle: 안전모 착용 및 어깨에 황금망치를 얹고 전방 주시 (6 프레임)
 *    - hammer_repair: 황금망치를 머리 위로 번쩍 들어 집 벽돌을 쾅쾅 두드리는 수리 액션 (8 프레임)
 *    - shield_block: 거대한 성벽 방패를 전방에 내리꽂고 육각 에너지 방어막을 전개하는 액션 (8 프레임)
 * =========================================================================================
 */

(function (window) {
    'use strict';

    const FRAME_SIZE = 128; // 프레임 가로/세로 해상도 (고화질)

    // 각 돼지별 액션 정의 및 시트 메타데이터
    const PIG_CONFIGS = {
        1: {
            name: '첫째 돼지',
            role: '짚의 명인 (1층)',
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 2 * FRAME_SIZE,
            actions: {
                idle: { row: 0, frameCount: 6, fps: 7, loop: true },
                roll_straw: { row: 1, frameCount: 8, fps: 12, loop: false }
            }
        },
        2: {
            name: '둘째 돼지',
            role: '도토리 명사수 (2층)',
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 5 * FRAME_SIZE,
            actions: {
                idle: { row: 0, frameCount: 6, fps: 8, loop: true },
                slingshot_shoot: { row: 1, frameCount: 6, fps: 16, loop: false },
                bomb_throw: { row: 2, frameCount: 8, fps: 13, loop: false },
                rapid_shoot: { row: 3, frameCount: 6, fps: 22, loop: false },
                gatling_shoot: { row: 4, frameCount: 6, fps: 30, loop: false }
            }
        },
        3: {
            name: '셋째 돼지',
            role: '벽돌 마스터 (3층)',
            sheetWidth: 8 * FRAME_SIZE,
            sheetHeight: 3 * FRAME_SIZE,
            actions: {
                idle: { row: 0, frameCount: 6, fps: 6, loop: true },
                hammer_repair: { row: 1, frameCount: 8, fps: 12, loop: false },
                shield_block: { row: 2, frameCount: 8, fps: 10, loop: false }
            }
        }
    };

    /**
     * 🎨 Sprite Sheet 생성기 (오프스크린 캔버스에 각 프레임을 정밀 베이킹)
     */
    class PigSpriteSheetGenerator {
        constructor() {
            this.canvases = {};
            this.contexts = {};
            this.baseImages = { 1: null, 2: null, 3: null };
            this.isReady = { 1: false, 2: false, 3: false };

            // 초기 생성 즉시 폴백 벡터로 1회 사전 베이킹 -> 이미지 로딩 중에도 투명화/깜빡임 100% 방지!
            for (let id = 1; id <= 3; id++) {
                this.bakeSheet(id);
            }

            this.loadBaseImages();
        }

        loadBaseImages() {
            for (let id = 1; id <= 3; id++) {
                const src = `assets/pig${id}.png`;
                const img = window.gameAssets ? window.gameAssets.image(src) : new Image();
                const onLoad = () => {
                    this.baseImages[id] = img;
                    this.bakeSheet(id);
                    this.isReady[id] = true;
                };
                const onError = () => {
                    // 이미지 로드 실패 시에도 폴백 유지
                    this.isReady[id] = true;
                };
                if (!img.src) img.src = src;
                if (img.complete) {
                    if (img.naturalWidth > 0) onLoad();
                    else onError();
                } else {
                    img.addEventListener('load', onLoad, { once: true });
                    img.addEventListener('error', onError, { once: true });
                }
            }
        }

        getCanvas(pigId) {
            if (!this.canvases[pigId]) {
                const cfg = PIG_CONFIGS[pigId];
                const c = document.createElement('canvas');
                c.width = cfg.sheetWidth;
                c.height = cfg.sheetHeight;
                this.canvases[pigId] = c;
                this.contexts[pigId] = c.getContext('2d');
            }
            return this.canvases[pigId];
        }

        bakeSheet(pigId) {
            const canvas = this.getCanvas(pigId);
            const ctx = this.contexts[pigId];
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (pigId === 1) {
                this.bakePig1(ctx);
            } else if (pigId === 2) {
                this.bakePig2(ctx);
            } else if (pigId === 3) {
                this.bakePig3(ctx);
            }
            this.isReady[pigId] = true;
        }

        // 베이스 돼지 본체 그리기 헬퍼
        drawPigBody(ctx, pigId, cx, cy, options = {}) {
            const { scaleX = 1, scaleY = 1, rot = 0, offsetX = 0, offsetY = 0 } = options;
            ctx.save();
            ctx.translate(cx + offsetX, cy + offsetY);
            ctx.rotate(rot);
            ctx.scale(scaleX, scaleY);

            const img = this.baseImages[pigId];
            const targetW = 68;
            const targetH = 82;

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
            } else {
                // 폴백 아기돼지 본체
                ctx.fillStyle = pigId === 1 ? '#f48fb1' : (pigId === 2 ? '#ff80ab' : '#f06292');
                ctx.beginPath();
                ctx.ellipse(0, 0, 26, 30, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#f06292';
                ctx.beginPath();
                ctx.ellipse(0, 4, 14, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#880e4f';
                ctx.beginPath();
                ctx.arc(-5, 4, 2.5, 0, Math.PI * 2);
                ctx.arc(5, 4, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // =========================================================================
        // 🌾 1. 첫째 돼지 스프라이트 시트 베이킹 (Idle & 짚다발 굴리기)
        // =========================================================================
        bakePig1(ctx) {
            const F = FRAME_SIZE;

            // Row 0: Idle (6 프레임) - 통통 튀는 호흡과 볏짚 흔들기
            for (let f = 0; f < 6; f++) {
                const ox = f * F;
                const oy = 0;
                const cx = ox + F / 2;
                const cy = oy + F / 2 + 10;

                const bob = Math.sin((f / 6) * Math.PI * 2) * 3;
                const squishX = 1 + Math.sin((f / 6) * Math.PI * 2) * 0.04;
                const squishY = 1 - Math.sin((f / 6) * Math.PI * 2) * 0.04;

                // 본체
                this.drawPigBody(ctx, 1, cx, cy + bob, { scaleX: squishX, scaleY: squishY, rot: (f % 2 === 0 ? 0.03 : -0.03) });

                // 입에 문 황금 볏짚 한 줄기
                ctx.save();
                ctx.translate(cx + 8, cy + bob - 4);
                ctx.rotate(Math.sin((f / 6) * Math.PI * 2) * 0.2);
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(12, -4, 20, 4);
                ctx.stroke();
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.ellipse(20, 4, 4, 2, 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Row 1: Roll Straw (8 프레임) - 짚다발 굴리기 대작전!
            // Frame 0: 뒤로 젖히며 힘 모으기
            // Frame 1: 앞으로 숙이며 거대 짚다발 등장
            // Frame 2: 양손으로 짚다발 꽉 쥐기
            // Frame 3: 힘껏 밀기 시작! 짚다발 회전 시작
            // Frame 4: 최대 추진 파워! 짚다발 맹렬히 굴러감 & 흙먼지 팍!
            // Frame 5: 짚다발 발사 및 양손 뻗은 팔로우 스루
            // Frame 6: 으랏차차 기쁨의 주먹 불끈!
            // Frame 7: 기립 복귀
            const strawBaleRadius = 26;

            for (let f = 0; f < 8; f++) {
                const ox = f * F;
                const oy = F;
                const cx = ox + F / 2 - 14;
                const cy = oy + F / 2 + 10;

                let bodyRot = 0;
                let bodyOffX = 0;
                let bodyOffY = 0;
                let strawX = 0;
                let strawY = 0;
                let strawRot = 0;
                let showStraw = false;
                let armState = 0; // 0: 준비, 1: 잡기, 2: 밀기, 3: 팔로우, 4: 승리포즈

                if (f === 0) {
                    bodyRot = -0.15;
                    bodyOffX = -8;
                    bodyOffY = -4;
                    armState = 0;
                } else if (f === 1) {
                    bodyRot = 0.05;
                    bodyOffX = -2;
                    showStraw = true;
                    strawX = cx + 32;
                    strawY = cy + 12;
                    strawRot = 0;
                    armState = 1;
                } else if (f === 2) {
                    bodyRot = 0.22;
                    bodyOffX = 6;
                    bodyOffY = 4;
                    showStraw = true;
                    strawX = cx + 36;
                    strawY = cy + 12;
                    strawRot = 0.4;
                    armState = 1;
                } else if (f === 3) {
                    bodyRot = 0.35;
                    bodyOffX = 14;
                    bodyOffY = 6;
                    showStraw = true;
                    strawX = cx + 46;
                    strawY = cy + 12;
                    strawRot = 1.4;
                    armState = 2;
                } else if (f === 4) {
                    bodyRot = 0.42;
                    bodyOffX = 20;
                    bodyOffY = 8;
                    showStraw = true;
                    strawX = cx + 64;
                    strawY = cy + 12;
                    strawRot = 3.2;
                    armState = 3;
                } else if (f === 5) {
                    bodyRot = 0.25;
                    bodyOffX = 12;
                    bodyOffY = 4;
                    armState = 3;
                } else if (f === 6) {
                    bodyRot = -0.12;
                    bodyOffX = 0;
                    bodyOffY = -8;
                    armState = 4;
                } else if (f === 7) {
                    bodyRot = -0.02;
                    bodyOffX = 0;
                    bodyOffY = 0;
                    armState = 0;
                }

                // 흙먼지 파티클 (프레임 3, 4)
                if (f === 3 || f === 4) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(217, 119, 6, 0.4)';
                    ctx.beginPath();
                    ctx.arc(cx - 10, cy + 28, 6, 0, Math.PI * 2);
                    ctx.arc(cx - 18, cy + 25, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // 본체 렌더링
                this.drawPigBody(ctx, 1, cx, cy, { offsetX: bodyOffX, offsetY: bodyOffY, rot: bodyRot });

                // 거대 짚다발 렌더링
                if (showStraw) {
                    this.renderStrawBale(ctx, strawX, strawY, strawBaleRadius, strawRot);
                }

                // 양손 액션 렌더링 (짚다발 밀기 모션)
                ctx.save();
                ctx.fillStyle = '#f48fb1';
                ctx.strokeStyle = '#c2185b';
                ctx.lineWidth = 2;

                if (armState === 1) { // 짚다발 쥐기
                    ctx.beginPath();
                    ctx.arc(cx + bodyOffX + 16, cy + bodyOffY + 4, 7, 0, Math.PI * 2);
                    ctx.arc(cx + bodyOffX + 26, cy + bodyOffY + 12, 7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                } else if (armState === 2) { // 힘껏 밀기
                    ctx.beginPath();
                    ctx.arc(cx + bodyOffX + 24, cy + bodyOffY + 2, 7, 0, Math.PI * 2);
                    ctx.arc(cx + bodyOffX + 34, cy + bodyOffY + 8, 7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                } else if (armState === 3) { // 밀어낸 후 양팔 뻗기
                    ctx.beginPath();
                    ctx.arc(cx + bodyOffX + 26, cy + bodyOffY - 4, 7, 0, Math.PI * 2);
                    ctx.arc(cx + bodyOffX + 32, cy + bodyOffY + 6, 7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    // 추진 바람선
                    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(cx + bodyOffX + 38, cy + bodyOffY);
                    ctx.lineTo(cx + bodyOffX + 54, cy + bodyOffY);
                    ctx.stroke();
                } else if (armState === 4) { // 승리의 만세/불끈 포즈
                    ctx.beginPath();
                    ctx.arc(cx + bodyOffX - 16, cy + bodyOffY - 22, 8, 0, Math.PI * 2);
                    ctx.arc(cx + bodyOffX + 18, cy + bodyOffY - 22, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        // 짚다발 구체 렌더링 헬퍼
        renderStrawBale(ctx, x, y, r, rotation) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            // 짚단 기본 바탕
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // 볏짚 질감 소용돌이
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2;
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, (r / 3.5) * i, i * 0.8, i * 0.8 + Math.PI * 1.4);
                ctx.stroke();
            }

            // 볏짚 바깥 튀어나온 짚단 가닥들
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                const sx = Math.cos(a) * (r - 2);
                const sy = Math.sin(a) * (r - 2);
                const ex = Math.cos(a) * (r + 7);
                const ey = Math.sin(a) * (r + 7);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.stroke();
            }

            // 볏짚 묶음 밧줄 2줄
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(-r * 0.5, -r * 0.75, r, r * 1.5);

            ctx.restore();
        }

        // =========================================================================
        // 🌰 2. 둘째 돼지 스프라이트 시트 베이킹 (Idle & 새총 사격 & 폭탄 투척)
        // =========================================================================
        bakePig2(ctx) {
            const F = FRAME_SIZE;

            // Row 0: Idle (6 프레임) - 고글 착용 및 새총 들고 조준 탐색
            for (let f = 0; f < 6; f++) {
                const ox = f * F;
                const oy = 0;
                const cx = ox + F / 2 - 8;
                const cy = oy + F / 2 + 10;
                const bob = Math.sin((f / 6) * Math.PI * 2) * 3.5;

                this.drawPigBody(ctx, 2, cx, cy + bob, { rot: Math.sin(f) * 0.04 });

                // 왼손 Y자 새총 기본 들기
                this.renderSlingshot(ctx, cx + 22, cy + bob + 2, 0, 0, false);
            }

            // Row 1: Slingshot Shoot (6 프레임) - 잡아 당겼다(pull/draw)가 놓는(snap/release) 액션!
            // Frame 0: 새총 전방 조준 전개
            // Frame 1: 오른손으로 가죽 파우치에 도토리를 물리고 35% 뒤로 당김
            // Frame 2: 풀 텐션(MAX TENSION)! 고무줄이 뺨까지 팽팽히 늘어나고 몸이 뒤로 젖혀짐!
            // Frame 3: 스냅(SNAP RELEASE)! 줄을 놓으며 도토리 탄환이 섬광과 함께 발사!
            // Frame 4: 반동(Recoil)! 고무줄 탄성으로 새총이 뒤로 튕기고 연기 발생
            // Frame 5: 안정화 복귀
            for (let f = 0; f < 6; f++) {
                const ox = f * F;
                const oy = F;
                const cx = ox + F / 2 - 12;
                const cy = oy + F / 2 + 10;

                let bodyRot = 0;
                let bodyOffX = 0;
                let pullAmount = 0;
                let showAcorn = false;
                let fireMuzzle = false;
                let recoilX = 0;

                if (f === 0) {
                    bodyRot = -0.05;
                    pullAmount = 0.1;
                    showAcorn = true;
                } else if (f === 1) {
                    bodyRot = -0.12;
                    bodyOffX = -4;
                    pullAmount = 0.55;
                    showAcorn = true;
                } else if (f === 2) { // 팽팽한 최대 텐션!
                    bodyRot = -0.25;
                    bodyOffX = -8;
                    pullAmount = 1.0;
                    showAcorn = true;
                } else if (f === 3) { // 번쩍 방출 스냅!
                    bodyRot = 0.18;
                    bodyOffX = 6;
                    pullAmount = -0.2;
                    fireMuzzle = true;
                } else if (f === 4) { // 반동 킥백
                    bodyRot = -0.14;
                    bodyOffX = -3;
                    recoilX = -6;
                } else if (f === 5) {
                    bodyRot = 0;
                    bodyOffX = 0;
                }

                // 본체
                this.drawPigBody(ctx, 2, cx, cy, { offsetX: bodyOffX, rot: bodyRot });

                // Y자 새총 & 늘어나는 고무줄 렌더링
                const slingshotX = cx + bodyOffX + 24 + recoilX;
                const slingshotY = cy + 4;
                this.renderSlingshot(ctx, slingshotX, slingshotY, pullAmount, bodyRot, showAcorn);

                // 발사 순간 탄환 섬광 & 추진 링 (Frame 3)
                if (fireMuzzle) {
                    ctx.save();
                    const fx = slingshotX + 26;
                    const fy = slingshotY - 4;

                    // 노란 탄환 발사체 궤적
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath();
                    ctx.ellipse(fx + 10, fy, 10, 5, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // 발사 충격 링
                    ctx.strokeStyle = '#ffd54f';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.ellipse(fx + 2, fy, 4, 12, 0, 0, Math.PI * 2);
                    ctx.stroke();

                    // 바람선
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(fx + 14, fy - 6);
                    ctx.lineTo(fx + 30, fy - 6);
                    ctx.moveTo(fx + 14, fy + 6);
                    ctx.lineTo(fx + 30, fy + 6);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // Row 2: Bomb Throw (8 프레임) - 폭탄/다이너마이트 와인드업 투척 액션!
            // Frame 0: 도화선에 불붙은 다이너마이트/폭탄 꺼내기
            // Frame 1: 불꽃이 팍팍 튀며 어깨 뒤로 팔 젖히기 시작
            // Frame 2: 풀 와인드업 젖힘 (Apex Windup)
            // Frame 3: 허리 회전과 함께 앞으로 힘껏 던지기
            // Frame 4: 손에서 폭탄 릴리스! 연기와 함께 날아감
            // Frame 5: 팔로우 스루 손 뻗기
            // Frame 6: 회심의 미소 & 주먹 쥐기
            // Frame 7: 기본 복귀
            for (let f = 0; f < 8; f++) {
                const ox = f * F;
                const oy = 2 * F;
                const cx = ox + F / 2 - 12;
                const cy = oy + F / 2 + 10;

                let bodyRot = 0;
                let bodyOffX = 0;
                let bombX = 0;
                let bombY = 0;
                let showBomb = false;
                let handPose = 0;

                if (f === 0) {
                    bodyRot = -0.05;
                    showBomb = true;
                    bombX = cx + 18;
                    bombY = cy - 2;
                } else if (f === 1) {
                    bodyRot = -0.18;
                    bodyOffX = -5;
                    showBomb = true;
                    bombX = cx - 14;
                    bombY = cy - 24;
                } else if (f === 2) { // 뒤로 깊게 젖힘
                    bodyRot = -0.32;
                    bodyOffX = -10;
                    showBomb = true;
                    bombX = cx - 24;
                    bombY = cy - 32;
                } else if (f === 3) { // 전방 투척 스윙
                    bodyRot = 0.28;
                    bodyOffX = 8;
                    showBomb = true;
                    bombX = cx + 22;
                    bombY = cy - 26;
                } else if (f === 4) { // 릴리스!
                    bodyRot = 0.38;
                    bodyOffX = 14;
                    showBomb = true;
                    bombX = cx + 52;
                    bombY = cy - 20;
                    handPose = 1;
                } else if (f === 5) {
                    bodyRot = 0.18;
                    bodyOffX = 6;
                    handPose = 1;
                } else if (f === 6) {
                    bodyRot = -0.08;
                    bodyOffX = -2;
                    handPose = 2;
                } else if (f === 7) {
                    bodyRot = 0;
                    bodyOffX = 0;
                }

                // 본체
                this.drawPigBody(ctx, 2, cx, cy, { offsetX: bodyOffX, rot: bodyRot });

                // 폭탄 렌더링
                if (showBomb) {
                    this.renderBomb(ctx, bombX, bombY, f);
                }

                // 던진 손 팔로우 스루
                ctx.save();
                ctx.fillStyle = '#ff80ab';
                ctx.strokeStyle = '#c2185b';
                ctx.lineWidth = 2;
                if (handPose === 1) {
                    ctx.beginPath();
                    ctx.arc(cx + bodyOffX + 28, cy - 8, 7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                } else if (handPose === 2) {
                    ctx.beginPath();
                    ctx.arc(cx + bodyOffX + 16, cy - 14, 7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Row 3: Rapid Shoot (6 프레임) - 사격속도 중속 (Lv.3~4): 신속한 퀵 드로우 & 스냅 연사!
            for (let f = 0; f < 6; f++) {
                const ox = f * F;
                const oy = 3 * F;
                const cx = ox + F / 2 - 12;
                const cy = oy + F / 2 + 10;

                let bodyRot = 0;
                let bodyOffX = 0;
                let pullAmount = 0;
                let showAcorn = false;
                let fireMuzzle = false;
                let recoilX = 0;

                if (f === 0) { // 번개같은 조준 및 65% 즉시 장전
                    bodyRot = -0.10;
                    bodyOffX = -4;
                    pullAmount = 0.65;
                    showAcorn = true;
                } else if (f === 1) { // 팽팽한 고속 풀텐션!
                    bodyRot = -0.22;
                    bodyOffX = -7;
                    pullAmount = 1.15;
                    showAcorn = true;
                } else if (f === 2) { // 맹렬한 스냅 릴리즈!
                    bodyRot = 0.20;
                    bodyOffX = 7;
                    pullAmount = -0.3;
                    fireMuzzle = true;
                } else if (f === 3) { // 퀵 킥백 반동
                    bodyRot = -0.16;
                    bodyOffX = -4;
                    recoilX = -7;
                } else if (f === 4) { // 신속한 완충
                    bodyRot = -0.06;
                    bodyOffX = -1;
                    recoilX = -2;
                } else if (f === 5) { // 즉각적인 다음 탄환 준비
                    bodyRot = 0;
                    bodyOffX = 0;
                }

                // 본체
                this.drawPigBody(ctx, 2, cx, cy, { offsetX: bodyOffX, rot: bodyRot });

                // 고글에 주황빛 속사 반사광
                ctx.save();
                ctx.fillStyle = '#ff9800';
                ctx.beginPath();
                ctx.arc(cx + bodyOffX + 6, cy - 8, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Y자 새총 & 고무줄
                const slingshotX = cx + bodyOffX + 24 + recoilX;
                const slingshotY = cy + 4;
                this.renderSlingshot(ctx, slingshotX, slingshotY, pullAmount, bodyRot, showAcorn);

                // 발사 순간 특수 추진 플래시 & 이중 충격파 링 (Frame 2)
                if (fireMuzzle) {
                    ctx.save();
                    const fx = slingshotX + 26;
                    const fy = slingshotY - 4;

                    // 고속 탄환 발사체 궤적 (주황-황금 그라데이션)
                    ctx.fillStyle = '#ff9800';
                    ctx.beginPath();
                    ctx.ellipse(fx + 12, fy, 14, 6, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // 이중 충격파 링
                    ctx.strokeStyle = '#ffb74d';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.ellipse(fx + 2, fy, 5, 14, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.strokeStyle = '#ffe082';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(fx + 12, fy, 4, 10, 0, 0, Math.PI * 2);
                    ctx.stroke();

                    // 빠른 추진선
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(fx + 16, fy - 8);
                    ctx.lineTo(fx + 36, fy - 8);
                    ctx.moveTo(fx + 16, fy + 8);
                    ctx.lineTo(fx + 36, fy + 8);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // Row 4: Gatling Shoot (6 프레임) - 사격속도 고속/MAX (Lv.5 이상): 맹렬한 개틀링 머신건 연사!
            for (let f = 0; f < 6; f++) {
                const ox = f * F;
                const oy = 4 * F;
                const cx = ox + F / 2 - 12;
                const cy = oy + F / 2 + 10;

                let bodyRot = 0;
                let bodyOffX = 0;
                let pullAmount = 0;
                let showAcorn = false;
                let fireMuzzle = false;
                let recoilX = 0;

                if (f === 0) { // 전방 숙이고 탄환 장전 (돌격 자세)
                    bodyRot = 0.08;
                    bodyOffX = 3;
                    pullAmount = 0.85;
                    showAcorn = true;
                } else if (f === 1) { // 1차 폭풍 릴리즈! (대형 총구 화염)
                    bodyRot = 0.24;
                    bodyOffX = 9;
                    pullAmount = -0.4;
                    fireMuzzle = true;
                } else if (f === 2) { // 맹렬한 반동 킥백 + 불꽃 스파크
                    bodyRot = -0.20;
                    bodyOffX = -6;
                    recoilX = -8;
                } else if (f === 3) { // 0.05초 만의 초광속 리로드
                    bodyRot = -0.10;
                    bodyOffX = -2;
                    pullAmount = 0.95;
                    showAcorn = true;
                } else if (f === 4) { // 2차 연타 릴리즈!
                    bodyRot = 0.22;
                    bodyOffX = 8;
                    pullAmount = -0.35;
                    fireMuzzle = true;
                } else if (f === 5) { // 연속 발사 유지 폼
                    bodyRot = 0.02;
                    bodyOffX = 1;
                    recoilX = -3;
                }

                // 본체
                this.drawPigBody(ctx, 2, cx, cy, { offsetX: bodyOffX, rot: bodyRot });

                // 고글에 이글거리는 붉은빛 버닝 안광
                ctx.save();
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.arc(cx + bodyOffX + 6, cy - 8, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Y자 새총 & 고무줄
                const slingshotX = cx + bodyOffX + 24 + recoilX;
                const slingshotY = cy + 4;
                this.renderSlingshot(ctx, slingshotX, slingshotY, pullAmount, bodyRot, showAcorn);

                // 폭풍 개틀링 총구 화염 & 화염 탄환 궤적 (Frame 1 & 4)
                if (fireMuzzle) {
                    ctx.save();
                    const fx = slingshotX + 26;
                    const fy = slingshotY - 4;

                    // 거대 총구 화염 Muzzle Flash
                    ctx.fillStyle = '#ff3d00';
                    ctx.beginPath();
                    ctx.arc(fx + 6, fy, 14, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#ffd600';
                    ctx.beginPath();
                    ctx.arc(fx + 6, fy, 8, 0, Math.PI * 2);
                    ctx.fill();

                    // 연속 탄환 더블 궤적
                    ctx.fillStyle = '#ff6d00';
                    ctx.beginPath();
                    ctx.ellipse(fx + 18, fy, 16, 7, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // 삼중 충격파 링
                    ctx.strokeStyle = '#ff9100';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.ellipse(fx + 4, fy, 6, 18, 0, 0, Math.PI * 2);
                    ctx.stroke();

                    // 사방으로 튀는 개틀링 불꽃 스파크
                    ctx.strokeStyle = '#fff59d';
                    ctx.lineWidth = 2;
                    const angles = [-0.6, -0.3, 0, 0.3, 0.6];
                    for (const ang of angles) {
                        ctx.beginPath();
                        ctx.moveTo(fx + 10, fy);
                        ctx.lineTo(fx + 10 + Math.cos(ang) * 22, fy + Math.sin(ang) * 16);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            }
        }

        // 새총 렌더링 헬퍼 (Y자 나무와 고무줄 당김/놓음)
        renderSlingshot(ctx, x, y, pull, rot, hasAcorn) {
            ctx.save();
            ctx.translate(x, y);

            // 나무 Y 새총 손잡이
            ctx.strokeStyle = '#8d6e63';
            ctx.fillStyle = '#5d4037';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 14);
            ctx.lineTo(0, 0);
            ctx.lineTo(-8, -12); // 왼쪽 가지
            ctx.moveTo(0, 0);
            ctx.lineTo(8, -12);  // 오른쪽 가지
            ctx.stroke();

            // 늘어나는 적갈색 고무줄
            const pullBackX = -pull * 22;
            const pullBackY = 0;
            ctx.strokeStyle = '#ef5350';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-8, -12);
            ctx.lineTo(pullBackX, pullBackY);
            ctx.lineTo(8, -12);
            ctx.stroke();

            // 가죽 파우치 & 도토리
            ctx.fillStyle = '#4e342e';
            ctx.beginPath();
            ctx.arc(pullBackX, pullBackY, 4, 0, Math.PI * 2);
            ctx.fill();

            if (hasAcorn) {
                ctx.fillStyle = '#b45309';
                ctx.beginPath();
                ctx.ellipse(pullBackX - 2, pullBackY, 5, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#78350f';
                ctx.fillRect(pullBackX - 7, pullBackY - 3, 3, 6);
            }
            ctx.restore();
        }

        // 폭탄 렌더링 헬퍼
        renderBomb(ctx, x, y, frame) {
            ctx.save();
            ctx.translate(x, y);

            // 검정 폭탄 몸체
            const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 14);
            grad.addColorStop(0, '#616161');
            grad.addColorStop(1, '#111111');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#424242';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 신관 캡
            ctx.fillStyle = '#9e9e9e';
            ctx.fillRect(-3, -15, 6, 4);

            // 도화선
            ctx.strokeStyle = '#d7ccc8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.quadraticCurveTo(6, -20, 4, -26);
            ctx.stroke();

            // 타오르는 불꽃 스파크 (노랑 + 빨강 별빛)
            ctx.fillStyle = frame % 2 === 0 ? '#ffeb3b' : '#ff5722';
            ctx.beginPath();
            ctx.arc(4, -26, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(4, -31);
            ctx.lineTo(4, -21);
            ctx.moveTo(-1, -26);
            ctx.lineTo(9, -26);
            ctx.stroke();

            ctx.restore();
        }

        // =========================================================================
        // 🧱 3. 셋째 돼지 스프라이트 시트 베이킹 (Idle & 망치 수리 & 방패 방어)
        // =========================================================================
        bakePig3(ctx) {
            const F = FRAME_SIZE;

            // Row 0: Idle (6 프레임) - 어깨에 황금 망치 얹고 늠름하게 보초
            for (let f = 0; f < 6; f++) {
                const ox = f * F;
                const oy = 0;
                const cx = ox + F / 2 - 4;
                const cy = oy + F / 2 + 10;
                const bob = Math.sin((f / 6) * Math.PI * 2) * 2.5;

                this.drawPigBody(ctx, 3, cx, cy + bob, { rot: Math.sin(f * 0.8) * 0.03 });

                // 어깨에 얹은 황금 망치
                this.renderHammer(ctx, cx + 18, cy + bob - 16, 0.45, 1.0);
            }

            // Row 1: Hammer Repair (8 프레임) - 망치로 집을 쾅쾅 두드리는 액션!
            // Frame 0: 수리 준비! 망치 양손으로 쥐기
            // Frame 1: 머리 위로 황금 망치 번쩍 들어올리기
            // Frame 2: 최고 정점(Apex)! 망치 헤드에서 번쩍 광채
            // Frame 3: 집 벽돌을 향해 전광석화 내리치기! (SWING DOWN)
            // Frame 4: 강타 임팩트(IMPACT FLASH)! 불꽃 별과 금빛 수리 파티클 팍!
            // Frame 5: 반동으로 살짝 들렸다가 2차 연속 타격 쿵!
            // Frame 6: 2차 스파크 & 땀 닦기
            // Frame 7: 기립 복귀
            for (let f = 0; f < 8; f++) {
                const ox = f * F;
                const oy = F;
                const cx = ox + F / 2 - 14;
                const cy = oy + F / 2 + 10;

                let bodyRot = 0;
                let bodyOffX = 0;
                let bodyOffY = 0;
                let hammerRot = 0;
                let hammerX = 0;
                let hammerY = 0;
                let impact = false;
                let sparkColor = '#ffd700';

                if (f === 0) {
                    bodyRot = -0.05;
                    hammerX = cx + 14;
                    hammerY = cy - 10;
                    hammerRot = 0.2;
                } else if (f === 1) { // 위로 번쩍
                    bodyRot = -0.18;
                    bodyOffX = -4;
                    hammerX = cx + 4;
                    hammerY = cy - 32;
                    hammerRot = -0.5;
                } else if (f === 2) { // 최고 정점
                    bodyRot = -0.28;
                    bodyOffX = -7;
                    hammerX = cx - 2;
                    hammerY = cy - 40;
                    hammerRot = -0.9;
                } else if (f === 3) { // 맹렬한 내리치기
                    bodyRot = 0.28;
                    bodyOffX = 8;
                    bodyOffY = 4;
                    hammerX = cx + 38;
                    hammerY = cy + 18;
                    hammerRot = 1.35;
                } else if (f === 4) { // 임팩트 프레임!
                    bodyRot = 0.35;
                    bodyOffX = 10;
                    bodyOffY = 6;
                    hammerX = cx + 42;
                    hammerY = cy + 20;
                    hammerRot = 1.45;
                    impact = true;
                    sparkColor = '#ffd700';
                } else if (f === 5) { // 2차 리바운드 타격
                    bodyRot = 0.22;
                    bodyOffX = 6;
                    hammerX = cx + 38;
                    hammerY = cy + 18;
                    hammerRot = 1.35;
                    impact = true;
                    sparkColor = '#4caf50'; // 힐링 수리 스파크
                } else if (f === 6) {
                    bodyRot = 0.05;
                    bodyOffX = 0;
                    hammerX = cx + 22;
                    hammerY = cy - 12;
                    hammerRot = 0.3;
                } else if (f === 7) {
                    bodyRot = 0;
                    bodyOffX = 0;
                    hammerX = cx + 18;
                    hammerY = cy - 16;
                    hammerRot = 0.45;
                }

                // 본체
                this.drawPigBody(ctx, 3, cx, cy, { offsetX: bodyOffX, offsetY: bodyOffY, rot: bodyRot });

                // 황금 망치
                this.renderHammer(ctx, hammerX, hammerY, hammerRot, 1.15);

                // 벽돌 강타 임팩트 파티클 & 빛 (Frame 4, 5)
                if (impact) {
                    ctx.save();
                    const ix = hammerX + 16;
                    const iy = hammerY + 8;

                    // 강타 충격 링
                    ctx.strokeStyle = sparkColor;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(ix, iy, 14, 0, Math.PI * 2);
                    ctx.stroke();

                    // 4방향 별빛 스파크
                    ctx.fillStyle = '#ffffff';
                    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
                        const sx = ix + Math.cos(a) * 18;
                        const sy = iy + Math.sin(a) * 18;
                        ctx.beginPath();
                        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // 수리 벽돌 가루
                    ctx.fillStyle = '#d97706';
                    ctx.fillRect(ix - 8, iy + 6, 5, 4);
                    ctx.fillRect(ix + 6, iy + 4, 4, 4);
                    ctx.restore();
                }
            }

            // Row 2: Shield Block (8 프레임) - 방어할 땐 거대 방패로 막는 액션!
            // Frame 0: 위협 감지! 방패 꺼내기
            // Frame 1: 자세를 굳건히 낮추며 방패 가슴 앞 전개
            // Frame 2: 방패 전방 내리꽂기! (SHIELD SLAM)
            // Frame 3: 육각 에너지 방어막(HEXAGON BARRIER) 대방출! (MAX DEFENSE)
            // Frame 4: 공격을 튕겨내는 에너지 파동 방출
            // Frame 5: 굳건한 방어 유지
            // Frame 6: 방어막 서서히 갈무리
            // Frame 7: 기본 복귀
            for (let f = 0; f < 8; f++) {
                const ox = f * F;
                const oy = 2 * F;
                const cx = ox + F / 2 - 14;
                const cy = oy + F / 2 + 10;

                let bodyRot = 0;
                let bodyOffX = 0;
                let shieldX = 0;
                let shieldY = 0;
                let shieldScale = 1.0;
                let barrierAlpha = 0;

                if (f === 0) {
                    bodyRot = -0.05;
                    shieldX = cx + 8;
                    shieldY = cy + 4;
                    shieldScale = 0.8;
                } else if (f === 1) {
                    bodyRot = -0.15;
                    bodyOffX = -5;
                    shieldX = cx + 18;
                    shieldY = cy + 2;
                    shieldScale = 1.0;
                } else if (f === 2) { // 쿵 내리꽂기
                    bodyRot = 0.12;
                    bodyOffX = 4;
                    shieldX = cx + 28;
                    shieldY = cy + 6;
                    shieldScale = 1.15;
                    barrierAlpha = 0.4;
                } else if (f === 3) { // 찬란한 육각 에너지 성벽 전개!
                    bodyRot = 0.08;
                    bodyOffX = 2;
                    shieldX = cx + 32;
                    shieldY = cy + 4;
                    shieldScale = 1.25;
                    barrierAlpha = 0.95;
                } else if (f === 4) { // 방어 충격파
                    bodyRot = 0.05;
                    shieldX = cx + 30;
                    shieldY = cy + 4;
                    shieldScale = 1.2;
                    barrierAlpha = 0.8;
                } else if (f === 5) {
                    bodyRot = 0;
                    shieldX = cx + 26;
                    shieldY = cy + 4;
                    shieldScale = 1.1;
                    barrierAlpha = 0.5;
                } else if (f === 6) {
                    bodyRot = -0.05;
                    shieldX = cx + 16;
                    shieldY = cy + 4;
                    shieldScale = 0.9;
                    barrierAlpha = 0.15;
                } else if (f === 7) {
                    bodyRot = 0;
                    shieldX = cx + 10;
                    shieldY = cy + 6;
                    shieldScale = 0.75;
                }

                // 본체
                this.drawPigBody(ctx, 3, cx, cy, { offsetX: bodyOffX, rot: bodyRot });

                // 성벽 방패 렌더링
                this.renderShield(ctx, shieldX, shieldY, shieldScale);

                // 육각 에너지 배리어 오라 렌더링
                if (barrierAlpha > 0) {
                    this.renderHexBarrier(ctx, shieldX + 16, shieldY, barrierAlpha);
                }
            }
        }

        // 황금 망치 렌더링 헬퍼
        renderHammer(ctx, x, y, rot, scale = 1.0) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.scale(scale, scale);

            // 나무 자루
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 24);
            ctx.lineTo(0, -18);
            ctx.stroke();

            // 황금 망치 머리
            const grad = ctx.createLinearGradient(-14, -26, 14, -10);
            grad.addColorStop(0, '#fef08a');
            grad.addColorStop(0.5, '#facc15');
            grad.addColorStop(1, '#ca8a04');
            ctx.fillStyle = grad;
            ctx.strokeStyle = '#854d0e';
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            ctx.roundRect(-16, -26, 32, 16, 4);
            ctx.fill();
            ctx.stroke();

            // 망치 광채 십자
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-6, -20, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // 중장갑 방패 렌더링 헬퍼
        renderShield(ctx, x, y, scale = 1.0) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // 방패 그림자
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(0, 24, 14, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // 방패 본체 (성벽 카이트 실드)
            ctx.beginPath();
            ctx.moveTo(-16, -24);
            ctx.lineTo(16, -24);
            ctx.lineTo(16, 8);
            ctx.lineTo(0, 24);
            ctx.lineTo(-16, 8);
            ctx.closePath();

            const grad = ctx.createLinearGradient(-16, -24, 16, 24);
            grad.addColorStop(0, '#e2e8f0');
            grad.addColorStop(0.4, '#94a3b8');
            grad.addColorStop(1, '#475569');
            ctx.fillStyle = grad;
            ctx.fill();

            // 황금 테두리
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // 방패 중앙 십자 & 사자/별 문양
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.restore();
        }

        // 육각 에너지 배리어 렌더링 헬퍼
        renderHexBarrier(ctx, x, y, alpha) {
            ctx.save();
            ctx.translate(x, y);
            ctx.globalAlpha = Math.min(1.0, alpha);

            // 푸른/금빛 방어막 오라
            ctx.strokeStyle = '#38bdf8';
            ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
            ctx.lineWidth = 3;

            // 반원형 전방 쉴드 돔
            ctx.beginPath();
            ctx.arc(0, 0, 36, -Math.PI * 0.45, Math.PI * 0.45);
            ctx.stroke();
            ctx.fill();

            // 육각 허니컴 격자
            const hexR = 12;
            [-10, 10].forEach(hy => {
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const hx = 14 + Math.cos(angle) * hexR;
                    const py = hy + Math.sin(angle) * hexR;
                    if (i === 0) ctx.moveTo(hx, py);
                    else ctx.lineTo(hx, py);
                }
                ctx.closePath();
                ctx.strokeStyle = '#7dd3fc';
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            ctx.restore();
        }
    }

    // 전역 싱글톤 스프라이트 시트 제너레이터
    const generator = new PigSpriteSheetGenerator();

    /**
     * 🎬 돼지 개별 애니메이터 인스턴스
     */
    class PigAnimator {
        constructor(pigId) {
            this.pigId = pigId;
            this.config = PIG_CONFIGS[pigId];
            this.currentAction = 'idle';
            this.frameIndex = 0;
            this.timer = 0;
            this.isFinished = false;
            this.onCompleteCallback = null;
            this.speedMultiplier = 1.0;
            this.customFps = null;
            this.customLoop = null;
        }

        setSpeedMultiplier(mul = 1.0) {
            this.speedMultiplier = Math.max(0.2, mul);
        }

        setCustomFps(fps = null) {
            this.customFps = fps;
        }

        /**
         * 액션 재생 (동일 액션 중복 호출 시 자연스럽게 유지 또는 재시작)
         */
        playAction(actionName, force = false, onComplete = null, customFps = null, loop = null) {
            if (!this.config.actions[actionName]) return;
            if (this.currentAction === actionName && !this.isFinished && !force) {
                if (loop !== null) this.customLoop = loop;
                if (customFps) this.customFps = customFps;
                return;
            }

            this.currentAction = actionName;
            this.frameIndex = 0;
            this.timer = 0;
            this.isFinished = false;
            this.onCompleteCallback = onComplete;
            if (customFps) this.customFps = customFps;
            this.customLoop = loop;
        }

        update(dt) {
            const act = this.config.actions[this.currentAction];
            if (!act) return;

            const baseFps = this.customFps ? this.customFps : act.fps;
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
                        // 기본 idle로 자연스러운 복귀
                        this.currentAction = 'idle';
                        this.frameIndex = 0;
                        this.timer = 0;
                        this.customFps = null;
                        this.customLoop = null;
                    }
                }
            }
        }

        /**
         * 스프라이트 시트에서 현재 프레임을 추출하여 캔버스에 렌더링
         */
        draw(ctx, destX, destY, destW = 68, destH = 68) {
            const canvas = generator.getCanvas(this.pigId);
            const act = this.config.actions[this.currentAction] || this.config.actions.idle;
            const sx = this.frameIndex * FRAME_SIZE;
            const sy = act.row * FRAME_SIZE;

            ctx.drawImage(
                canvas,
                sx, sy, FRAME_SIZE, FRAME_SIZE,
                destX - destW / 2, destY - destH / 2, destW, destH
            );
        }

        getCurrentAction() {
            return this.currentAction;
        }

        get isReady() {
            return generator.isReady[this.pigId] === true;
        }
    }

    // 전역 네임스페이스 등록
    window.PigSpriteSystem = {
        generator,
        PigAnimator,
        PIG_CONFIGS,
        FRAME_SIZE
    };

})(window);
