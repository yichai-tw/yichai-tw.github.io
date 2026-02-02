/**
 * 寵物健康計算器 (Pet Health Calculator)
 * 用途：計算年齡換算、體況評估、營養需求等
 * 版本：1.0.0
 * 最後更新：2026-01-30
 */

class PetHealthCalculator {
    constructor() {
        this.guidelines = null;
        this._loadPromise = null;
        this.loadGuidelines();
    }

    /**
     * 載入健康指引資料庫（重複呼叫會回傳同一 Promise，避免 race condition）
     */
    async loadGuidelines() {
        if (this._loadPromise) return this._loadPromise;
        this._loadPromise = (async () => {
        try {
            // 根據當前網頁路徑自動判斷資料夾位置
            const isGitHubPages = window.location.hostname.includes('github.io');
            const basePath = isGitHubPages ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) : '';
            const jsonUrl = `${window.location.origin}${basePath}data/health-guidelines.json`;
            
            console.log('正在從以下網址載入指引資料：', jsonUrl);
            const response = await fetch(jsonUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.guidelines = await response.json();
            console.log('✅ 健康指引資料載入成功');
        } catch (error) {
            console.error('❌ 載入健康指引失敗，嘗試使用備用路徑:', error);
            // 備用路徑嘗試
            try {
                const altResponse = await fetch('data/health-guidelines.json');
                this.guidelines = await altResponse.json();
                console.log('✅ 使用備用路徑載入成功');
            } catch (altError) {
                console.warn('❌ 備用路徑也失敗，嘗試載入 per-species JSON:', altError);
                // 嘗試載入 per-species guidelines（guidelines_{species}.json）
                try {
                    const speciesKeys = ['cat', 'dog', 'rabbit', 'hamster'];
                    const assembled = {};
                    for (const key of speciesKeys) {
                        try {
                            const resp = await fetch(`data/guidelines_${key}.json`);
                            if (!resp.ok) {
                                continue;
                            }
                            const json = await resp.json();
                            assembled[key] = json;
                        } catch (e) {
                            // 忽略單一物種失敗，繼續其它物種
                            console.warn(`載入 data/guidelines_${key}.json 失敗:`, e);
                        }
                    }

                    // 若有載入任何物種，設定為 guidelines
                    if (Object.keys(assembled).length > 0) {
                        // 試著載入 breeds_* JSON（若存在）並合併到對應 species
                        for (const key of Object.keys(assembled)) {
                            try {
                                const bresp = await fetch(`data/breeds_${key}.json`);
                                if (bresp.ok) {
                                    const breeds = await bresp.json();
                                    // 若後端是 list，嘗試保留為屬性；若已是 dict，直接替換
                                    if (Array.isArray(breeds)) {
                                        // 無法自動轉成具有 key 的 dict，暫放於 assembled[key].breeds_list
                                        assembled[key].breeds_list = breeds;
                                    } else {
                                        assembled[key].breeds = breeds;
                                    }
                                }
                            } catch (_) {
                                // 忽略
                            }
                        }

                        // 合併各物種可能包含的 common 欄位（如 activityLevelOptions、sexMerModifier 等）
                        const mergedCommon = {};
                        for (const sk of Object.keys(assembled)) {
                            try {
                                const part = assembled[sk];
                                if (part && typeof part === 'object' && part.common && typeof part.common === 'object') {
                                    Object.assign(mergedCommon, part.common);
                                }
                            } catch (e) {
                                // 忽略單一物種的 common 合併錯誤
                            }
                        }

                        // 若沒有任何 common，建立最小預設以避免後端計算出錯
                        if (!mergedCommon || Object.keys(mergedCommon).length === 0) {
                            mergedCommon.sexMerModifier = mergedCommon.sexMerModifier || {};
                            mergedCommon.activityLevelOptions = mergedCommon.activityLevelOptions || {};
                        } else {
                            mergedCommon.sexMerModifier = mergedCommon.sexMerModifier || {};
                        }

                        // 指定組裝結果與合併後的 common
                        this.guidelines = assembled;
                        this.guidelines.common = mergedCommon;
                        console.log('✅ 已使用 per-species JSON 組裝指引資料，並合併 common 欄位');
                    } else {
                        console.error('❌ 未能找到任何 per-species JSON');
                    }
                } catch (assembleError) {
                    console.error('❌ 組裝 per-species JSON 時發生錯誤:', assembleError);
                }
            }
        }
        })();
        return this._loadPromise;
    }

