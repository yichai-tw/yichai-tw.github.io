/**
 * 寵物健康報告 UI 控制器 (Pet Health Report UI Controller)
 * 用途：處理表單互動、步驟切換與報告生成觸發
 */

let selectedPetType = null;
let currentStep = 1;
let generatedReport = null;

/**
 * 選擇動物種類
 */
function selectPetType(petType) {
    selectedPetType = petType;
    
    // 更新按鈕樣式
    document.querySelectorAll('.pet-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`[data-pet-type="${petType}"]`).classList.add('selected');
    
    // 更新體重提示
    updateWeightHint(petType);
    
    // 倉鼠預設體重單位為公克，其餘為公斤
    const weightUnitSelect = document.getElementById('weightUnit');
    if (weightUnitSelect) {
        weightUnitSelect.value = petType === 'hamster' ? 'g' : 'kg';
    }
    
    // 顯示/隱藏狗狗體型選項
    document.getElementById('dogSizeSection').style.display = 
        petType === 'dog' ? 'block' : 'none';
    
    // 顯示/隱藏倉鼠品種選項
    const hamsterSection = document.getElementById('hamsterBreedSection');
    if (hamsterSection) {
        hamsterSection.style.display = petType === 'hamster' ? 'block' : 'none';
    }

    // 更新年齡輸入提示
    const ageHint = document.querySelector('#ageInput p');
    if (ageHint) {
        if (petType === 'hamster') {
            ageHint.textContent = '小提醒：倉鼠壽命較短，建議精確填寫月份（例如 18 個月）';
            ageHint.classList.add('text-orange-600', 'font-semibold');
        } else {
            ageHint.textContent = '例：2 年 6 個月，或直接填 19 個月';
            ageHint.classList.remove('text-orange-600', 'font-semibold');
        }
    }
    
    // 自動跳轉到步驟 2
    setTimeout(() => goToStep2(), 500);
}

/**
 * 前往步驟 2
 */
function goToStep2() {
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    updateStepIndicator(2);
    currentStep = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 返回步驟 1
 */
function backToStep1() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    updateStepIndicator(1);
    currentStep = 1;
}

/**
 * 更新步驟指示器
 */
function updateStepIndicator(step) {
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`step${i}Indicator`);
        if (!indicator) continue;

        indicator.classList.remove('active', 'completed');
        
        if (i < step) {
            indicator.classList.add('completed');
            indicator.innerHTML = '✓';
        } else if (i === step) {
            indicator.classList.add('active');
            indicator.innerHTML = i;
        } else {
            indicator.innerHTML = i;
        }
    }
}

/**
 * 切換年齡輸入方式
 */
function toggleAgeInput() {
    const type = document.querySelector('input[name="ageInputType"]:checked').value;
    document.getElementById('birthdateInput').style.display = 
        type === 'birthdate' ? 'block' : 'none';
    document.getElementById('ageInput').style.display = 
        type === 'age' ? 'block' : 'none';
}

/**
 * 更新體重提示
 */
function updateWeightHint(petType) {
    const hints = {
        cat: '一般成貓：3-5 kg',
        dog: '依體型而異：2-70 kg',
        rabbit: '一般成兔：1.5-3.5 kg',
        hamster: '倉鼠：30-200 g'
    };
    const hintElement = document.getElementById('weightHint');
    if (hintElement) {
        hintElement.textContent = hints[petType] || '';
    }
}

/**
 * 表單驗證
 */
function validateForm() {
    const ageInputType = document.querySelector('input[name="ageInputType"]:checked').value;
    
    if (ageInputType === 'birthdate') {
        const birthdate = document.getElementById('birthdate').value;
        if (!birthdate) {
            alert('請選擇出生日期');
            return false;
        }
    } else {
        const years = document.getElementById('ageYears').value;
        const months = document.getElementById('ageMonths').value;
        if (!years && !months) {
            alert('請輸入年齡');
            return false;
        }
    }
    
    // 狗狗必須選擇體型
    if (selectedPetType === 'dog') {
        const dogSize = document.querySelector('input[name="dogSize"]:checked');
        if (!dogSize) {
            alert('請選擇狗狗體型');
            return false;
        }
    }

    // 倉鼠必須選擇品種
    if (selectedPetType === 'hamster') {
        const hamsterBreed = document.querySelector('input[name="hamsterBreed"]:checked');
        if (!hamsterBreed) {
            alert('請選擇倉鼠品種');
            return false;
        }
    }
    
    return true;
}

