/**
 * effects.js
 * 게임 비주얼 이펙트 및 파티클 시스템 렌더러
 * 불필요한 shadowBlur 제거 및 선형 그라데이션 재사용을 통한 고성능 최적화 완료
 */

class EffectsRenderer {
    constructor(game) {
        this.game = game;
        this._particleBuckets = new Map();
    }

    get strawRolls() { return this.game.strawRolls; }
    get strawImages() { return this.game.strawImages; }
    get enemies() { return this.game.enemies; }
    get boulders() { return this.game.boulders; }
    get cosmicStorms() { return this.game.cosmicStorms; }
    get fallingBombs() { return this.game.fallingBombs; }
    get bombImages() { return this.game.bombImages; }
    get projectiles() { return this.game.projectiles; }
    get projImages() { return this.game.projImages; }
    get antiAirRockets() { return this.game.antiAirRockets; }
    get comicExplosions() { return this.game.comicExplosions; }
    get fxBoomImage() { return this.game.fxBoomImage; }
    get coins() { return this.game.coins; }
    get particles() { return this.game.particles; }
    get confetti() { return this.game.confetti; }
    get floatingTexts() { return this.game.floatingTexts; }
    get ultimateCinematic() { return this.game.ultimateCinematic; }
    get pigImages() { return this.game.pigImages; }
    get groundFireTrails() { return this.game.groundFireTrails || []; }
    get secondaryClusters() { return this.game.secondaryClusters || []; }
    get sulfurMines() { return this.game.sulfurMines || []; }
    get steamPulses() { return this.game.steamPulses || []; }
    get lavaMortars() { return this.game.lavaMortars || []; }
    get divineLightnings() { return this.game.divineLightnings || []; }