    /**
     * 計算寵物的精確年齡（年 + 月）
     * @param {Date|string} birthdate - 出生日期
     * @returns {Object} { years: 年, months: 月, totalMonths: 總月數 }
     */
    calculateAge(birthdate) {
        const birth = new Date(birthdate);
        const today = new Date();
        
        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        
        if (months < 0) {
            years--;
            months += 12;
        }
        
        const totalMonths = years * 12 + months;
        
        return {
            years: years,
            months: months,
            totalMonths: totalMonths,
            decimal: parseFloat((totalMonths / 12).toFixed(2))
        };
    }

    /**
     * 計算人類等值年齡
     * @param {string} petType - 動物種類 (cat/dog/rabbit/hamster)
     * @param {number} ageYears - 年齡（年）
     * @param {number} ageMonths - 年齡（月）
     * @param {string} dogSize - 狗的體型 (small/medium/large/giant)，僅狗需要
     * @param {string} hamsterBreed - 倉鼠品種，僅倉鼠需要
     * @returns {Object} { humanAge: 人類年齡, stage: 生命階段, description: 描述 }
     */
    calculateHumanAge(petType, ageYears, ageMonths = 0, dogSize = null, hamsterBreed = null) {
        if (!this.guidelines || !this.guidelines[petType]) {
            console.error('無法取得指引資料');
            return null;
        }

        const totalYears = ageYears + (ageMonths / 12);
        const ageConversion = this.guidelines[petType].ageConversion;
        
        // 判斷生命階段
        let currentStage = null;
        for (const [stage, data] of Object.entries(ageConversion)) {
            const [minAge, maxAge] = data.range;
            if (totalYears >= minAge && totalYears < maxAge) {
                currentStage = stage;
                break;
            }
        }
        
        // 如果超過最大年齡，使用老年期
        if (!currentStage) {
            currentStage = '老年期';
        }

        let humanAge = 0;
        
        // 根據不同動物種類計算
        if (petType === 'dog' && dogSize) {
            // 狗狗依體型計算
            humanAge = this.calculateDogHumanAge(totalYears, dogSize, currentStage);
        } else if (petType === 'cat') {
            humanAge = this.calculateCatHumanAge(totalYears, currentStage);
        } else if (petType === 'rabbit') {
            humanAge = this.calculateRabbitHumanAge(totalYears, currentStage);
        } else if (petType === 'hamster') {
            humanAge = this.calculateHamsterHumanAge(totalYears, currentStage, hamsterBreed);
        }

        return {
            humanAge: Math.round(humanAge),
            stage: currentStage,
            description: ageConversion[currentStage].description,
            petAge: {
                years: ageYears,
                months: ageMonths,
                total: totalYears
            }
        };
    }

    /**
     * 計算貓的人類年齡
     */
    calculateCatHumanAge(totalYears, stage) {
        if (totalYears < 1) {
            // 幼年期：每月 1.5 歲
            return (totalYears * 12) * 1.5;
        } else if (totalYears < 2) {
            // 青少年期：15 + (年 - 1) * 9
            return 15 + (totalYears - 1) * 9;
        } else if (totalYears < 7) {
            // 成年期：24 + (年 - 2) * 4
            return 24 + (totalYears - 2) * 4;
        } else if (totalYears < 11) {
            // 熟齡期：44 + (年 - 7) * 4
            return 44 + (totalYears - 7) * 4;
        } else {
            // 老年期：60 + (年 - 11) * 3
            return 60 + (totalYears - 11) * 3;
        }
    }

    /**
     * 計算狗的人類年齡（依體型）
     */
    calculateDogHumanAge(years, size, stage) {
        const sizeMultipliers = {
            'small': { base: 15, factor: [9, 4, 4, 3] },
            'medium': { base: 17, factor: [10, 5, 5, 4] },
            'large': { base: 20, factor: [12, 6, 6, 5] },
            'giant': { base: 25, factor: [15, 7, 7, 6] }
        };

        const multiplier = sizeMultipliers[size] || sizeMultipliers['medium'];

        if (years < 1) {
            // 幼年期
            return (years * 12) * (multiplier.base / 12);
        } else if (years < 2) {
            // 青少年期
            return multiplier.base + (years - 1) * multiplier.factor[0];
        } else if (years < 7) {
            // 成年期
            return multiplier.base + multiplier.factor[0] + (years - 2) * multiplier.factor[1];
        } else if (years < 10) {
            // 熟齡期
            const prevYears = multiplier.base + multiplier.factor[0] + (5 * multiplier.factor[1]);
            return prevYears + (years - 7) * multiplier.factor[2];
        } else {
            // 老年期
            const prevYears = multiplier.base + multiplier.factor[0] + (5 * multiplier.factor[1]) + (3 * multiplier.factor[2]);
            return prevYears + (years - 10) * multiplier.factor[3];
        }
    }