/**
 * 收集表單資料
 */
function collectFormData() {
    const ageInputType = document.querySelector('input[name="ageInputType"]:checked').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const weightUnit = document.getElementById('weightUnit').value;
    
    return {
        petType: selectedPetType,
        petName: document.getElementById('petName').value || null,
        birthdate: ageInputType === 'birthdate' ? 
            document.getElementById('birthdate').value : null,
        ageYears: ageInputType === 'age' ? 
            parseInt(document.getElementById('ageYears').value) || 0 : null,
        ageMonths: ageInputType === 'age' ? 
            parseInt(document.getElementById('ageMonths').value) || 0 : null,
        weight: weight ? (weightUnit === 'g' ? weight / 1000 : weight) : null,
        dogSize: selectedPetType === 'dog' ? 
            document.querySelector('input[name="dogSize"]:checked')?.value : null,
        hamsterBreed: selectedPetType === 'hamster' ?
            document.querySelector('input[name="hamsterBreed"]:checked')?.value : null
    };
}

/**
 * 顯示載入中
 */
function showLoading() {
    const btn = document.querySelector('#petDataForm button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<div class="loader mx-auto"></div>';
}

/**
 * 隱藏載入中
 */
function hideLoading() {
    const btn = document.querySelector('#petDataForm button[type="submit"]');
    btn.disabled = false;
    btn.innerHTML = '生成報告 →';
}

/**
 * 顯示報告
 */
function showReport() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('reportSection').style.display = 'block';
    updateStepIndicator(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 分享報告
 */
async function shareReport() {
    if (!generatedReport) return;
    
    try {
        const blob = await generatedReport.toBlob();
        const file = new File([blob], 'pet-health-report.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: '毛孩健康小幫手',
                text: '我剛生成了寵物的健康報告！',
                files: [file]
            });
        } else {
            // 如果不支援分享，則下載
            downloadReport();
            alert('您的瀏覽器不支援直接分享，已為您下載圖片。');
        }
    } catch (err) {
        console.error('分享失敗:', err);
        downloadReport();
    }
}

/**
 * 下載報告
 */
async function downloadReport() {
    if (!generatedReport) return;
    
    const blob = await generatedReport.toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `毛孩健康小幫手_${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 重置表單
 */
function resetForm() {
    location.reload();
}

/**
 * 監聽表單提交
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('petDataForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateForm()) return;
            
            const formData = collectFormData();
            showLoading();
            
            try {
                // 更加魯棒的檢查
                const calculator = window.healthCalculator || (typeof healthCalculator !== 'undefined' ? healthCalculator : null);
                
                if (!calculator) {
                    throw new Error('健康計算器模組尚未載入完成。');
                }

                // 等待計算器載入資料 (如果還沒載完)
                if (!calculator.guidelines) {
                    await calculator.loadGuidelines();
                }

                if (!calculator.guidelines) {
                    throw new Error('無法從伺服器取得健康指引資料。');
                }
                
                console.log('正在生成報告資料...', formData);
                const reportData = calculator.generateHealthReport(formData);
                
                console.log('正在產生報告圖片...');
                const generator = new PetHealthReportGenerator(reportData);
                await generator.generate();
                
                generatedReport = generator;
                showReport();
            } catch (error) {
                console.error('生成報告失敗，詳細錯誤資訊：', error);
                alert(`報告生成失敗：${error.message}\n請檢查輸入資料或重新整理頁面再試。`);
            } finally {
                hideLoading();
            }
        });
    }
});
