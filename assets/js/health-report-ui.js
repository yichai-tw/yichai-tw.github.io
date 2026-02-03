/**
 * 寵物健康報告 UI 控制器 (Pet Health Report UI Controller)
 * 用途：處理表單互動、步驟切換與報告生成觸發、表單記憶（瀏覽器保留一天）
 */

let selectedPetType = null;
let currentStep = 1;
let generatedReport = null;

// 表單記憶：存在 localStorage，保留一天
const STORAGE_KEY = 'yichai_health_report_form';
const TTL_MS = 24 * 60 * 60 * 1000; // 1 天

function saveFormToStorage(data) {
    try {
        const payload = { ...data, savedAt: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('無法寫入表單記憶', e);
    }
}

function getStoredFormData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data.savedAt || (Date.now() - data.savedAt > TTL_MS)) return null;
        return data;
    } catch (e) {
        return null;
    }
}

function clearStorageOnly() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.warn('無法清除儲存', e);
    }
}

/**
 * 一鍵清除所有紀錄：清除 localStorage 儲存並將表單還原為預設
 */
function clearAllStoredAndForm() {
    clearStorageOnly();
    const petNameEl = document.getElementById('petName');
    if (petNameEl) petNameEl.value = '';
    const birth = document.querySelector('input[name="ageInputType"][value="birthdate"]');
    if (birth) birth.checked = true;
    const birthInput = document.getElementById('birthdate');
    if (birthInput) birthInput.value = '';
    const y = document.getElementById('ageYears');
    const m = document.getElementById('ageMonths');
    if (y) y.value = '';
    if (m) m.value = '';
    document.getElementById('birthdateInput').style.display = 'block';
    document.getElementById('ageInput').style.display = 'none';
    toggleAgeInput();
    const weightEl = document.getElementById('weight');
    const unitEl = document.getElementById('weightUnit');
    if (weightEl) weightEl.value = '';
    if (unitEl) unitEl.value = selectedPetType === 'hamster' ? 'g' : 'kg';
    const sexMale = document.querySelector('input[name="sex"][value="male"]');
    if (sexMale) sexMale.checked = true;
    const neuteredNo = document.querySelector('input[name="neutered"][value="no"]');
    if (neuteredNo) neuteredNo.checked = true;
    const actMod = document.querySelector('input[name="activityLevel"][value="moderate"]');
    if (actMod) actMod.checked = true;
    const shapeIdeal = document.querySelector('input[name="bodyShape"][value="ideal"]');
    if (shapeIdeal) shapeIdeal.checked = true;
    if (selectedPetType === 'dog') {
        const small = document.querySelector('input[name="dogSize"][value="small"]');
        if (small) small.checked = true;
    }
    if (selectedPetType === 'hamster') {
        const syrian = document.querySelector('input[name="hamsterBreed"][value="syrian"]');
        if (syrian) syrian.checked = true;
    }
    const noneCb = document.getElementById('healthConditionNone');
    if (noneCb) noneCb.checked = true;
    document.querySelectorAll('input[name="healthCondition"]').forEach(cb => {
        if (cb.id !== 'healthConditionNone') cb.checked = false;
    });
}