    /**
     * 計算兔子的人類年齡
     */
    calculateRabbitHumanAge(totalYears, stage) {
        if (totalYears < 0.5) {
            // 幼年期：每月 2 歲
            return (totalYears * 12) * 2;
        } else if (totalYears < 1) {
            // 青少年期：12 + (年 - 0.5) * 16
            return 12 + (totalYears - 0.5) * 16;
        } else if (totalYears < 5) {
            // 成年期：28 + (年 - 1) * 6
            return 28 + (totalYears - 1) * 6;
        } else if (totalYears < 8) {
            // 熟齡期：52 + (年 - 5) * 5
            return 52 + (totalYears - 5) * 5;
        } else {
            // 老年期：67 + (年 - 8) * 4
            return 67 + (totalYears - 8) * 4;
        }
    }

    /**
     * 計算倉鼠的人類年齡 (使用線性映射模型：0-性成熟 -> 0-15, 性成熟-壽命中位 -> 15-80)
     */
    calculateHamsterHumanAge(totalYears, stage, breedKey = null) {
        if (!this.guidelines || !this.guidelines.hamster || !this.guidelines.hamster.breeds) {
            return totalYears * 25; // 降級方案
        }

        const breed = this.guidelines.hamster.breeds[breedKey] || this.guidelines.hamster.breeds['syrian'];
        const totalMonths = totalYears * 12;
        
        // 取得品種特定參數 (單位：月)
        const sm = breed.sexualMaturity; // 性成熟點 (月)
        const ml = breed.medianLifespan; // 壽命中位點 (月)

        if (totalMonths <= sm) {
            // 0 -> sm 映射到 0 -> 15 歲
            return (totalMonths / sm) * 15;
        } else if (totalMonths <= ml) {
            // sm -> ml 映射到 15 -> 80 歲
            return 15 + ((totalMonths - sm) / (ml - sm)) * (80 - 15);
        } else {
            // 超過壽命中位點，進入高齡期 (每增加 1 個月約增加人類 2.5 歲)
            return 80 + (totalMonths - ml) * 2.5;
        }
    }

    /**
     * 取得生命階段的詳細資訊
     * @param {string} petType - 動物種類
     * @param {string} stage - 生命階段
     * @returns {Object} 階段詳細資訊
     */
    getStageInfo(petType, stage) {
        if (!this.guidelines || !this.guidelines[petType]) {
            return null;
        }

        return this.guidelines[petType].lifeStages[stage] || null;
    }

    /**
     * RER（靜態能量需求）= 70 × 體重(kg)^0.75，適用犬貓
     */
    calculateRER(weightKg) {
        return 70 * Math.pow(weightKg, 0.75);
    }

