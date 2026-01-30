/**
 * 寵物健康計算器 (Pet Health Calculator)
 * 用途：計算年齡換算、體況評估、營養需求等
 * 版本：1.0.0
 * 最後更新：2026-01-30
 */

class PetHealthCalculator {
    constructor() {
        this.guidelines = null;
        this.loadGuidelines();
    }

    /**
     * 載入健康指引資料庫
     */
    async loadGuidelines() {
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
                console.error('❌ 備用路徑也失敗:', altError);
            }
        }
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
     * 計算倉鼠的人類年齡
     */
    calculateHamsterHumanAge(totalYears, stage, breed = null) {
        let baseAge = 0;
        
        if (totalYears < 0.25) {
            // 幼年期：每月 3 歲
            baseAge = (totalYears * 12) * 3;
        } else if (totalYears < 0.5) {
            // 青少年期：9 + (年 - 0.25) * 28
            baseAge = 9 + (totalYears - 0.25) * 28;
        } else if (totalYears < 1.5) {
            // 成年期：16 + (年 - 0.5) * 20
            baseAge = 16 + (totalYears - 0.5) * 20;
        } else if (totalYears < 2) {
            // 熟齡期：36 + (年 - 1.5) * 24
            baseAge = 36 + (totalYears - 1.5) * 24;
        } else {
            // 老年期：48 + (年 - 2) * 20
            baseAge = 48 + (totalYears - 2) * 20;
        }

        // 根據品種調整倍率
        const breedMultipliers = {
            'syrian': 1.0,        // 黃金鼠 (基準)
            'winter_white': 1.2,  // 侏儒鼠壽命較短，老得快
            'campbell': 1.2,
            'roborovski': 0.8     // 老公公鼠最長壽，老得慢
        };

        const multiplier = (breed && breedMultipliers[breed]) ? breedMultipliers[breed] : 1.0;
        return baseAge * multiplier;
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
     * 計算每日熱量需求 (Daily Calorie Requirement)
     * @param {string} petType - 動物種類
     * @param {number} weight - 體重（公斤）
     * @param {string} dogSize - 狗的體型（僅狗需要）
     * @returns {number} 每日熱量（kcal）
     */
    calculateDailyCalories(petType, weight, dogSize = null) {
        if (!this.guidelines || !this.guidelines[petType]) {
            return 0;
        }

        const nutrition = this.guidelines[petType].nutritionGuidelines;

        if (petType === 'cat') {
            // 貓：體重 * 70 * 0.8
            return Math.round(weight * 70 * 0.8);
        } else if (petType === 'dog' && dogSize) {
            // 狗：依體型計算
            const multipliers = {
                'small': 110,
                'medium': 95,
                'large': 80,
                'giant': 70
            };
            return Math.round(weight * (multipliers[dogSize] || 95));
        } else if (petType === 'rabbit') {
            // 兔子：體重 * 100
            return Math.round(weight * 100);
        } else if (petType === 'hamster') {
            // 倉鼠：固定 30-45 kcal
            return 40; // 取中間值
        }

        return 0;
    }

    /**
     * 計算每日飲水量 (Daily Water Intake)
     * @param {string} petType - 動物種類
     * @param {number} weight - 體重（公斤）
     * @returns {number} 每日飲水量（ml）
     */
    calculateWaterIntake(petType, weight) {
        if (!this.guidelines || !this.guidelines[petType]) {
            return 0;
        }

        if (petType === 'cat') {
            // 貓：體重 * 50 ml
            return Math.round(weight * 50);
        } else if (petType === 'dog') {
            // 狗：體重 * 60 ml
            return Math.round(weight * 60);
        } else if (petType === 'rabbit') {
            // 兔子：體重 * 100 ml
            return Math.round(weight * 100);
        } else if (petType === 'hamster') {
            // 倉鼠：10-20 ml
            return 15; // 取中間值
        }

        return 0;
    }

    /**
     * 計算建議乾糧份量（克）
     * @param {number} calories - 每日熱量需求
     * @param {number} foodCaloriesPer100g - 飼料每 100g 熱量（預設 350 kcal/100g）
     * @returns {number} 建議乾糧克數
     */
    calculateFoodAmount(calories, foodCaloriesPer100g = 350) {
        return Math.round((calories / foodCaloriesPer100g) * 100);
    }

    /**
     * 評估體況評分 (Body Condition Score, BCS)
     * 簡化版：依據理想體重範圍評估
     * @param {string} petType - 動物種類
     * @param {number} weight - 當前體重（公斤）
     * @param {string} dogSize - 狗的體型（僅狗需要）
     * @returns {Object} { score: 評分, category: 類別, advice: 建議 }
     */
    evaluateBCS(petType, weight, dogSize = null) {
        if (!this.guidelines || !this.guidelines[petType]) {
            return null;
        }

        let idealWeight = this.guidelines[petType].idealWeight;
        
        // 狗狗依體型取得理想體重
        if (petType === 'dog' && dogSize) {
            idealWeight = idealWeight[dogSize] || idealWeight.general;
        } else if (idealWeight.general) {
            idealWeight = idealWeight.general;
        }

        const minWeight = idealWeight.min;
        const maxWeight = idealWeight.max;
        const midWeight = (minWeight + maxWeight) / 2;

        let bcsCategory = null;
        let score = 5; // 預設理想

        // 簡化判斷邏輯
        if (weight < minWeight * 0.85) {
            bcsCategory = 'underweight';
            score = 2;
        } else if (weight < minWeight) {
            bcsCategory = 'underweight';
            score = 3;
        } else if (weight >= minWeight && weight <= maxWeight) {
            bcsCategory = 'ideal';
            score = weight < midWeight ? 4 : 5;
        } else if (weight <= maxWeight * 1.15) {
            bcsCategory = 'overweight';
            score = 6;
        } else if (weight <= maxWeight * 1.3) {
            bcsCategory = 'overweight';
            score = 7;
        } else {
            bcsCategory = 'obese';
            score = 8;
        }

        const bcsInfo = this.guidelines[petType].bcsGuidelines[bcsCategory];

        return {
            score: score,
            category: bcsCategory,
            description: bcsInfo.description,
            advice: bcsInfo.advice,
            idealRange: `${minWeight}-${maxWeight} ${idealWeight.unit}`,
            currentWeight: weight
        };
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

        const { petType, petName, birthdate, ageYears, ageMonths, weight, dogSize, hamsterBreed } = petData;

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

        // 計算營養需求
        const dailyCalories = weight ? this.calculateDailyCalories(petType, weight, dogSize) : 0;
        const waterIntake = weight ? this.calculateWaterIntake(petType, weight) : 0;
        const foodAmount = dailyCalories ? this.calculateFoodAmount(dailyCalories) : 0;

        // 評估體況
        const bcsEvaluation = weight ? this.evaluateBCS(petType, weight, dogSize) : null;

        // 產生報告
        const breedName = (petType === 'hamster' && hamsterBreed) ? 
            ` (${this.guidelines.hamster.breeds[hamsterBreed].label})` : '';

        return {
            petInfo: {
                type: petType,
                typeName: (this.guidelines[petType].name || '毛孩') + breedName,
                emoji: this.guidelines[petType].emoji || '🐾',
                name: petName || '毛孩',
                age: age
            },
            humanAge: {
                age: humanAgeData.humanAge,
                stage: humanAgeData.stage,
                stageDescription: humanAgeData.description,
                comparison: this.generateAgeComparison(humanAgeData.humanAge, humanAgeData.stage)
            },
            stageInfo: {
                ageRange: stageInfo ? `${stageInfo.ageRange[0]}-${stageInfo.ageRange[1]} 歲` : '',
                humanAge: stageInfo ? stageInfo.humanAge : '',
                checkupFrequency: stageInfo ? stageInfo.checkupFrequency : '每年一次',
                comparison: stageInfo ? stageInfo.comparison : ''
            },
            nutrition: {
                dailyCalories: dailyCalories,
                waterIntake: waterIntake,
                foodAmount: foodAmount,
                unit: weight >= 1 ? 'kg' : 'g'
            },
            bodyCondition: bcsEvaluation,
            healthTips: this.getHealthTips(petType, humanAgeData.stage) || [],
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