    // 렌더링과 상태 변경을 분리해 저사양 모드에서 프레임을 건너뛰어도
    // 이펙트 수명과 물리가 정상적으로 진행되게 한다.
    update(dt) {
        if (!this.confetti || this.confetti.length === 0) return;
        const step = dt / 16.6;
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx * step;
            c.y += c.vy * step;
            c.vy += c.gravity * step;
            c.life -= step;
            c.rotation += c.rotSpeed * step;
            if (c.life <= 0 || c.y > V_HEIGHT + 20) {
                this.confetti[i] = this.confetti[this.confetti.length - 1];
                this.confetti.pop();
            }
        }
    }

    // 1. 지면 바닥 장판 이펙트 레이어 (늑대 캐릭터 발밑)
    drawGroundLayer(ctx) {
        this.drawStatAwakeningAura(ctx);
        this.drawGroundFireTrails(ctx);
        this.drawSulfurMines(ctx);
    }

    // 2. 최상위 스킬 & 투사체 & 폭발 & 파티클 레이어 (늑대 캐릭터 앞 맨 위 레이어)
    drawTopLayer(ctx) {
        this.drawSecondaryClusters(ctx);
        this.drawSteamPulses(ctx);
        this.drawLavaMortars(ctx);
        this.drawStrawRolls(ctx);
        this.drawBlowerWindJet(ctx);
        this.drawBoulders(ctx);
        this.drawBossLaser(ctx);
        this.drawCosmicStorms(ctx);
        this.drawFallingBombs(ctx);
        this.drawProjectiles(ctx);
        this.drawAntiAirRockets(ctx);
        this.drawComicExplosions(ctx);
        this.drawCoins(ctx);
        this.drawParticles(ctx);
        this.drawConfetti(ctx);
        this.drawDivineLightnings(ctx);
        this.drawFloatingTexts(ctx);
        if (this.ultimateCinematic > 0) {
            this.drawUltimateCinematic(ctx);
        }
    }

    draw(ctx) {
        this.drawGroundLayer(ctx);
        this.drawTopLayer(ctx);
    }

    drawStrawRolls(ctx) {
        this.strawRolls.forEach(roll => {
            ctx.save();
            ctx.translate(roll.x, roll.y);

            const r = roll.rank || 1;
            const img = this.strawImages && this.strawImages[r];
            const diameter = roll.radius * 2.15;

            if (r === 2) {
                // 2성: 불타는 짚단 오라 & 바닥 화염 잔상 🔥 (고성능 발광)
                ctx.fillStyle = 'rgba(255, 61, 0, 0.35)';
                ctx.beginPath();
                ctx.arc(0, 0, roll.radius * 1.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 87, 34, 0.45)';
                ctx.beginPath();
                ctx.ellipse(0, roll.radius * 0.85, roll.radius * 1.3, 14, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (r === 3) {
                // 3성: 황금 태풍 짚단 오라 & 회전 돌풍 링 👑 (고성능 발광)
                ctx.fillStyle = 'rgba(255, 215, 0, 0.30)';
                ctx.beginPath();
                ctx.arc(0, 0, roll.radius * 1.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, roll.radius * 1.25, roll.rotation * 2, roll.rotation * 2 + Math.PI * 1.4);
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(245, 197, 66, 0.25)';
                ctx.beginPath();
                ctx.arc(0, 0, roll.radius * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.rotate(roll.rotation);

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, -diameter / 2, -diameter / 2, diameter, diameter);
            } else {
                // 백업 벡터 드로잉
                ctx.beginPath();
                ctx.arc(0, 0, roll.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 5;
                ctx.stroke();

                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.arc(0, 0, roll.radius * (0.3 + i * 0.2), 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            ctx.restore();
        });
    }

    drawBoulders(ctx) {
        this.boulders.forEach(bld => {
            ctx.save();
            ctx.translate(bld.x, bld.y);
            if (bld.isBossMeteor) {
                // 불꽃 꼬리는 진행 방향의 반대쪽으로 뻗는다.
                const length = Math.hypot(bld.vx, bld.vy) || 1;
                ctx.strokeStyle = 'rgba(255, 120, 0, 0.65)';
                ctx.lineWidth = bld.radius;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-bld.vx / length * 95, -bld.vy / length * 95);
                ctx.stroke();
            }
            ctx.rotate(bld.rotation);

            if (bld.isAxe) {
                // 🪓 중간보스 회전 쌍도끼 (상단 푸른 풍압 / 하단 붉은 투기 궤적)
                const isUpper = bld.isUpperAxe;
                // 회전 잔상 아크
                ctx.strokeStyle = isUpper ? 'rgba(56, 189, 248, 0.5)' : 'rgba(239, 68, 68, 0.5)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 1.5);
                ctx.stroke();

                // 도끼 자루
                ctx.fillStyle = '#4e342e';
                ctx.fillRect(-3, -22, 6, 44);
                ctx.strokeStyle = '#271714';
                ctx.lineWidth = 1;
                ctx.strokeRect(-3, -22, 6, 44);

                // 양날 도끼 헤드
                ctx.fillStyle = isUpper ? '#78909c' : '#90a4ae';
                ctx.beginPath();
                ctx.arc(-11, -10, 15, -Math.PI * 0.45, Math.PI * 0.45, false);
                ctx.lineTo(-3, -10);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.arc(11, -10, 15, Math.PI * 0.55, Math.PI * 1.45, false);
                ctx.lineTo(3, -10);
                ctx.closePath();
                ctx.fill();

                // 예리한 은빛 칼날 광택
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 중심부 고정 리벳 & 장식
                ctx.fillStyle = isUpper ? '#38bdf8' : '#ef4444';
                ctx.beginPath();
                ctx.arc(0, -10, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (bld.isWind) {
                // 💨 바람늑대의 거대 회오리 돌풍탄 (Mega Swirling Wind Blast)
                const time = performance.now() * 0.01;
                const r = bld.radius || 36;

                // 1. 바깥쪽 6개 나선 회오리 날개 와류
                for (let w = 0; w < 6; w++) {
                    const ang = (w * Math.PI / 3) + bld.rotation * 1.8;
                    ctx.strokeStyle = w % 2 === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(128, 222, 234, 0.75)';
                    ctx.lineWidth = 3.5;
                    ctx.beginPath();
                    ctx.arc(0, 0, r * 0.6 + w * 2.8, ang, ang + Math.PI * 0.7);
                    ctx.stroke();
                }

                // 2. 중심부 압축 공기 플라즈마 구체
                ctx.fillStyle = 'rgba(77, 208, 225, 0.4)';
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(178, 235, 242, 0.8)';
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
                ctx.fill();

                // 3. 뒤로 길게 휘날리는 4갈래 고속 바람 기류 꼬리 (Speed trails)
                ctx.strokeStyle = 'rgba(224, 247, 250, 0.7)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                for (let t = 0; t < 4; t++) {
                    const ty = (t - 1.5) * 11;
                    ctx.moveTo(0, ty);
                    ctx.quadraticCurveTo(25, ty + Math.sin(time + t) * 8, 48, ty);
                }
                ctx.stroke();
            } else {
                // 🔥 울프 제왕의 거대 화염 마그마 운석 바위 (Mega Magma Meteor Boulder)
                const r = bld.radius || 34;
                const time = performance.now() * 0.008;

                // 1. 운석 뒤로 타오르는 화염 꼬리 (Flame Meteor Trails)
                for (let f = 0; f < 3; f++) {
                    const fy = (f - 1) * 12;
                    ctx.strokeStyle = f === 1 ? 'rgba(255, 235, 59, 0.85)' : 'rgba(255, 61, 0, 0.7)';
                    ctx.lineWidth = 4.5 - f;
                    ctx.beginPath();
                    ctx.moveTo(r * 0.5, fy);
                    ctx.quadraticCurveTo(r + 20, fy + Math.sin(time * 3 + f) * 8, r + 42, fy);
                    ctx.stroke();
                }

                // 2. 흑요석 검붉은 암석 베이스
                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();

                // 3. 이글거리는 마그마 균열 (Lava Veins)
                ctx.strokeStyle = '#ff3d00';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(-r * 0.6, -r * 0.4);
                ctx.lineTo(-r * 0.1, 0);
                ctx.lineTo(-r * 0.5, r * 0.5);
                ctx.moveTo(0, -r * 0.6);
                ctx.lineTo(r * 0.3, -r * 0.1);
                ctx.lineTo(r * 0.2, r * 0.5);
                ctx.stroke();

                ctx.strokeStyle = '#ffeb3b';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(-r * 0.4, -r * 0.3);
                ctx.lineTo(-r * 0.1, 0);
                ctx.lineTo(r * 0.2, -r * 0.1);
                ctx.stroke();

                // 4. 울퉁불퉁한 외곽 암석 테두리
                ctx.strokeStyle = '#3e2723';
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
            ctx.restore();

            // 체력바 & 네임택
            const hpPct = Math.max(0, bld.hp / bld.maxHp);
            const barW = bld.radius * 1.5;
            const barY = bld.y - bld.radius - 12;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(bld.x - barW / 2 - 1, barY - 1, barW + 2, 6);
            ctx.fillStyle = bld.isWind ? '#00e5ff' : (bld.isAxe ? (bld.isUpperAxe ? '#38bdf8' : '#ef4444') : '#ff5722');
            ctx.fillRect(bld.x - barW / 2, barY, barW * hpPct, 4);

            // 네임택 텍스트
            ctx.font = 'bold 9.5px Pretendard, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = bld.isWind ? '#81d4fa' : (bld.isAxe ? '#cbd5e1' : '#ffab00');
            const label = bld.isWind ? '💨 돌풍' : (bld.isAxe ? (bld.isUpperAxe ? '🪓 비행도끼(상)' : '🪓 돌격도끼(하)') : '🔥 마그마 운석');
            ctx.fillText(label, bld.x, barY - 4);
        });
    }

    // 💨 바람늑대 입-투사체 연결 나선형 제트 돌풍 (입에서 전방 140px로 뻗어나가는 연속 폭풍 스트림)
    drawBlowerWindJet(ctx) {
        if (!this.enemies) return;
        const time = performance.now() * 0.012;
        this.enemies.forEach(e => {
            if (e.isDead || e.wolfTypeKey !== 'blower') return;
            if (e.blowTimer >= 1500 && e.blowTimer <= 2700) {
                const mouthX = e.x - 45;
                const mouthY = e.y - 35;
                const streamLen = 140;

                ctx.save();
                ctx.translate(mouthX, mouthY);

                // 3갈래 나선형 회오리 제트 기류
                for (let k = 0; k < 3; k++) {
                    ctx.strokeStyle = k === 0 ? 'rgba(255, 255, 255, 0.9)' : (k === 1 ? 'rgba(178, 235, 242, 0.8)' : 'rgba(77, 208, 225, 0.7)');
                    ctx.lineWidth = 3.5 - k * 0.8;
                    ctx.beginPath();
                    for (let x = 0; x < streamLen; x += 4) {
                        const wave = Math.sin((x * 0.08) - time * 2 + (k * Math.PI * 0.6)) * (8 + (x / streamLen) * 16);
                        if (x === 0) ctx.moveTo(-x, wave);
                        else ctx.lineTo(-x, wave);
                    }
                    ctx.stroke();
                }

                // 기류 끝단 압축 윈드 링
                for (let r = 0; r < 2; r++) {
                    const rx = -streamLen * (0.5 + r * 0.4);
                    const ry = Math.sin(time + r) * 6;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.ellipse(rx, ry, 8 + r * 4, 18 + r * 6, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }

                ctx.restore();
            }
        });
    }

    // 👑 울프 제왕 파괴 레이저 (1.2초 충전 마법진 & 스크린 관통 파괴 빔)
    drawBossLaser(ctx) {
        if (!this.enemies) return;
        this.enemies.forEach(e => {
            if (e.isDead || e.wolfTypeKey !== 'boss') return;

            // 1. 레이저 충전 단계 (1.2초간 입가에 자줏빛 마력 구체 & 마법진 집결)
            if (e.laserCharging) {
                const { x: mouthX, y: mouthY } = e.getLaserOrigin();
                const time = performance.now() * 0.006;
                const chargePct = Math.min(1.0, (1200 - (e.laserChargeTimer || 0)) / 1200);

                ctx.save();
                ctx.translate(mouthX, mouthY);

                // 외부 회전 마법진 링
                ctx.strokeStyle = 'rgba(233, 30, 99, 0.85)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, 22 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
                ctx.stroke();

                // 내부 룬 문자 회전 링
                ctx.strokeStyle = 'rgba(156, 39, 176, 0.75)';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.arc(0, 0, 14, time * 2, time * 2 + Math.PI * 1.5);
                ctx.stroke();

                // 중심 압축 마력 플라즈마 구체
                const coreR = 8 + chargePct * 12;
                ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
                ctx.beginPath();
                ctx.arc(0, 0, coreR, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, coreR * 0.45, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                // 레이저 충전 게이지 & 캔슬 요구치 표시 바
                const barW = 120;
                const barH = 10;
                const barX = e.x - barW / 2;
                const barY = e.y - e.h - 32;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

                // 충전 진행률
                ctx.fillStyle = '#e11d48';
                ctx.fillRect(barX, barY, barW * chargePct, barH);

                // 캔슬 저지 대미지 텍스트
                ctx.font = 'bold 11px Pretendard, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fde047';
                const dmgLeft = Math.max(0, (e.laserDamageRequired || 160) - (e.laserDamageAccumulated || 0));
                ctx.fillText(`⚡ 집중 사격 캔슬! 남은 HP: ${Math.round(dmgLeft)}`, e.x, barY - 6);
            }

            // 2. 레이저 발사 단계 (스크린 전체를 가로지르는 굵은 파괴 광선)
            if (e.laserBeamActive) {
                const { x: startX, y: startY } = e.getLaserOrigin();
                const targetX = this.game.house.x + this.game.house.w;
                const targetY = this.game.house.y + 40;

                ctx.save();

                // 1) 외곽 거대 파괴 오라 광폭
                ctx.strokeStyle = 'rgba(233, 30, 99, 0.35)';
                ctx.lineWidth = 42;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(targetX, targetY);
                ctx.stroke();

                // 2) 중간 플라즈마 레이저 빔
                ctx.strokeStyle = 'rgba(255, 64, 129, 0.85)';
                ctx.lineWidth = 20;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(targetX, targetY);
                ctx.stroke();

                // 3) 중심 백색 코어 빔
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(targetX, targetY);
                ctx.stroke();

                // 집 타격점 폭발 광원
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.arc(targetX, targetY, 32, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(targetX, targetY, 16, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        });
    }

    drawCosmicStorms(ctx) {
        if (!this.cosmicStorms || this.cosmicStorms.length === 0) return;

        // 재사용 가능한 수직 깔때기 그라디언트 캐시
        if (!this._funnelGrad) {
            this._funnelGrad = ctx.createLinearGradient(0, 45, 0, 635);
            this._funnelGrad.addColorStop(0, 'rgba(56, 189, 248, 0.32)');
            this._funnelGrad.addColorStop(0.35, 'rgba(14, 165, 233, 0.48)');
            this._funnelGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.68)');
            this._funnelGrad.addColorStop(1, 'rgba(52, 211, 153, 0.52)');
        }

        this.cosmicStorms.forEach(storm => {
            ctx.save();
            const now = performance.now() * 0.001;
            const sx = storm.x;
            const sy = storm.y;
            const btmY = 635;   // 지면 접지 Y
            const topY = 45;    // 하늘 상단 Y
            const totalH = btmY - topY; // 590px

            // 1. 전체 화면을 가로지르는 수평 질주 돌풍선 (단일 패스 배칭)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let w = 0; w < 7; w++) {
                const wPhase = (now * 2.5 + w * 0.17) % 1;
                const wx = sx - 160 + wPhase * 580;
                const wy = 70 + w * 75 + Math.sin(now * 8 + w) * 14;
                const wLen = 130 + (w % 3) * 70;
                ctx.moveTo(wx, wy);
                ctx.lineTo(wx + wLen, wy + Math.sin(w) * 8);
            }
            ctx.stroke();

            // 2. 지면 맹렬한 모래 소용돌이 베이스 (Ground Dust Tornado Foot)
            const groundSpin = now * 12;
            for (let g = 0; g < 3; g++) {
                const gPhase = (now * 4 + g * 0.33) % 1;
                const gR = 40 + gPhase * 85;
                const gAlpha = (1 - gPhase) * 0.75;
                ctx.strokeStyle = `rgba(217, 119, 6, ${gAlpha})`;
                ctx.lineWidth = 3.5 - gPhase * 2;
                ctx.beginPath();
                ctx.ellipse(sx, btmY - 10, gR, gR * 0.35, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // 지면 먼지구름 덩어리들 (단일 패스 배칭)
            ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
            ctx.beginPath();
            for (let d = 0; d < 6; d++) {
                const dAng = groundSpin + d * (Math.PI / 3);
                const dx = sx + Math.cos(dAng) * 45;
                const dy = btmY - 12 + Math.sin(dAng) * 15;
                ctx.moveTo(dx + 12, dy);
                ctx.arc(dx, dy, 12, 0, Math.PI * 2);
            }
            ctx.fill();

            // 3. 거대 회오리 깔때기 바디 (캐시된 단일 그라데이션 기반 7단 고속 타원 렌더링)
            ctx.fillStyle = this._funnelGrad;
            const tiers = 7;
            for (let t = 0; t < tiers; t++) {
                const ratio = t / (tiers - 1);
                const curY = topY + ratio * totalH;
                const curHalfW = 190 * (1 - ratio * 0.75) + 35;
                const waveOffset = Math.sin(now * 14 - t * 0.6) * (18 * (1 - ratio * 0.5));
                const tierX = sx + waveOffset;

                ctx.beginPath();
                ctx.ellipse(tierX, curY, curHalfW, 24 * (1 - ratio * 0.4), 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // 4. 고속 회전하는 입체 기류 나선 밴드 (6 Spiral Cyclone Ribbons)
            const ribbonCount = 6;
            for (let r = 0; r < ribbonCount; r++) {
                const rAngleOffset = (r / ribbonCount) * Math.PI * 2;
                ctx.beginPath();
                ctx.lineWidth = (r % 2 === 0) ? 2.8 : 2.0;
                ctx.strokeStyle = (r % 2 === 0) ? 'rgba(255, 255, 255, 0.92)' : 'rgba(56, 189, 248, 0.85)';

                let started = false;
                for (let py = topY; py <= btmY; py += 55) {
                    const ratio = (py - topY) / totalH;
                    const curHalfW = 185 * (1 - ratio * 0.75) + 35;
                    const spiralAng = now * 16 - (ratio * 12) + rAngleOffset;
                    const spiralX = sx + Math.cos(spiralAng) * curHalfW + Math.sin(now * 12 + ratio * 4) * 12;
                    if (!started) {
                        ctx.moveTo(spiralX, py);
                        started = true;
                    } else {
                        ctx.lineTo(spiralX, py);
                    }
                }
                ctx.stroke();
            }

            // 5. 회오리 바람에 휘말린 공중 비행 파편 (save/restore 완전 제거, native ellipse 회전)
            const debrisItems = [
                { type: 'leaf_g', rRatio: 0.15, hOffset: 90, angSpeed: 14 },
                { type: 'leaf_o', rRatio: 0.35, hOffset: 220, angSpeed: 17 },
                { type: 'spark',  rRatio: 0.55, hOffset: 340, angSpeed: 21 },
                { type: 'leaf_g', rRatio: 0.75, hOffset: 460, angSpeed: 18 },
                { type: 'spark',  rRatio: 0.25, hOffset: 160, angSpeed: 23 },
                { type: 'leaf_o', rRatio: 0.65, hOffset: 400, angSpeed: 15 },
                { type: 'spark',  rRatio: 0.45, hOffset: 280, angSpeed: 19 },
                { type: 'leaf_g', rRatio: 0.85, hOffset: 520, angSpeed: 16 }
            ];

            debrisItems.forEach((deb, idx) => {
                const ratio = deb.hOffset / totalH;
                const curY = topY + deb.hOffset;
                const curHalfW = (185 * (1 - ratio * 0.75) + 35) * 0.9;
                const debAng = now * deb.angSpeed + idx * 1.5;
                const debX = sx + Math.cos(debAng) * curHalfW;
                const debScale = (Math.sin(debAng) + 1.2) * 0.5;

                if (deb.type === 'leaf_g') {
                    ctx.fillStyle = '#22c55e';
                    ctx.beginPath();
                    ctx.ellipse(debX, curY, 9 * debScale, 4 * debScale, debAng * 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (deb.type === 'leaf_o') {
                    ctx.fillStyle = '#f97316';
                    ctx.beginPath();
                    ctx.ellipse(debX, curY, 8 * debScale, 4.5 * debScale, debAng * 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = '#fde047';
                    ctx.beginPath();
                    ctx.arc(debX, curY, 4 * debScale, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // 6. 회오리 중심 초고압 발광 코어 (White-Hot Core Column)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
            ctx.fillRect(sx - 10, topY + 40, 20, totalH - 60);

            // 7. 대회오리 중심 회전 엠블럼 아이콘
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(-now * 8);
            ctx.font = '54px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌪️', 0, 0);
            ctx.restore();

            ctx.restore();
        });
    }

    drawFallingBombs(ctx) {
        this.fallingBombs.forEach(b => {
            // 1) 지면 타겟팅 경고 서클 및 십자선 (착탄 지점 표시)
            ctx.save();
            const progress = b.currentFrame / b.flightFrames;
            ctx.fillStyle = `rgba(239, 68, 68, ${0.25 + progress * 0.45})`;
            ctx.beginPath();
            ctx.ellipse(b.destX, b.destY, 24 + (1 - progress) * 20, 10 + (1 - progress) * 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(220, 38, 38, ${0.5 + progress * 0.5})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 십자 조준선
            ctx.beginPath();
            ctx.moveTo(b.destX - 12, b.destY);
            ctx.lineTo(b.destX + 12, b.destY);
            ctx.moveTo(b.destX, b.destY - 6);
            ctx.lineTo(b.destX, b.destY + 6);
            ctx.stroke();
            ctx.restore();

            // 2) 낙하 중인 도토리 폭탄 스프라이트
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.rotation);
            const bImg = this.bombImages && this.bombImages[b.rank];
            const bombSize = b.rank === 3 ? 46 : (b.rank === 2 ? 40 : 34);

            if (bImg && bImg.complete && bImg.naturalWidth > 0) {
                ctx.drawImage(bImg, -bombSize / 2, -bombSize / 2, bombSize, bombSize);
            } else {
                ctx.fillStyle = b.rank === 3 ? '#fbc02d' : (b.rank === 2 ? '#d32f2f' : '#5d4037');
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
            }

            // 도화선 스파크 반짝임
            if (Math.random() < 0.8) {
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.arc(0, -bombSize * 0.45, 3 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    }

    drawProjectiles(ctx) {
        if (!this.projectiles || this.projectiles.length === 0) return;
        this.projectiles.forEach(p => {
            // 비행 속도 잔상 선 (단일 폴리라인 고속 렌더링)
            if (p.history && p.history.length > 1) {
                ctx.strokeStyle = p.tier === 3 ? 'rgba(255, 112, 67, 0.45)' : (p.tier === 2 ? 'rgba(189, 189, 189, 0.45)' : 'rgba(141, 110, 99, 0.38)');
                ctx.lineWidth = p.tier === 3 ? 3 : 2;
                ctx.beginPath();
                ctx.moveTo(p.history[0].x, p.history[0].y);
                for (let h = 1; h < p.history.length; h++) {
                    ctx.lineTo(p.history[h].x, p.history[h].y);
                }
                ctx.stroke();
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation || 0);

            const img = this.projImages && this.projImages[p.tier];
            const size = p.tier === 3 ? 32 : (p.tier === 2 ? 28 : 24);

            if (p.tier === 3) {
                // Tier 3: 불꽃 화염 오라 (고성능 발광)
                ctx.fillStyle = 'rgba(255, 87, 34, 0.35)';
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.tier === 2) {
                // Tier 2: 금속성 광채 (고성능 발광)
                ctx.fillStyle = 'rgba(144, 164, 174, 0.35)';
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
            } else {
                // 백업 벡터 드로잉
                if (p.tier === 1) {
                    ctx.fillStyle = '#8d5b28';
                    ctx.beginPath();
                    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.tier === 2) {
                    ctx.fillStyle = '#5d4037';
                    ctx.beginPath();
                    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = '#263238';
                    ctx.beginPath();
                    ctx.arc(0, 0, p.radius + 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        });
    }

    // 셋째 돼지 마스터 대공 요격 로켓 렌더링
    drawAntiAirRockets(ctx) {
        if (!this.antiAirRockets) return;
        this.antiAirRockets.forEach(r => {
            // 비행 궤적 황금 섬광선
            if (r.history && r.history.length > 1) {
                ctx.save();
                for (let h = 0; h < r.history.length - 1; h++) {
                    const pt1 = r.history[h];
                    const pt2 = r.history[h + 1];
                    const alpha = ((h + 1) / r.history.length) * 0.7;
                    ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(pt1.x, pt1.y);
                    ctx.lineTo(pt2.x, pt2.y);
                    ctx.stroke();
                }
                ctx.restore();
            }

            ctx.save();
            ctx.translate(r.x, r.y);
            const angle = Math.atan2(r.vy || -1, r.vx || 1);
            ctx.rotate(angle);

            // 1. 로켓 부스터 화염
            ctx.fillStyle = 'rgba(255, 87, 34, 0.9)';
            ctx.beginPath();
            ctx.moveTo(-14, -5);
            ctx.lineTo(-24 - Math.random() * 8, 0);
            ctx.lineTo(-14, 5);
            ctx.closePath();
            ctx.fill();

            // 2. 황금 벽돌 대공 로켓 몸체
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-12, -7, 22, 14);
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-12, -7, 22, 14);

            // 벽돌 이음선
            ctx.strokeStyle = '#d97706';
            ctx.beginPath();
            ctx.moveTo(-1, -7); ctx.lineTo(-1, 7);
            ctx.stroke();

            // 3. 로켓 탄두 (붉은색 첨두 원뿔)
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(10, -7);
            ctx.lineTo(22, 0);
            ctx.lineTo(10, 7);
            ctx.closePath();
            ctx.fill();

            // 4. 날개 핀 (파란색 메탈 핀)
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.moveTo(-10, -7); ctx.lineTo(-16, -12); ctx.lineTo(-4, -7);
            ctx.moveTo(-10, 7); ctx.lineTo(-16, 12); ctx.lineTo(-4, 7);
            ctx.fill();

            // 5. 대공 유도 조준 센서 반짝임
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.arc(16, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    drawComicExplosions(ctx) {
        this.comicExplosions.forEach(exp => {
            ctx.save();
            const progress = 1 - (exp.life / exp.maxLife);
            const alpha = Math.max(0, 1 - progress * 1.25);

            // 1) 팽창하는 충격파 링 (Shockwave ring)
            ctx.strokeStyle = exp.rank === 3 ? `rgba(255, 235, 59, ${alpha * 0.85})` : (exp.rank === 2 ? `rgba(255, 87, 34, ${alpha * 0.85})` : `rgba(255, 152, 0, ${alpha * 0.85})`);
            ctx.lineWidth = Math.max(1, (1 - progress) * 6);
            ctx.beginPath();
            ctx.ellipse(exp.x, exp.y, exp.shockwaveRadius, exp.shockwaveRadius * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();

            const manager = this.game.performanceManager;
            const quality = manager ? manager.quality : 2;
            if (quality > 0 && !(manager && manager.prefersReducedMotion)) {
                // 고정 개수의 광선과 링: 추가 파티클 객체를 생성하지 않는다.
                ctx.globalAlpha = alpha * 0.65;
                ctx.strokeStyle = exp.rank === 3 ? '#fff9c4' : '#ffedd5';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const rays = quality === 2 ? 10 : 6;
                for (let ray = 0; ray < rays; ray++) {
                    const angle = ray * Math.PI * 2 / rays + exp.rotation;
                    const inner = exp.shockwaveRadius * 0.7;
                    const outer = exp.shockwaveRadius * (1.2 + (ray % 2) * 0.2);
                    ctx.moveTo(exp.x + Math.cos(angle) * inner, exp.y + Math.sin(angle) * inner * 0.65);
                    ctx.lineTo(exp.x + Math.cos(angle) * outer, exp.y + Math.sin(angle) * outer * 0.65);
                }
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(exp.x, exp.y, exp.shockwaveRadius * 0.72, exp.shockwaveRadius * 0.4, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // 2) 만화 폭발 버섯구름 스프라이트 (팝인 스케일 애니메이션)
            ctx.translate(exp.x, exp.y);
            ctx.rotate(exp.rotation);
            let curScale;
            if (progress < 0.25) {
                curScale = (progress / 0.25) * 1.25;
            } else {
                curScale = 1.25 - (progress - 0.25) * 0.35;
            }
            const baseW = exp.rank === 3 ? 165 : (exp.rank === 2 ? 135 : 110);
            const drawW = baseW * curScale;
            const drawH = drawW;

            ctx.globalAlpha = alpha;
            if (this.fxBoomImage && this.fxBoomImage.complete && this.fxBoomImage.naturalWidth > 0) {
                ctx.drawImage(this.fxBoomImage, -drawW / 2, -drawH * 0.65, drawW, drawH);
            }

            // 3) 만화 액션 텍스트 팝 (POW! / 쾅! / KABOOM!)
            if (progress < 0.65) {
                ctx.save();
                ctx.rotate(-exp.rotation);
                const textScale = Math.sin((progress / 0.65) * Math.PI) * 1.35;
                ctx.font = `900 ${Math.floor(22 * textScale)}px "Black Han Sans", Impact, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const txt = exp.rank === 3 ? '☢️ KABOOM!' : (exp.rank === 2 ? '🧨 콰-앙!!' : '💥 펑!');
                ctx.fillStyle = exp.rank === 3 ? '#ffeb3b' : (exp.rank === 2 ? '#ff5722' : '#ff9800');
                ctx.strokeStyle = '#212121';
                ctx.lineWidth = 4;
                ctx.strokeText(txt, 0, -drawH * 0.55);
                ctx.fillText(txt, 0, -drawH * 0.55);
                ctx.restore();
            }

            ctx.restore();
        });
    }

    drawCoins(ctx) {
        this.coins.forEach(c => {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#b8860b';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('G', c.x, c.y);
        });
    }

    drawParticles(ctx) {
        if (!this.particles || this.particles.length === 0) return;

        // 색상별 단일 패스 배치 렌더링 (Draw Call 90% 이상 대폭 절감)
        const buckets = this._particleBuckets;
        for (const [color, list] of buckets) {
            if (list.length === 0) buckets.delete(color);
            else list.length = 0;
        }
        for (let i = 0; i < this.particles.length; i++) {
            const pt = this.particles[i];
            const c = pt.color || '#ffffff';
            let list = buckets.get(c);
            if (!list) {
                list = [];
                buckets.set(c, list);
            }
            list.push(pt);
        }

        buckets.forEach((pts, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            for (let j = 0; j < pts.length; j++) {
                const pt = pts[j];
                const r = pt.size > 0 ? pt.size : 1.5;
                ctx.moveTo(pt.x + r, pt.y);
                ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
            }
            ctx.fill();
        });
        const manager = this.game.performanceManager;
        if (manager && (manager.quality === 0 || manager.prefersReducedMotion)) return;
        const count = Math.min(this.particles.length, manager && manager.quality === 1 ? 8 : 16);
        ctx.save();
        ctx.strokeStyle = '#fff7d6';
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
            const p = this.particles[i];
            const r = Math.min(7, Math.max(2, p.size || 2));
            ctx.moveTo(p.x - r, p.y);
            ctx.lineTo(p.x + r, p.y);
            ctx.moveTo(p.x, p.y - r);
            ctx.lineTo(p.x, p.y + r);
        }
        ctx.stroke();
        ctx.restore();

    }

    drawConfetti(ctx) {
        if (!this.confetti || this.confetti.length === 0) return;
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
            ctx.restore();
        }
    }

    drawFloatingTexts(ctx) {
        if (!this.floatingTexts || this.floatingTexts.length === 0) return;
        // 과다한 플로팅 텍스트 누적 방지 (최대 16개 O(1) 트렁케이트)
        if (this.floatingTexts.length > 16) {
            this.floatingTexts.length = 16;
        }

        // 공통 캔버스 상태 1회 설정 (save/restore 및 font 파싱 부하 완전 제거)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 18px sans-serif';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;

        for (let i = 0; i < this.floatingTexts.length; i++) {
            const ft = this.floatingTexts[i];
            ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
            ctx.fillStyle = ft.color;

            if (ft.isBanner) {
                ctx.font = `bold ${Math.floor(22 * (ft.scale || 1))}px sans-serif`;
                ctx.lineWidth = 5;
                ctx.strokeText(ft.text, ft.x, ft.y);
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.font = 'bold 18px sans-serif';
                ctx.lineWidth = 3;
            } else {
                ctx.strokeText(ft.text, ft.x, ft.y);
                ctx.fillText(ft.text, ft.x, ft.y);
            }
        }
        ctx.globalAlpha = 1.0;
    }

    // ⚡ 스탯 ALL MAX 요새 신성 각성 배경 아우라
    drawStatAwakeningAura(ctx) {
        if (!this.game || !this.game.checkAllStatsMax || !this.game.checkAllStatsMax()) return;
        ctx.save();
        const hx = this.game.house.x + this.game.house.w * 0.5;
        const hy = this.game.house.y + this.game.house.h * 0.45;
        const now = performance.now();
        const pulse = Math.sin(now * 0.004) * 0.18 + 0.95;

        // 신성한 황금 아우라 (그라디언트 객체 할당 없는 고성능 3단 동심원)
        const baseR = 190 * pulse;
        ctx.fillStyle = 'rgba(255, 152, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(hx, hy, baseR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 193, 7, 0.25)';
        ctx.beginPath();
        ctx.arc(hx, hy, baseR * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 235, 59, 0.40)';
        ctx.beginPath();
        ctx.arc(hx, hy, baseR * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // 번개 스파크 링
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(hx, hy, 150 * pulse, (now * 0.002) % (Math.PI * 2), (now * 0.002 + Math.PI * 1.2) % (Math.PI * 2));
        ctx.stroke();

        ctx.restore();
    }

    // 🌾 첫째 돼지 콤보: 화염 가시 장판 (1단계: 화염 장판, 2단계: 황금 가시밭)
    drawGroundFireTrails(ctx) {
        if (!this.groundFireTrails || this.groundFireTrails.length === 0) return;
        const now = performance.now();
        this.groundFireTrails.forEach(t => {
            const alpha = Math.min(1.0, t.life / 600);
            ctx.save();
            ctx.globalAlpha = alpha;

            if (t.tier === 1) {
                // 1단계: 바닥 화염 짚 장판 🔥
                ctx.fillStyle = 'rgba(255, 87, 34, 0.4)';
                ctx.beginPath();
                ctx.ellipse(t.x + t.w * 0.5, t.y + 12, t.w * 0.55, 12, 0, 0, Math.PI * 2);
                ctx.fill();

                // 일렁이는 불꽃
                for (let k = 0; k < 4; k++) {
                    const fx = t.x + (k / 3) * t.w;
                    const fh = 14 + Math.sin(now * 0.02 + fx) * 6;
                    ctx.fillStyle = k % 2 === 0 ? '#ff5722' : '#ffeb3b';
                    ctx.beginPath();
                    ctx.moveTo(fx - 6, t.y + 12);
                    ctx.lineTo(fx, t.y + 12 - fh);
                    ctx.lineTo(fx + 6, t.y + 12);
                    ctx.closePath();
                    ctx.fill();
                }
            } else {
                // 2단계: 황금 가시 불바다 👑 (황금 가시 + 맹렬한 불꽃)
                ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
                ctx.beginPath();
                ctx.ellipse(t.x + t.w * 0.5, t.y + 14, t.w * 0.6, 15, 0, 0, Math.PI * 2);
                ctx.fill();

                // 솟아난 황금 가시들
                const thornCount = 5;
                for (let i = 0; i < thornCount; i++) {
                    const tx = t.x + (i / (thornCount - 1)) * t.w;
                    const th = 22 + (i % 2 === 1 ? 8 : 0);
                    ctx.fillStyle = '#ffd700';
                    ctx.strokeStyle = '#b45309';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(tx - 7, t.y + 14);
                    ctx.lineTo(tx, t.y + 14 - th);
                    ctx.lineTo(tx + 7, t.y + 14);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // 가시 끝 번쩍이는 황금 스파크
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(tx, t.y + 14 - th, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                // 화염 아우라
                ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
                ctx.beginPath();
                ctx.arc(t.x + t.w * 0.5, t.y + 6, 18, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });
    }

    // 💣 둘째 돼지 콤보: 바닥 유황 지뢰
    drawSulfurMines(ctx) {
        if (!this.sulfurMines || this.sulfurMines.length === 0) return;
        const now = performance.now();
        this.sulfurMines.forEach(m => {
            ctx.save();
            ctx.translate(m.x, m.y);

            // 감지 경고 링
            const blink = Math.sin(now * 0.015) > 0;
            ctx.strokeStyle = blink ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.35)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, 36, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // 유황 지뢰 본체 (황동 지뢰판 + 유황 수정체)
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(0, 4, 16, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // 유황 크리스탈
            ctx.fillStyle = '#facc15';
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(8, 0);
            ctx.lineTo(0, 5);
            ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 점화 심지 LED
            ctx.fillStyle = blink ? '#ff0000' : '#ffa000';
            ctx.beginPath();
            ctx.arc(0, -12, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    // 💣 둘째 돼지 콤보: 2차 유탄 클러스터 파편
    drawSecondaryClusters(ctx) {
        if (!this.secondaryClusters || this.secondaryClusters.length === 0) return;
        this.secondaryClusters.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);

            // 소형 폭탄 탄체
            ctx.fillStyle = c.tier === 2 ? '#b91c1c' : '#854d0e';
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 심지 불꽃
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(c.radius * 0.7, -c.radius * 0.7, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    // ♨️ 셋째 돼지 콤보: 요새 고압 증기 펄스 & 플라즈마 충격파
    drawSteamPulses(ctx) {
        if (!this.steamPulses || this.steamPulses.length === 0) return;
        this.steamPulses.forEach(s => {
            const progress = s.radius / s.maxRadius;
            const alpha = Math.max(0, (1 - progress) * 0.85);
            ctx.save();
            ctx.globalAlpha = alpha;

            if (s.tier === 1) {
                // 1단계: 고압 백색 증기 펄스 링
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 14 * (1 - progress);
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.strokeStyle = 'rgba(224, 242, 254, 0.7)';
                ctx.lineWidth = 26 * (1 - progress);
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius * 0.95, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // 2단계: 초고압 플라즈마 증기 펄스 ⚡ (푸른빛 + 보랏빛 전격 아크)
                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = 18 * (1 - progress);
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius * 1.05, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        });
    }

    // 🌋 셋째 돼지 콤보: 가마솥 용암 대공포 탄환
    drawLavaMortars(ctx) {
        if (!this.lavaMortars || this.lavaMortars.length === 0) return;
        this.lavaMortars.forEach(m => {
            ctx.save();
            ctx.translate(m.x, m.y);

            // 용암 고속 후광 (그라디언트 객체 할당 없는 동심원 발광)
            ctx.fillStyle = 'rgba(216, 27, 96, 0.35)';
            ctx.beginPath();
            ctx.arc(0, 0, m.radius * 1.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 87, 34, 0.65)';
            ctx.beginPath();
            ctx.arc(0, 0, m.radius * 1.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(0, 0, m.radius * 0.9, 0, Math.PI * 2);
            ctx.fill();

            // 단단한 마그마 핵
            ctx.fillStyle = '#d84315';
            ctx.beginPath();
            ctx.arc(0, 0, m.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    // ⚡ 스탯 ALL MAX: 천벌의 벼락 이펙트
    drawDivineLightnings(ctx) {
        if (!this.divineLightnings || this.divineLightnings.length === 0) return;
        this.divineLightnings.forEach(l => {
            const alpha = Math.min(1.0, l.life / 80);
            ctx.save();
            ctx.globalAlpha = alpha;

            // 주 번개 줄기
            if (l.points && l.points.length > 1) {
                // 외곽 푸른빛/황금빛 발광
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
                ctx.lineWidth = 10;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(l.points[0].x, l.points[0].y);
                for (let i = 1; i < l.points.length; i++) {
                    ctx.lineTo(l.points[i].x, l.points[i].y);
                }
                ctx.stroke();

                // 중심 순백의 전력 코어
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(l.points[0].x, l.points[0].y);
                for (let i = 1; i < l.points.length; i++) {
                    ctx.lineTo(l.points[i].x, l.points[i].y);
                }
                ctx.stroke();
            }

            // 착탄 지점 충격 구형
            ctx.fillStyle = 'rgba(255, 235, 59, 0.8)';
            ctx.beginPath();
            ctx.arc(l.targetX, l.targetY, 32 * (1 - l.life / l.maxLife + 0.5), 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    drawUltimateCinematic(ctx) {
        if (this.ultimateCinematic <= 0) return;
        const progress = this.ultimateCinematic / 45; // 1 -> 0

        ctx.save();

        // 1. 전체 화면 시공간 왜곡 틴트 & 섬광 플래시
        if (this.ultimateCinematic >= 38) {
            const flashAlpha = (this.ultimateCinematic - 38) / 7;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.85})`;
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
        } else {
            // 어두운 시네마틱 레터박스 비네트
            const vigGrad = ctx.createRadialGradient(V_WIDTH / 2, V_HEIGHT / 2, 200, V_WIDTH / 2, V_HEIGHT / 2, V_WIDTH * 0.75);
            vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vigGrad.addColorStop(1, `rgba(45, 10, 80, ${progress * 0.55})`);
            ctx.fillStyle = vigGrad;
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
        }

        // 2. 만화풍 하이퍼 스피드라인 (Speedlines)
        const numLines = 36;
        ctx.lineWidth = 3;
        for (let i = 0; i < numLines; i++) {
            const seed = (i * 137.5) % 1;
            const y = (i / numLines) * V_HEIGHT + (Math.sin(performance.now() * 0.02 + i) * 15);
            const lineLen = 300 + seed * 600;
            const startX = ((performance.now() * 1.8 + i * 85) % (V_WIDTH + lineLen)) - lineLen;
            const alpha = (0.2 + seed * 0.5) * Math.min(1, progress * 1.5);

            ctx.strokeStyle = i % 3 === 0 
                ? `rgba(255, 255, 255, ${alpha})` 
                : (i % 3 === 1 ? `rgba(217, 70, 239, ${alpha})` : `rgba(56, 189, 248, ${alpha})`);

            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(startX + lineLen, y + (seed - 0.5) * 20);
            ctx.stroke();
        }

        // 3. 역동적인 사선 만화 컷인 배너 (Manga Cut-in Ribbon)
        const bannerH = 110;
        const bannerY = 190;
        let bannerOffset = 0;
        if (this.ultimateCinematic > 40) {
            bannerOffset = (this.ultimateCinematic - 40) * 80;
        } else if (this.ultimateCinematic < 10) {
            bannerOffset = (10 - this.ultimateCinematic) * -80;
        }

        ctx.save();
        ctx.translate(bannerOffset, 0);

        // 배너 배경 (사선 평행사변형)
        ctx.beginPath();
        ctx.moveTo(-50, bannerY - 15);
        ctx.lineTo(V_WIDTH + 50, bannerY);
        ctx.lineTo(V_WIDTH + 50, bannerY + bannerH + 15);
        ctx.lineTo(-50, bannerY + bannerH);
        ctx.closePath();

        const bannerGrad = ctx.createLinearGradient(0, bannerY, V_WIDTH, bannerY);
        bannerGrad.addColorStop(0, 'rgba(30, 10, 60, 0.95)');
        bannerGrad.addColorStop(0.3, 'rgba(88, 28, 135, 0.95)');
        bannerGrad.addColorStop(0.7, 'rgba(157, 23, 77, 0.95)');
        bannerGrad.addColorStop(1, 'rgba(30, 10, 60, 0.95)');
        ctx.fillStyle = bannerGrad;
        ctx.fill();

        // 배너 골드/네온 테두리
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#facc15';
        ctx.stroke();

        // 컷인 삼형제 아바타 합동 렌더링 (좌측 140px 부근)
        const pigBaseX = 140;
        const pigBaseY = bannerY + 58;

        // 삼형제 영웅 아우라
        const auraGrad = ctx.createRadialGradient(pigBaseX, pigBaseY, 10, pigBaseX, pigBaseY, 70);
        auraGrad.addColorStop(0, 'rgba(250, 204, 21, 0.8)');
        auraGrad.addColorStop(0.6, 'rgba(236, 72, 153, 0.4)');
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(pigBaseX, pigBaseY, 70, 0, Math.PI * 2);
        ctx.fill();

        // 삼형제 이미지 나란히 배치
        if (this.pigImages) {
            if (this.pigImages[1]?.complete && this.pigImages[1]?.naturalWidth > 0) {
                ctx.drawImage(this.pigImages[1], pigBaseX - 70, pigBaseY - 45, 55, 75);
            }
            if (this.pigImages[3]?.complete && this.pigImages[3]?.naturalWidth > 0) {
                ctx.drawImage(this.pigImages[3], pigBaseX + 15, pigBaseY - 45, 55, 75);
            }
            if (this.pigImages[2]?.complete && this.pigImages[2]?.naturalWidth > 0) {
                ctx.drawImage(this.pigImages[2], pigBaseX - 30, pigBaseY - 50, 65, 85);
            }
        }

        // 컷인 텍스트 렌더링
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.font = '900 14px "Comic Sans MS", "Noto Sans KR", sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('★ CELESTIAL TYPHOON · MAXIMUM TORNADO BLOWAWAY ★', pigBaseX + 105, bannerY + 28);

        ctx.font = '900 36px "Jua", "Noto Sans KR", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🌪️ 전설의 궁극기: 천지개벽 대회오리 폭풍! 🌪️', pigBaseX + 100, bannerY + 58);

        ctx.font = '800 15px "Noto Sans KR", sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText('삼형제의 합동 비기 발동! 거대 대회오리가 모든 늑대를 하늘 높이 날려버립니다!', pigBaseX + 105, bannerY + 86);

        ctx.restore();
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.EffectsRenderer = EffectsRenderer;
}