    /**
     * 計算營養需求區間（熱量、乾糧、飲水皆為區間）
     * 犬貓：RER × 活動係數 × 體型係數，再給 ±15% 區間；飲水依 ml/kg 區間
     * @param {string} petType - 動物種類
     * @param {number} weight - 體重（公斤）
     * @param {string} dogSize - 狗的體型（僅狗需要）
     * @param {string} activityLevel - 運動量選項（very_low / low / moderate / high / very_high）
     * @param {string} bodyShape - 體型選項（very_thin / thin / ideal / heavy / very_heavy）
     * @param {string} sex - 性別（male / female），影響犬貓參考熱量
     * @returns {Object} { dailyCaloriesMin, dailyCaloriesMax, foodAmountMin, foodAmountMax, waterIntakeMin, waterIntakeMax }
     */
    calculateNutritionRanges(petType, weight, dogSize, activityLevel, bodyShape, sex) {
        if (!this.guidelines || !this.guidelines[petType] || !weight || weight <= 0) {
            return {
                dailyCaloriesMin: 0, dailyCaloriesMax: 0,
                foodAmountMin: 0, foodAmountMax: 0,
                waterIntakeMin: 0, waterIntakeMax: 0
            };
        }

        const ng = this.guidelines[petType].nutritionGuidelines;
        const common = this.guidelines.common || {};
        const activityMult = (ng.activityMultipliers && activityLevel) ? (ng.activityMultipliers[activityLevel] || 1.2) : 1.2;
        const bodyMult = (ng.bodyShapeMultipliers && bodyShape) ? (ng.bodyShapeMultipliers[bodyShape] || 1) : 1;
        const sexMult = (common.sexMerModifier && sex) ? (common.sexMerModifier[sex] || 1) : 1;
        const kcalPer100g = ng.foodCaloriesPer100gDefault || 350;

        if (petType === 'cat' || (petType === 'dog' && dogSize)) {
            const RER = this.calculateRER(weight);
            const MER = RER * activityMult * bodyMult * sexMult;
            const dailyCaloriesMin = Math.round(MER * 0.85);
            const dailyCaloriesMax = Math.round(MER * 1.15);
            const foodAmountMin = Math.round((dailyCaloriesMin / kcalPer100g) * 100);
            const foodAmountMax = Math.round((dailyCaloriesMax / kcalPer100g) * 100);
            const waterMlMin = ng.waterMlPerKgMin ? Math.round(weight * ng.waterMlPerKgMin) : 0;
            const waterMlMax = ng.waterMlPerKgMax ? Math.round(weight * ng.waterMlPerKgMax) : 0;
            return {
                dailyCaloriesMin, dailyCaloriesMax,
                foodAmountMin, foodAmountMax,
                waterIntakeMin: waterMlMin, waterIntakeMax: waterMlMax
            };
        }

        if (petType === 'rabbit') {
            const calMin = (ng.caloriesPerKgMin || 80) * weight;
            const calMax = (ng.caloriesPerKgMax || 120) * weight;
            const dailyCaloriesMin = Math.round(calMin);
            const dailyCaloriesMax = Math.round(calMax);
            const foodAmountMin = Math.round((calMin / kcalPer100g) * 100);
            const foodAmountMax = Math.round((calMax / kcalPer100g) * 100);
            const waterMlMin = ng.waterMlPerKgMin ? Math.round(weight * ng.waterMlPerKgMin) : 0;
            const waterMlMax = ng.waterMlPerKgMax ? Math.round(weight * ng.waterMlPerKgMax) : 0;
            return {
                dailyCaloriesMin, dailyCaloriesMax,
                foodAmountMin, foodAmountMax,
                waterIntakeMin: waterMlMin, waterIntakeMax: waterMlMax
            };
        }

        if (petType === 'hamster') {
            const dailyCaloriesMin = ng.dailyCaloriesMin || 30;
            const dailyCaloriesMax = ng.dailyCaloriesMax || 45;
            const foodAmountMin = ng.foodGramsMin || 10;
            const foodAmountMax = ng.foodGramsMax || 15;
            const waterIntakeMin = ng.waterMlMin || 10;
            const waterIntakeMax = ng.waterMlMax || 20;
            return {
                dailyCaloriesMin, dailyCaloriesMax,
                foodAmountMin, foodAmountMax,
                waterIntakeMin, waterIntakeMax
            };
        }

        return {
            dailyCaloriesMin: 0, dailyCaloriesMax: 0,
            foodAmountMin: 0, foodAmountMax: 0,
            waterIntakeMin: 0, waterIntakeMax: 0
        };
    }

    /**
     * 取得該物種／體型的理想體重區間（kg），供計算體態分數
     */
    getIdealWeightRange(petType, dogSize, hamsterBreed) {
        const g = this.guidelines && this.guidelines[petType];
        if (!g || !g.idealWeight) return null;
        const iw = g.idealWeight;
        if (petType === 'dog' && dogSize && iw[dogSize]) {
            const r = iw[dogSize];
            return { min: r.min, max: r.max };
        }
        if (iw.general) {
            const r = iw.general;
            const unit = (r.unit || 'kg').toLowerCase();
            const toKg = unit === 'g' ? 0.001 : 1;
            return { min: r.min * toKg, max: r.max * toKg };
        }
        return null;
    }

