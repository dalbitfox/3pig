/**
 * enemies.js
 * 적 늑대 군단 클래스 정의 (기본, 스케이터, 할머니, 풍선, 돌격, 중간보스, 보스)
 */

class Enemy {
    constructor(x, y, hp, speed, goldVal) {
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.maxHp = hp;
        this.speed = speed;
        this.baseSpeed = speed;
        this.goldVal = goldVal;
        this.w = 60;
        this.h = 65;
        this.isDead = false;
        this.slowTimer = 0;
        this.rootTimer = 0; // 🌾 가시밭 속박 타이머
        this.armorShredTimer = 0; // 🌾 황금 가시밭 방어력 30% 감소 디버프 타이머
        this.attackCooldown = 0;
        this.animTimer = Math.random() * 100;
        this.wolfTypeKey = null;
        this.animator = null;

        // 🌪️ 궁극기 대회오리 바람 공중 비행 물리 상태
        this.tornadoState = {
            active: false,
            vx: 0,
            vy: 0,
            gravity: 0.65,
            rot: 0,
            rotSpeed: 0,
            origY: y
        };
    }

    launchAirborne(vx, vy, game) {
        this.tornadoState = {
            active: true,
            vx: vx,
            vy: vy,
            gravity: 0.55,
            rot: 0,
            rotSpeed: (Math.random() - 0.5) * 0.12,
            origY: this.tornadoState && this.tornadoState.origY ? this.tornadoState.origY : this.y
        };
    }

    takeDamage(dmg, game) {
        if (this.armorShredTimer > 0) {
            dmg *= 1.30; // 방어력 30% 감소로 인한 1.3배 추가 피해
        }
        this.hp -= dmg;
        // 대량 피격 시 플로팅 텍스트 과부하 방지
        if (game.floatingTexts.length < 30) {
            game.floatingTexts.push({
                text: `-${Math.round(dmg)}`,
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y - this.h - 10,
                color: this.armorShredTimer > 0 ? '#ff1744' : '#ffeb3b',
                alpha: 1.0,
                duration: 700,
                elapsed: 0
            });
        }
        soundEngine.hit();

        if (this.animator && !this.isDead && this.hp > 0) {
            this.animator.playAction('hurt', false, null, 12);
        }

        if (this.hp <= 0 && !this.isDead) {
            this.isDead = true;
            game.score += this.goldVal * 15;

            // 아기돼지 삼형제가 "초보네~ㅋ" 놀림!
            game.onWolfKilled(this);

            // 몬스터 처치 시 골드가 집 안으로 쏙 들어가도록 코인 1개 생성 (메타 골드 버프 적용!)
            const finalGold = game.getGoldGain(this.goldVal);
            game.coins.push({
                x: this.x,
                y: this.y - 30,
                val: finalGold
            });
        }
    }

    update(dt, game) {
        // 🌪️ [회오리바람 공중 비행 물리] - 피격당해 체력이 다했더라도(사망했더라도) 보스늑대처럼 공중으로 솟구쳐 날아가는 액션이 완전히 끝날 때까지 비행 물리 처리!
        if (this.tornadoState && this.tornadoState.active) {
            const step = dt / 16.6;
            this.x += this.tornadoState.vx * step;
            this.y += this.tornadoState.vy * step;
            this.tornadoState.vy += this.tornadoState.gravity * step;
            this.tornadoState.rot += this.tornadoState.rotSpeed * step;

            // 비행 중 소용돌이 공기 스파크 & 깃털/먼지 방출
            if (Math.random() < 0.45 && game && game.particles && game.particles.length < 90) {
                game.particles.push({
                    x: this.x + (Math.random() - 0.5) * 30,
                    y: (this.y - this.h * 0.5) + (Math.random() - 0.5) * 30,
                    vx: -3 + Math.random() * 6,
                    vy: -2 + Math.random() * 4,
                    color: Math.random() < 0.4 ? '#38bdf8' : (Math.random() < 0.7 ? '#4ade80' : '#fef08a'),
                    size: 3 + Math.random() * 3.5,
                    life: 14
                });
            }

            // 1) 화면 오른쪽 밖으로 완전히 날아간 경우 (V_WIDTH + 80 이상) 비행 종료
            if (this.x > (game ? 1280 + 80 : 1360)) {
                this.tornadoState.active = false;
                return;
            }

            // 2) 착지 판정 (하강 중 원래 지면 높이에 도달)
            if (this.y >= this.tornadoState.origY && this.tornadoState.vy > 0) {
                this.y = this.tornadoState.origY;
                this.tornadoState.active = false;
                this.tornadoState.rot = 0;

                // 이미 사망한 늑대라면 착지 시 "쿵! 😵💥" 모래 먼지 퐁! 내뿜고 비행 종료(소멸)
                if (this.isDead || this.hp <= 0) {
                    if (game && game.particles && game.particles.length < 85) {
                        for (let k = 0; k < 12; k++) {
                            game.particles.push({
                                x: this.x + (Math.random() - 0.5) * 35,
                                y: this.y + (Math.random() - 0.5) * 8,
                                vx: (Math.random() - 0.5) * 6,
                                vy: -Math.random() * 3.5 - 1,
                                color: '#d7ccc8',
                                size: 4 + Math.random() * 3,
                                life: 18
                            });
                        }
                    }
                    if (game && game.floatingTexts && game.floatingTexts.length < 35) {
                        game.floatingTexts.push({
                            text: '쿵! 😵💥',
                            x: this.x,
                            y: this.y - this.h - 15,
                            color: '#facc15',
                            alpha: 1.0,
                            duration: 750,
                            elapsed: 0
                        });
                    }
                    return;
                }

                // 살아남은 보스 / 늑대: 착지 후 1초간 기절/슬로우
                this.slowTimer = 1000;
                this.speed = 0;

                // 풍선 늑대 및 공중 늑대가 회오리바람 착지 후 지상 질주 상태로 전환
                if (this.wolfTypeKey === 'balloon') {
                    this.isFlying = false;
                    this.isFalling = false;
                    this.baseSpeed = 1.1;
                    if (this.animator) {
                        this.animator.defaultAction = 'ground_run';
                        this.animator.playAction('ground_run', true);
                    }
                } else if (this.wolfTypeKey === 'umbrella') {
                    this.isFlying = false;
                    this.isFalling = false;
                    this.umbrellaInverted = true;
                    this.baseSpeed = 1.05;
                } else if (this.wolfTypeKey === 'miniwolf') {
                    this.hasParachute = false;
                    this.isLanding = false;
                }

                // 착지 "쿵! 😵" 모래 먼지 & 만화 텍스트
                if (game) {
                    soundEngine.hit();
                    if (game.particles && game.particles.length < 80) {
                        for (let k = 0; k < 10; k++) {
                            game.particles.push({
                                x: this.x + (Math.random() - 0.5) * 35,
                                y: this.y + (Math.random() - 0.5) * 8,
                                vx: (Math.random() - 0.5) * 5,
                                vy: -Math.random() * 3.5 - 1,
                                color: '#d7ccc8',
                                size: 3.5 + Math.random() * 2.5,
                                life: 16
                            });
                        }
                    }
                    if (game.floatingTexts && game.floatingTexts.length < 35) {
                        game.floatingTexts.push({
                            text: '쿵! 😵',
                            x: this.x,
                            y: this.y - this.h - 15,
                            color: '#facc15',
                            alpha: 1.0,
                            duration: 850,
                            elapsed: 0
                        });
                    }
                }
            }
            return; // 공중 비행 중에는 통상 보행/공격 스킵
        }

        // 비행 중이 아닐 때만 사망 검사
        if (this.isDead || this.hp <= 0) return;

        this.animTimer += dt * 0.006;
        if (this.animator) {
            // 보폭 싱크: 실제 이동 속도에 비례하여 달리기/보행 프레임 애니메이션 속도 동적 조절!
            this.animator.speedMultiplier = Math.max(0.4, this.speed / Math.max(0.1, this.baseSpeed));
            this.animator.update(dt / 1000);
        }

        // 방어력 감소 디버프 타이머
        if (this.armorShredTimer > 0) {
            this.armorShredTimer -= dt;
        }

        // 속박(이동 불가) 및 슬로우 타이머
        if (this.rootTimer > 0) {
            this.rootTimer -= dt;
            this.speed = 0;
        } else if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            this.speed = this.baseSpeed * 0.5;
        } else {
            this.speed = this.baseSpeed;
        }

