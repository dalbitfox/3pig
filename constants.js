/**
 * constants.js
 * 게임 전역 상수, 캔버스 초기화, 난이도 및 칭호 설정
 */

var canvas = document.getElementById('game-canvas');
var ctx = canvas ? canvas.getContext('2d') : null;

// 내부 렌더링 해상도 고정 (1200 x 675, 16:9 비율)
var V_WIDTH = 1200;
var V_HEIGHT = 675;
if (canvas) {
    canvas.width = V_WIDTH;
    canvas.height = V_HEIGHT;
}

// 구형 브라우저 및 모바일 웹뷰 대응 roundRect 폴리필
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        let r = 0;
        if (typeof radii === 'number') r = radii;
        else if (Array.isArray(radii) && radii.length > 0) r = radii[0];
        r = Math.min(r, w / 2, h / 2);
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
        return this;
    };
}

// 게임 상태 정의
var GameState = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    SHOP: 'SHOP',
    VICTORY: 'VICTORY',
    GAMEOVER: 'GAMEOVER'
};

// 난이도별 설정
var DIFFICULTY_CONFIG = {
    easy: {
        name: '쉬움',
        badgeClass: 'diff-badge-easy',
        hpMul: 1.0,
        speedMul: 1.0,
        countMul: 1.0,
        midBossHp: 1800,          // 5단계 중간보스 체력 1,800
        midBossDamage: 0.9,       // 중간보스 공격력
        bossHp: 4800,
        bossDamage: 1.1,
        skillIgnoreChance: 0.30,  // 쉬움: 스킬 무시 30%
        normalDodgeChance: 0.20,  // 쉬움: 일반 공격 회피 20%
        bossCastleAttackPct: 0.30 // 쉬움: 성 닿고 공격 시 성 체력의 30% 감소
    },
    normal: {
        name: '보통',
        badgeClass: 'diff-badge-normal',
        hpMul: 1.85,              // [난이도 대폭 상향] 늑대 체력 +85%
        speedMul: 1.35,           // 늑대 이동속도 +35%
        countMul: 1.5,            // 늑대 수량 +50%
        midBossHp: 5800,          // 5단계 중간보스 체력 5,800
        midBossDamage: 1.35,
        bossHp: 16000,            // 제왕 체력 16,000
        bossDamage: 1.8,          // 제왕 공격력 1.8배
        skillIgnoreChance: 0.55,  // 보통: 스킬 무시 55%
        normalDodgeChance: 0.45,  // 보통: 일반 공격 회피 45%
        bossCastleAttackPct: 0.50 // 보통: 성 닿고 공격 시 성 체력의 50% 감소
    },
    hard: {
        name: '어려움',
        badgeClass: 'diff-badge-hard',
        hpMul: 2.8,               // [난이도 대폭 상향] 늑대 체력 2.8배
        speedMul: 1.75,           // 늑대 이동속도 +75%
        countMul: 2.1,            // 늑대 수량 2.1배 폭풍 공세
        midBossHp: 13500,         // 5단계 중간보스 체력 13,500
        midBossDamage: 2.0,
        bossHp: 38000,            // 제왕 체력 38,000
        bossDamage: 2.8,          // 제왕 공격력 2.8배
        skillIgnoreChance: 0.75,  // 어려움: 스킬 무시 75%
        normalDodgeChance: 0.75,  // 어려움: 일반 공격 회피 75%
        bossCastleAttackPct: 0.70 // 어려움: 성 닿고 공격 시 성 체력의 70% 감소
    },
    endless: {
        name: '무한 모드',
        badgeClass: 'diff-badge-endless',
        hpMul: 2.8,
        speedMul: 1.75,
        countMul: 2.1,
        midBossHp: 7500,          // 무한 모드 5웨이브 중간보스 체력
        midBossDamage: 1.4,
        bossHp: 16000,            // 10웨이브 시작 기준
        bossDamage: 1.2,
        skillIgnoreChance: 0.20,
        normalDodgeChance: 0.15,
        bossCastleAttackPct: 0.30
    }
};

// 칭호 설정
var TITLES_CONFIG = [
    { id: 'nuclear_beginner', name: '핵초보', cost: 0, prev: null, color: '#facc15', desc: '무한 모드 100웨이브 완전 정복 보상!' },
    { id: 'nuclear2_beginner', name: '핵핵초보', cost: 1000000, prev: 'nuclear_beginner', color: '#fb923c', desc: '100만 골드로 승급한 진정한 핵핵초보!' },
    { id: 'nuclear3_beginner', name: '핵핵핵초보', cost: 1000000, prev: 'nuclear2_beginner', color: '#f87171', desc: '초월적 경지에 도달한 궁극의 핵핵핵초보!' },
    { id: 'yoon', name: '윤석열', cost: 10000000, prev: 'nuclear3_beginner', color: '#c084fc', desc: '1,000만 골드로 획득한 영광의 칭호!' },
    { id: 'yoon_penis', name: '윤석열 꼬추', cost: 100000000, prev: 'yoon', color: '#38bdf8', desc: '1억 골드로 강림한 우주 최강의 신화적 칭호!' }
];

if (typeof window !== 'undefined') {
    window.canvas = canvas;
    window.ctx = ctx;
    window.V_WIDTH = V_WIDTH;
    window.V_HEIGHT = V_HEIGHT;
    window.GameState = GameState;
    window.DIFFICULTY_CONFIG = DIFFICULTY_CONFIG;
    window.TITLES_CONFIG = TITLES_CONFIG;
}