    /**
     * 依體重與理想區間計算體態分數 1–5（理想=5，過輕/過重遞減）
     */
    computeBodyScore(weightKg, idealMin, idealMax) {
        if (weightKg == null || weightKg <= 0 || idealMin == null || idealMax == null) return 3;
        const mid = (idealMin + idealMax) / 2;
        const ratio = weightKg / mid;
        if (ratio >= 0.95 && ratio <= 1.05) return 5;
        if (ratio >= 0.9 && ratio < 0.95) return 4;
        if (ratio > 1.05 && ratio <= 1.1) return 4;
        if (ratio >= 0.85 && ratio < 0.9) return 3;
        if (ratio > 1.1 && ratio <= 1.15) return 3;
        if (ratio >= 0.8 && ratio < 0.85) return 2;
        if (ratio > 1.15 && ratio <= 1.2) return 2;
        return 1;
    }

    /**
     * 活動量對應分數 1–5（非常活潑=5）
     */
    getActivityScore(activityLevel) {
        const map = { very_low: 1, low: 2, moderate: 3, high: 4, very_high: 5 };
        return map[activityLevel] != null ? map[activityLevel] : 3;
    }

    /**
     * 寵物幸福度綜合指數 1–5（體態分與活動分平均，四捨五入）
     */
    computeWellnessScore(bodyScore, activityScore) {
        const raw = (bodyScore + activityScore) / 2;
        return Math.max(1, Math.min(5, Math.round(raw)));
    }

    /**
     * 取得體型／運動量標籤與建議（保留供營養計算與建議文案；幸福度改由計算產生）
     */
    getBodyShapeAndAdvice(bodyShape, activityLevel) {
        const common = this.guidelines && this.guidelines.common;
        if (!common) return { bodyShapeLabel: '', activityLabel: '', advice: '', bodyShapeLevel: 3, praise: '' };
        const bodyOpt = common.bodyShapeOptions && bodyShape ? common.bodyShapeOptions[bodyShape] : null;
        const activityOpt = common.activityLevelOptions && activityLevel ? common.activityLevelOptions[activityLevel] : null;
        const advice = (common.bodyShapeAdvice && bodyShape) ? common.bodyShapeAdvice[bodyShape] : '';
        const bodyShapeLevel = (common.bodyShapeLevel && bodyShape) ? common.bodyShapeLevel[bodyShape] : 3;
        const praise = (common.bodyShapePraise && bodyShape) ? common.bodyShapePraise[bodyShape] : '';
        return {
            bodyShapeLabel: bodyOpt ? bodyOpt.label : '',
            activityLabel: activityOpt ? activityOpt.label : '',
            advice: advice || '維持均衡飲食與適度活動。',
            bodyShapeLevel: bodyShapeLevel,
            praise: praise || ''
        };
    }

    /**
     * 依幸福度等級 1–5 取得稱讚與建議（用於報告）
     */
    getWellnessPraiseAndAdvice(wellnessLevel) {
        const common = this.guidelines && this.guidelines.common;
        if (!common || !common.bodyShapePraise || !common.bodyShapeAdvice) {
            return { praise: '', advice: '維持均衡飲食與適度活動。' };
        }
        const levelToKey = { 1: 'very_thin', 2: 'thin', 3: 'ideal', 4: 'heavy', 5: 'very_heavy' };
        const key = levelToKey[Math.max(1, Math.min(5, wellnessLevel))] || 'ideal';
        return {
            praise: common.bodyShapePraise[key] || '',
            advice: common.bodyShapeAdvice[key] || '維持均衡飲食與適度活動。'
        };
    }

    /**
     * 依勾選的健康狀況取得飲食與照護建議（常見疾病會影響建議）
     * @param {string} petType - 動物種類
     * @param {string[]} conditionIds - 勾選的狀況 id 陣列
     * @returns {Object} { dietaryNotes: string[], tips: string[], labels: string[] }
     */
    getConditionAdvice(petType, conditionIds) {
        if (!this.guidelines || !this.guidelines[petType]) {
            return { dietaryNotes: [], tips: [], labels: [] };
        }
        const conditions = this.guidelines[petType].commonConditions || [];
        const selected = conditions.filter(c => conditionIds.indexOf(c.id) !== -1);
        const dietaryNotes = selected.map(c => c.dietaryNote).filter(Boolean);
        const tips = selected.map(c => c.tip ? `🏥 ${c.label}：${c.tip}` : null).filter(Boolean);
        const labels = selected.map(c => c.label);
        return { dietaryNotes, tips, labels };
    }