function applyRestoredFormData(data) {
    if (!data) return;
    const petNameEl = document.getElementById('petName');
    if (petNameEl) petNameEl.value = data.petName || '';
    // 年齡
    if (data.birthdate) {
        const birth = document.querySelector('input[name="ageInputType"][value="birthdate"]');
        if (birth) birth.checked = true;
        const birthInput = document.getElementById('birthdate');
        if (birthInput) birthInput.value = data.birthdate;
        document.getElementById('birthdateInput').style.display = 'block';
        document.getElementById('ageInput').style.display = 'none';
    } else {
        const age = document.querySelector('input[name="ageInputType"][value="age"]');
        if (age) age.checked = true;
        const y = document.getElementById('ageYears');
        const m = document.getElementById('ageMonths');
        if (y) y.value = data.ageYears != null ? data.ageYears : '';
        if (m) m.value = data.ageMonths != null ? data.ageMonths : '';
        document.getElementById('birthdateInput').style.display = 'none';
        document.getElementById('ageInput').style.display = 'block';
    }
    toggleAgeInput();
    // 體重：存的是 kg，倉鼠顯示為 g
    const weightEl = document.getElementById('weight');
    const unitEl = document.getElementById('weightUnit');
    if (weightEl && unitEl) {
        if (data.petType === 'hamster' && data.weight != null) {
            weightEl.value = Math.round(data.weight * 1000);
            unitEl.value = 'g';
        } else if (data.weight != null) {
            weightEl.value = data.weight;
            unitEl.value = 'kg';
        }
    }
    // 性別、結紮、運動量、體型
    const sexRadio = document.querySelector(`input[name="sex"][value="${data.sex || 'male'}"]`);
    if (sexRadio) sexRadio.checked = true;
    const neuteredRadio = document.querySelector(`input[name="neutered"][value="${data.neutered ? 'yes' : 'no'}"]`);
    if (neuteredRadio) neuteredRadio.checked = true;
    const actRadio = document.querySelector(`input[name="activityLevel"][value="${data.activityLevel || 'moderate'}"]`);
    if (actRadio) actRadio.checked = true;
    const shapeRadio = document.querySelector(`input[name="bodyShape"][value="${data.bodyShape || 'ideal'}"]`);
    if (shapeRadio) shapeRadio.checked = true;
    if (data.petType === 'dog' && data.dogSize) {
        const dogRadio = document.querySelector(`input[name="dogSize"][value="${data.dogSize}"]`);
        if (dogRadio) dogRadio.checked = true;
    }
    if (data.petType === 'hamster' && data.hamsterBreed) {
        const hamRadio = document.querySelector(`input[name="hamsterBreed"][value="${data.hamsterBreed}"]`);
        if (hamRadio) hamRadio.checked = true;
    }
    // 健康狀況：需等動態選項渲染後再勾選
    const ids = Array.isArray(data.healthConditions) ? data.healthConditions : [];
    const noneCb = document.getElementById('healthConditionNone');
    if (noneCb) noneCb.checked = ids.length === 0;
    document.querySelectorAll('input[name="healthCondition"]').forEach(cb => {
        if (cb.id === 'healthConditionNone') return;
        cb.checked = ids.indexOf(cb.value) !== -1;
    });
}


/**
 * 依 data/health-guidelines.json 的 hamster.breeds 動態產生倉鼠品種選項（不硬編碼）
 */
