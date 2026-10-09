/**
 * 게임 음악 카탈로그
 * 악보 데이터만 담당하며 실제 Web Audio 합성/재생은 audio.js가 맡는다.
 */
(function exposeGameMusicCatalog(root) {
    const stageThemes = {
        1: { name: '햇살 초원의 아침', stepMs: 178, lead: 'marimba', melody: [72,76,79,76,74,77,81,79,76,74,72,67,69,71,72,0], bass: [48,55,53,55,48,52,53,55], chords: [[60,64,67],[65,69,72],[57,60,64],[55,59,62]] },
        2: { name: '풍차 골짜기의 바람', stepMs: 168, lead: 'marimba', melody: [67,71,74,79,78,74,71,69,67,69,71,74,72,71,69,0], bass: [43,50,47,50,45,52,50,47], chords: [[55,59,62],[59,62,66],[60,64,67],[57,61,64]] },
        3: { name: '무지개 언덕의 행진', stepMs: 158, lead: 'bell', melody: [74,78,81,86,81,78,76,74,76,79,83,88,83,79,78,0], bass: [50,57,54,57,55,62,57,54], chords: [[62,66,69],[59,62,66],[55,59,62],[57,61,64]] },
        4: { name: '황금 해바라기 축제', stepMs: 150, lead: 'marimba', melody: [69,73,76,81,80,76,73,71,69,76,78,81,83,81,76,0], bass: [45,52,49,52,50,57,52,56], chords: [[57,61,64],[61,64,68],[62,66,69],[64,68,71]] },
        5: { name: '버섯 숲의 그림자', stepMs: 166, lead: 'bell', melody: [74,77,81,80,74,72,69,72,75,74,68,69,72,71,65,0], bass: [38,45,41,45,38,44,41,36], chords: [[50,53,57],[53,56,60],[48,52,55],[45,48,52]] },
        6: { name: '솜사탕 요정의 춤', stepMs: 184, lead: 'bell', melody: [77,81,84,81,79,84,86,84,81,77,79,81,76,79,77,0], bass: [53,60,57,60,55,60,52,55], chords: [[65,69,72],[69,72,76],[67,71,74],[64,67,72]] },
        7: { name: '수정 호수의 별빛', stepMs: 196, lead: 'bell', melody: [76,83,88,83,78,83,86,81,76,79,83,79,74,78,76,0], bass: [40,47,43,47,38,45,35,42], chords: [[52,55,59],[55,59,62],[50,54,57],[47,50,54]] },
        8: { name: '에메랄드 왕궁 행진곡', stepMs: 146, lead: 'marimba', melody: [72,76,79,84,83,79,76,72,74,77,81,86,84,83,79,0], bass: [48,55,52,55,53,60,55,59], chords: [[60,64,67],[64,67,71],[65,69,72],[67,71,74]] },
        9: { name: '황혼 요새의 경계', stepMs: 136, lead: 'marimba', melody: [69,72,76,75,69,68,64,68,71,74,77,76,71,68,64,0], bass: [45,52,48,52,43,50,44,40], chords: [[57,60,64],[60,63,67],[55,59,62],[52,56,59]] },
        10: { name: '최종 결전 전야제', stepMs: 122, lead: 'marimba', melody: [64,67,71,76,75,71,67,66,64,68,71,77,76,71,68,0], bass: [40,47,43,47,38,45,44,35], chords: [[52,55,59],[55,59,62],[50,54,57],[47,51,54]] }
    };

    const bossThemes = {
        midboss: {
            name: '중간보스: 강철 발톱의 진군', stepMs: 126, lead: 'brass', heavy: true,
            melody: [48,51,55,54,48,51,58,55,53,51,48,47,48,55,51,0],
            bass: [36,36,39,34,36,31,34,35], chords: [[48,51,55],[46,50,53],[44,48,51],[47,50,53]]
        },
        finalboss: {
            name: '최종보스: 종말의 늑대왕', stepMs: 94, lead: 'brass', heavy: true,
            melody: [50,53,56,62,61,56,53,49,50,57,56,53,51,49,44,0,50,53,58,61,62,56,53,50,51,56,59,65,62,59,56,49],
            bass: [38,38,33,37,38,32,34,37,38,26,32,37,35,31,32,25], chords: [[50,53,56],[49,53,56],[46,50,53],[44,49,53]]
        }
    };

    const normalizeStage = (stageNumber) => {
        const numericStage = Number.isFinite(Number(stageNumber)) ? Math.floor(Number(stageNumber)) : 1;
        return ((Math.max(1, numericStage) - 1) % 10) + 1;
    };
    const catalog = {
        stageThemes,
        bossThemes,
        getTheme(mode = 'stage', stageNumber = 1) {
            if (mode === 'midboss' || mode === 'finalboss') return bossThemes[mode];
            return stageThemes[normalizeStage(stageNumber)];
        },
        midiToFrequency(note) { return note > 0 ? 440 * Math.pow(2, (note - 69) / 12) : 0; },
        normalizeStage
    };
    root.GameMusicCatalog = catalog;
    if (typeof module !== 'undefined' && module.exports) module.exports = catalog;
})(typeof window !== 'undefined' ? window : globalThis);