    /**
     * 取得生命階段的健康提醒
     * @param {string} petType - 動物種類
     * @param {string} stage - 生命階段
     * @returns {Array} 健康提醒陣列
     */
    getHealthTips(petType, stage) {
        const stageInfo = this.getStageInfo(petType, stage);
        return stageInfo ? stageInfo.healthTips : [];
    }

    /**
     * 取得健檢頻率建議
     * @param {string} petType - 動物種類
     * @param {string} stage - 生命階段
     * @returns {string} 健檢頻率描述
     */
    getCheckupFrequency(petType, stage) {
        const stageInfo = this.getStageInfo(petType, stage);
        return stageInfo ? stageInfo.checkupFrequency : '每年健檢一次';
    }

    /**
     * 產生趣味性年齡比喻
     * @param {number} humanAge - 人類等值年齡
     * @param {string} stage - 生命階段
     * @returns {string} 趣味比喻
     */
    generateAgeComparison(humanAge, stage) {
        const comparisons = {
            '幼年期': [
                '正在快速成長中',
                '像個充滿好奇心的小寶寶',
                '每天都在學習新事物'
            ],
            '青少年期': [
                '青春洋溢的少年時期',
                '活力充沛的青春期',
                '正值精力旺盛階段'
            ],
            '成年期': [
                '處於人生黃金時期',
                '正值壯年的黃金階段',
                '成熟穩重的壯年期'
            ],
            '熟齡期': [
                '步入中年的成熟期',
                '經驗豐富的中年時期',
                '需要開始注重保健'
            ],
            '老年期': [
                '進入需要特別照護的階段',
                '享受退休生活的老年期',
                '需要更多關愛與照顧'
            ]
        };

        const stageComparisons = comparisons[stage] || ['健康活潑'];
        return stageComparisons[Math.floor(Math.random() * stageComparisons.length)];
    }