        // 집 또는 원거리 지정 사거리 지점을 향해 전진
        const stopTargetX = (this.stopAtX !== undefined) ? this.stopAtX : (game.house.x + game.house.w + 15);
        if (this.x > stopTargetX) {
            this.x -= this.speed * (dt / 16.6);
        } else if (this.stopAtX === undefined) {
            // 집에 도달하여 근접 공격 (원거리 늑대는 제외)
            this.attackCooldown -= dt;
            if (this.attackCooldown <= 0) {
                this.attackCooldown = this.isBoss ? 1500 : 1100;
                if (this.animator && this.animator.config && this.animator.config.actions && this.animator.config.actions.bite) {
                    this.animator.playAction('bite');
                }
                if (game.house.invincibleTimer > 0) {
                    // 무적 방어막이 공격을 완전 무효화하고 튕겨냄!
                    soundEngine.hit();
                    this.x += 35;
                    game.floatingTexts.push({
                        text: '무적 방어막!',
                        x: this.x,
                        y: this.y - this.h - 10,
                        color: '#00e5ff',
                        alpha: 1.0,
                        duration: 600,
                        elapsed: 0
                    });
                } else {
                    let dmg;
                    if (this.isBoss) {
                        // 유저 요청: 보스가 성에 닿고 공격할 때 쉬움 30%, 보통 50%, 어려움 70% 삭감!
                        const pct = this.castleAttackPct || (game.currentDiff === 'hard' ? 0.70 : game.currentDiff === 'normal' ? 0.50 : 0.30);
                        dmg = Math.round(game.house.maxHp * pct);
                        game.showBanner(`💥 늑대 제왕의 성 파괴 일격! (성 체력 -${Math.round(pct * 100)}%)`, "#ff1744");
                        game.triggerScreenShake(28);
                        soundEngine.explosion();
                        game.floatingTexts.push({
                            text: `💥 성 파괴 일격! -${dmg} (-${Math.round(pct * 100)}%)`,
                            x: game.house.x + game.house.w * 0.5,
                            y: game.house.y + 40,
                            color: '#ff1744',
                            alpha: 1.0,
                            duration: 1200,
                            elapsed: 0,
                            scale: 2.0
                        });
                    } else {
                        dmg = this.attackDamage || 12;
                        if (game.house.tier === 2) dmg *= 0.85;
                        if (game.house.tier === 3) dmg *= 0.65;
                        dmg = Math.round(dmg);
                        soundEngine.hit();
                    }
                    game.house.hp -= dmg;
                    game.house.shake = this.isBoss ? 28 : 8;
                }
            }
        }
    }

    drawHealthBar(ctx) {
        if (this.isDead || this.hp <= 0 || (this.tornadoState && this.tornadoState.active)) return;
        const barW = 44;
        const barH = 5;
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#263238';
        ctx.fillRect(this.x - barW / 2, this.y - this.h - 14, barW, barH);
        ctx.fillStyle = '#e53935';
        ctx.fillRect(this.x - barW / 2, this.y - this.h - 14, barW * hpPercent, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barW / 2, this.y - this.h - 14, barW, barH);
    }

    // 공통 늑대 외형 렌더링 (참새 부리 탈피! 뾰족 귀, 송곳니, 늑대 주둥이, 꼬리)
    drawWolfBody(ctx, color = '#607d8b', darkColor = '#455a64', lightColor = '#cfd8dc') {
        const bob = Math.sin(this.animTimer * 8) * 3;
        const legSwing = Math.sin(this.animTimer * 10) * 8;

        // 1. 늑대의 풍성한 꼬리 (엉덩이 뒤쪽)
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(20, -32 + bob);
        ctx.quadraticCurveTo(45, -50 + bob, 48, -25 + bob);
        ctx.quadraticCurveTo(38, -15 + bob, 22, -22 + bob);
        ctx.closePath();
        ctx.fill();
        // 꼬리 끝 흰 털 포인트
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.arc(46, -30 + bob, 5, 0, Math.PI * 2);
        ctx.fill();

        // 2. 뒷다리
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.ellipse(14 - legSwing * 0.4, -10, 6, 12, 0.2, 0, Math.PI * 2);
        ctx.ellipse(18 + legSwing * 0.4, -10, 6, 12, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // 3. 늑대 몸통 (회색 털)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(4, -28 + bob, 22, 16, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // 4. 목덜미 갈기털 (뾰족뾰족한 늑대 털)
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(-10, -42 + bob);
        ctx.lineTo(-6, -32 + bob);
        ctx.lineTo(-2, -38 + bob);
        ctx.lineTo(2, -30 + bob);
        ctx.lineTo(6, -38 + bob);
        ctx.lineTo(2, -45 + bob);
        ctx.closePath();
        ctx.fill();

        // 5. 앞다리와 날카로운 발톱
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.ellipse(-8 + legSwing * 0.5, -8, 5, 13, -0.1, 0, Math.PI * 2);
        ctx.ellipse(-2 - legSwing * 0.5, -8, 5, 13, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 6. 늑대 머리통
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(-16, -42 + bob, 15, 0, Math.PI * 2);
        ctx.fill();

        // 7. 뾰족한 늑대 귀 2개 (머리 위로 쫑긋)
        // 뒤쪽 귀
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(-10, -52 + bob);
        ctx.lineTo(-4, -68 + bob);
        ctx.lineTo(-1, -50 + bob);
        ctx.closePath();
        ctx.fill();
        // 앞쪽 귀
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-19, -52 + bob);
        ctx.lineTo(-16, -70 + bob);
        ctx.lineTo(-9, -51 + bob);
        ctx.closePath();
        ctx.fill();
        // 귀 안쪽 털
        ctx.fillStyle = '#ff80ab';
        ctx.beginPath();
        ctx.moveTo(-17, -54 + bob);
        ctx.lineTo(-15, -66 + bob);
        ctx.lineTo(-11, -53 + bob);
        ctx.closePath();
        ctx.fill();

        // 8. 늑대의 긴 주둥이(Muzzle)와 사나운 입
        // 윗턱 (앞으로 길게 뻗은 개과 주둥이)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-20, -47 + bob);
        ctx.lineTo(-38, -43 + bob); // 주둥이 끝
        ctx.lineTo(-38, -39 + bob);
        ctx.lineTo(-20, -38 + bob);
        ctx.closePath();
        ctx.fill();

        // 늑대의 검은 코
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(-38, -43 + bob, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 아랫턱
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(-20, -37 + bob);
        ctx.lineTo(-34, -36 + bob);
        ctx.lineTo(-20, -32 + bob);
        ctx.closePath();
        ctx.fill();

        // 입 속 붉은 혀
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(-26, -37 + bob, 3, 0, Math.PI);
        ctx.fill();

        // 날카로운 흰색 송곳니 (위아래 이빨)
        ctx.fillStyle = '#ffffff';
        // 윗 송곳니
        ctx.beginPath();
        ctx.moveTo(-33, -39 + bob);
        ctx.lineTo(-31, -33 + bob);
        ctx.lineTo(-29, -39 + bob);
        ctx.closePath();
        ctx.fill();
        // 아랫 송곳니
        ctx.beginPath();
        ctx.moveTo(-28, -36 + bob);
        ctx.lineTo(-26, -41 + bob);
        ctx.lineTo(-24, -36 + bob);
        ctx.closePath();
        ctx.fill();

        // 9. 사납고 날카로운 늑대 눈
        ctx.fillStyle = '#ffeb3b'; // 노란 늑대 눈
        ctx.beginPath();
        ctx.ellipse(-23, -45 + bob, 4.5, 3.5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // 검은 세로 동공
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(-23, -45 + bob, 1.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 날카로운 눈썹 주름
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-28, -48 + bob);
        ctx.lineTo(-19, -46 + bob);
        ctx.stroke();
    }
}

// 1. 일반 늑대 (Normal Wolf)
class NormalWolf extends Enemy {
    constructor(x, y) {
        super(x, y, 55, 1.1, 5); // 1.1 균형 잡힌 클래식 속도
        this.w = 125; // 20% 추가 확대 (104 -> 125)
        this.h = 118; // 20% 추가 확대 (98 -> 118)
        this.wolfTypeKey = 'normal';
        if (window.WolfSpriteSystem) {
            this.animator = new window.WolfSpriteSystem.WolfAnimator('normal');
        }
    }

    update(dt, game) {
        if (this.animator) {
            const targetX = game.house.x + game.house.w;
            if (this.x <= targetX + 18) {
                this.animator.playAction('bite', true);
            } else if (this.animator.currentAction === 'bite') {
                this.animator.playAction('run', true);
            }
        }
        // 허둥지둥 발밑 만화 모래 먼지 퐁!
        if (game && game.particles && (!this.animator || this.animator.currentAction === 'run') && Math.random() < 0.16) {
            game.particles.push({
                x: this.x + 26 + (Math.random() - 0.5) * 8,
                y: this.y + 2,
                vx: 0.8 + Math.random() * 1.2,
                vy: -Math.random() * 1.2,
                color: '#d7ccc8',
                size: 3 + Math.random() * 2.5,
                life: 12 + Math.random() * 6
            });
        }
        super.update(dt, game);
    }

    draw(ctx, game) {
        ctx.save();
        if (this.animator && this.animator.isReady) {
            // 스프라이트 시트 기반 8프레임 전력 질주 애니메이션 (20% 추가 확대 렌더링 234x150)
            this.animator.draw(ctx, this.x, this.y - 70, 234, 150);
        } else {
            ctx.translate(this.x, this.y);
            const img = game && game.wolfImages && game.wolfImages.normal;
            if (img && img.complete && img.naturalWidth > 0) {
                const bob = Math.sin(this.animTimer * 14) * 3;
                // 네 발 질주 맹수 공식 스프라이트 렌더링 (20% 추가 확대)
                ctx.drawImage(img, -118, -137 + bob, 228, 137);
            } else {
                ctx.scale(2.34, 2.34);
                this.drawWolfBody(ctx, '#607d8b', '#455a64', '#eceff1');
            }
        }
        ctx.restore();
        this.drawHealthBar(ctx);
    }
}

// 2. 선글라스 스케이트 늑대 (Skater Wolf - 빠르고 날렵함)
class SkaterWolf extends Enemy {
    constructor(x, y) {
        super(x, y, 40, 1.85, 8); // 1.85 쾌적하고 박진감 넘치는 스케이팅 속도
        this.w = 118; // 20% 추가 확대 (98 -> 118)
        this.h = 132; // 20% 추가 확대 (110 -> 132)
        this.wolfTypeKey = 'skater';
        if (window.WolfSpriteSystem) {
            this.animator = new window.WolfSpriteSystem.WolfAnimator('skater');
        }
    }

    update(dt, game) {
        if (this.animator) {
            const targetX = game.house.x + game.house.w;
            if (this.x <= targetX + 18) {
                this.animator.playAction('jump_attack', true);
            } else if (this.animator.currentAction === 'jump_attack') {
                this.animator.playAction('skate', true);
            }
        }
        // 보드 뒤 엉성한 폭죽 로켓 실시간 불꽃 & 연기 파티클
        if (game && game.particles && Math.random() < 0.45) {
            game.particles.push({
                x: this.x + 36 + (Math.random() - 0.5) * 6,
                y: this.y - 12 + (Math.random() - 0.5) * 6,
                vx: 1.5 + Math.random() * 2.5,
                vy: (Math.random() - 0.5) * 1.5,
                color: Math.random() < 0.5 ? '#ff5722' : (Math.random() < 0.75 ? '#ffeb3b' : '#eceff1'),
                size: 2.5 + Math.random() * 3,
                life: 14 + Math.random() * 8
            });
        }
        super.update(dt, game);
    }

    draw(ctx, game) {
        ctx.save();
        if (this.animator && this.animator.isReady) {
            // 스프라이트 시트 기반 8프레임 킥푸시 스케이트보드 애니메이션 (20% 추가 확대 렌더링 210x210)
            this.animator.draw(ctx, this.x, this.y - 86, 210, 210);
        } else {
            ctx.translate(this.x, this.y);
            const bob = Math.sin(this.animTimer * 12) * 2;
            const img = game && game.wolfImages && game.wolfImages.skater;
            if (img && img.complete && img.naturalWidth > 0) {
                // 킥푸시 우드 데크 스케이터 공식 스프라이트 렌더링 (20% 추가 확대)
                ctx.drawImage(img, -106, -203 + bob, 206, 206);
            } else {
                ctx.scale(2.34, 2.34);
                // 주황색 스케이트보드
                ctx.fillStyle = '#ff5722';
                ctx.fillRect(-35, -4, 70, 8);
                ctx.strokeStyle = '#bf360c';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-35, -4, 70, 8);

                // 스케이트보드 바퀴 2개
                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.arc(-22, 7, 5, 0, Math.PI * 2);
                ctx.arc(20, 7, 5, 0, Math.PI * 2);
                ctx.fill();

                // 늑대 몸체 렌더링
                this.drawWolfBody(ctx, '#546e7a', '#37474f', '#cfd8dc');

                // 쿨한 블랙 선글라스 😎
                ctx.fillStyle = '#111111';
                ctx.beginPath();
                ctx.roundRect(-30, -49 + bob, 15, 8, 2);
                ctx.fill();
                ctx.strokeStyle = '#ffeb3b';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        ctx.restore();
        this.drawHealthBar(ctx);
    }
}

// 3. 할머니 변장 늑대 (Granny Wolf - 근접 시 무섭게 달려드는 거대 야수로 돌변!)
class GrannyWolf extends Enemy {
    constructor(x, y) {
        super(x, y, 85, 0.65, 12); // 0.65 능청스럽고 느긋한 변장 걸음
        this.w = 118; // 20% 추가 확대 (98 -> 118)
        this.h = 140; // 20% 추가 확대 (117 -> 140)
        this.isDisguised = true;
        this.wolfTypeKey = 'granny';
        if (window.WolfSpriteSystem) {
            this.animator = new window.WolfSpriteSystem.WolfAnimator('granny');
        }
    }

    update(dt, game) {
        if (this.isDisguised && (this.x < 520 || this.hp < this.maxHp * 0.7)) {
            // 변장 찢어발기기! 거대 야수 늑대 본체 등장!
            this.isDisguised = false;
            this.baseSpeed = 1.9; // 1.9 박진감 넘치는 맹렬한 야수 돌진
            this.speed = this.baseSpeed;
            this.w = 140; // 20% 추가 확대 (117 -> 140)
            this.h = 125; // 20% 추가 확대 (104 -> 125)
            game.showBanner("🐺 할머니 늑대가 변장을 찢어발기고 무섭게 달려듭니다!!", "#d32f2f");
            soundEngine.whoosh();
            soundEngine.hit();
            if (this.animator) {
                this.animator.defaultAction = 'scary_rush';
                this.animator.playAction('scary_rush', true, null, null, true);
            }
            // 찢겨나가는 핑크 두건 & 레드 망토 파티클 폭발
            for (let k = 0; k < 15; k++) {
                game.particles.push({
                    x: this.x + (Math.random() - 0.5) * 30,
                    y: this.y - 45 + (Math.random() - 0.5) * 30,
                    vx: (Math.random() - 0.5) * 6 + 2,
                    vy: -Math.random() * 5 - 1,
                    color: Math.random() > 0.5 ? '#f06292' : '#d32f2f',
                    size: 4 + Math.random() * 4,
                    life: 30
                });
            }
        }

        if (this.animator) {
            const targetX = game.house.x + game.house.w;
            if (!this.isDisguised) {
                if (this.x <= targetX + 18) {
                    this.animator.playAction('scary_bite', true);
                } else if (this.animator.currentAction === 'scary_bite') {
                    this.animator.playAction('scary_rush', true);
                }
            }
        }

        super.update(dt, game);
    }

    draw(ctx, game) {
        ctx.save();
        if (this.animator && this.animator.isReady) {
            // 변장 시: 능청스러운 할머니 보행 (20% 추가 확대 194x218) / 변장 해제: 무섭게 달려드는 거대 야수 늑대 (20% 추가 확대 242x194)
            if (this.isDisguised) {
                this.animator.draw(ctx, this.x, this.y - 88, 194, 218);
            } else {
                this.animator.draw(ctx, this.x, this.y - 70, 242, 194);
            }
        } else {
            ctx.translate(this.x, this.y);
            const img = game && game.wolfImages && game.wolfImages.granny;
            if (this.isDisguised && img && img.complete && img.naturalWidth > 0) {
                const bob = Math.sin(this.animTimer * 8) * 2;
                ctx.drawImage(img, -97, -210 + bob, 194, 218);
            } else if (this.isDisguised) {
                ctx.scale(2.34, 2.34);
                this.drawWolfBody(ctx, '#78909c', '#546e7a', '#b0bec5');
                ctx.fillStyle = '#ba68c8';
                ctx.beginPath();
                ctx.arc(-14, -45, 18, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 변장 해제 시 고화질 무서운 야수 늑대 즉시 렌더링! (20% 추가 확대)
                const rImg = game && game.wolfImages && game.wolfImages.granny_revealed;
                if (rImg && rImg.complete && rImg.naturalWidth > 0) {
                    const bob = Math.sin(this.animTimer * 12) * 3;
                    ctx.drawImage(rImg, -132, -156 + bob, 258, 194);
                } else if (window.WolfSpriteSystem && window.WolfSpriteSystem.generator) {
                    window.WolfSpriteSystem.generator.drawScaryRevealedWolf(ctx, 0, -70, 242, 194, {
                        mouthOpen: 1.4,
                        clawSlash: true
                    });
                } else {
                    ctx.scale(2.65, 2.65);
                    this.drawWolfBody(ctx, '#1e293b', '#0f172a', '#ff1744');
                    ctx.fillStyle = '#ff1744';
                    ctx.beginPath();
                    ctx.arc(-23, -45, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
        this.drawHealthBar(ctx);
    }
}

// 4. 풍선 비행 늑대 (Balloon Wolf - 공중 부유 & 지상 추락 시 에비에이터 파일럿 늑대로 돌격!)
class BalloonWolf extends Enemy {
    constructor(x, y) {
        super(x, y, 45, 1.0, 10); // 1.0 유유자적한 공중 비행 속도
        this.w = 132; // 20% 추가 확대 (110 -> 132)
        this.h = 210; // 20% 추가 확대 (175 -> 210)
        this.attackDamage = 20; // 지상 돌격 공격력 70% 증가 (기존 12 -> 20)
        this.isFlying = true;
        this.isFalling = false;
        this.fallVy = 0;
        this.wolfTypeKey = 'balloon';
        if (window.WolfSpriteSystem) {
            this.animator = new window.WolfSpriteSystem.WolfAnimator('balloon');
        }
    }

    takeDamage(dmg, game, isSkill = false, isBalloonPop = false) {
        if (this.isFlying && !isBalloonPop) {
            // 풍선여우는 비행 중 필살기, 스킬, 몸체 일반사격 모두 완전 무시! 오직 풍선을 맞춰야만 대미지를 입음!
            game.floatingTexts.push({
                text: '🎈 풍선만 타격 가능! (스킬/필살기 면역)',
                x: this.x,
                y: this.y - 110,
                color: '#ffeb3b',
                alpha: 1.0,
                duration: 800,
                elapsed: 0
            });
            soundEngine.playNoise(0.06, 0.06, 700);
            return false;
        }
        return super.takeDamage(dmg, game);
    }

    popBalloon(game) {
        if (this.isFlying) {
            this.isFlying = false;
            this.isFalling = true;
            this.fallVy = 1.2;
            soundEngine.pop();
            this.w = 160; // 성체 일반 늑대 크기로 정상화 (기존 118 -> 160)
            this.h = 150; // 성체 일반 늑대 크기로 정상화 (기존 125 -> 150)

            // 풍선이 터진 공중의 실제 풍선 좌표(y-196)에서 찬란한 노란 풍선 파편 대량 방출!
            const popY = this.y - 196;
            for (let i = 0; i < 26; i++) {
                const ang = (i / 26) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
                const spd = Math.random() * 7 + 3;
                game.particles.push({
                    x: this.x + 2 + Math.cos(ang) * 15,
                    y: popY + Math.sin(ang) * 15,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd - 1.5,
                    color: Math.random() < 0.75 ? '#ffd600' : '#ffab00',
                    size: Math.random() * 6 + 3,
                    life: 28
                });
            }

            game.floatingTexts.push({
                text: '💥 풍선 격추! 폭탄마 파일럿 늑대 추락!',
                x: this.x,
                y: popY - 15,
                color: '#ff5252',
                alpha: 1.0,
                duration: 900,
                elapsed: 0
            });

            // 풍선이 터졌을 때만 유일하게 대미지(30)를 입고 추락!
            this.takeDamage(30, game, false, true);

            if (this.animator) {
                this.animator.defaultAction = 'ground_run';
                this.animator.playAction('pop_fall', false);
            }
        }
    }

    update(dt, game) {
        // 🌪️ 회오리바람 비행 물리 중에는 사망 여부나 일반 풍선 자폭/낙하와 무관하게 회오리 비행 물리 우선 처리!
        if (this.tornadoState && this.tornadoState.active) {
            super.update(dt, game);
            return;
        }

        if (this.isDead || this.hp <= 0) return;

        if (this.isFlying) {
            const targetX = game.house.x + game.house.w;
            if (this.x < targetX + 15) {
                // 공중에서 집에 도달하면 투하 자폭 (공격력 70% 대폭 증가: 기존 25 -> 43)
                if (game.house.invincibleTimer > 0) {
                    game.floatingTexts.push({
                        text: '무적 방어막!',
                        x: this.x,
                        y: this.y - 110,
                        color: '#00e5ff',
                        alpha: 1.0,
                        duration: 600,
                        elapsed: 0
                    });
                } else {
                    let bombDmg = 43; // 25 * 1.7 = 42.5 -> 43 (70% 증가)
                    if (game.house.tier === 2) bombDmg *= 0.85;
                    if (game.house.tier === 3) bombDmg *= 0.65;
                    bombDmg = Math.round(bombDmg);
                    game.house.hp -= bombDmg;
                    game.house.shake = 14;
                    game.floatingTexts.push({
                        text: `💥 풍선 폭격 자폭! -${bombDmg}`,
                        x: game.house.x + game.house.w * 0.5,
                        y: game.house.y + 40,
                        color: '#ff1744',
                        alpha: 1.0,
                        duration: 1000,
                        elapsed: 0,
                        scale: 1.5
                    });
                }
                this.isDead = true;
                soundEngine.pop();
                return;
            }
        } else if (this.isFalling) {
            // 풍선 피격 후 지면(474)을 향해 포물선 낙하!
            this.y += this.fallVy * (dt / 16.6);
            this.fallVy += 0.38 * (dt / 16.6); // 중력 가속도
            if (this.y >= 474) {
                this.y = 474;
                this.isFalling = false;
                this.slowTimer = 800; // 0.8초 착지 기절 후 지상 질주
                this.baseSpeed = 1.25; // 지상 질주 속도
                this.speed = this.baseSpeed * 0.5;
                if (this.animator) {
                    this.animator.playAction('ground_run', true);
                }
                // 지면 착지 흙먼지 파티클
                for (let k = 0; k < 14; k++) {
                    game.particles.push({
                        x: this.x + (Math.random() - 0.5) * 45,
                        y: 474,
                        vx: (Math.random() - 0.5) * 6,
                        vy: -Math.random() * 3.5 - 0.5,
                        color: Math.random() < 0.5 ? '#d7ccc8' : '#a1887f',
                        size: Math.random() * 5 + 2,
                        life: 22
                    });
                }
            }
        } else {
            // 지상 파일럿 다이너마이트 폭탄마 돌격 애니메이션 전환
            if (this.animator && this.slowTimer <= 0) {
                const targetX = game.house.x + game.house.w;
                if (this.x <= targetX + 18) {
                    this.animator.playAction('ground_attack', true);
                    if (this.attackCooldown <= 0) {
                        this.attackCooldown = 1200;
                        let dmg = 24;
                        if (game.house.tier === 2) dmg *= 0.85;
                        if (game.house.tier === 3) dmg *= 0.65;
                        dmg = Math.round(dmg);
                        game.house.hp -= dmg;
                        game.house.shake = 10;
                        soundEngine.explosion();
                        game.floatingTexts.push({
                            text: `🧨 쾅! 다이너마이트 폭탄 투척! -${dmg}`,
                            x: game.house.x + game.house.w * 0.5,
                            y: game.house.y + 40,
                            color: '#ff3d00',
                            alpha: 1.0,
                            duration: 900,
                            elapsed: 0
                        });
                    }
                } else if (this.animator.currentAction === 'ground_attack') {
                    this.animator.playAction('ground_run', true);
                }
            }
        }

        super.update(dt, game);
    }

    draw(ctx, game) {
        ctx.save();
        if (this.animator && this.animator.isReady) {
            // 비행 중: 풍선 폭격기 (226x305) / 지상 추락 및 질주: 일반 성체 규격 (275x210) 대폭 확대!
            if (this.isFlying) {
                this.animator.draw(ctx, this.x, this.y - 149, 226, 305);
            } else {
                this.animator.draw(ctx, this.x, this.y - 85, 275, 210);
            }
        } else {
            ctx.translate(this.x, this.y);
            const img = game && game.wolfImages && game.wolfImages.balloon;
            if (this.isFlying && img && img.complete && img.naturalWidth > 0) {
                const floatBob = Math.sin(this.animTimer * 6) * 4;
                ctx.drawImage(img, -113, -296 + floatBob, 226, 305);
            } else if (this.isFlying) {
                ctx.scale(2.34, 2.34);
                const bX = 1, bY = -100, bR = 30;
                const grad = ctx.createRadialGradient(bX - 8, bY - 8, 4, bX, bY, bR);
                grad.addColorStop(0, '#fff59d');
                grad.addColorStop(0.6, '#fbc02d');
                grad.addColorStop(1, '#f57f17');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(bX, bY, bR, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(bX, bY + bR + 4);
                ctx.lineTo(-6, -30);
                ctx.stroke();

                this.drawWolfBody(ctx, '#d32f2f', '#b71c1c', '#ffcdd2');
            } else {
                // 지상 추락 시: 일반 성체 규격(275x210)으로 당당하게 확대 렌더링!
                const gImg = game && game.wolfImages && game.wolfImages.balloon_ground;
                if (gImg && gImg.complete && gImg.naturalWidth > 0) {
                    const bob = Math.sin(this.animTimer * 10) * 3;
                    ctx.drawImage(gImg, -137, -200 + bob, 275, 200);
                } else if (window.WolfSpriteSystem && window.WolfSpriteSystem.generator) {
                    window.WolfSpriteSystem.generator.drawAviatorPilotWolf(ctx, 0, -85, 275, 210, {
                        stepPhase: this.animTimer * 10,
                        hasDynamite: true
                    });
                } else {
                    ctx.scale(2.7, 2.7);
                    this.drawWolfBody(ctx, '#d32f2f', '#b71c1c', '#ffcdd2');
                }
            }
        }
        ctx.restore();

        // 지상 모드일 때 머리 위 다이너마이트 심지 불꽃 스파크 연출 🧨✨
        if (!this.isFlying && !this.isDead) {
            const sparkTime = performance.now() * 0.02;
            ctx.save();
            ctx.translate(this.x - 22, this.y - 145);
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(0, 0, 4.5 + Math.sin(sparkTime * 4) * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff5722';
            ctx.beginPath();
            ctx.arc(Math.cos(sparkTime) * 3, Math.sin(sparkTime) * 3, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        this.drawHealthBar(ctx);
    }
}

// 5. 볼빵빵 입김 늑대 (Blower Wolf - 60% 지점 도달 시 원거리 입김 돌풍 발사)
class BlowerWolf extends Enemy {
    constructor(x, y) {
        super(x, y, 70, 0.85, 12); // 0.85 침착한 전진 속도
        this.w = 149; // 20% 추가 확대 (124 -> 149)
        this.h = 132; // 20% 추가 확대 (110 -> 132)
        const screenWidth = typeof V_WIDTH !== 'undefined' ? V_WIDTH : 1200;
        this.stopAtX = screenWidth * 0.6; // 화면 60% 지점 (720px)에서 정지하여 원거리 공격 개시!
        this.blowTimer = 0;
        this.hasFiredWind = false;
        this.wolfTypeKey = 'blower';
        if (window.WolfSpriteSystem) {
            this.animator = new window.WolfSpriteSystem.WolfAnimator('blower');
        }
    }

    update(dt, game) {
        // 🌪️ 회오리바람에 휘말려 공중 비행 중일 때는 입김 공격을 멈추고 공중 비행 물리 전담! (멈춤 버그 완전 해결)
        if (this.tornadoState && this.tornadoState.active) {
            super.update(dt, game);
            return;
        }

        // 사망 시에도 super.update가 처리할 수 있도록 리턴하지 않고 위임
        if (this.isDead || this.hp <= 0) {
            super.update(dt, game);
            return;
        }

        if (this.x > this.stopAtX) {
            this.speed = this.baseSpeed;
            if (this.animator) {
                this.animator.playAction('walk', true);
            }
            this.blowTimer = 0;
            this.hasFiredWind = false;
        } else {
            // 60% 지점(720px)에 완전히 정지하여 원거리 돌풍 발사 패턴 수행!
            this.speed = 0;
            this.blowTimer += dt;
            if (this.animator) {
                if (this.blowTimer < 1500) {
                    this.animator.playAction('inhale', true);
                } else {
                    this.animator.playAction('blow_tornado', true);
                }
            }

            // 1500ms(숨 들이쉬기 완료) 시점에 원거리 돌풍 투사체 발사!
            if (this.blowTimer >= 1500 && !this.hasFiredWind) {
                this.hasFiredWind = true;
                if (game.shootWolfWind) {
                    game.shootWolfWind(this.x - 45, this.y - 35);
                }
                // 입김 발사 순간 반동 먼지/바람 파티클
                for (let k = 0; k < 14; k++) {
                    game.particles.push({
                        x: this.x - 30,
                        y: this.y - 35,
                        vx: -Math.random() * 6 - 2,
                        vy: (Math.random() - 0.5) * 4,
                        color: Math.random() < 0.6 ? '#e0f7fa' : '#80deea',
                        size: Math.random() * 6 + 2,
                        life: 20
                    });
                }
            }

            // 3200ms 주기로 리셋하여 다음 숨들이쉬기 및 돌풍 발사 반복
            if (this.blowTimer >= 3200) {
                this.blowTimer = 0;
                this.hasFiredWind = false;
            }
        }
        super.update(dt, game);
    }

    draw(ctx, game) {
        ctx.save();
        if (this.animator && this.animator.isReady) {
            // 스프라이트 시트 기반 볼 부풀리기 & 회오리 돌풍 분사 애니메이션 (20% 추가 확대 렌더링 274x203)
            this.animator.draw(ctx, this.x, this.y - 82, 274, 203);
        } else {
            ctx.translate(this.x, this.y);
            const img = game && game.wolfImages && game.wolfImages.blower;
            if (img && img.complete && img.naturalWidth > 0) {
                const puffScale = (this.blowTimer > 1500) ? 1.0 + Math.sin(this.blowTimer * 0.02) * 0.08 : 1.0;
                ctx.scale(puffScale, puffScale);
                ctx.drawImage(img, -132, -194, 265, 194);
            } else {
                ctx.scale(2.34, 2.34);
                this.drawWolfBody(ctx, '#455a64', '#263238', '#90a4ae');
                const puff = (this.blowTimer > 1500) ? Math.sin(this.blowTimer * 0.02) * 8 + 14 : 4;
                ctx.fillStyle = '#607d8b';
                ctx.beginPath();
                ctx.arc(-26 - puff * 0.3, -40, 10 + puff * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#263238';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
        ctx.restore();
        this.drawHealthBar(ctx);
    }
}

// 5.5 중간 보스: 늑대 선봉 돌격대장 (Mid-Boss Wolf)
class MidBossWolf extends Enemy {
    constructor(x, y, hp = 1800, damageMul = 1.0, skillIgnoreChance = 0.25, normalDodgeChance = 0.20, castleAttackPct = 0.25, speed = 0.75, bossTitle = '🐺 [중간보스] 늑대 선봉 돌격대장') {
        super(x, y, hp, speed, 200); // 200 골드 보상
        this.isBoss = true;
        this.isMidBoss = true;
        this.w = 172; // 20% 추가 확대 (143 -> 172)
        this.h = 210; // 20% 추가 확대 (175 -> 210)
        this.damageMul = damageMul;
        this.skillIgnoreChance = skillIgnoreChance;
        this.normalDodgeChance = normalDodgeChance;
        this.castleAttackPct = castleAttackPct;
        this.bossTitle = bossTitle;
        this.chargeTimer = 0;
        this.chargeWarningTimer = 0;
        this.isCharging = false;
        this.chargeDuration = 0;
        this.axeThrowTimer = 0;
        this.isEnraged = false;
        this.wolfTypeKey = 'midboss';
        if (window.WolfSpriteSystem) {
            this.animator = new window.WolfSpriteSystem.WolfAnimator('midboss');
        }
    }

    update(dt, game) {
        // 사망한 보스도 회오리 비행을 끝내야 적 목록에서 제거될 수 있다.
        if (this.tornadoState && this.tornadoState.active) {
            super.update(dt, game);
            return;
        }

        if (this.isDead || this.hp <= 0) return;

        // 돌진 예고 경고 처리 (0.8초 동안 지면 진동 및 예고선)
        if (this.chargeWarningTimer > 0) {
            this.chargeWarningTimer -= dt;
            this.speed = 0;
            if (this.chargeWarningTimer <= 0) {
                // 지면을 쿵! 강타하며 도약 돌진 개시!
                this.isCharging = true;
                this.chargeDuration = 1200;
                this.speed = this.baseSpeed * 2.3;
                soundEngine.explosion();
                game.createFloatingText('💥 쿵! 지면 강타 도약 돌진!!', this.x, this.y - this.h - 30, '#ff9800', 1000);
                game.triggerScreenShake(12);

                // 지면 강타 흙먼지 & 충격파 파티클 대량 방출
                for (let k = 0; k < 20; k++) {
                    game.particles.push({
                        x: this.x + (Math.random() - 0.5) * 40,
                        y: this.y - 10,
                        vx: -Math.random() * 8 + 4,
                        vy: -Math.random() * 5 - 2,
                        color: Math.random() < 0.5 ? '#8d6e63' : '#d7ccc8',
                        size: 4 + Math.random() * 4,
                        life: 25
                    });
                }
            }
        } else if (this.isCharging) {
            // 돌진 지속시간 처리
            this.chargeDuration -= dt;
            if (this.chargeDuration <= 0) {
                this.isCharging = false;
                this.speed = this.baseSpeed * (this.isEnraged ? 1.35 : 1.0);
            }
        }

        if (this.animator) {
            if (this.isCharging) {
                this.animator.playAction('charge', true);
            } else if (this.axeThrowTimer >= (this.isEnraged ? 3200 : 4500) - 500) {
                this.animator.playAction('axe_throw', false);
            } else if (this.animator.isFinished) {
                this.animator.playAction('march', true);
            }
        }

        super.update(dt, game);

        // 체력 50% 이하 분노 광폭화 및 돌격 지원군 1회 소환
        if (!this.isEnraged && this.hp <= this.maxHp * 0.5) {
            this.isEnraged = true;
            this.speed = this.baseSpeed * 1.35;
            game.showBanner("🔥 중간보스가 분노하여 돌격 지원군을 호출합니다!!", "#ff5722");
            soundEngine.bossAlert();
            game.spawnEnemy('skater');
            game.spawnEnemy('granny');
            if (game.currentDiff !== 'easy') {
                game.spawnEnemy('blower');
            }
        }

        // 패턴 1: 지면 강타 도약 돌진 (예고 후 돌격, 5.5초 주기)
        if (this.chargeWarningTimer <= 0 && !this.isCharging) {
            this.chargeTimer += dt;
            const chargeInterval = this.isEnraged ? 3800 : 5500;
            if (this.chargeTimer >= chargeInterval) {
                this.chargeTimer = 0;
                this.chargeWarningTimer = 800; // 0.8초 경고 단계
                soundEngine.bossAlert();
                game.createFloatingText('⚠️ [지면 강타] 돌격 도약 준비!', this.x, this.y - this.h - 30, '#ef4444', 800);
            }
        }

        // 패턴 2: 2연속 회전 쌍도끼 일제 투척 (4.5초 주기)
        this.axeThrowTimer += dt;
        const axeInterval = this.isEnraged ? 3200 : 4500;
        if (this.axeThrowTimer >= axeInterval) {
            this.axeThrowTimer = 0;
            game.throwMidBossTwinAxes(this.x - 15, this.y - 35, this.damageMul * 0.7);
        }
    }

    takeDamage(dmg, game, isSkill = false) {
        if (isSkill) {
            if (Math.random() < this.skillIgnoreChance) {
                game.floatingTexts.push({
                    text: '🛡️ 스킬 무시!',
                    x: this.x + (Math.random() - 0.5) * 30,
                    y: this.y - this.h - 25,
                    color: '#ff9800',
                    alpha: 1.0,
                    duration: 850,
                    elapsed: 0
                });
                soundEngine.skillIgnore();
                return false;
            }
        } else {
            if (Math.random() < this.normalDodgeChance) {
                game.floatingTexts.push({
                    text: '💨 회피!',
                    x: this.x + (Math.random() - 0.5) * 30,
                    y: this.y - this.h - 25,
                    color: '#00e5ff',
                    alpha: 1.0,
                    duration: 800,
                    elapsed: 0
                });
                soundEngine.dodge();
                return false;
            }
        }

        super.takeDamage(dmg, game);
        if (this.hp <= 0) {
            this.isDead = true;
            const anyBossAlive = game.enemies.some(e => e.isBoss && e !== this && !e.isDead && e.hp > 0);
            if (!anyBossAlive) {
                const bossHud = document.getElementById('boss-hud-container');
                if (bossHud) bossHud.classList.add('hidden');
                soundEngine.startStageBGM(game.wave);
                if (game.updateBGMButton) game.updateBGMButton();
            }
            game.showBanner(`🎉 중간보스 선봉 돌격대장 격파 완료! (+${this.goldVal}G)`, "#4caf50");
        }
        return true;
    }

    draw(ctx, game) {
        ctx.save();

        // 광폭화 또는 돌진 시 주황/붉은 아우라 (성능 최적화: 가벼운 발광 렌더링)
        if (this.isEnraged || this.isCharging) {
            ctx.fillStyle = this.isCharging ? 'rgba(255, 152, 0, 0.28)' : 'rgba(255, 61, 0, 0.32)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y - 35, 75, 70, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.animator && this.animator.isReady) {
            // 스프라이트 시트 기반 흑기사 돌격대장 애니메이션 (행진 / 맹렬한 돌진 / 쌍날 도끼 투척 - 20% 추가 확대)
            this.animator.draw(ctx, this.x, this.y - 125, 320, 305);
        } else {
            ctx.translate(this.x, this.y);
            const img = game && game.wolfImages && game.wolfImages.midboss;
            if (img && img.complete && img.naturalWidth > 0) {
                const bob = Math.sin(this.animTimer * 10) * 3;
                // 흑기사 용병 지휘관 중간보스 공식 스프라이트 렌더링 (20% 추가 확대)
                ctx.drawImage(img, -156, -296 + bob, 312, 296);
            } else {
                ctx.scale(3.12, 3.12); // 3.12배 늠름하고 육중한 중간보스 체격! (20% 추가 확대)

            // 늑대 몸체 (강인한 강철 다크 그레이 털)
            this.drawWolfBody(ctx, this.isEnraged ? '#4e342e' : '#37474f', '#212121', '#cfd8dc');

            // 1. 펄럭이는 붉은 망토 (등 뒤)
            ctx.fillStyle = this.isEnraged ? '#b71c1c' : '#c62828';
            ctx.beginPath();
            const capeWave = Math.sin(this.animTimer * 12) * 5;
            ctx.moveTo(10, -35);
            ctx.quadraticCurveTo(32, -40 + capeWave, 42, -15 + capeWave);
            ctx.lineTo(26, -10 + capeWave);
            ctx.lineTo(6, -25);
            ctx.closePath();
            ctx.fill();

            // 2. 가시 박힌 강철 어깨 갑옷 (견갑)
            ctx.fillStyle = '#455a64';
            ctx.beginPath();
            ctx.ellipse(0, -42, 10, 7, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#90a4ae';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 견갑의 날카로운 은빛 스파이크 2개
            ctx.fillStyle = '#eceff1';
            ctx.beginPath();
            ctx.moveTo(-4, -48);
            ctx.lineTo(-2, -56);
            ctx.lineTo(2, -47);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(2, -47);
            ctx.lineTo(5, -54);
            ctx.lineTo(8, -45);
            ctx.closePath();
            ctx.fill();

            // 3. 앞발에 쥔 쌍날 전투 도끼 (Battle Axe)
            ctx.save();
            ctx.translate(-24, -28);
            ctx.rotate(-0.35 + Math.sin(this.animTimer * 8) * 0.15);
            // 도끼 자루 (나무)
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(-2, -26, 4, 34);
            // 도끼 머리 (강철 쌍날)
            ctx.fillStyle = '#78909c';
            ctx.beginPath();
            ctx.arc(-8, -18, 10, -Math.PI * 0.4, Math.PI * 0.4, false);
            ctx.lineTo(-2, -18);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.arc(8, -18, 10, Math.PI * 0.6, Math.PI * 1.4, false);
            ctx.lineTo(2, -18);
            ctx.closePath();
            ctx.fill();
            // 날카로운 도끼날 은빛 하이라이트
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(-8, -18, 10, -Math.PI * 0.4, Math.PI * 0.4, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(8, -18, 10, Math.PI * 0.6, Math.PI * 1.4, false);
            ctx.stroke();
            ctx.restore();

            // 4. 이마의 붉은 전사의 띠
            ctx.strokeStyle = '#d50000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-28, -44);
            ctx.lineTo(-12, -47);
            ctx.stroke();
        }
    }

    ctx.restore();

    // 머리 위 체력바 (30% 확대)
    const barW = 143;
    const barH = 13;
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x - barW / 2, this.y - this.h - 24, barW, barH);
    ctx.fillStyle = this.isEnraged ? '#ff3d00' : '#ff9800';
    ctx.fillRect(this.x - barW / 2, this.y - this.h - 24, barW * hpPercent, barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.x - barW / 2, this.y - this.h - 24, barW, barH);
    }
}

// 6. 최종 보스: 빅 배드 울프 제왕 (Boss Wolf)
class BossWolf extends Enemy {
    constructor(x, y, hp = 4800, damageMul = 1.1, skillIgnoreChance = 0.3, normalDodgeChance = 0.2, castleAttackPct = 0.3, speed = 0.75 * 1.12, bossTitle = '👑 빅 배드 울프 제왕') {
        super(x, y, hp, speed, 300);
        this.isBoss = true;
        this.w = 218 * 1.2; // 현재 크기에서 20% 확대
        this.h = 258 * 1.2; // 충돌 판정도 표시 크기에 맞춤
        this.damageMul = damageMul;
        this.skillIgnoreChance = skillIgnoreChance;
        this.normalDodgeChance = normalDodgeChance;
        this.castleAttackPct = castleAttackPct;
        this.bossTitle = bossTitle;
        this.laserRange = 620;
        this.attackPatternTimer = 0;
        this.laserCharging = false;
        this.laserChargeTimer = 0;
        this.laserDamageRequired = 160;
        this.laserDamageAccumulated = 0;
        this.laserBeamActive = false;
        this.laserBeamTimer = 0;
        this.rangedAttackTimer = 0;
        this.boulderTimer = 0;
        this.summonTimer = 0;
        this.isEnraged = false;
        this.wolfTypeKey = 'boss';
        if (window.WolfSpriteSystem) {
            this.animator = new window.WolfSpriteSystem.WolfAnimator('boss');
        }
    }

    getLaserOrigin() {
        const image = typeof window !== 'undefined' && window.game && window.game.wolfImages && window.game.wolfImages.boss;
        const artworkReady = (this.animator && this.animator.isReady) || (image && image.complete && image.naturalWidth > 0);
        return artworkReady
            ? { x: this.x - 85, y: this.y - 210 }
            : { x: this.x - 14, y: this.y - 136 };
    }

    update(dt, game) {
        // 사망한 보스도 회오리 비행을 끝내야 적 목록에서 제거될 수 있다.
        if (this.tornadoState && this.tornadoState.active) {
            super.update(dt, game);
            return;
        }

        if (this.isDead || this.hp <= 0) return;

        // 레이저 충전/발사 중에는 제자리에서 조준한다.
        if (this.laserCharging || this.laserBeamActive) this.stopAtX = this.x;
        super.update(dt, game);
        delete this.stopAtX;

        // 체력 50% 이하 광폭화 발동
        if (!this.isEnraged && this.hp <= this.maxHp * 0.5) {
            this.isEnraged = true;
            this.speed = this.baseSpeed * 1.8;
            game.showBanner("🔥 늑대 제왕이 분노하여 광폭화합니다!!", "#ff0033");
            soundEngine.bossAlert();
        }

        // 1. 레이저 충전 단계 처리
        if (this.laserCharging) {
            this.speed = 0;
            this.laserChargeTimer -= dt;

            // 집중 사격으로 캔슬 성공 여부 검사
            if (this.laserDamageAccumulated >= this.laserDamageRequired) {
                this.laserCharging = false;
                this.laserBeamActive = false;
                this.slowTimer = 1800; // 1.8초 그로기 스턴!
                soundEngine.explosion();
                game.showBanner("💥 [캔슬 대성공!] 제왕의 파괴 레이저 시전을 완벽히 저지했습니다!!", "#00e5ff");
                game.createFloatingText('⚡ 캔슬 저지 스턴!!', this.x, this.y - this.h - 40, '#00e5ff', 1200);

                // 스턴 파티클
                for (let k = 0; k < 25; k++) {
                    game.particles.push({
                        x: this.x - 45 + (Math.random() - 0.5) * 30,
                        y: this.y - 75 + (Math.random() - 0.5) * 30,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        color: Math.random() < 0.5 ? '#00e5ff' : '#ffd54f',
                        size: 4 + Math.random() * 4,
                        life: 25
                    });
                }
            } else if (this.laserChargeTimer <= 0) {
                // 충전 완료 -> 스크린 관통 파괴 레이저 발사!
                this.laserCharging = false;
                this.laserBeamActive = true;
                this.laserBeamTimer = 650;
                soundEngine.wolfWind();
                soundEngine.explosion();
                game.showBanner("👑 빅 배드 울프 제왕의 파괴 레이저 직격 발사!!", "#e91e63");

                let dmg = (this.isEnraged ? 60 : 38) * this.damageMul;
                if (game.house.invincibleTimer > 0) {
                    dmg = 0;
                    game.showBanner("🛡️ 무적 방어막이 파괴 레이저를 완전히 막아냈습니다!", "#00e5ff");
                } else if (game.house.tier === 3) {
                    dmg *= 0.35; // 벽돌집은 견딤
                } else if (game.house.tier === 2) {
                    dmg *= 0.65;
                }
                dmg = Math.round(dmg);
                game.house.hp -= dmg;
                game.house.shake = dmg > 0 ? 22 : 6;
                game.triggerScreenShake(dmg > 0 ? 24 : 8);
            }
        } else if (this.laserBeamActive) {
            this.speed = 0;
            this.laserBeamTimer -= dt;
            if (this.laserBeamTimer <= 0) {
                this.laserBeamActive = false;
            }
        }

        // 패턴 1: 제왕의 파괴 레이저 포효 (1.2초 충전형 & 캔슬 기믹)
        if (!this.laserCharging && !this.laserBeamActive) {
            const patternInterval = this.isEnraged ? 3500 : 5000;
            const inLaserRange = this.x - (game.house.x + game.house.w) <= this.laserRange;
            if (inLaserRange) this.attackPatternTimer += dt;
            if (this.attackPatternTimer >= patternInterval) {
                this.attackPatternTimer = 0;
                this.laserCharging = true;
                this.laserChargeTimer = 1200; // 1.2초 충전
                this.laserDamageRequired = this.isEnraged ? 210 : 160;
                this.laserDamageAccumulated = 0;
                if (this.animator) {
                    this.animator.playAction('laser_roar', false);
                }
                soundEngine.bossAlert();
                game.showBanner("⚠️ [제왕의 파괴 레이저 응축 중!] 1.2초 내 집중 사격으로 캔슬하세요!!", "#f43f5e");
            }
        }

        // 패턴 2: 불타는 거대 마그마 운석 투척 패턴
        this.boulderTimer += dt;
        if (this.boulderTimer >= (this.isEnraged ? 4800 : 7000)) {
            this.boulderTimer = 0;
            if (this.animator) {
                this.animator.playAction('boulder_throw', false);
            }
            game.throwBossBoulder(this.x, this.y - this.h - 20, this.damageMul);
        }

        // 추가 원거리 공격: 3초마다 한 번, 30% 확률로 운석 발사.
        // 레이저 동작 중에는 타이머를 멈춰 공격이 겹치지 않도록 한다.
        if (!this.laserCharging && !this.laserBeamActive) {
            this.rangedAttackTimer += dt;
            if (this.rangedAttackTimer >= 3000) {
                this.rangedAttackTimer = 0;
                if (Math.random() < 0.30) {
                    if (this.animator) this.animator.playAction('boulder_throw', false);
                    game.showBanner('☄️ 제왕의 추가 원거리 운석 공격!', '#ff5722');
                    game.throwBossBoulder(this.x, this.y - this.h - 20, this.damageMul);
                }
            }
        }

        // 기본 애니메이션 복귀
        if (this.animator && this.animator.isFinished && !this.laserCharging && !this.laserBeamActive) {
            this.animator.playAction('emperor_walk', true);
        }

        // 패턴 3: 부하 늑대 대량 소환 (보스전 총력전)
        this.summonTimer += dt;
        const summonInterval = this.isEnraged ? 4500 : 7000;
        if (this.summonTimer >= summonInterval) {
            this.summonTimer = 0;
            game.showBanner("🐺 늑대 제왕의 증원 부대 소환!!", "#9c27b0");
            game.spawnEnemy('skater');
            game.spawnEnemy('blower');
            if (this.isEnraged || game.currentDiff !== 'easy') {
                game.spawnEnemy('balloon');
                game.spawnEnemy('granny');
            }
        }
    }

    takeDamage(dmg, game, isSkill = false) {
        if (this.laserCharging) {
            this.laserDamageAccumulated += dmg;
            game.floatingTexts.push({
                text: `⚡ 캔슬 누적! -${Math.round(dmg)}`,
                x: this.x - 30,
                y: this.y - this.h - 45,
                color: '#fde047',
                alpha: 1.0,
                duration: 600,
                elapsed: 0
            });
        }

        if (isSkill) {
            if (Math.random() < this.skillIgnoreChance) {
                // 스킬 무시 발동!
                game.floatingTexts.push({
                    text: '🛡️ 스킬 무시!',
                    x: this.x + (Math.random() - 0.5) * 30,
                    y: this.y - this.h - 25,
                    color: '#e040fb',
                    alpha: 1.0,
                    duration: 900,
                    elapsed: 0
                });
                soundEngine.skillIgnore();
                for (let k = 0; k < 12; k++) {
                    game.particles.push({
                        x: this.x,
                        y: this.y - 50,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        color: '#ea80fc',
                        size: 4,
                        life: 22
                    });
                }
                return false;
            }
        } else {
            if (Math.random() < this.normalDodgeChance) {
                // 일반 공격 회피 발동! (유저 요청: 일반 공격에는 무조건 밀려나지 않음!)
                game.floatingTexts.push({
                    text: '💨 회피!',
                    x: this.x + (Math.random() - 0.5) * 30,
                    y: this.y - this.h - 25,
                    color: '#00e5ff',
                    alpha: 1.0,
                    duration: 850,
                    elapsed: 0
                });
                soundEngine.dodge();
                // 일반 공격에는 절대로 뒤로 밀려나지 않음 (오직 스킬에만 넉백 허용)
                return false;
            }
        }

        super.takeDamage(dmg, game);
        if (this.hp <= 0) {
            this.isDead = true;
            const anyBossAlive = game.enemies.some(e => e.isBoss && e !== this && !e.isDead && e.hp > 0);
            if (!anyBossAlive) {
                const bossHud = document.getElementById('boss-hud-container');
                if (bossHud) bossHud.classList.add('hidden');
                soundEngine.startStageBGM(game.wave);
                if (game.updateBGMButton) game.updateBGMButton();
            }
        }
        return true;
    }

    draw(ctx, game) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(1.2, 1.2);
        ctx.translate(-this.x, -this.y);

        // 광폭화 시 붉은 아우라 발광 (성능 최적화: 가벼운 발광 렌더링)
        if (this.isEnraged) {
            ctx.fillStyle = 'rgba(255, 23, 68, 0.28)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y - 60, 110, 100, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.animator && this.animator.isReady) {
            // 스프라이트 시트 기반 빅 배드 울프 제왕 애니메이션 (제왕 보행 / 레이저 포효 / 황금 발톱 참격 / 암석 투척 - 20% 추가 확대)
            this.animator.draw(ctx, this.x, this.y - 172, 390, 390);
        } else {
            ctx.translate(this.x, this.y);
            const img = game && game.wolfImages && game.wolfImages.boss;
            if (img && img.complete && img.naturalWidth > 0) {
                const bob = Math.sin(this.animTimer * 8) * 3;
                // 빅 배드 울프 제왕 공식 스프라이트 렌더링 (20% 추가 확대)
                ctx.drawImage(img, -195, -374 + bob, 390, 390);
            } else {
                ctx.scale(3.9, 3.9); // 3.9배 거대한 빅 보스 늑대! (20% 추가 확대)

            // 1. 펄럭이는 거대한 붉은 모피 망토 (등 뒤)
            ctx.fillStyle = this.isEnraged ? '#880e4f' : '#b71c1c';
            ctx.beginPath();
            const capeWave = Math.sin(this.animTimer * 10) * 6;
            ctx.moveTo(12, -38);
            ctx.quadraticCurveTo(36, -45 + capeWave, 48, -10 + capeWave);
            ctx.lineTo(30, -5 + capeWave);
            ctx.lineTo(8, -25);
            ctx.closePath();
            ctx.fill();

            // 거대한 늑대 몸체 (차콜 그레이 / 흑청색 털)
            this.drawWolfBody(ctx, this.isEnraged ? '#37000b' : '#263238', '#10171a', '#78909c');

            // 2. 황금 흉갑 (Golden Chestplate)
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(-16, -38);
            ctx.lineTo(8, -40);
            ctx.lineTo(10, -22);
            ctx.lineTo(-12, -20);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#b78103';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 흉갑 중앙의 붉은 보석
            ctx.fillStyle = '#d50000';
            ctx.beginPath();
            ctx.arc(-3, -29, 3, 0, Math.PI * 2);
            ctx.fill();

            // 3. 뾰족한 황금 제왕 왕관 (Golden Crown)
            ctx.fillStyle = '#ffc107';
            ctx.strokeStyle = '#ff8f00';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-20, -68);
            ctx.lineTo(-24, -78); // 왼쪽 뿔
            ctx.lineTo(-17, -72);
            ctx.lineTo(-13, -82); // 중앙 높은 뿔
            ctx.lineTo(-9, -72);
            ctx.lineTo(-4, -78);  // 오른쪽 뿔
            ctx.lineTo(-6, -68);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 왕관 보석
            ctx.fillStyle = '#e91e63';
            ctx.beginPath();
            ctx.arc(-13, -75, 1.8, 0, Math.PI * 2);
            ctx.fill();

            // 4. 날카로운 거대 황금 발톱 (Golden Claws)
            ctx.fillStyle = '#ffd700';
            for (let c = 0; c < 3; c++) {
                ctx.beginPath();
                ctx.moveTo(-28 - c * 4, -20 + c * 2);
                ctx.lineTo(-38 - c * 3, -17 + c * 2);
                ctx.lineTo(-29 - c * 4, -14 + c * 2);
                ctx.closePath();
                ctx.fill();
            }

            // 5. 붉게 타오르는 안광
            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            ctx.arc(-23, -46, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-23, -46, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();

        const gem = this.getLaserOrigin();
        ctx.save();
        ctx.fillStyle = this.laserCharging ? '#fff1f2' : '#f43f5e';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(gem.x, gem.y - 12);
        ctx.lineTo(gem.x + 9, gem.y);
        ctx.lineTo(gem.x, gem.y + 12);
        ctx.lineTo(gem.x - 9, gem.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 거대 보스 머리 위 체력바 (30% 확대)
        const barW = 182 * 1.2;
        const barH = 16;
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barW / 2, this.y - this.h - 32, barW, barH);
        ctx.fillStyle = this.isEnraged ? '#ff1744' : '#e91e63';
        ctx.fillRect(this.x - barW / 2, this.y - this.h - 32, barW * hpPercent, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - barW / 2, this.y - this.h - 32, barW, barH);
    }
}

// =========================================================================
// 8. 양철 방패 탱커 늑대 (Shield Wolf - 냄비 헬멧 & 양철 방패로 전면 방어!)
// =========================================================================
class ShieldWolf extends Enemy {
    constructor(x, y) {
        super(x, y, 110, 0.82, 16); // 탄탄한 체력 110, 묵직한 돌격 속도 0.82
        this.w = 130;
        this.h = 125;
        this.shieldHp = 95;
        this.maxShieldHp = 95;
        this.hasShield = true;
        this.wolfTypeKey = 'shield';
        if (window.WolfSpriteSystem) {
            this.animator = new window.WolfSpriteSystem.WolfAnimator('shield');
            this.brokenAnimator = new window.WolfSpriteSystem.WolfAnimator('shield_broken');
        }
    }

    update(dt, game) {
        if (!this.hasShield && this.brokenAnimator) {
            this.brokenAnimator.speedMultiplier = Math.max(0.4, this.speed / Math.max(0.1, this.baseSpeed));
            this.brokenAnimator.update(dt / 1000);
        }
        super.update(dt, game);
    }

    takeDamage(dmg, game, isSkill = false, isArmorPierce = false) {
        if (this.hasShield && this.shieldHp > 0 && !isArmorPierce) {
            if (this.armorShredTimer > 0) dmg *= 1.30;
            this.shieldHp -= dmg;

            if (typeof soundEngine !== 'undefined' && soundEngine.shieldClang) {
                soundEngine.shieldClang();
            } else if (typeof soundEngine !== 'undefined') {
                soundEngine.hit();
            }

            // 방패 피격 금속 스파크 파티클
            if (game && game.particles && game.particles.length < 85) {
                for (let k = 0; k < 8; k++) {
                    game.particles.push({
                        x: this.x - 32 + (Math.random() - 0.5) * 16,
                        y: this.y - 48 + (Math.random() - 0.5) * 28,
                        vx: -Math.random() * 5 - 2,
                        vy: (Math.random() - 0.5) * 6,
                        color: Math.random() < 0.5 ? '#b0bec5' : '#ffd54f',
                        size: 2.5 + Math.random() * 2.5,
                        life: 14
                    });
                }
            }

            if (game && game.floatingTexts && game.floatingTexts.length < 30) {
                game.floatingTexts.push({
                    text: `🛡️ 챙! 방패 -${Math.round(dmg)}`,
                    x: this.x - 25,
                    y: this.y - this.h - 18,
                    color: '#4fc3f7',
                    alpha: 1.0,
                    duration: 650,
                    elapsed: 0
                });
            }

            // 방패 내구도 소진 시 파괴 연출!
            if (this.shieldHp <= 0) {
                this.hasShield = false;
                this.baseSpeed = 1.35; // 방패 파괴 후 가벼워져서 헐레벌떡 광속 질주!
                if (typeof soundEngine !== 'undefined' && soundEngine.shieldBreak) {
                    soundEngine.shieldBreak();
                } else if (typeof soundEngine !== 'undefined') {
                    soundEngine.explosion();
                }

                // 방패 박살 금속 파편 폭발 방출
                if (game && game.particles && game.particles.length < 80) {
                    for (let k = 0; k < 24; k++) {
                        const ang = Math.random() * Math.PI * 2;
                        const spd = Math.random() * 8 + 3;
                        game.particles.push({
                            x: this.x - 28,
                            y: this.y - 45,
                            vx: Math.cos(ang) * spd,
                            vy: Math.sin(ang) * spd - 2,
                            color: Math.random() < 0.4 ? '#c59b27' : (Math.random() < 0.7 ? '#cfd8dc' : '#ffb74d'),
                            size: Math.random() * 5 + 3,
                            life: 25
                        });
                    }
                }

                if (game && game.floatingTexts && game.floatingTexts.length < 35) {
                    game.floatingTexts.push({
                        text: '💥 뚜껑 방패 박살! 맨몸 노출!',
                        x: this.x - 15,
                        y: this.y - this.h - 25,
                        color: '#ff7043',
                        alpha: 1.0,
                        duration: 900,
                        elapsed: 0,
                        scale: 1.3
                    });
                }

                // 방패 파괴 시 0.5초간 당황하여 멈칫
                this.slowTimer = 500;
                this.speed = 0;
            }
            return false;
        }

        return super.takeDamage(dmg, game);
    }

    draw(ctx, game) {
        ctx.save();
        // 1. 방패 보유 시: 황동 뚜껑 방패 애니메이터 (달리기 & 공격 시 shield_attack)
        if (this.hasShield) {
            if (this.animator && this.animator.isReady) {
                this.animator.draw(ctx, this.x, this.y - 55, 190, 170);
                ctx.restore();
                this.drawHealthBar(ctx);
                return;
            }
        } else {
            // 2. 방패 파괴 시: 양손 허우적거리며 질주하는 shield_broken 애니메이터!
            if (!this.brokenAnimator && window.WolfSpriteSystem) {
                this.brokenAnimator = new window.WolfSpriteSystem.WolfAnimator('shield_broken');
            }
            if (this.brokenAnimator && this.brokenAnimator.isReady) {
                this.brokenAnimator.draw(ctx, this.x, this.y - 48, 180, 160);
                ctx.restore();
                this.drawHealthBar(ctx);
                return;
            }
        }
        // ---- 벡터 폴백 (PNG 미로딩 시에만) ----
        ctx.translate(this.x, this.y);
        ctx.scale(2.34, 2.34);

        const bob = Math.sin(this.animTimer * 8) * 2.5;

        // 1. 단단한 흑회색 본체 렌더링
        this.drawWolfBody(ctx, '#455a64', '#263238', '#90a4ae');

        // 2. 머리 위 냄비 헬멧 (Pot Helmet)
        // 냄비 본체
        ctx.fillStyle = '#78909c';
        ctx.beginPath();
        ctx.ellipse(-16, -55 + bob, 15, 9, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // 냄비 챙(Rim)
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 냄비 뚜껑 손잡이/꼭지 (황동빛)
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(-16, -64 + bob, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b78103';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 턱끈 (가죽)
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-25, -52 + bob);
        ctx.quadraticCurveTo(-18, -34 + bob, -10, -50 + bob);
        ctx.stroke();

        // 3. 거대 양철 방패 (Tin Shield)
        if (this.hasShield) {
            ctx.save();
            ctx.translate(-26, -38 + bob);
            ctx.rotate(-0.08);

            // 방패 베이스 그라데이션 (정적 1회 캐싱으로 가비지 컬렉션 및 렉 완전 방지)
            if (!ShieldWolf.shieldGrad) {
                ShieldWolf.shieldGrad = ctx.createLinearGradient(-12, -28, 12, 28);
                ShieldWolf.shieldGrad.addColorStop(0, '#eceff1');
                ShieldWolf.shieldGrad.addColorStop(0.4, '#b0bec5');
                ShieldWolf.shieldGrad.addColorStop(1, '#607d8b');
            }
            ctx.fillStyle = ShieldWolf.shieldGrad;

            // 방패 곡면 외형
            ctx.beginPath();
            ctx.moveTo(-10, -28);
            ctx.lineTo(10, -28);
            ctx.quadraticCurveTo(14, 0, 10, 26);
            ctx.lineTo(-4, 30);
            ctx.quadraticCurveTo(-14, 0, -10, -28);
            ctx.closePath();
            ctx.fill();

            // 방패 테두리 리벳 및 골판 리지(Corrugation)
            ctx.strokeStyle = '#37474f';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // 골판지 형태의 수직 주름선
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            [-5, 0, 5].forEach(ox => {
                ctx.beginPath();
                ctx.moveTo(ox, -26);
                ctx.lineTo(ox, 26);
                ctx.stroke();
            });

            // 방패 리벳 징
            ctx.fillStyle = '#ffffff';
            [[-8, -24], [8, -24], [-8, 20], [8, 20]].forEach(([rx, ry]) => {
                ctx.beginPath();
                ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
                ctx.fill();
            });

            // 방패 표면 낙서 (빨간 X 또는 늑대 발톱 스크래치)
            ctx.strokeStyle = '#ff1744';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-6, -8);
            ctx.lineTo(6, 6);
            ctx.moveTo(6, -8);
            ctx.lineTo(-6, 6);
            ctx.stroke();

            // 방패 내구도 50% 미만 시 균열 금 표시
            if (this.shieldHp < this.maxShieldHp * 0.5) {
                ctx.strokeStyle = '#212121';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(0, -15);
                ctx.lineTo(-3, 0);
                ctx.lineTo(4, 12);
                ctx.stroke();
            }

            ctx.restore();
        } else {
            // 방패 파괴 시: 찢어진 가죽 스트랩이 덜렁거림
            ctx.strokeStyle = '#8d6e63';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-18, -32 + bob);
            ctx.quadraticCurveTo(-26, -20 + bob, -24, -8 + bob);
            ctx.stroke();

            // 당황/분노한 빨간 안광
            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            ctx.arc(-23, -45 + bob, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        ctx.restore();
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        if (this.isDead || this.hp <= 0 || (this.tornadoState && this.tornadoState.active)) return;

        const barW = 44;
        const barH = 5;

        // 본체 체력바 (아래)
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#263238';
        ctx.fillRect(this.x - barW / 2, this.y - this.h - 14, barW, barH);
        ctx.fillStyle = '#e53935';
        ctx.fillRect(this.x - barW / 2, this.y - this.h - 14, barW * hpPercent, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barW / 2, this.y - this.h - 14, barW, barH);

        // 양철 방패 내구도 게이지바 (체력바 바로 위 - 청록/은빛 네온)
        if (this.hasShield) {
            const shieldPercent = Math.max(0, this.shieldHp / this.maxShieldHp);
            const shieldBarY = this.y - this.h - 22;
            ctx.fillStyle = '#1a237e';
            ctx.fillRect(this.x - barW / 2, shieldBarY, barW, 4.5);
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(this.x - barW / 2, shieldBarY, barW * shieldPercent, 4.5);
            ctx.strokeStyle = '#80d8ff';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - barW / 2, shieldBarY, barW, 4.5);
        }
    }
}

// =========================================================================
// 9. 미니 새끼 늑대 (Mini Wolf - 공수 투하 후 통통 점프 질주!)
// =========================================================================
class MiniWolf extends Enemy {
    constructor(x, y, hasParachute = false) {
        super(x, y, 28, 1.45, 2); // 날렵한 1.45 이동 속도, 귀여운 28 체력
        this.w = 64;
        this.h = 58;
        this.hasParachute = hasParachute;
        this.isLanding = hasParachute;
        this.fallVy = 1.35;
        this.hopTimer = Math.random() * 10;
        this.wolfTypeKey = 'miniwolf';
        if (window.WolfSpriteSystem) {
            this.animator = new window.WolfSpriteSystem.WolfAnimator('miniwolf');
            this.paraAnimator = new window.WolfSpriteSystem.WolfAnimator('miniwolf_para');
        }
    }

    update(dt, game) {
        if (this.tornadoState && this.tornadoState.active) {
            super.update(dt, game);
            return;
        }

        if (this.isDead || this.hp <= 0) return;

        if (this.hasParachute) {
            if (this.paraAnimator) {
                this.paraAnimator.update(dt / 1000);
            }
            this.animTimer += dt * 0.006;
            this.y += this.fallVy * (dt / 16.6);
            this.x -= (this.speed * 0.45) * (dt / 16.6);
            this.x += Math.sin(this.animTimer * 5) * 0.65;

            // 착지 높이(474) 도달 시 낙하산 해제 및 지상 질주 돌격!
            if (this.y >= 474) {
                this.y = 474;
                this.hasParachute = false;
                this.isLanding = false;
                if (typeof soundEngine !== 'undefined' && soundEngine.miniPuppyYip) {
                    soundEngine.miniPuppyYip();
                } else if (typeof soundEngine !== 'undefined') {
                    soundEngine.hit();
                }

                // 퐁! 착지 먼지 파티클
                if (game && game.particles && game.particles.length < 85) {
                    for (let k = 0; k < 8; k++) {
                        game.particles.push({
                            x: this.x + (Math.random() - 0.5) * 20,
                            y: 474,
                            vx: (Math.random() - 0.5) * 4,
                            vy: -Math.random() * 2.5 - 0.5,
                            color: '#d7ccc8',
                            size: 2.8,
                            life: 14
                        });
                    }
                }

                if (game && game.floatingTexts && game.floatingTexts.length < 35) {
                    game.floatingTexts.push({
                        text: '🐾 퐁! 착지!',
                        x: this.x,
                        y: this.y - this.h - 10,
                        color: '#69f0ae',
                        alpha: 1.0,
                        duration: 650,
                        elapsed: 0
                    });
                }
            }
            return;
        }

        this.hopTimer += dt * 0.015;

        // 미니 늑대의 집 공격 대미지는 4 (앙증맞은 깨물기)
        const targetX = game.house.x + game.house.w;
        if (this.x <= targetX + 15 && this.attackCooldown <= 0) {
            this.attackCooldown = 1100;
            if (game.house.invincibleTimer > 0) {
                if (typeof soundEngine !== 'undefined') soundEngine.hit();
                this.x += 25;
            } else {
                let dmg = 4;
                if (game.house.tier === 2) dmg *= 0.85;
                if (game.house.tier === 3) dmg *= 0.65;
                game.house.hp -= Math.max(1, Math.round(dmg));
                game.house.shake = 4;
                if (typeof soundEngine !== 'undefined') soundEngine.hit();
            }
            return;
        }

        super.update(dt, game);
    }

    draw(ctx, game) {
        ctx.save();

        // 1. 공수 낙하산 상태 (hasParachute === true)
        if (this.hasParachute) {
            if (!this.paraAnimator && window.WolfSpriteSystem) {
                this.paraAnimator = new window.WolfSpriteSystem.WolfAnimator('miniwolf_para');
            }
            if (this.paraAnimator && this.paraAnimator.isReady) {
                // miniwolf_para 스프라이트 시트 애니메이션 (너비 170, 높이 170)
                this.paraAnimator.draw(ctx, this.x, this.y - 45, 170, 170);
                ctx.restore();
                this.drawHealthBar(ctx);
                return;
            }

            // 폴백 벡터 렌더링
            ctx.translate(this.x, this.y);
            const sway = Math.sin(this.animTimer * 5) * 0.12;
            ctx.save();
            ctx.translate(0, -48);
            ctx.rotate(sway);
            const pColors = ['#ff5252', '#ffffff', '#ff5252', '#ffffff', '#ff5252'];
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = pColors[i];
                ctx.beginPath();
                const startA = Math.PI + (i * Math.PI) / 5;
                const endA = Math.PI + ((i + 1) * Math.PI) / 5;
                ctx.arc(0, 0, 22, startA, endA);
                ctx.lineTo(0, 0);
                ctx.closePath();
                ctx.fill();
            }
            ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = '#efebe9'; ctx.lineWidth = 1;
            [[-18, 0], [-6, 0], [6, 0], [18, 0]].forEach(([lx]) => {
                ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(0, 36); ctx.stroke();
            });
            ctx.restore();
            // 미니 늑대 몸통 폴백
            ctx.fillStyle = '#607d8b';
            ctx.beginPath();
            ctx.ellipse(0, -10, 14, 11, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath();
            ctx.arc(-8, -22, 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath(); ctx.arc(-11, -23, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffd54f';
            ctx.fillRect(6, -18, 5, 10);
            ctx.restore();
            this.drawHealthBar(ctx);
            return;
        }

        // 2. 지상 주행 상태 (hasParachute === false)
        if (this.animator && this.animator.isReady) {
            this.animator.draw(ctx, this.x, this.y - 38, 130, 126);
            ctx.restore();
            this.drawHealthBar(ctx);
            return;
        }

        // 지상 주행 벡터 폴백
        ctx.translate(this.x, this.y);
        const hop = Math.abs(Math.sin(this.hopTimer * 4.5)) * 6.5;
        ctx.save();
        ctx.translate(0, -hop);
        ctx.fillStyle = '#607d8b';
        ctx.beginPath();
        ctx.ellipse(0, -18, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.arc(-10, -30, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath(); ctx.arc(-14, -31, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd54f';
        ctx.fillRect(8, -28, 6, 12);
        ctx.restore();
        ctx.restore();

        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        if (this.isDead || this.hp <= 0 || (this.tornadoState && this.tornadoState.active)) return;
        const barW = 34;
        const barH = 4;
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        const barY = this.hasParachute ? this.y - 75 : this.y - 65;
        ctx.fillStyle = '#263238';
        ctx.fillRect(this.x - barW / 2, barY, barW, barH);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(this.x - barW / 2, barY, barW * hpPercent, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(this.x - barW / 2, barY, barW, barH);
    }
}

// =========================================================================
// 10. 우산 낙하산 공수 늑대 (Umbrella Wolf - 고고도 활강 & 미니 늑대 투하 & 격추 시 지상 보행!)
// =========================================================================
class UmbrellaWolf extends Enemy {
    constructor(x, y) {
        super(x, y || 205, 65, 0.92, 18); // 0.92 유유한 활강 속도, 65 체력
        this.w = 138;
        this.h = 195;
        this.isFlying = true;
        this.isFalling = false;
        this.umbrellaInverted = false;
        this.fallVy = 0;
        this.wolfTypeKey = 'umbrella';
        if (window.WolfSpriteSystem) {
            this.animator = new window.WolfSpriteSystem.WolfAnimator('umbrella');
        }
        this.airdropTimer = 2200;
        this.dropInterval = 3500;
        this.dropCount = 0;
        this.maxDrops = 3;
        this.glidePhase = Math.random() * 10;
    }

    popUmbrella(game) {
        if (this.isFlying) {
            this.isFlying = false;
            this.isFalling = true;
            this.umbrellaInverted = true;
            this.fallVy = 1.6;
            if (typeof soundEngine !== 'undefined' && soundEngine.umbrellaPop) {
                soundEngine.umbrellaPop();
            } else if (typeof soundEngine !== 'undefined') {
                soundEngine.pop();
            }
            this.w = 120;
            this.h = 125;

            // 우산 뒤집힘 파편 파티클 (무지개색 천 조각 및 살대 스파크)
            const popY = this.y - 120;
            if (game && game.particles && game.particles.length < 80) {
                const colors = ['#e91e63', '#00e5ff', '#ffeb3b', '#4caf50', '#ff9800'];
                for (let i = 0; i < 22; i++) {
                    const ang = (i / 22) * Math.PI * 2;
                    const spd = Math.random() * 6 + 2;
                    game.particles.push({
                        x: this.x + Math.cos(ang) * 12,
                        y: popY + Math.sin(ang) * 12,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd - 1.5,
                        color: colors[i % colors.length],
                        size: Math.random() * 5 + 2.5,
                        life: 25
                    });
                }
            }

            if (game && game.floatingTexts && game.floatingTexts.length < 35) {
                game.floatingTexts.push({
                    text: '☂️💥 우산 뒤집힘! 지상 추락!',
                    x: this.x,
                    y: popY - 10,
                    color: '#ff4081',
                    alpha: 1.0,
                    duration: 900,
                    elapsed: 0,
                    scale: 1.2
                });
            }

            // 우산 격추 시 25 고정 대미지 피격
            this.takeDamage(25, game, true, true);
        }
    }

    takeDamage(dmg, game, isSkill = false, isAntiAir = false) {
        if (this.isFlying && !isAntiAir && !isSkill) {
            // 비행 중 몸체에 사격 피격 시 대미지를 입으며, 체력이 낮아지면 우산 파손 격추!
            const res = super.takeDamage(dmg, game);
            if (this.hp <= 30 && this.isFlying) {
                this.popUmbrella(game);
            }
            return res;
        }
        return super.takeDamage(dmg, game);
    }

    update(dt, game) {
        if (this.tornadoState && this.tornadoState.active) {
            super.update(dt, game);
            return;
        }

        if (this.isDead || this.hp <= 0) return;

        if (this.isFlying) {
            this.animTimer += dt * 0.006;
            this.glidePhase += dt * 0.003;
            this.y += Math.sin(this.glidePhase * 2.5) * 0.35;
            this.x -= this.speed * (dt / 16.6);

            // 미니 새끼 늑대 공수 투하 (3.5초 주기, 최대 3마리)
            this.airdropTimer -= dt;
            const targetX = game.house.x + game.house.w;
            if (this.airdropTimer <= 0 && this.dropCount < this.maxDrops && this.x > targetX + 140) {
                this.airdropTimer = this.dropInterval;
                this.dropCount++;
                if (typeof soundEngine !== 'undefined' && soundEngine.airdropWhistle) {
                    soundEngine.airdropWhistle();
                }
                const mini = new MiniWolf(this.x - 10, this.y + 40, true);
                mini.hp = Math.round(mini.hp * (game.waveHpMul || 1));
                mini.maxHp = mini.hp;
                game.enemies.push(mini);

                if (game.floatingTexts && game.floatingTexts.length < 35) {
                    game.floatingTexts.push({
                        text: '🪂 미니 늑대 공수 투하!',
                        x: this.x - 10,
                        y: this.y + 20,
                        color: '#69f0ae',
                        alpha: 1.0,
                        duration: 800,
                        elapsed: 0
                    });
                }
            }

            // 집에 도달 시 공중 급강하 자폭
            if (this.x < targetX + 15) {
                game.house.hp -= 30;
                game.house.shake = 12;
                this.isDead = true;
                if (typeof soundEngine !== 'undefined') soundEngine.explosion();
                if (game.floatingTexts && game.floatingTexts.length < 35) {
                    game.floatingTexts.push({
                        text: '💥 공수 늑대 급강하 자폭! -30',
                        x: game.house.x + game.house.w * 0.5,
                        y: game.house.y + 40,
                        color: '#ff1744',
                        alpha: 1.0,
                        duration: 900,
                        elapsed: 0
                    });
                }
                return;
            }
        } else if (this.isFalling) {
            // 우산 뒤집힌 후 지면(474)으로 포물선 추락!
            this.y += this.fallVy * (dt / 16.6);
            this.fallVy += 0.38 * (dt / 16.6);

            if (this.y >= 474) {
                this.y = 474;
                this.isFalling = false;
                this.slowTimer = 850; // 착지 기절
                this.baseSpeed = 1.05;
                this.speed = this.baseSpeed * 0.5;

                if (typeof soundEngine !== 'undefined') soundEngine.hit();
                if (game && game.particles && game.particles.length < 85) {
                    for (let k = 0; k < 12; k++) {
                        game.particles.push({
                            x: this.x + (Math.random() - 0.5) * 40,
                            y: 474,
                            vx: (Math.random() - 0.5) * 6,
                            vy: -Math.random() * 3.5 - 0.5,
                            color: '#d7ccc8',
                            size: 4,
                            life: 20
                        });
                    }
                }

                if (game && game.floatingTexts && game.floatingTexts.length < 35) {
                    game.floatingTexts.push({
                        text: '쿵! 😵 추락 보행!',
                        x: this.x,
                        y: this.y - this.h - 15,
                        color: '#facc15',
                        alpha: 1.0,
                        duration: 850,
                        elapsed: 0
                    });
                }
            }
        } else {
            // 지상 추락 후 뒤집힌 우산을 몽둥이처럼 쥐고 돌격!
            super.update(dt, game);
        }
    }

    draw(ctx, game) {
        ctx.save();
        // animator 준비되면 모든 상태에서 PNG 스프라이트 사용
        if (this.animator && this.animator.isReady) {
            // 비행/낙하 중에는 위치를 더 위에 표시 (우산이 머리 위에 있으므로)
            const yOffset = this.isFlying ? -120 : (this.isFalling ? -90 : -90);
            this.animator.draw(ctx, this.x, this.y + yOffset, 280, 260);
            ctx.restore();
            this.drawHealthBar(ctx);
            return;
        }
        ctx.translate(this.x, this.y);

        const bob = Math.sin(this.animTimer * 6) * 3;
        const scarfFlap = Math.sin(this.animTimer * 8) * 8;

        if (this.isFlying) {
            // ==========================================
            // [비행 모드] 화려한 스트라이프 우산과 공중 활강
            // ==========================================
            ctx.save();
            ctx.translate(0, -90 + bob);

            // 1. 우산 꼭지 & 회전 풍향계/리본
            ctx.fillStyle = '#ffd600';
            ctx.beginPath();
            ctx.arc(0, -56, 4, 0, Math.PI * 2);
            ctx.fill();

            // 2. 화려한 무지개 패치워크 우산 돔 (너비 94, 높이 46)
            const panels = [
                { color: '#e91e63', start: Math.PI, end: Math.PI + Math.PI * 0.2 },
                { color: '#ffeb3b', start: Math.PI + Math.PI * 0.2, end: Math.PI + Math.PI * 0.4 },
                { color: '#00e5ff', start: Math.PI + Math.PI * 0.4, end: Math.PI + Math.PI * 0.6 },
                { color: '#76ff03', start: Math.PI + Math.PI * 0.6, end: Math.PI + Math.PI * 0.8 },
                { color: '#d500f9', start: Math.PI + Math.PI * 0.8, end: Math.PI * 2 }
            ];

            panels.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, -10, 48, p.start, p.end);
                ctx.lineTo(0, -10);
                ctx.closePath();
                ctx.fill();
            });

            // 우산 테두리 둥근 레이스 프릴
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 5; i++) {
                const fa = Math.PI + (i + 0.5) * (Math.PI / 5);
                const fx = Math.cos(fa) * 48;
                const fy = -10 + Math.sin(fa) * 48;
                ctx.beginPath();
                ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // 우산 살대 골격 & 중앙 금속 샤프트
            ctx.strokeStyle = '#37474f';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -56);
            ctx.lineTo(0, 40); // 손잡이까지 이어지는 샤프트
            ctx.stroke();

            // 구부러진 우산 손잡이 고리
            ctx.strokeStyle = '#8d6e63';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(-6, 42, 6, 0, Math.PI);
            ctx.stroke();

            ctx.restore();

            // 3. 매달려 날아가는 늑대 본체
            ctx.save();
            ctx.translate(0, bob);
            ctx.scale(2.2, 2.2);

            // 날리는 빨간 비행 스카프
            ctx.fillStyle = '#d32f2f';
            ctx.beginPath();
            ctx.moveTo(0, -32);
            ctx.quadraticCurveTo(18 + scarfFlap * 0.4, -38, 26 + scarfFlap * 0.8, -28);
            ctx.lineTo(22 + scarfFlap * 0.8, -23);
            ctx.quadraticCurveTo(12, -28, 0, -28);
            ctx.closePath();
            ctx.fill();

            // 공중에서 버둥거리는 다리 자세
            this.drawWolfBody(ctx, '#546e7a', '#37474f', '#cfd8dc');

            // 머리 위 가죽 고글 (Aviator Goggles)
            ctx.fillStyle = '#4e342e';
            ctx.fillRect(-22, -50, 14, 4); // 스트랩
            ctx.fillStyle = '#81d4fa';
            ctx.beginPath();
            ctx.arc(-16, -49, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffd54f';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            // 고글 광택
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-17, -50, 1.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        } else if (this.isFalling) {
            // ==========================================
            // [추락 모드] 뒤집혀서 산산조각난 깔때기 우산 & 당황한 늑대
            // ==========================================
            ctx.save();
            ctx.translate(0, -85);

            // 뒤집힌 우산 (깔때기 형태)
            ctx.fillStyle = '#d500f9';
            ctx.beginPath();
            ctx.moveTo(0, 30);
            ctx.lineTo(-44, -35);
            ctx.quadraticCurveTo(0, -15, 44, -35);
            ctx.closePath();
            ctx.fill();

            // 튀어나온 부러진 철사 살대들
            ctx.strokeStyle = '#263238';
            ctx.lineWidth = 2;
            [[-48, -42], [-20, -50], [20, -50], [48, -42]].forEach(([wx, wy]) => {
                ctx.beginPath();
                ctx.moveTo(0, 30);
                ctx.lineTo(wx, wy);
                ctx.stroke();
            });

            ctx.restore();

            // 당황하여 버둥거리는 늑대
            ctx.save();
            ctx.scale(2.2, 2.2);
            this.drawWolfBody(ctx, '#546e7a', '#37474f', '#cfd8dc');

            // 빙글빙글 만화 어지럼증 눈 (@_@)
            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(-23, -45, 3.5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        } else {
            // ==========================================
            // [지상 보행 모드] 뒤집힌 우산을 몽둥이처럼 쥐고 돌격
            // ==========================================
            ctx.save();
            ctx.scale(2.2, 2.2);
            this.drawWolfBody(ctx, '#546e7a', '#37474f', '#cfd8dc');

            // 어깨에 멘 부러진 우산 몽둥이
            ctx.strokeStyle = '#37474f';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-10, -32 + bob);
            ctx.lineTo(16, -55 + bob);
            ctx.stroke();

            // 끝에 매달린 너덜너덜한 천
            ctx.fillStyle = '#e91e63';
            ctx.beginPath();
            ctx.arc(16, -55 + bob, 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        ctx.restore();
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        if (this.isDead || this.hp <= 0 || (this.tornadoState && this.tornadoState.active)) return;
        const barW = 44;
        const barH = 5;
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        const barY = this.isFlying ? (this.y - 148) : (this.y - this.h - 14);

        ctx.fillStyle = '#263238';
        ctx.fillRect(this.x - barW / 2, barY, barW, barH);
        ctx.fillStyle = '#e91e63';
        ctx.fillRect(this.x - barW / 2, barY, barW * hpPercent, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barW / 2, barY, barW, barH);
    }
}

if (typeof window !== 'undefined') {
    window.Enemy = Enemy;
    window.NormalWolf = NormalWolf;
    window.SkaterWolf = SkaterWolf;
    window.GrannyWolf = GrannyWolf;
    window.BalloonWolf = BalloonWolf;
    window.BlowerWolf = BlowerWolf;
    window.MidBossWolf = MidBossWolf;
    window.BossWolf = BossWolf;
    window.ShieldWolf = ShieldWolf;
    window.MiniWolf = MiniWolf;
    window.UmbrellaWolf = UmbrellaWolf;
}
