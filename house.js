/**
 * house.js
 * 아기돼지 삼형제의 집(초가집, 통나무집, 벽돌성) 및 아기돼지 모션, 말풍선 렌더러
 */

class HouseRenderer {
    constructor(game) {
        this.game = game;
    }

    get house() { return this.game.house; }
    get houseImages() { return this.game.houseImages; }
    get pigRanks() { return this.game.pigRanks; }
    get pigAnim() { return this.game.pigAnim; }
    get pigAnimators() { return this.game.pigAnimators; }
    get pigImages() { return this.game.pigImages; }
    get pigSpeeches() { return this.game.pigSpeeches; }
    get cauldronFire() { return this.game.cauldronFire; }

    drawCauldronWater(ctx) {
        if (this.cauldronFire > 0) {
            ctx.fillStyle = 'rgba(255, 87, 34, 0.35)';
            ctx.beginPath();
            ctx.ellipse(this.house.x + this.house.w + 60, this.house.y + 200, 90, 25, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    draw(ctx) {
        this.drawCauldronWater(ctx);
        this.drawHouseAndPigs();
        this.drawPigSpeeches();
    }

    // 집과 아기돼지 삼형제 드로잉
    drawHouseAndPigs() {
        ctx.save();
        const shakeX = (Math.random() - 0.5) * this.house.shake;
        const shakeY = (Math.random() - 0.5) * this.house.shake;
        ctx.translate(this.house.x + shakeX, this.house.y + shakeY);

        const w = this.house.w;
        const h = this.house.h;

        const hImg = this.houseImages && this.houseImages[this.house.tier];
        if (hImg && hImg.complete && hImg.naturalWidth > 0) {
            // 🏠 고화질 공식 일러스트 스프라이트 렌더링 (신축 15% 확대 규격 반영)
            const drawW = w + 40;
            const drawH = (drawW / hImg.naturalWidth) * hImg.naturalHeight;
            const drawX = -20;
            const drawY = h - drawH + 16;

            // 철거 단계 시 살짝 가라앉음/진동
            let visualY = drawY;
            let visualScale = 1.0;
            if (this.game.reconstruction && this.game.reconstruction.active) {
                const recon = this.game.reconstruction;
                if (recon.phase === 'demolish') {
                    visualY += (recon.elapsed / 300) * 16;
                } else if (recon.phase === 'complete') {
                    const popProgress = (recon.elapsed - 800) / 400;
                    visualScale = 1.0 + Math.sin(popProgress * Math.PI) * 0.08;
                }
            }

            ctx.save();
            if (visualScale !== 1.0) {
                ctx.translate(w * 0.5, h);
                ctx.scale(visualScale, visualScale);
                ctx.translate(-w * 0.5, -h);
            }
            ctx.drawImage(hImg, drawX, visualY, drawW, drawH);
            ctx.restore();

            // 실시간 인터랙션 1: 굴뚝 뭉게구름 연기 (동적 arc 버블)
            const now = performance.now() * 0.003;
            let chimX = w - 38;
            let chimY = drawY + 32;
            if (this.house.tier === 2) {
                chimX = 36; // 통나무집은 좌측 자연석 굴뚝
                chimY = drawY + 28;
            } else if (this.house.tier === 3) {
                chimX = w - 36; // 콘크리트 성채는 우측 배기탑
                chimY = drawY + 30;
            }

            ctx.save();
            ctx.fillStyle = this.house.tier === 3 ? 'rgba(203, 213, 225, 0.65)' : 'rgba(245, 245, 245, 0.75)';
            ctx.beginPath();
            ctx.arc(chimX + Math.sin(now * 2) * 6, chimY - 14, 9, 0, Math.PI * 2);
            ctx.arc(chimX + Math.cos(now * 1.8) * 9 + 5, chimY - 30, 13, 0, Math.PI * 2);
            ctx.arc(chimX + Math.sin(now * 1.5) * 13 + 10, chimY - 48, 17, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 실시간 인터랙션 2: 스타일별 동적 등불 & 창문 온기
            if (this.house.tier === 1) {
                // 1단계 짚집: 처마 밑 흔들리는 호롱불 & 따스한 주황빛 온기
                const lanternX = w * 0.51;
                const lanternY = drawY + drawH * 0.46;
                const lanternSway = Math.sin(now * 2.5) * 4;
                const flamePulse = 0.85 + Math.sin(now * 7) * 0.15;
                ctx.save();
                ctx.fillStyle = `rgba(253, 224, 71, ${0.35 * flamePulse})`;
                ctx.beginPath();
                ctx.arc(lanternX + lanternSway, lanternY, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(245, 158, 11, ${0.7 * flamePulse})`;
                ctx.beginPath();
                ctx.arc(lanternX + lanternSway, lanternY, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (this.house.tier === 2) {
                // 2단계 통나무집: 창문 너머 벽난로 장작불 깜빡임 온기
                const hearthX = w * 0.31;
                const hearthY = drawY + drawH * 0.64;
                const firePulse = 0.8 + Math.sin(now * 8) * 0.2;
                ctx.save();
                ctx.fillStyle = `rgba(249, 115, 22, ${0.28 * firePulse})`;
                ctx.beginPath();
                ctx.ellipse(hearthX, hearthY, 26, 20, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (this.house.tier === 3) {
                // 3단계 콘크리트 성채: 요새 방어 서치라이트/랜턴 보호 빔
                const beaconX = w * 0.48;
                const beaconY = drawY + drawH * 0.55;
                const beaconPulse = 0.85 + Math.sin(now * 4) * 0.15;
                ctx.save();
                ctx.fillStyle = `rgba(56, 189, 248, ${0.25 * beaconPulse})`;
                ctx.beginPath();
                ctx.arc(beaconX, beaconY, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // 실시간 인터랙션 3: 체력 감소에 따른 벽면 손상 균열 (Damage Cracks)
            const hpRatio = Math.max(0, this.house.hp / this.house.maxHp);
            if (hpRatio < 0.75) {
                ctx.save();
                const isCritical = hpRatio < 0.25;
                const isHeavy = hpRatio < 0.5;
                const crackColor = this.house.tier === 3 ? '#0f172a' : (this.house.tier === 2 ? '#451a03' : '#78350f');
                ctx.strokeStyle = crackColor;
                ctx.lineWidth = isCritical ? 3.5 : (isHeavy ? 2.5 : 1.8);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // 중앙 균열 라인
                ctx.beginPath();
                ctx.moveTo(w * 0.38, h * 0.48);
                ctx.lineTo(w * 0.44, h * 0.56);
                ctx.lineTo(w * 0.40, h * 0.65);
                ctx.lineTo(w * 0.47, h * 0.76);
                ctx.stroke();

                if (isHeavy) {
                    ctx.beginPath();
                    ctx.moveTo(w * 0.72, h * 0.42);
                    ctx.lineTo(w * 0.67, h * 0.52);
                    ctx.lineTo(w * 0.74, h * 0.62);
                    ctx.lineTo(w * 0.70, h * 0.74);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(w * 0.18, h * 0.82);
                    ctx.lineTo(w * 0.24, h * 0.88);
                    ctx.lineTo(w * 0.22, h * 0.94);
                    ctx.stroke();
                }

                if (isCritical) {
                    const warnPulse = 0.5 + Math.sin(performance.now() * 0.008) * 0.45;
                    ctx.strokeStyle = `rgba(239, 68, 68, ${warnPulse})`;
                    ctx.lineWidth = 2.0;
                    ctx.beginPath();
                    ctx.moveTo(w * 0.52, h * 0.32);
                    ctx.lineTo(w * 0.48, h * 0.45);
                    ctx.lineTo(w * 0.55, h * 0.58);
                    ctx.stroke();

                    ctx.fillStyle = `rgba(239, 68, 68, ${warnPulse * 0.15})`;
                    ctx.fillRect(0, 0, w, h);
                }
                ctx.restore();
            }

            // 실시간 인터랙션 4: 셋째 돼지 수리 시 황금빛/초록빛 균열 봉합 치유 오라
            if (this.house.repairFxTimer > 0) {
                ctx.save();
                const repairProgress = this.house.repairFxTimer / 1500;
                const glowAlpha = Math.min(1.0, repairProgress * 1.5);
                ctx.strokeStyle = `rgba(74, 222, 128, ${glowAlpha})`;
                ctx.shadowColor = '#4ade80';
                ctx.shadowBlur = 12;
                ctx.lineWidth = 3.5;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(w * 0.38, h * 0.48);
                ctx.lineTo(w * 0.44, h * 0.56);
                ctx.lineTo(w * 0.40, h * 0.65);
                ctx.lineTo(w * 0.47, h * 0.76);
                ctx.stroke();

                ctx.strokeStyle = `rgba(250, 204, 21, ${glowAlpha * 0.85})`;
                ctx.beginPath();
                ctx.moveTo(w * 0.72, h * 0.42);
                ctx.lineTo(w * 0.67, h * 0.52);
                ctx.lineTo(w * 0.74, h * 0.62);
                ctx.lineTo(w * 0.70, h * 0.74);
                ctx.stroke();

                const nowT = performance.now() * 0.005;
                for (let r = 0; r < 4; r++) {
                    const rx = w * (0.35 + (r % 2) * 0.32);
                    const ry = h * (0.50 + Math.floor(r / 2) * 0.22);
                    const sparkSize = 4 + Math.sin(nowT + r) * 3;
                    ctx.fillStyle = '#fef08a';
                    ctx.fillRect(rx - sparkSize, ry - 1.5, sparkSize * 2, 3);
                    ctx.fillRect(rx - 1.5, ry - sparkSize, 3, sparkSize * 2);
                }
                ctx.restore();
            }

            // 🏗️ 신축 공사 중 특수 연출 (철거 파편 & 건설 먼지 & 망치 스파크 & 완공 별빛)
            if (this.game.reconstruction && this.game.reconstruction.active) {
                const recon = this.game.reconstruction;
                ctx.save();
                
                // 공사 먼지 구름
                if (recon.dustClouds && recon.dustClouds.length > 0) {
                    recon.dustClouds.forEach(d => {
                        ctx.fillStyle = `rgba(245, 245, 244, ${Math.max(0, d.alpha)})`;
                        ctx.beginPath();
                        ctx.arc(d.x - this.house.x, d.y - this.house.y, d.size, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }

                // 비산 파편
                if (recon.debris && recon.debris.length > 0) {
                    recon.debris.forEach(deb => {
                        ctx.save();
                        ctx.translate(deb.x - this.house.x, deb.y - this.house.y);
                        ctx.rotate(deb.rot);
                        ctx.fillStyle = deb.color;
                        ctx.fillRect(-deb.size / 2, -deb.size / 2, deb.size, deb.size * 0.7);
                        ctx.restore();
                    });
                }

                // 빌드 단계 (300~800ms) 망치질 스파크
                if (recon.phase === 'build') {
                    for (let s = 0; s < 4; s++) {
                        const sx = (Math.sin(performance.now() * 0.02 + s * 2) * 0.4 + 0.5) * w;
                        const sy = (Math.cos(performance.now() * 0.015 + s * 3) * 0.3 + 0.5) * h;
                        ctx.fillStyle = s % 2 === 0 ? '#ffeb3b' : '#ffffff';
                        ctx.beginPath();
                        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                // 완공 단계 (800~1200ms) 황금 별빛 축포
                if (recon.phase === 'complete') {
                    const starProgress = (recon.elapsed - 800) / 400;
                    const starAlpha = Math.max(0, 1 - starProgress);
                    ctx.fillStyle = `rgba(255, 215, 0, ${starAlpha})`;
                    for (let st = 0; st < 8; st++) {
                        const ang = (st / 8) * Math.PI * 2;
                        const dist = starProgress * 70;
                        const stx = w * 0.5 + Math.cos(ang) * dist;
                        const sty = h * 0.5 + Math.sin(ang) * dist;
                        ctx.beginPath();
                        ctx.arc(stx, sty, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }
        } else if (this.house.tier === 1) {
            // ================= [폴백] 1단계: 초가집 =================
            const deckY = 156;
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(4, deckY, w - 8, h - deckY);
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(4, deckY, w - 8, h - deckY);
            ctx.strokeStyle = '#4e342e';
            ctx.lineWidth = 1.5;
            for (let x = 18; x < w - 10; x += 22) {
                ctx.beginPath();
                ctx.moveTo(x, deckY);
                ctx.lineTo(x, h);
                ctx.stroke();
            }

            ctx.fillStyle = '#fdd835';
            ctx.fillRect(8, 70, w - 16, deckY - 70);
            ctx.strokeStyle = '#e6a100';
            ctx.lineWidth = 3;
            ctx.strokeRect(8, 70, w - 16, deckY - 70);

            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.2;
            for (let y = 80; y < deckY; y += 14) {
                ctx.beginPath();
                ctx.moveTo(12, y);
                ctx.lineTo(w - 12, y);
                ctx.stroke();
            }

            ctx.fillStyle = '#fff9c4';
            ctx.fillRect(20, 85, 42, 38);
            ctx.strokeStyle = '#8d6e63';
            ctx.lineWidth = 2;
            ctx.strokeRect(20, 85, 42, 38);
            ctx.beginPath();
            ctx.moveTo(41, 85); ctx.lineTo(41, 123);
            ctx.moveTo(20, 104); ctx.lineTo(62, 104);
            ctx.stroke();

            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(w * 0.58, 78, 48, deckY - 78);
            ctx.strokeStyle = '#3e2723';
            ctx.strokeRect(w * 0.58, 78, 48, deckY - 78);
            ctx.fillStyle = '#ffd54f';
            ctx.beginPath();
            ctx.arc(w * 0.58 + 10, 115, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fbc02d';
            ctx.beginPath();
            ctx.moveTo(-20, 78);
            ctx.quadraticCurveTo(w / 2, -18, w + 20, 78);
            ctx.lineTo(w + 14, 92);
            ctx.quadraticCurveTo(w / 2, 0, -14, 92);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            ctx.strokeStyle = '#e6a100';
            ctx.lineWidth = 2;
            for (let i = 0; i < 11; i++) {
                ctx.beginPath();
                ctx.moveTo(-6 + i * 18, 84);
                ctx.lineTo(-1 + i * 18, 98);
                ctx.stroke();
            }

            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, 72);
            ctx.quadraticCurveTo(w / 2, -10, w + 10, 72);
            ctx.stroke();

        } else if (this.house.tier === 2) {
            // ================= [폴백] 2단계: 나무집 =================
            ctx.fillStyle = '#78909c';
            ctx.fillRect(5, h - 22, w - 10, 22);
            ctx.strokeStyle = '#455a64';
            ctx.strokeRect(5, h - 22, w - 10, 22);

            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(10, 65, w - 20, h - 85);
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 3;
            for (let y = 65; y < h - 20; y += 18) {
                ctx.beginPath();
                ctx.moveTo(10, y);
                ctx.lineTo(w - 10, y);
                ctx.stroke();
            }

            ctx.fillStyle = '#4e342e';
            ctx.fillRect(w * 0.52, h - 80, 52, 60);
            ctx.strokeStyle = '#271c19';
            ctx.strokeRect(w * 0.52, h - 80, 52, 60);
            ctx.fillStyle = '#ffd54f';
            ctx.beginPath();
            ctx.arc(w * 0.52 + 10, h - 50, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffe082';
            ctx.fillRect(20, h - 82, 48, 42);
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(20, h - 82, 48, 42);

            ctx.fillStyle = '#ffe082';
            ctx.fillRect(w * 0.45, 80, 55, 42);
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 3;
            ctx.strokeRect(w * 0.45, 80, 55, 42);
            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(w * 0.42, 115, 62, 8);
            ctx.strokeRect(w * 0.42, 115, 62, 8);

            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            ctx.moveTo(w / 2, -18);
            ctx.lineTo(-20, 72);
            ctx.lineTo(w + 20, 72);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            ctx.fillStyle = '#4e342e';
            ctx.fillRect(w / 2 - 28, 8, 56, 12);
            ctx.strokeStyle = '#271c19';
            ctx.strokeRect(w / 2 - 28, 8, 56, 12);

        } else {
            // ================= [폴백] 3단계: 벽돌집 =================
            ctx.fillStyle = '#b71c1c';
            ctx.fillRect(w - 52, -32, 40, 68);
            ctx.strokeStyle = '#7f0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(w - 52, -32, 40, 68);

            const now = performance.now() * 0.003;
            ctx.fillStyle = 'rgba(230, 230, 230, 0.7)';
            ctx.beginPath();
            ctx.arc(w - 32 + Math.sin(now * 2) * 5, -42, 8, 0, Math.PI * 2);
            ctx.arc(w - 28 + Math.cos(now * 1.8) * 8, -56, 12, 0, Math.PI * 2);
            ctx.arc(w - 24 + Math.sin(now * 1.5) * 12, -72, 16, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#37474f';
            ctx.fillRect(2, h - 25, w - 4, 25);
            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(2, h - 25, w - 4, 25);

            ctx.fillStyle = '#c62828';
            ctx.fillRect(6, 55, w - 12, h - 78);
            ctx.strokeStyle = '#ffebee';
            ctx.lineWidth = 1.5;
            for (let y = 55; y < h - 25; y += 16) {
                ctx.beginPath();
                ctx.moveTo(6, y);
                ctx.lineTo(w - 6, y);
                ctx.stroke();
            }

            ctx.fillStyle = '#455a64';
            ctx.fillRect(w * 0.52, h - 85, 54, 62);
            ctx.strokeStyle = '#263238';
            ctx.lineWidth = 3;
            ctx.strokeRect(w * 0.52, h - 85, 54, 62);
            ctx.fillStyle = '#b0bec5';
            for (let r = 0; r < 3; r++) {
                ctx.fillRect(w * 0.55 + r * 15, h - 78, 4, 4);
                ctx.fillRect(w * 0.55 + r * 15, h - 35, 4, 4);
            }

            ctx.fillStyle = '#ffb300';
            ctx.fillRect(18, h - 86, 50, 44);
            ctx.strokeStyle = '#37474f';
            ctx.lineWidth = 3;
            ctx.strokeRect(18, h - 86, 50, 44);

            ctx.fillStyle = '#37474f';
            ctx.beginPath();
            ctx.arc(w * 0.62, 90, 24, Math.PI, 0);
            ctx.lineTo(w * 0.62 + 24, 118);
            ctx.lineTo(w * 0.62 - 24, 118);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffc107';
            ctx.fillRect(w * 0.62 - 18, 92, 36, 22);

            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.moveTo(w / 2, -20);
            ctx.lineTo(-24, 60);
            ctx.lineTo(w + 24, 60);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#102027';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            ctx.fillStyle = '#b71c1c';
            ctx.fillRect(w / 2 - 32, 6, 64, 14);
            ctx.strokeStyle = '#7f0000';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(w / 2 - 32, 6, 64, 14);
        }

        // 무적 방어막 돔 렌더링 (셋째 3성 스킬 발동 시)
        if (this.house.invincibleTimer > 0) {
            ctx.save();
            ctx.strokeStyle = '#00e5ff';
            ctx.fillStyle = 'rgba(0, 229, 255, 0.22)';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.ellipse(w * 0.5, h * 0.5, w * 0.75, h * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 방어막 육각 홀로그램 텍스트
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🛡️ 절대 무적 성벽 (${(this.house.invincibleTimer / 1000).toFixed(1)}s)`, w * 0.5, -25);
            ctx.restore();
        }

        // ================= 아기돼지 삼형제 배치 =================
        if (this.house.tier === 1) {
            // 1단계 초가집: 늑대가 나오는 위치와 동일한 높이의 1층 넓은 툇마루에 삼형제 나란히 배치!
            this.drawPig(3, 44, 184, this.pigRanks[3]);
            this.drawPig(2, 105, 180, this.pigRanks[2]);
            this.drawPig(1, 168, 184, this.pigRanks[1]);
        } else {
            // 2단계(나무집) / 3단계(콘크리트 성채):
            // 캐릭터 앞을 가리던 난간 없이 견고한 발받침대(플랫폼)를 먼저 그린 뒤 캐릭터를 렌더링!
            if (this.house.tier === 2) {
                // --- 2단계 나무집: 견고한 원목 발받침대 ---
                // 1) 2층 둘째 돼지 발받침대 (튼튼한 원목 판자 플랫폼 + 목재 사선 지지대)
                const p2X = w * 0.62;
                const p2FootY = 120; // 둘째 돼지 발바닥 높이
                ctx.fillStyle = '#4e342e';
                ctx.beginPath();
                ctx.moveTo(p2X - 30, p2FootY); ctx.lineTo(p2X - 30, p2FootY + 16); ctx.lineTo(p2X - 16, p2FootY);
                ctx.moveTo(p2X + 16, p2FootY); ctx.lineTo(p2X + 30, p2FootY + 16); ctx.lineTo(p2X + 30, p2FootY);
                ctx.fill();
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(p2X - 38, p2FootY, 76, 10);
                ctx.strokeStyle = '#3e2723';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(p2X - 38, p2FootY, 76, 10);

                // 2) 3층 첫째 돼지 발받침대 (지붕 꼭대기 통나무 관측 발판)
                const p1X = w * 0.5;
                const p1FootY = 32; // 첫째 돼지 발바닥 높이
                ctx.fillStyle = '#3e2723';
                ctx.beginPath();
                ctx.moveTo(p1X - 26, p1FootY); ctx.lineTo(p1X - 26, p1FootY + 14); ctx.lineTo(p1X - 12, p1FootY);
                ctx.moveTo(p1X + 12, p1FootY); ctx.lineTo(p1X + 26, p1FootY + 14); ctx.lineTo(p1X + 26, p1FootY);
                ctx.fill();
                ctx.fillStyle = '#6d4c41';
                ctx.fillRect(p1X - 36, p1FootY, 72, 9);
                ctx.strokeStyle = '#271c19';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(p1X - 36, p1FootY, 72, 9);

            } else if (this.house.tier === 3) {
                // --- 3단계 콘크리트 성채: 중후한 강화 콘크리트 슬래브 발받침대 ---
                // 1) 2층 둘째 돼지 발받침대 (콘크리트 테라스 발판 + 코벨 받침)
                const p2X = w * 0.62;
                const p2FootY = 120;
                ctx.fillStyle = '#334155';
                ctx.beginPath();
                ctx.moveTo(p2X - 32, p2FootY); ctx.lineTo(p2X - 32, p2FootY + 18); ctx.lineTo(p2X - 16, p2FootY);
                ctx.moveTo(p2X + 16, p2FootY); ctx.lineTo(p2X + 32, p2FootY + 18); ctx.lineTo(p2X + 32, p2FootY);
                ctx.fill();
                ctx.fillStyle = '#64748b';
                ctx.fillRect(p2X - 40, p2FootY, 80, 12);
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(p2X - 40, p2FootY, 80, 12);
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(p2X - 38, p2FootY + 1, 76, 3);

                // 2) 3층 첫째 돼지 발받침대 (요새 치성 망루 발판)
                const p1X = w * 0.5;
                const p1FootY = 32;
                ctx.fillStyle = '#1e293b';
                ctx.beginPath();
                ctx.moveTo(p1X - 28, p1FootY); ctx.lineTo(p1X - 28, p1FootY + 16); ctx.lineTo(p1X - 14, p1FootY);
                ctx.moveTo(p1X + 14, p1FootY); ctx.lineTo(p1X + 28, p1FootY + 16); ctx.lineTo(p1X + 28, p1FootY);
                ctx.fill();
                ctx.fillStyle = '#475569';
                ctx.fillRect(p1X - 38, p1FootY, 76, 11);
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(p1X - 38, p1FootY, 76, 11);
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(p1X - 36, p1FootY + 1, 72, 3);
            }

            // 발받침대 위에 온전한 전신 캐릭터 렌더링
            // 1층: 셋째 돼지 (성문과 기단부를 망치와 방패로 수호!)
            this.drawPig(3, 50, 184, this.pigRanks[3]);
            // 2층: 둘째 돼지 (2층 발받침대 위에서 도토리 새총 조준!)
            this.drawPig(2, w * 0.62, 96, this.pigRanks[2]);
            // 3층: 첫째 돼지 (3층 발받침대 위에서 거대 짚단을 굴리는 지휘관!)
            this.drawPig(1, w * 0.5, 14, this.pigRanks[1]);
        }

        ctx.restore();
    }

    // 돼지 캐릭터 렌더링 헬퍼 (배경 완전 제거 누끼 캐릭터 & 실시간 모션 애니메이션)
    drawPig(pigId, x, y, rank = 1) {
        ctx.save();

        const anim = (this.pigAnim && this.pigAnim[pigId]) || { bounce: 0, recoil: 0, rot: 0 };
        const now = performance.now() * 0.0035;

        // 각 돼지별 고유한 리듬의 호흡 & 통통 바운스
        let idleBounceY = 0;
        let idleRot = 0;
        if (pigId === 1) {
            idleBounceY = Math.sin(now * 1.8 + 0.5) * 4.5;
            idleRot = Math.sin(now * 1.2) * 0.07;
        } else if (pigId === 2) {
            idleBounceY = Math.sin(now * 1.6 + 1.2) * 4.0;
            idleRot = Math.sin(now * 1.1) * 0.06;
        } else if (pigId === 3) {
            idleBounceY = Math.sin(now * 1.4 + 2.0) * 3.5;
            idleRot = Math.sin(now * 0.9) * 0.05;
        }

        const totalX = x - (anim.recoil || 0);
        const totalY = y - 7 + idleBounceY - (anim.bounce || 0);
        const totalRot = idleRot + (anim.rot || 0);

        ctx.translate(totalX, totalY);
        ctx.rotate(totalRot);
        ctx.scale(1.43, 1.43); // 🐷 아기돼지 삼형제 캐릭터 크기 10% 추가 확대! (1.3 -> 1.43)

        // 1. 발 밑 부드러운 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 24, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. 3성/2성 성급 오라 효과 (MAX 상태면 회전 황금 마법진 오라)
        const isPigMax = rank >= 3 || (pigId === 3 && rank >= 2);
        if (isPigMax) {
            // 찬란한 회전 황금 마법진 오라
            ctx.save();
            ctx.rotate(now * 1.5);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.setLineDash([7, 5]);
            ctx.beginPath();
            ctx.arc(0, 4, 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else if (rank === 2) {
            // 은빛 성급 링
            ctx.strokeStyle = '#b0bec5';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 4, 28, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 2-1. 둘째 돼지 도토리 터보 모드 가동 시 화려한 번개 & 불꽃 오라
        if (pigId === 2 && this.game && this.game.isTurbo) {
            ctx.save();
            ctx.rotate(-now * 2.5);
            ctx.strokeStyle = '#ff9100';
            ctx.lineWidth = 3;
            ctx.setLineDash([9, 5]);
            ctx.beginPath();
            ctx.arc(0, 4, 34, 0, Math.PI * 2);
            ctx.stroke();

            // 내부 황금 스파크 링
            ctx.strokeStyle = '#ffe600';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.arc(0, 4, 38, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // 상단 ⚡ TURBO 플로팅 배지
            ctx.save();
            ctx.fillStyle = '#ffea00';
            ctx.font = '900 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ff6d00';
            ctx.shadowBlur = 8;
            ctx.fillText('⚡ TURBO', 0, -48);
            ctx.restore();
        }

        // 3. 캐릭터 스프라이트 렌더링 (첫째, 둘째, 셋째 삼형제 모두 동일한 다이내믹 프레임 애니메이션 적용!)
        if (this.pigAnimators && this.pigAnimators[pigId]) {
            const spriteW = 76;
            const spriteH = 76;
            this.pigAnimators[pigId].draw(ctx, 0, -2, spriteW, spriteH);
        } else {
            // 폴백 단일 이미지 렌더링
            const img = this.pigImages && this.pigImages[pigId];
            if (img && img.complete && img.naturalWidth > 0) {
                const legacyH = 54 * (img.naturalHeight / img.naturalWidth);
                ctx.drawImage(img, -27, -legacyH / 2, 54, legacyH);
            } else {
                // 폴백 분홍 돼지
                ctx.fillStyle = pigId === 1 ? '#f48fb1' : (pigId === 2 ? '#ff80ab' : '#f06292');
                ctx.beginPath();
                ctx.arc(0, 0, 24, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 4. 성급 표시 데코 (왕관 / 별) - MAX 상태일 때는 어떤 돼지든 절대 별 2개가 아닌 👑 찬란한 황금 왕관 및 ★★★ MAX 표시!
        if (isPigMax) {
            // 찬란한 황금 왕관 👑 (위아래로 둥둥 부유)
            const crownBob = Math.sin(now * 2.5) * 3;
            const crownY = (pigId === 1 ? -28 : -36) + crownBob;
            ctx.save();
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
            ctx.shadowBlur = 8;
            ctx.fillText('👑', 0, crownY);
            ctx.font = '900 9px sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2.5;
            ctx.strokeText('★★★ MAX', 0, crownY - 14);
            ctx.fillText('★★★ MAX', 0, crownY - 14);
            ctx.restore();
        } else if (rank === 2) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.strokeStyle = '#37474f';
            ctx.lineWidth = 2;
            ctx.strokeText('★★', 0, -36);
            ctx.fillText('★★', 0, -36);
        } else if (rank === 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.strokeStyle = '#37474f';
            ctx.lineWidth = 2;
            ctx.strokeText('★', 0, -36);
            ctx.fillText('★', 0, -36);
        }

        ctx.restore();
    }

    // 아기돼지 삼형제 "초보네~ㅋ" 말풍선 렌더링 (돼지의 실시간 모션에 맞추어 역동적으로 부유)
    drawPigSpeeches() {
        const now = performance.now() * 0.0035;
        this.pigSpeeches.forEach(sp => {
            ctx.save();
            const alpha = Math.min(1.0, sp.life / 300);
            ctx.globalAlpha = Math.max(0, alpha);

            // 해당 돼지의 현재 움직임 위치 동기화 (1단계 초가집 단층 나란히 배치 및 2단계 이상 층별 배치 완벽 동기화)
            let curX = sp.x;
            let curY = sp.y;
            if (this.house.tier === 1) {
                if (sp.pigIdx === 3) {
                    curX = this.house.x + 44;
                    curY = this.house.y + 184 + Math.sin(now * 1.4 + 2.0) * 3.5;
                } else if (sp.pigIdx === 2) {
                    curX = this.house.x + 105;
                    curY = this.house.y + 180 + Math.sin(now * 1.6 + 1.2) * 4.0;
                } else if (sp.pigIdx === 1) {
                    curX = this.house.x + 168;
                    curY = this.house.y + 184 + Math.sin(now * 1.8 + 0.5) * 4.5;
                }
            } else {
                if (sp.pigIdx === 3) {
                    // 1층: 셋째돼지
                    curX = this.house.x + 50;
                    curY = this.house.y + 184 + Math.sin(now * 1.4 + 2.0) * 3.5;
                } else if (sp.pigIdx === 2) {
                    // 2층: 둘째돼지
                    curX = this.house.x + this.house.w * 0.62;
                    curY = this.house.y + 96 + Math.sin(now * 1.6 + 1.2) * 4.0;
                } else if (sp.pigIdx === 1) {
                    // 3층: 첫째돼지
                    curX = this.house.x + this.house.w * 0.5;
                    curY = this.house.y + 8 + Math.sin(now * 1.8 + 0.5) * 4.5;
                }
            }
            if (this.pigAnim && this.pigAnim[sp.pigIdx]) {
                curY -= (this.pigAnim[sp.pigIdx].bounce || 0);
            }

            ctx.font = 'bold 14px "Pretendard", "Malgun Gothic", sans-serif';
            const metrics = ctx.measureText(sp.text);
            const textW = metrics.width;
            const bubbleW = textW + 18;
            const bubbleH = 26;
            const x = curX - bubbleW / 2;
            const y = curY - 48; // 돼지 캐릭터 30% 확대에 맞추어 말풍선 높이 상향 조정

            // 말풍선 배경 (부드러운 라운드 박스)
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(x, y, bubbleW, bubbleH, 8);
            } else {
                ctx.rect(x, y, bubbleW, bubbleH);
            }
            ctx.fill();
            ctx.stroke();

            // 말풍선 아래 꼬리표
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(curX - 5, y + bubbleH);
            ctx.lineTo(curX + 5, y + bubbleH);
            ctx.lineTo(curX, y + bubbleH + 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 말풍선 꼬리 덮어쓰기 (내부 경계선 지우기)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(curX - 4, y + bubbleH - 1, 8, 2);

            // 텍스트 출력
            ctx.fillStyle = '#d81b60';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sp.text, curX, y + bubbleH / 2);

            ctx.restore();
        });
    }
}

if (typeof window !== 'undefined') {
    window.HouseRenderer = HouseRenderer;
}