    /**
     * 產生完整的健康報告資料
     * @param {Object} petData - 寵物資料
     * @returns {Object} 完整報告資料
     */
    generateHealthReport(petData) {
        if (!this.guidelines) {
            throw new Error('健康指引資料尚未載入，請稍後再試。');
        }

        const { petType, petName, birthdate, ageYears, ageMonths, weight, sex, neutered, dogSize, hamsterBreed, activityLevel, bodyShape, healthConditions } = petData;
        const actLevel = activityLevel || 'moderate';
        const bShape = bodyShape || 'ideal';
        const conditionIds = Array.isArray(healthConditions) ? healthConditions : [];

        if (!this.guidelines[petType]) {
            throw new Error(`不支援的寵物種類: ${petType}`);
        }

        // 計算年齡
        let age;
        if (birthdate) {
            age = this.calculateAge(birthdate);
        } else {
            const years = parseInt(ageYears) || 0;
            const months = parseInt(ageMonths) || 0;
            age = {
                years: years,
                months: months,
                totalMonths: years * 12 + months,
                decimal: parseFloat((years + months / 12).toFixed(2))
            };
        }

        // 計算人類年齡
        const humanAgeData = this.calculateHumanAge(
            petType, 
            age.years, 
            age.months, 
            dogSize,
            hamsterBreed
        );

        if (!humanAgeData) {
            throw new Error('無法計算人類等值年齡資料。');
        }

        // 取得生命階段資訊
        const stageInfo = this.getStageInfo(petType, humanAgeData.stage);

        // 計算營養需求區間（綜合品種、年齡、體重、體型、性別；熱量、乾糧、飲水皆為區間）
        const nutritionRanges = weight
            ? this.calculateNutritionRanges(petType, weight, dogSize, actLevel, bShape, sex || 'male')
            : { dailyCaloriesMin: 0, dailyCaloriesMax: 0, foodAmountMin: 0, foodAmountMax: 0, waterIntakeMin: 0, waterIntakeMax: 0 };

        // 寵物幸福度綜合指數：依體重與理想體重計算體態分、活動量對應活動分，合併為 1–5 愛心
        const idealRange = this.getIdealWeightRange(petType, dogSize, hamsterBreed);
        const weightKg = weight != null ? (weight < 1 ? weight : weight) : null;
        const bodyScore = idealRange && weightKg != null
            ? this.computeBodyScore(weightKg, idealRange.min, idealRange.max)
            : 3;
        const activityScore = this.getActivityScore(actLevel);
        const wellnessScore = this.computeWellnessScore(bodyScore, activityScore);
        const wellnessPraise = this.getWellnessPraiseAndAdvice(wellnessScore);
        const bodyShapeAdvice = this.getBodyShapeAndAdvice(bShape, actLevel);
        const bodyCondition = {
            bodyShape: bShape,
            bodyShapeLabel: bodyShapeAdvice.bodyShapeLabel,
            activityLevel: actLevel,
            activityLabel: bodyShapeAdvice.activityLabel,
            bodyScore,
            activityScore,
            wellnessScore,
            advice: wellnessPraise.advice,
            praise: wellnessPraise.praise
        };

        // 健康狀況對飲食與提醒的影響（常見疾病，會納入建議）
        const conditionAdvice = this.getConditionAdvice(petType, conditionIds);
        const stageTips = this.getHealthTips(petType, humanAgeData.stage) || [];
        // 性別／結紮健康關注（已結紮顯示結紮後建議，未結紮顯示性別建議；納入健康提醒第一條）
        let sexFocus = '';
        if (neutered && this.guidelines.neuteredFocus && this.guidelines.neuteredFocus[petType]) {
            sexFocus = this.guidelines.neuteredFocus[petType];
        } else if (this.guidelines.sexHealthFocus && this.guidelines.sexHealthFocus[petType] && sex) {
            sexFocus = this.guidelines.sexHealthFocus[petType][sex];
        }
        const healthTipsMerged = (sexFocus ? ['👤 ' + sexFocus] : []).concat(conditionAdvice.tips, stageTips);

        // 產生報告（綜合品種、年齡、體重、體型、性別，若有勾選健康狀況則納入建議）
        const breedName = (petType === 'hamster' && hamsterBreed) ? 
            ` (${this.guidelines.hamster.breeds[hamsterBreed].label})` : '';
        const sexLabel = (this.guidelines.common && this.guidelines.common.sexOptions && sex) 
            ? this.guidelines.common.sexOptions[sex].label 
            : (sex === 'female' ? '母' : '公');
        const neuteredLabel = neutered ? '已絕育' : '未絕育';

        return {
            petInfo: {
                type: petType,
                typeName: (this.guidelines[petType].name || '毛孩') + breedName,
                emoji: this.guidelines[petType].emoji || '🐾',
                name: petName || '毛孩',
                age: age,
                sex: sex || 'male',
                sexLabel: sexLabel,
                neuteredLabel: neuteredLabel
            },
            humanAge: {
                age: humanAgeData.humanAge,
                stage: humanAgeData.stage,
                stageDescription: humanAgeData.description,
                comparison: this.generateAgeComparison(humanAgeData.humanAge, humanAgeData.stage),
                petAge: {
                    years: age.years,
                    months: age.months,
                    total: age.totalMonths
                }
            },
            stageInfo: {
                ageRange: stageInfo ? `${stageInfo.ageRange[0]}-${stageInfo.ageRange[1]} 歲` : '',
                humanAge: stageInfo ? stageInfo.humanAge : '',
                checkupFrequency: stageInfo ? stageInfo.checkupFrequency : '每年一次',
                comparison: stageInfo ? stageInfo.comparison : ''
            },
            nutrition: {
                dailyCaloriesMin: nutritionRanges.dailyCaloriesMin,
                dailyCaloriesMax: nutritionRanges.dailyCaloriesMax,
                foodAmountMin: nutritionRanges.foodAmountMin,
                foodAmountMax: nutritionRanges.foodAmountMax,
                waterIntakeMin: nutritionRanges.waterIntakeMin,
                waterIntakeMax: nutritionRanges.waterIntakeMax,
                unit: weight >= 1 ? 'kg' : 'g'
            },
            bodyCondition: bodyCondition,
            conditionAdvice: conditionAdvice,
            sexHealthFocus: sexFocus,
            healthTips: healthTipsMerged,
            generatedDate: new Date().toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };
    }
}

// 全域實例（頁面載入時自動建立）
var healthCalculator = new PetHealthCalculator();
window.healthCalculator = healthCalculator;

// 等待 DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🐾 寵物健康計算器已載入');
});