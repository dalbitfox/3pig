/**
 * Web Audio API 기반 순수 신디사이저 오디오 엔진
 * 외부 사운드 파일 없이 브라우저 내에서 직접 효과음 및 BGM을 합성 생성
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.bgmGain = null;
        this.isMuted = false;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.bgmMode = 'stage';
        this.bgmStage = 1;
        try {
            this.isBgmEnabled = localStorage.getItem('pigs_bgm_enabled') !== 'false';
        } catch (e) {
            this.isBgmEnabled = true;
        }
        this.noiseBuffer = null;
        this.sfxVoices = [];
        this.sfxLastEvents = new Map();
        this.sfxOutput = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx && !this.bgmGain) {
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.setValueAtTime(0.20, this.ctx.currentTime);
            this.bgmGain.connect(this.ctx.destination);
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.bgmGain && this.ctx) {
            this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.20, this.ctx.currentTime);
        }
        if (this.isMuted) {
            this.stopBGM();
        } else {
            this.resumeBGM();
        }
        return this.isMuted;
    }

    toggleBGM() {
        this.isBgmEnabled = !this.isBgmEnabled;
        try {
            localStorage.setItem('pigs_bgm_enabled', String(this.isBgmEnabled));
        } catch (e) {
            // 저장소가 차단된 브라우저에서도 현재 세션의 토글은 정상 동작한다.
        }
        if (this.isBgmEnabled) this.resumeBGM();
        else this.stopBGM();
        return this.isBgmEnabled;
    }

    allowSfxEvent(name, gapMs) {
        if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return false;
        const now = this.ctx.currentTime * 1000;
        const last = this.sfxLastEvents.get(name);
        if (last !== undefined && now - last < gapMs) return false;
        this.sfxLastEvents.set(name, now);
        return true;
    }

    reserveSfx(duration) {
        if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return false;
        const now = this.ctx.currentTime;
        for (let i = this.sfxVoices.length - 1; i >= 0; i--) {
            if (this.sfxVoices[i] <= now) this.sfxVoices.splice(i, 1);
        }
        const manager = typeof window !== 'undefined' && window.game && window.game.performanceManager;
        const limit = manager && manager.quality === 0 ? 12 : 24;
        if (this.sfxVoices.length >= limit) return false;
        this.sfxVoices.push(now + duration);
        return true;
    }

    getSfxOutput() {
        if (!this.sfxOutput) {
            // 효과음 전용 압축기로 폭발이 겹칠 때의 급격한 음량 피크를 완화한다.
            this.sfxOutput = this.ctx.createDynamicsCompressor();
            this.sfxOutput.threshold.value = -16;
            this.sfxOutput.knee.value = 18;
            this.sfxOutput.ratio.value = 5;
            this.sfxOutput.attack.value = 0.003;
            this.sfxOutput.release.value = 0.15;
            this.sfxOutput.connect(this.ctx.destination);
        }
        return this.sfxOutput;
    }

    // 기본 단음 생성 헬퍼
    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2, pitchDecay = true) {
        if (!this.reserveSfx(duration)) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);
            if (pitchDecay) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(10, freq * 0.4), now + duration);
            }

            gain.gain.setValueAtTime(gainVal, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.getSfxOutput());
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            console.warn(e);
        }
    }

    // 노이즈 생성 (타격, 폭발, 바람)
    playNoise(duration = 0.2, gainVal = 0.2, lowpass = 1000) {
        if (!this.reserveSfx(Math.min(duration, 0.98))) return;
        try {
            // 백색소음 샘플을 호출마다 재생성하면 다중 피격 시 큰 GC/오디오 스레드
            // 스파이크가 발생한다. 1초 버퍼를 한 번 만든 뒤 모든 효과음이 공유한다.
            if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== this.ctx.sampleRate) {
                const bufferSize = this.ctx.sampleRate;
                this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = this.noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(lowpass, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(gainVal, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.getSfxOutput());
            noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };

            const safeDuration = Math.min(duration, 0.98);
            const maxOffset = Math.max(0, this.noiseBuffer.duration - safeDuration);
            noise.start(now, Math.random() * maxOffset, safeDuration);
            noise.stop(now + safeDuration);
        } catch (e) {
            console.warn(e);
        }
    }

    // =============================================================
    // 동화풍 어쿠스틱 오케스트라 / 장난감 악기 신디사이저 엔진
    // =============================================================

    // 1. 마림바 / 실로폰 (나무 말렛 타격 배음 + 목재 공명통 감쇠)
    playMarimba(freq, duration = 0.20, gainVal = 0.20) {
        if (this.isMuted || !this.ctx || !freq) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.bgmGain || this.ctx.destination;
            const master = this.ctx.createGain();
            master.gain.setValueAtTime(gainVal, now);
            master.connect(dest);

            // 기음 (Fundamental Wood Resonance)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(1.0, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            osc.connect(gain);
            gain.connect(master);
            osc.start(now);
            osc.stop(now + duration);

            // 말렛 타격 배음 (3.8x harmonic transient click)
            const oscHarm = this.ctx.createOscillator();
            const gainHarm = this.ctx.createGain();
            oscHarm.type = 'sine';
            oscHarm.frequency.setValueAtTime(freq * 3.8, now);
            gainHarm.gain.setValueAtTime(0.35, now);
            gainHarm.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
            oscHarm.connect(gainHarm);
            gainHarm.connect(master);
            oscHarm.start(now);
            oscHarm.stop(now + 0.04);

            setTimeout(() => {
                try { master.disconnect(); } catch (e) {}
            }, (duration + 0.05) * 1000);
        } catch (e) {
            console.warn(e);
        }
    }

    // 2. 토이 피아노 / 글로켄슈필 (맑고 영롱한 벨 차임 하모니 화음)
    playToyPiano(notes, duration = 0.35, gainVal = 0.12) {
        if (this.isMuted || !this.ctx || !notes || !notes.length) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.bgmGain || this.ctx.destination;
            const master = this.ctx.createGain();
            master.gain.setValueAtTime(gainVal, now);
            master.connect(dest);

            notes.forEach(f => {
                if (!f) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, now);
                gain.gain.setValueAtTime(0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
                osc.connect(gain);
                gain.connect(master);
                osc.start(now);
                osc.stop(now + duration);

                // 고음 차임벨 배음 (2.76x)
                const oscH = this.ctx.createOscillator();
                const gainH = this.ctx.createGain();
                oscH.type = 'sine';
                oscH.frequency.setValueAtTime(f * 2.76, now);
                gainH.gain.setValueAtTime(0.12, now);
                gainH.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                oscH.connect(gainH);
                gainH.connect(master);
                oscH.start(now);
                oscH.stop(now + 0.09);
            });

            setTimeout(() => {
                try { master.disconnect(); } catch (e) {}
            }, (duration + 0.1) * 1000);
        } catch (e) {
            console.warn(e);
        }
    }

    // 3. 어쿠스틱 퐁퐁 베이스 (로우패스 필터를 거친 따뜻하고 둥근 업라이트 베이스)
    playAcousticBass(freq, duration = 0.25, gainVal = 0.24) {
        if (this.isMuted || !this.ctx || !freq) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.bgmGain || this.ctx.destination;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.97), now + duration);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320, now);
            filter.frequency.exponentialRampToValueAtTime(130, now + duration);

            gain.gain.setValueAtTime(gainVal, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(dest);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            console.warn(e);
        }
    }

    // 4. 어린이 만화 퍼커션 (우드블록, 트라이앵글, 소프트 에그 쉐이커)
    playToyPercussion(type = 'woodblock', gainVal = 0.14) {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.bgmGain || this.ctx.destination;

            if (type === 'woodblock') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(950, now);
                osc.frequency.exponentialRampToValueAtTime(450, now + 0.03);
                gain.gain.setValueAtTime(gainVal, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
                osc.connect(gain);
                gain.connect(dest);
                osc.start(now);
                osc.stop(now + 0.04);
            } else if (type === 'triangle') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(3520, now);
                gain.gain.setValueAtTime(gainVal * 0.7, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                osc.connect(gain);
                gain.connect(dest);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'shaker') {
                const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(3600, now);
                filter.Q.setValueAtTime(2.2, now);
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(gainVal * 0.65, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(dest);
                noise.start(now);
            }
        } catch (e) {
            console.warn(e);
        }
    }

    // 1. 발사음 (사과/돌멩이 날아가는 경쾌한 쇽 소리)
    shoot() {
        this.init();
        if (!this.allowSfxEvent('shoot', 45)) return;
        this.playTone(650, 'triangle', 0.085, 0.12, true);
        this.playTone(1100, 'sine', 0.045, 0.035, true);
    }

    // 2. 늑대 피격음 (딱! 퍽! - 다량 타격 시 오디오 스레드 과부하 방지 쓰로틀링)
    hit() {
        if (!this.allowSfxEvent('hit', 45)) return;
        this.playNoise(0.065, 0.14, 1800);
        this.playTone(155, 'triangle', 0.09, 0.14, true);
        this.playTone(1250, 'sine', 0.045, 0.04, true);
    }

    // 3. 풍선 터짐 (펑!)
    pop() {
        if (!this.allowSfxEvent('pop', 65)) return;
        this.playNoise(0.12, 0.25, 2500);
        this.playTone(400, 'sine', 0.1, 0.2, true);
    }

    // 4. [1] 첫째 돼지 짚단 굴리기 (두구두구 웅장한 굴림)
    strawRoll() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        this.playNoise(0.8, 0.2, 500);
        this.playTone(120, 'triangle', 0.6, 0.25, false);
    }

    // 5. [2] 둘째 돼지 도토리 폭탄 (쾅! 폭발음)
    acornExplode() {
        if (!this.allowSfxEvent('acorn', 80)) return;
        this.playNoise(0.45, 0.35, 600);
        this.playTone(90, 'sine', 0.4, 0.3, true);
    }

    // 5-1. 거대 바위/보스 폭발음 (쿠구궁 쾅!)
    explosion() {
        if (!this.allowSfxEvent('explosion', 90)) return;
        this.playTone(85, 'sine', 0.48, 0.28, true);
        this.playNoise(0.32, 0.26, 1900);
        this.playTone(460, 'triangle', 0.18, 0.085, true);
    }

    // 6. [3] 셋째 돼지 뚝딱 수리 & 펄펄 가마솥
    repair() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        [0, 0.08, 0.16].forEach((delay, idx) => {
            setTimeout(() => {
                this.playTone(550 + idx * 100, 'square', 0.07, 0.18, false);
            }, delay * 1000);
        });
        setTimeout(() => {
            this.playNoise(0.5, 0.18, 3000); // 끓는 솥 치이익
        }, 220);
    }

    // 7. 볼빵빵 늑대 돌풍 입김 (후우우우욱)
    wolfWind() {
        this.playNoise(0.6, 0.22, 900);
    }

    // 8. 동전 획득 짤랑
    coin() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987, now); // B5
        osc.frequency.setValueAtTime(1318, now + 0.08); // E6

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // 8-1. 아기돼지의 "초보네~ㅋ" 놀림 사운드 (경쾌한 삑삑 톤)
    pigTease() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        const notes = [659.25, 783.99, 880.00]; // E5, G5, A5
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.08, 0.12, true);
            }, idx * 60);
        });
    }

    // ⚡ 도토리 터보 모드 토글 효과음 (ON: 고속 상승 파워업 챠임 / OFF: 부드러운 하강음)
    turboToggle(isOn) {
        this.init();
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            if (isOn) {
                // 파워업 활성화: C5 -> E5 -> G5 -> C6 고속 아르페지오 (번개 충전 사운드)
                const freqs = [523.25, 659.25, 783.99, 1046.50];
                freqs.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.035);
                    gain.gain.setValueAtTime(0.24, now + idx * 0.035);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.12);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.035);
                    osc.stop(now + idx * 0.035 + 0.12);
                });
            } else {
                // 비활성화: G5 -> E5 -> C5 부드러운 해제음
                const freqs = [783.99, 659.25, 523.25];
                freqs.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.04);
                    gain.gain.setValueAtTime(0.18, now + idx * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.14);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.04);
                    osc.stop(now + idx * 0.04 + 0.14);
                });
            }
        } catch (e) {
            console.warn(e);
        }
    }

    // 0. 난이도 및 UI 카드/메뉴 선택 전용 효과음 (찰진 스위치 팝 + 맑고 풍성한 3화음 상승 챠임벨)
    playSelect() {
        this.init();
        if (this.isMuted) return;

        const playNotes = () => {
            if (!this.ctx) return;
            try {
                const now = this.ctx.currentTime;

                // 1. 또각! 찰진 스위치 팝 타격감 (어택감 극대화)
                const popOsc = this.ctx.createOscillator();
                const popGain = this.ctx.createGain();
                popOsc.type = 'triangle';
                popOsc.frequency.setValueAtTime(850, now);
                popOsc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
                popGain.gain.setValueAtTime(0.45, now);
                popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                popOsc.connect(popGain);
                popGain.connect(this.ctx.destination);
                popOsc.start(now);
                popOsc.stop(now + 0.04);

                // 2. 맑고 경쾌하게 울려 퍼지는 3화음 상승 벨 차임 (G5 784Hz -> C6 1046Hz -> E6 1318Hz)
                const notes = [
                    { freq: 783.99, delay: 0.015, dur: 0.16, gain: 0.35, type: 'triangle' },
                    { freq: 1046.50, delay: 0.065, dur: 0.22, gain: 0.40, type: 'triangle' },
                    { freq: 1318.51, delay: 0.115, dur: 0.28, gain: 0.36, type: 'sine' }
                ];

                notes.forEach(n => {
                    const t = now + n.delay;
                    const osc = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    osc.type = n.type;
                    osc.frequency.setValueAtTime(n.freq, t);
                    g.gain.setValueAtTime(n.gain, t);
                    g.gain.exponentialRampToValueAtTime(0.001, t + n.dur);
                    osc.connect(g);
                    g.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + n.dur);
                });
            } catch (e) {
                console.warn(e);
            }
        };

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().then(playNotes).catch(() => {});
        } else {
            playNotes();
        }
    }

    // 0-1. 상위 탭 전환 효과음 (부드럽고 찰진 UI 슬라이드 탭 사운드)
    playTab() {
        this.init();
        if (this.isMuted) return;

        const doPlay = () => {
            if (!this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                // 부드러운 탭 블립 (540Hz -> 820Hz)
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(540, now);
                osc.frequency.exponentialRampToValueAtTime(820, now + 0.07);

                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);

                // 고음 미세 탭 찰칵 사운드
                const tick = this.ctx.createOscillator();
                const tickGain = this.ctx.createGain();
                tick.type = 'triangle';
                tick.frequency.setValueAtTime(1300, now);
                tickGain.gain.setValueAtTime(0.12, now);
                tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
                tick.connect(tickGain);
                tickGain.connect(this.ctx.destination);
                tick.start(now);
                tick.stop(now + 0.025);
            } catch (e) {
                console.warn(e);
            }
        };

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().then(doPlay).catch(() => {});
        } else {
            doPlay();
        }
    }

    // 0-2. 진짜 게임 시작을 알리는 웅장하고 전율 넘치는 게임 시작 효과음 (엔진 점화 + 로켓 부스터 + 영웅 팡파르)
    playGameStart() {
        this.init();
        if (this.isMuted) return;

        const doPlay = () => {
            if (!this.ctx) return;
            try {
                const now = this.ctx.currentTime;

                // 1. 묵직한 베이스 킥 & 엔진 점화 (둥-!)
                const subOsc = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(160, now);
                subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.45);
                subGain.gain.setValueAtTime(0.55, now);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                subOsc.connect(subGain);
                subGain.connect(this.ctx.destination);
                subOsc.start(now);
                subOsc.stop(now + 0.45);

                // 2. 화려한 로켓 부스터 분사 (쉬이이이익-!)
                this.playNoise(0.45, 0.28, 2200);

                // 3. 고음 가속 스윕 빔 (쓔우우웅-!)
                const sweepOsc = this.ctx.createOscillator();
                const sweepGain = this.ctx.createGain();
                sweepOsc.type = 'sawtooth';
                sweepOsc.frequency.setValueAtTime(260, now + 0.05);
                sweepOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
                sweepGain.gain.setValueAtTime(0.22, now + 0.05);
                sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
                sweepOsc.connect(sweepGain);
                sweepGain.connect(this.ctx.destination);
                sweepOsc.start(now + 0.05);
                sweepOsc.stop(now + 0.38);

                // 4. 출격 팡파르 영웅 화음 (빠-바-밤-! G4 -> C5 -> E5 -> G5)
                const fanfare = [
                    { freq: 392.00, delay: 0.12, dur: 0.15, gain: 0.34, type: 'triangle' }, // G4
                    { freq: 523.25, delay: 0.22, dur: 0.18, gain: 0.40, type: 'triangle' }, // C5
                    { freq: 659.25, delay: 0.32, dur: 0.22, gain: 0.44, type: 'triangle' }, // E5
                    { freq: 783.99, delay: 0.44, dur: 0.50, gain: 0.48, type: 'sine' },     // G5 (길게 울림)
                    { freq: 1046.50, delay: 0.44, dur: 0.50, gain: 0.26, type: 'triangle' } // C6 (화음)
                ];

                fanfare.forEach(note => {
                    const t = now + note.delay;
                    const osc = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    osc.type = note.type;
                    osc.frequency.setValueAtTime(note.freq, t);
                    g.gain.setValueAtTime(note.gain, t);
                    g.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
                    osc.connect(g);
                    g.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + note.dur);
                });
            } catch (e) {
                console.warn(e);
            }
        };

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().then(doPlay).catch(() => {});
        } else {
            doPlay();
        }
    }

    // 9. 업그레이드 / 집 진화 팡파르
    upgrade() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'triangle', 0.18, 0.2, false);
            }, idx * 70);
        });
    }

    // 10. 보스 경고 경보음 (위잉- 위잉-)
    bossAlert() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        [0, 250, 500].forEach(delay => {
            setTimeout(() => {
                this.playTone(440, 'sawtooth', 0.2, 0.25, false);
            }, delay);
        });
    }

    // 11. 승리 팡파르
    victory() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        const melody = [523, 523, 523, 659, 784, 1046];
        melody.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'triangle', 0.22, 0.25, false);
            }, idx * 120);
        });
    }

    // 12. 게임오버 슬픈 톤
    gameover() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        const melody = [440, 415, 392, 349];
        melody.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sawtooth', 0.35, 0.2, true);
            }, idx * 180);
        });
    }

    // 13. 보스 일반 공격 회피 사운드 (쉭- 바람 가르는 소리)
    dodge() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        this.playTone(600, 'sine', 0.08, 0.15, true);
        this.playNoise(0.08, 0.1, 1500);
    }

    // 14. 보스 스킬 무시 사운드 (챙- 금속 튕겨내는 방어음)
    skillIgnore() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        this.playTone(880, 'triangle', 0.15, 0.2, false);
        setTimeout(() => this.playTone(1200, 'square', 0.08, 0.12, true), 30);
    }

    // 15. 메뉴 영구 골드 보너스 투자 사운드 (차랑- 영롱한 크리스탈음)
    metaInvest() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sine', 0.2, 0.14, false), i * 50);
        });
    }

    // -------------------------------------------------------------
    // 배경음악 (BGM): music.js의 악보와 audio.js의 합성기를 분리한다.
    // -------------------------------------------------------------
    startBGM(mode = 'stage', stageNumber = this.bgmStage || 1) {
        const nextMode = mode === 'normal' ? 'stage' : mode === 'boss' ? 'finalboss' : mode;
        const nextStage = Math.max(1, Number(stageNumber) || 1);
        if (this.bgmPlaying && this.bgmMode === nextMode && this.bgmStage === nextStage) return;

        this.stopBGM();
        this.bgmMode = nextMode;
        this.bgmStage = nextStage;
        if (this.isMuted || !this.isBgmEnabled) return;

        this.init();
        this.bgmPlaying = true;
        this.bgmStep = 0;
        if (window.GameMusicCatalog) this.playCatalogTheme();
        else if (nextMode === 'finalboss' || nextMode === 'midboss') this.playBossTheme();
        else this.playNurseryTheme();
    }

    startStageBGM(stageNumber = 1) { this.startBGM('stage', stageNumber); }
    startMidBossBGM() { this.startBGM('midboss', this.bgmStage); }
    startFinalBossBGM() { this.startBGM('finalboss', this.bgmStage); }

    // 기존 호출부와 저장 데이터의 하위 호환성
    startBossBGM() { this.startFinalBossBGM(); }
    startNormalBGM() { this.startStageBGM(this.bgmStage || 1); }

    getCurrentBGMName() {
        const catalog = window.GameMusicCatalog;
        const theme = catalog && catalog.getTheme(this.bgmMode, this.bgmStage);
        return theme ? theme.name : '배경음악';
    }

    playLowBrass(freq, duration = 0.24, gainVal = 0.16) {
        if (this.isMuted || !this.ctx || !freq) return;
        try {
            const now = this.ctx.currentTime;
            const master = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(760, now);
            filter.frequency.exponentialRampToValueAtTime(260, now + duration);
            master.gain.setValueAtTime(gainVal, now);
            master.gain.exponentialRampToValueAtTime(0.001, now + duration);
            filter.connect(master);
            master.connect(this.bgmGain || this.ctx.destination);
            ['sawtooth', 'square'].forEach((type, index) => {
                const osc = this.ctx.createOscillator();
                osc.type = type;
                osc.frequency.setValueAtTime(freq * (index ? 0.5 : 1), now);
                osc.detune.setValueAtTime(index ? -7 : 5, now);
                osc.connect(filter);
                osc.start(now);
                osc.stop(now + duration);
            });
        } catch (e) { console.warn(e); }
    }

    playWarDrum(gainVal = 0.22) {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(118, now);
            osc.frequency.exponentialRampToValueAtTime(42, now + 0.24);
            gain.gain.setValueAtTime(gainVal, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
            osc.connect(gain);
            gain.connect(this.bgmGain || this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.28);
        } catch (e) { console.warn(e); }
    }

    playCatalogTheme() {
        const catalog = window.GameMusicCatalog;
        const theme = catalog && catalog.getTheme(this.bgmMode, this.bgmStage);
        if (!theme) return;
        const activeMode = this.bgmMode;
        const activeStage = this.bgmStage;
        const toFreq = catalog.midiToFrequency;
        const tick = () => {
            if (!this.bgmPlaying || this.isMuted || !this.isBgmEnabled ||
                this.bgmMode !== activeMode || this.bgmStage !== activeStage) return;
            const step = this.bgmStep % theme.melody.length;
            const melodyFreq = toFreq(theme.melody[step]);
            const chord = theme.chords[Math.floor(step / 4) % theme.chords.length];
            const bassFreq = toFreq(theme.bass[Math.floor(step / 2) % theme.bass.length]);

            if (melodyFreq) {
                if (theme.lead === 'brass') this.playLowBrass(melodyFreq, theme.stepMs / 760, 0.15);
                else if (theme.lead === 'bell') this.playToyPiano([melodyFreq], 0.30, 0.09);
                else this.playMarimba(melodyFreq, 0.20, 0.20);
            }
            if (step % 4 === 0 && chord) {
                if (theme.heavy) chord.slice(0, 2).forEach(note => this.playLowBrass(toFreq(note), 0.36, 0.10));
                else this.playToyPiano(chord.map(toFreq), 0.34, 0.08);
            }
            if (step % 2 === 0 && bassFreq) {
                this.playAcousticBass(bassFreq, theme.heavy ? 0.30 : 0.24, theme.heavy ? 0.29 : 0.19);
            }
            if (theme.heavy) {
                if (step % 4 === 0 || (activeMode === 'finalboss' && step % 4 === 2)) {
                    this.playWarDrum(activeMode === 'finalboss' ? 0.28 : 0.23);
                }
                if (step % 2 === 1) this.playToyPercussion('shaker', 0.055);
            } else {
                this.playToyPercussion(step % 2 ? 'woodblock' : 'shaker', step % 2 ? 0.075 : 0.045);
                if (step % 8 === 7) this.playToyPercussion('triangle', 0.065);
            }
            this.bgmStep++;
            this.bgmTimer = setTimeout(tick, theme.stepMs);
        };
        tick();
    }

    // 하위 호환성 유지용 별칭
    playDdongkkoTheme() {
        this.playNurseryTheme();
    }

    // 1. 동요 메들리 루프 ("아기돼지 삼형제" 3절 + "토실토실 아기돼지")
    playNurseryTheme() {
        const C3 = 130.81, D3 = 146.83, E3 = 164.81, F3 = 174.61, G3 = 196.00, A3 = 220.00, B3 = 246.94;
        const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
        const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00;

        const CH_C  = [C4, E4, G4];
        const CH_F  = [C4, F4, A4];
        const CH_G7 = [B3, D4, F4, G4];
        const CH_AM = [C4, E4, A4];

        // 36마디 144스텝 정밀 멜로디 (동요 2곡 풀 연주)
        const melody = [
            // --- Part 1: 아기돼지 삼형제 (1절: 첫 번째 짚집) ---
            C4, E4, G4, C5,    A4, A4, G4, 0,     // 첫 번째 아기돼지
            C4, D4, E4, F4,    E4, D4, C4, 0,     // 짚으로 집을 짓는데
            C4, E4, G4, C5,    A4, G4, G5, 0,     // 늑대가 나타나 후-!
            F4, E4, D4, D4,    E4, D4, C4, 0,     // 빨간 짚집 날아갔네

            // --- Part 2: 아기돼지 삼형제 (2절: 두 번째 나무집) ---
            C4, E4, G4, C5,    A4, A4, G4, 0,     // 두 번째 아기돼지
            C4, D4, E4, F4,    E4, D4, C4, 0,     // 나무로 집을 짓는데
            C4, E4, G4, C5,    A4, G4, G5, 0,     // 늑대가 나타나 후-!
            F4, E4, D4, D4,    E4, D4, C4, 0,     // 나무 집도 날아갔네

            // --- Part 3: 아기돼지 삼형제 (3절: 세 번째 벽돌집) ---
            C4, E4, G4, C5,    A4, A4, G4, 0,     // 세 번째 아기돼지
            C4, D4, E4, F4,    E4, D4, C4, 0,     // 벽돌로 집을 짓는데
            C4, E4, G4, C5,    G5, 0,  G5, 0,     // 늑대가 나타나 후- 후-!
            F4, E4, D4, D4,    C4, 0,  C5, 0,     // 끄떡없었네 만세-!

            // --- Part 4: 토실토실 아기돼지 (본곡) ---
            G4, E4, G4, E4,    G4, A4, G4, 0,     // 토실토실 아기돼지
            E4, G4, E4, C4,    D4, D4, C4, 0,     // 밥 달라고 꿀꿀꿀
            G4, E4, G4, E4,    G4, A4, G4, 0,     // 엄마돼지 오냐오냐
            E4, G4, E4, C4,    D4, D4, C4, 0,     // 알았다고 꿀꿀꿀

            // --- Part 5: 토실토실 아기돼지 (후렴 댄스타임) ---
            C5, G4, C5, G4,    A4, C5, A4, G4,    // 꿀꿀꿀꿀 기분좋아
            G4, E4, G4, E4,    D4, D4, C4, 0      // 아기돼지 춤을 춘다
        ];

        // 마디별(4스텝) 토이 피아노 화음 반주
        const chords = [
            CH_C,  CH_AM, CH_F,  CH_C,
            CH_C,  CH_G7, CH_G7, CH_C,
            CH_C,  CH_AM, CH_F,  CH_C,
            CH_C,  CH_G7, CH_G7, CH_C,
            CH_C,  CH_AM, CH_F,  CH_C,
            CH_C,  CH_G7, CH_F,  CH_C,
            CH_C,  CH_AM, CH_F,  CH_G7,
            CH_C,  CH_AM, CH_F,  CH_C,
            CH_C,  CH_F,  CH_C,  CH_G7
        ];

        // 2스텝 단위 바운스 어쿠스틱 워킹 베이스
        const bass = [
            C3, G3,  A3, E3,  F3, C3,  C3, G3,
            C3, E3,  G3, D3,  G3, B3,  C3, G3,
            C3, G3,  A3, E3,  F3, C3,  C3, G3,
            C3, E3,  G3, D3,  G3, B3,  C3, G3,
            C3, G3,  A3, E3,  F3, C3,  C3, G3,
            C3, E3,  G3, G3,  F3, G3,  C3, C3,
            C3, G3,  A3, E3,  F3, C3,  G3, D3,
            C3, G3,  A3, E3,  F3, C3,  C3, G3,
            C3, E3,  F3, C3,  C3, G3,  G3, C3
        ];

        const tick = () => {
            if (!this.bgmPlaying || this.isMuted || this.bgmMode !== 'stage') return;
            const step = this.bgmStep % melody.length;
            const mFreq = melody[step];
            const barIndex = Math.floor(step / 4) % chords.length;

            // 1. 마림바 / 실로폰 주 멜로디 (따뜻한 목재 타격음)
            if (mFreq > 0) {
                this.playMarimba(mFreq, 0.20, 0.22);
            }

            // 2. 토이 피아노 화음 (마디 첫 박자마다 영롱한 벨 차임 반주)
            if (step % 4 === 0) {
                const chordNotes = chords[barIndex];
                if (chordNotes) {
                    this.playToyPiano(chordNotes, 0.38, 0.11);
                }
            }

            // 3. 어쿠스틱 퐁퐁 워킹 베이스 (2박자마다 둥- 둥-)
            if (step % 2 === 0) {
                const bassIndex = Math.floor(step / 2) % bass.length;
                const bFreq = bass[bassIndex];
                if (bFreq > 0) {
                    this.playAcousticBass(bFreq, 0.24, 0.23);
                }
            }

            // 4. 어린이 만화 퍼커션 (우드블록 딱!, 소프트 쉐이커 츱, 트라이앵글 챙~)
            if (step % 2 === 1) {
                this.playToyPercussion('woodblock', 0.11);
            } else if (step % 4 === 0) {
                this.playToyPercussion('shaker', 0.08);
            }
            if (step % 8 === 7) {
                this.playToyPercussion('triangle', 0.09);
            }

            this.bgmStep++;
            this.bgmTimer = setTimeout(tick, 155);
        };
        tick();
    }

    // 2. 익살스럽고 긴박한 코믹 늑대 보스 테마 (C 단조 질주 마림바 & 쿵쾅 팀파니)
    playBossTheme() {
        const C2 = 65.41, Eb2 = 77.78, F2 = 87.31, G2 = 98.00, Ab2 = 103.83, B2 = 123.47;
        const C3 = 130.81, Eb3 = 155.56, F3 = 174.61, G3 = 196.00, Ab3 = 207.65, B3 = 246.94;
        const C4 = 261.63, D4 = 293.66, Eb4 = 311.13, F4 = 349.23, G4 = 392.00, Ab4 = 415.30, Bb4 = 466.16, B4 = 493.88;
        const C5 = 523.25, D5 = 587.33, Eb5 = 622.25, G5 = 783.99;

        const CH_CM = [C4, Eb4, G4];
        const CH_FM = [C4, F4, Ab4];
        const CH_G7M = [B3, D4, F4, G4];
        const CH_AB = [C4, Eb4, Ab4];

        // 32스텝 익살스러운 늑대 보스 행진곡 (코믹하면서도 박진감 넘치는 단조 멜로디)
        const bossMelody = [
            // Bar 1: 살금살금 늑대 등장
            C4, Eb4, G4, Eb4,
            // Bar 2: 발톱 세우며 으르렁
            C4, Eb4, G4, C5,
            // Bar 3: 우당탕탕 돌격 준비
            Bb4, Ab4, G4, F4,
            // Bar 4: 코믹한 헛발질
            Eb4, D4, C4, B3,
            // Bar 5: 보스 맹돌진!
            C4, Eb4, G4, C5,
            // Bar 6: 무시무시한 이빨 공격
            D5, Eb5, D5, C5,
            // Bar 7: 엉덩방아 꽈당!
            G4, Ab4, G4, F4,
            // Bar 8: 다시 기어오기
            Eb4, D4, C4, G3
        ];

        const bossChords = [
            CH_CM, CH_CM, CH_FM, CH_G7M,
            CH_CM, CH_AB, CH_FM, CH_CM
        ];

        const bossBass = [
            C2, G2,  C2, Eb2, F2, C2,  G2, B2,
            C2, G2,  Ab2, Eb2, F2, G2, G2, C2
        ];

        const tick = () => {
            if (!this.bgmPlaying || this.isMuted ||
                (this.bgmMode !== 'midboss' && this.bgmMode !== 'finalboss')) return;
            const step = this.bgmStep % bossMelody.length;
            const mFreq = bossMelody[step];
            const barIndex = Math.floor(step / 4) % bossChords.length;

            // 1. 질주하는 마림바 스타카토
            if (mFreq > 0) {
                this.playMarimba(mFreq, 0.13, 0.24);
            }

            // 2. 단조 보스 화음 악센트
            if (step % 4 === 0) {
                const chordNotes = bossChords[barIndex];
                if (chordNotes) {
                    this.playToyPiano(chordNotes, 0.26, 0.15);
                }
            }

            // 3. 쿵쾅거리는 팀파니 / 튜바 베이스
            if (step % 2 === 0) {
                const bassIndex = Math.floor(step / 2) % bossBass.length;
                const bFreq = bossBass[bassIndex];
                if (bFreq > 0) {
                    this.playAcousticBass(bFreq, 0.22, 0.30);
                }
            }

            // 4. 익살스러운 보스 퍼커션
            if (step % 2 === 1) {
                this.playToyPercussion('woodblock', 0.14);
            } else {
                this.playToyPercussion('shaker', 0.09);
            }
            if (step % 8 === 0) {
                this.playToyPercussion('triangle', 0.11);
            }

            this.bgmStep++;
            this.bgmTimer = setTimeout(tick, 125);
        };
        tick();
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    pauseBGM() {
        this.stopBGM();
    }

    resumeBGM() {
        if (!this.isMuted && this.isBgmEnabled) {
            this.startBGM(this.bgmMode || 'stage', this.bgmStage || 1);
        }
    }

    // 궁극기: 초공간 대폭풍포 (무지연 고성능 신디사이저 사운드)
    ultimateBlast() {
        this.tornadoHowl();
    }

    // 궁극기: 천지개벽 대회오리 폭풍 (웅장한 허리케인 돌풍 & 풍압 충격음 사운드 합성)
    tornadoHowl() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            // 1. 휘몰아치는 회오리바람 노이즈 스윕 (Wind Howl Noise Sweep)
            const bufferSize = Math.floor(this.ctx.sampleRate * 1.8);
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;

            // 공명 대역통과 필터 (소용돌이치며 솟구쳐 오르는 풍압음)
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.setValueAtTime(3.5, now);
            filter.frequency.setValueAtTime(180, now);
            filter.frequency.exponentialRampToValueAtTime(1400, now + 0.45);
            filter.frequency.exponentialRampToValueAtTime(350, now + 1.6);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.01, now);
            noiseGain.gain.linearRampToValueAtTime(0.42, now + 0.25);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

            whiteNoise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(dest);

            whiteNoise.start(now);
            whiteNoise.stop(now + 1.8);

            // 2. 깊은 지축을 흔드는 서브 베이스 럼블 (지진 & 풍압)
            const rumbleOsc = this.ctx.createOscillator();
            const rumbleGain = this.ctx.createGain();
            rumbleOsc.type = 'sawtooth';
            rumbleOsc.frequency.setValueAtTime(95, now);
            rumbleOsc.frequency.exponentialRampToValueAtTime(32, now + 1.4);

            rumbleGain.gain.setValueAtTime(0.38, now);
            rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

            rumbleOsc.connect(rumbleGain);
            rumbleGain.connect(dest);
            rumbleOsc.start(now);
            rumbleOsc.stop(now + 1.4);

            // 3. 고속 회전 소용돌이 공명음 (Tornado Siren Whistle)
            const whistleOsc = this.ctx.createOscillator();
            const whistleGain = this.ctx.createGain();
            whistleOsc.type = 'sine';
            whistleOsc.frequency.setValueAtTime(300, now);
            whistleOsc.frequency.linearRampToValueAtTime(680, now + 0.35);
            whistleOsc.frequency.linearRampToValueAtTime(260, now + 1.2);

            whistleGain.gain.setValueAtTime(0.01, now);
            whistleGain.gain.linearRampToValueAtTime(0.22, now + 0.3);
            whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

            whistleOsc.connect(whistleGain);
            whistleGain.connect(dest);
            whistleOsc.start(now);
            whistleOsc.stop(now + 1.3);

        } catch (e) {
            console.warn(e);
        }
    }

    // 🏗️ 신규 건축 사운드 1: 기존 건물 와르르 철거 붕괴음
    buildingCrumble() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            // 1. 저주파 붕괴 럼블 (와르르 쿵)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(28, now + 0.65);

            gain.gain.setValueAtTime(0.32, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.65);

            // 2. 파편 와르르 노이즈 버스트
            const bufferSize = this.ctx.sampleRate * 0.55;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(900, now);
            filter.frequency.exponentialRampToValueAtTime(180, now + 0.55);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.28, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(dest);
            noise.start(now);
        } catch (e) {
            console.warn(e);
        }
    }

    // 🏗️ 신규 건축 사운드 2: 뚝딱뚝딱 경쾌한 신축 망치질음
    constructionHammer() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            // 금속/원목 타격음 피치 모듈레이션
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            const baseFreq = 720 + Math.random() * 180;
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.12);

            // 타격 스파크 고주파 클릭음
            const clickOsc = this.ctx.createOscillator();
            const clickGain = this.ctx.createGain();
            clickOsc.type = 'sine';
            clickOsc.frequency.setValueAtTime(1600, now);
            clickGain.gain.setValueAtTime(0.25, now);
            clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            clickOsc.connect(clickGain);
            clickGain.connect(dest);
            clickOsc.start(now);
            clickOsc.stop(now + 0.04);
        } catch (e) {
            console.warn(e);
        }
    }

    // 🏗️ 신규 건축 사운드 3: 신축 완공 축하 경쾌한 팡파레
    buildingCompleteFanfare() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;
            const notes = [
                { f: 523.25, t: 0.00, d: 0.14 }, // C5
                { f: 659.25, t: 0.12, d: 0.14 }, // E5
                { f: 783.99, t: 0.24, d: 0.16 }, // G5
                { f: 1046.50, t: 0.38, d: 0.45 } // C6 (하이라이트)
            ];

            notes.forEach(n => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(n.f, now + n.t);

                gain.gain.setValueAtTime(0.001, now + n.t);
                gain.gain.linearRampToValueAtTime(0.26, now + n.t + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

                osc.connect(gain);
                gain.connect(dest);
                osc.start(now + n.t);
                osc.stop(now + n.t + n.d);
            });
        } catch (e) {
            console.warn(e);
        }
    }

    // ⚡ 천벌의 벼락 사운드 (고주파 전기 스파크 + 지축을 흔드는 굉음)
    thunderStrike() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            // 1. 날카로운 고전압 전기 방전 스파크 (0~0.08s)
            const zapOsc = this.ctx.createOscillator();
            const zapGain = this.ctx.createGain();
            zapOsc.type = 'sawtooth';
            zapOsc.frequency.setValueAtTime(2400, now);
            zapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
            zapGain.gain.setValueAtTime(0.35, now);
            zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            zapOsc.connect(zapGain);
            zapGain.connect(dest);
            zapOsc.start(now);
            zapOsc.stop(now + 0.08);

            // 2. 우르릉 쾅! 중저음 번개 굉음 노이즈 (0.02~0.6s)
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.55);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(80, now + 0.55);
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.40, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(dest);
            noise.start(now + 0.02);
        } catch (e) {
            console.warn(e);
        }
    }

    // 💥 대지진 충격파 사운드 (서브우퍼 초저주파 럼블 + 대지 파쇄음)
    earthquakeRumble() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            // 서브우퍼 저주파 진동 (55Hz -> 25Hz)
            const subOsc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            subOsc.type = 'triangle';
            subOsc.frequency.setValueAtTime(65, now);
            subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.7);
            subGain.gain.setValueAtTime(0.45, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
            subOsc.connect(subGain);
            subGain.connect(dest);
            subOsc.start(now);
            subOsc.stop(now + 0.7);

            // 대지 파쇄 노이즈
            this.playNoise(0.5, 0.3, 350);
        } catch (e) {
            console.warn(e);
        }
    }

    // 💣 클러스터 유탄 연쇄 폭발 사운드 (다다닥 터지는 팝핑 폭발음)
    clusterBurst() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            for (let i = 0; i < 4; i++) {
                const delay = i * 0.06;
                setTimeout(() => {
                    if (this.ctx && !this.isMuted) {
                        this.playNoise(0.12, 0.25, 900 - i * 100);
                        this.playTone(320 - i * 40, 'triangle', 0.1, 0.2, true);
                    }
                }, delay * 1000);
            }
        } catch (e) {
            console.warn(e);
        }
    }

    // ♨️ 요새 고압 증기 펄스 사운드 (쉬이이익 고압 분출음 + 금속 타격음)
    steamBurst() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            // 고압 스팀 노이즈
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1800, now);
            filter.Q.setValueAtTime(1.5, now);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            noise.start(now);

            // 밸브 타격음
            this.playTone(450, 'sawtooth', 0.08, 0.25, true);
        } catch (e) {
            console.warn(e);
        }
    }

    // 🌋 용암 대공포 발사 사운드 (쉬이익 치솟는 로켓 추진 + 쿵)
    lavaCannon() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(750, now + 0.25);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.28);

            this.playNoise(0.2, 0.25, 600);
        } catch (e) {
            console.warn(e);
        }
    }

    // 🛡️ 양철 방패 도탄 쨍그랑 사운드 (Metallic Clang & Ping)
    shieldClang() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            // 1. 고음 메탈릭 핑 (도탄 잔향)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.14);

            // 2. 냄비 뚜껑 챙! 어택음
            const clank = this.ctx.createOscillator();
            const clankGain = this.ctx.createGain();
            clank.type = 'triangle';
            clank.frequency.setValueAtTime(650, now);
            clank.frequency.exponentialRampToValueAtTime(220, now + 0.08);
            clankGain.gain.setValueAtTime(0.35, now);
            clankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            clank.connect(clankGain);
            clankGain.connect(dest);
            clank.start(now);
            clank.stop(now + 0.09);
        } catch (e) {
            console.warn(e);
        }
    }

    // 💥 방패 산산조각 파쇄 굉음 (Heavy Metal Shatter)
    shieldBreak() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            // 1. 금속 파괴 크랙
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.35);

            // 2. 쇳조각 튀는 파편 노이즈
            this.playNoise(0.28, 0.4, 1200);
        } catch (e) {
            console.warn(e);
        }
    }

    // ☂️ 우산 뒤집힘 및 천 찢김 사운드 (Umbrella Snap & Whoosh)
    umbrellaPop() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.22);

            this.playNoise(0.18, 0.2, 500);
        } catch (e) {
            console.warn(e);
        }
    }

    // 🪂 공수 낙하 만화풍 휘슬 사운드 (Airdrop Falling Whistle)
    airdropWhistle() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1050, now);
            osc.frequency.exponentialRampToValueAtTime(360, now + 0.45);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.45);
        } catch (e) {
            console.warn(e);
        }
    }

    // 🐶 미니 새끼 늑대 앙증맞은 점프 낑낑 소리
    miniPuppyYip() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const dest = this.ctx.destination;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(620, now);
            osc.frequency.exponentialRampToValueAtTime(840, now + 0.08);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + 0.1);
        } catch (e) {
            console.warn(e);
        }
    }
}

// 안전 Proxy: 혹시 모를 미정의 사운드 메서드 호출 시에도 게임이 절대 멈추지 않도록 보호
const rawSoundEngine = new SoundEngine();
window.soundEngine = new Proxy(rawSoundEngine, {
    get(target, prop) {
        if (prop in target) {
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
        }
        return (...args) => {
            console.warn(`[SoundEngine] Unimplemented sound method: ${String(prop)}`);
        };
    }
});