async function renderHamsterBreeds() {
    const container = document.getElementById('hamsterBreedOptions');
    if (!container) return;
    const calc = window.healthCalculator;
    if (!calc) return;
    await calc.loadGuidelines();
    const breeds = calc.guidelines && calc.guidelines.hamster && calc.guidelines.hamster.breeds;
    if (!breeds || typeof breeds !== 'object') {
        container.innerHTML = '<p class="text-sm text-gray-500 col-span-2">無法載入品種資料</p>';
        return;
    }
    container.innerHTML = '';
    const commonSep = '／';
    for (const [key, binfo] of Object.entries(breeds)) {
        const label = binfo.label || key;
        const sub = Array.isArray(binfo.commonNames) && binfo.commonNames.length
            ? binfo.commonNames.join(commonSep)
            : '';
        const labelEl = document.createElement('label');
        labelEl.className = 'cursor-pointer';
        labelEl.innerHTML = `
            <input type="radio" name="hamsterBreed" value="${key}" class="hidden peer">
            <div class="border-2 border-gray-200 rounded-lg p-3 text-center peer-checked:border-orange-500 peer-checked:bg-orange-50">
                <p class="font-semibold">${escapeHtml(label)}</p>
                <p class="text-xs text-gray-500">${escapeHtml(sub)}</p>
            </div>
        `;
        container.appendChild(labelEl);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function renderActivityBodyOptions(petType) {
    const actContainer = document.getElementById('activityLevelOptions');
    const bodyContainer = document.getElementById('bodyShapeOptions');
    if (!actContainer || !bodyContainer) return;
    const calc = window.healthCalculator;
    if (!calc) return;
    await calc.loadGuidelines();
    const guidelines = calc.guidelines || {};
    const sp = guidelines[petType] || {};
    const common = guidelines.common || {};

    const activityOrder = ['very_low', 'low', 'moderate', 'high', 'very_high'];
    const bodyOrder = ['very_thin', 'thin', 'ideal', 'heavy', 'very_heavy'];

    const actMap = sp.activityLevelOptions || common.activityLevelOptions || {};
    const bodyMap = sp.bodyShapeOptions || common.bodyShapeOptions || {};

    const actHtml = activityOrder.map((k) => {
        const v = actMap[k] || { label: k, description: '' };
        const checked = k === 'moderate' ? 'checked' : '';
        return `
        <label class="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-lg px-3 py-2 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
            <input type="radio" name="activityLevel" value="${k}" class="text-orange-500" ${checked}>
            <span><strong>${escapeHtml(v.label || '')}</strong> — ${escapeHtml(v.description || '')}</span>
        </label>`;
    }).join('');
    actContainer.innerHTML = actHtml || '<p class="text-sm text-gray-500 col-span-2">暫無選項</p>';

    const bodyHtml = bodyOrder.map((k) => {
        const v = bodyMap[k] || { label: k, description: '' };
        const checked = k === 'ideal' ? 'checked' : '';
        return `
        <label class="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-lg px-3 py-2 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
            <input type="radio" name="bodyShape" value="${k}" class="text-orange-500" ${checked}>
            <span><strong>${escapeHtml(v.label || '')}</strong> — ${escapeHtml(v.description || '')}</span>
        </label>`;
    }).join('');
    bodyContainer.innerHTML = bodyHtml || '<p class="text-sm text-gray-500 col-span-2">暫無選項</p>';
}

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
    
    // 顯示/隱藏倉鼠品種選項（由 health-guidelines.json 動態產生）
    const hamsterSection = document.getElementById('hamsterBreedSection');
    if (hamsterSection) {
        hamsterSection.style.display = petType === 'hamster' ? 'block' : 'none';
        if (petType === 'hamster') renderHamsterBreeds();
    }

    // 顯示/隱藏結紮選項（倉鼠一般不結紮，不顯示）
    const neuteredSection = document.getElementById('neuteredSection');
    if (neuteredSection) {
        neuteredSection.style.display = petType === 'hamster' ? 'none' : 'block';
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
    
    // 依物種動態更新運動量/體型選項
    renderActivityBodyOptions(petType);

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
    updateHealthConditionsList();
    setTimeout(updateHealthConditionsList, 800);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 一天內有儲存記錄時自動還原（同寵物種類才套用，延遲以等健康狀況選項載入）
    setTimeout(function autoRestore() {
        const stored = getStoredFormData();
        if (stored && stored.petType === selectedPetType) applyRestoredFormData(stored);
    }, 1000);
}

/**
 * 依物種載入健康狀況選項（常見疾病，可多選）
 */
function updateHealthConditionsList() {
    const container = document.getElementById('healthConditionsList');
    if (!container) return;
    const calc = window.healthCalculator;
    const guidelines = calc && calc.guidelines;
    const petType = selectedPetType;
    if (!petType || !guidelines || !guidelines[petType]) {
        container.innerHTML = '<p class="text-sm text-gray-500 col-span-2">此物種暫無勾選項目</p>';
        return;
    }
    const conditions = guidelines[petType].commonConditions || [];
    const noneId = 'health_condition_none';
    const noneLabel = '沒有任何狀況';
    const optionsHtml = conditions.map(c => `
        <label class="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-lg px-3 py-2 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 health-condition-option">
            <input type="checkbox" name="healthCondition" value="${c.id}" class="text-orange-500 rounded health-condition-cb flex-shrink-0">
            <span class="whitespace-nowrap">${c.label}</span>
        </label>
    `).join('');
    container.innerHTML = `
        <label class="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-lg px-3 py-2 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 col-span-full" id="healthConditionNoneWrap">
            <input type="checkbox" name="healthCondition" value="${noneId}" id="healthConditionNone" class="text-orange-500 rounded flex-shrink-0">
            <span class="whitespace-nowrap">${noneLabel}</span>
        </label>
        ${optionsHtml}
    `;
    const noneCb = document.getElementById('healthConditionNone');
    const otherCbs = container.querySelectorAll('.health-condition-cb');
    if (noneCb) {
        noneCb.addEventListener('change', function () {
            if (this.checked) {
                otherCbs.forEach(cb => { cb.checked = false; });
            }
        });
    }
    otherCbs.forEach(cb => {
        cb.addEventListener('change', function () {
            if (this.checked && noneCb) {
                noneCb.checked = false;
            }
        });
    });
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
    
    const healthConditionsRaw = Array.from(document.querySelectorAll('input[name="healthCondition"]:checked')).map(c => c.value);
    const healthConditions = healthConditionsRaw.filter(v => v && v !== 'health_condition_none');
    const neutered = document.querySelector('input[name="neutered"]:checked')?.value === 'yes';
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
        sex: document.querySelector('input[name="sex"]:checked')?.value || 'male',
        dogSize: selectedPetType === 'dog' ? 
            document.querySelector('input[name="dogSize"]:checked')?.value : null,
        hamsterBreed: selectedPetType === 'hamster' ?
            document.querySelector('input[name="hamsterBreed"]:checked')?.value : null,
        activityLevel: document.querySelector('input[name="activityLevel"]:checked')?.value || 'moderate',
        bodyShape: document.querySelector('input[name="bodyShape"]:checked')?.value || 'ideal',
        healthConditions: healthConditions,
        neutered: neutered
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
            saveFormToStorage(formData);  // 存在瀏覽器，保留一天
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
