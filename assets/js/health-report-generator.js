/**
 * 寵物健康報告圖片生成器 (Pet Health Report Canvas Generator)
 * 用途：將報告資料繪製成 Canvas 並導出圖片
 */

class PetHealthReportGenerator {
    constructor(reportData) {
        this.data = reportData;
        this.canvas = document.getElementById('reportCanvas') || document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        // 社群分享用 3:4 直式比例（寬:高 = 3:4）
        this.canvas.width = 1080;
        this.canvas.height = 1080 * (4 / 3); // 1440
        
        // 繪圖參數
        this.padding = 60;
        this.cardRadius = 30;
        this.colors = {
            backgroundStart: '#FFF9F0',
            backgroundEnd: '#F0F8FF',
            brandOrange: '#DF7621',
            textDark: '#333333',
            textLight: '#666666',
            cardBg: '#FFFFFF',
            shadow: 'rgba(0,0,0,0.1)'
        };
    }

    async generate() {
        await this.loadAssets();
        this.drawBackground();
        this.drawHeader();
        
        // 3:4 直式版面：起始高度略縮，卡片高度壓縮以納入一屏
        let currentY = 168;

        // 1. 人類年齡卡片
        this.drawAgeCard(currentY);
        currentY += 152;

        // 2. 生命階段卡片
        this.drawStageCard(currentY);
        currentY += 152;

        // 3. 體型與活動參考卡片（愛心 5 等級、3 顆以上稱讚飼主）
        if (this.data.bodyCondition) {
            this.drawBodyConditionCard(currentY);
            currentY += 200;
        }

        // 4. 飲食建議卡片（若有勾選健康狀況則含照護提醒，高度動態）
        this.drawNutritionCard(currentY);
        const nutritionCardHeight = (this.data.conditionAdvice && this.data.conditionAdvice.dietaryNotes && this.data.conditionAdvice.dietaryNotes.length > 0) ? 268 : 212;
        currentY += nutritionCardHeight;

        // 5. 健康提醒卡片
        this.drawHealthTipsCard(currentY);
        
        // 6. 底部資訊
        await this.drawFooter();
        
        return this.canvas;
    }

    async loadAssets() {
        // 等待字體載入
        await document.fonts.ready;
        
        // 載入 Logo
        try {
            this.logo = await this.loadImage('assets/images/yichai-petshop-logo.png');
        } catch (e) {
            console.warn('Logo 載入失敗，將跳過 Logo 繪製');
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, this.colors.backgroundStart);
        gradient.addColorStop(1, this.colors.backgroundEnd);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawHeader() {
        // 繪製 Logo（3:4 版面略縮）
        if (this.logo) {
            this.ctx.drawImage(this.logo, this.padding, 36, 88, 88);
        }

        // 標題
        this.ctx.textAlign = 'left';
        this.drawTextWithShadow('一鍵毛孩健康小幫手', 158, 88, 42, this.colors.brandOrange, 'bold');
        
        // 生成日期
        this.ctx.font = '22px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textLight;
        this.ctx.fillText(`生成日期：${this.data.generatedDate}`, 158, 122);
        
        // 寵物名字與種類（含性別：綜合計算用）
        const sexLabel = this.data.petInfo.sexLabel || '';
        const petTitle = `${this.data.petInfo.emoji} ${this.data.petInfo.name} 的專屬報告${sexLabel ? ` · ${sexLabel}` : ''}`;
        this.ctx.textAlign = 'right';
        this.ctx.font = 'bold 28px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(petTitle, this.canvas.width - this.padding, 108);
    }

    drawAgeCard(y) {
        const height = 152;
        this.drawRoundedCard(this.padding, y, this.canvas.width - this.padding * 2, height, this.cardRadius, this.colors.cardBg);
        
        const contentX = this.padding + 40;
        const contentY = y + 58;
        
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 32px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`${this.data.petInfo.emoji} 相當於人類 ${this.data.humanAge.age} 歲`, contentX, contentY);
        
        this.ctx.font = '28px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(this.data.humanAge.comparison, contentX, contentY + 52);
    }

    drawStageCard(y) {
        const height = 152;
        this.drawRoundedCard(this.padding, y, this.canvas.width - this.padding * 2, height, this.cardRadius, this.colors.cardBg);
        
        const contentX = this.padding + 40;
        const contentY = y + 58;
        
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 32px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`📋 目前生命階段：${this.data.humanAge.stage}`, contentX, contentY);
        
        this.ctx.font = '26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(`建議健檢頻率：${this.data.stageInfo.checkupFrequency}`, contentX, contentY + 52);
    }

    drawBodyConditionCard(y) {
        const height = 200;
        this.drawRoundedCard(this.padding, y, this.canvas.width - this.padding * 2, height, this.cardRadius, this.colors.cardBg);
        
        const contentX = this.padding + 40;
        const contentY = y + 58;
        const bc = this.data.bodyCondition;
        if (!bc) return;
        
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 32px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`📐 體型與活動參考`, contentX, contentY);
        
        this.ctx.font = '26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        const level = bc.bodyShapeLevel != null ? bc.bodyShapeLevel : 3;
        const heartsStr = '♥'.repeat(level) + '♡'.repeat(5 - level);
        this.ctx.fillText(`體型參考：${heartsStr}（${bc.bodyShapeLabel || '標準'}）　運動量：${bc.activityLabel || '適中'}`, contentX, contentY + 46);
        let drawY = contentY + 46 + 34;
        if (bc.praise) {
            this.ctx.fillStyle = this.colors.brandOrange;
            this.ctx.font = '24px "Noto Sans TC"';
            this.ctx.fillText(`💬 ${bc.praise}`, contentX, drawY);
            drawY += 32;
        }
        this.ctx.font = '26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        const adviceLines = this.wrapText(`建議：${bc.advice || '維持均衡飲食與適度活動。'}`, this.canvas.width - this.padding * 2 - 80);
        adviceLines.forEach((line) => {
            this.ctx.fillText(line, contentX, drawY);
            drawY += 30;
        });
    }

    drawNutritionCard(y) {
        const cond = this.data.conditionAdvice;
        const hasConditionNotes = cond && cond.dietaryNotes && cond.dietaryNotes.length > 0;
        const height = hasConditionNotes ? 268 : 212;
        this.drawRoundedCard(this.padding, y, this.canvas.width - this.padding * 2, height, this.cardRadius, this.colors.cardBg);
        
        const contentX = this.padding + 40;
        const contentY = y + 58;
        const nut = this.data.nutrition;
        const lineHeight = 34;
        const maxWidth = this.canvas.width - this.padding * 2 - 80;

        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 32px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`🍲 飲食建議`, contentX, contentY);

        this.ctx.font = '26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;

        let drawY = contentY + 46;
        const hasNutrition = (nut.dailyCaloriesMin > 0 || nut.dailyCaloriesMax > 0);
        if (hasNutrition) {
            const calMin = nut.dailyCaloriesMin;
            const calMax = nut.dailyCaloriesMax;
            const line1 = `每日熱量：${calMin}–${calMax} kcal（參考區間）`;
            const lines1 = this.wrapText(line1, maxWidth);
            lines1.forEach((line) => {
                this.ctx.fillText(line, contentX, drawY);
                drawY += lineHeight;
            });
            const lines2 = this.wrapText(`乾糧約：${nut.foodAmountMin}–${nut.foodAmountMax} g`, maxWidth);
            lines2.forEach((line) => {
                this.ctx.fillText(line, contentX, drawY);
                drawY += lineHeight;
            });
            const lines3 = this.wrapText(`飲水：${nut.waterIntakeMin}–${nut.waterIntakeMax} ml`, maxWidth);
            lines3.forEach((line) => {
                this.ctx.fillText(line, contentX, drawY);
                drawY += lineHeight;
            });
            this.ctx.font = '22px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.textLight;
            const footnote = '以上區間已依品種、年齡、體重、體型、性別綜合計算。';
            this.wrapText(footnote, maxWidth).forEach((line) => {
                this.ctx.fillText(line, contentX, drawY);
                drawY += 28;
            });
        } else {
            this.ctx.fillText('請填寫體重以獲得飲食建議', contentX, drawY);
            drawY += lineHeight;
        }

        if (hasConditionNotes) {
            drawY += 8;
            this.ctx.font = 'bold 24px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.brandOrange;
            this.ctx.fillText('🏥 依您勾選的健康狀況，飲食與照護提醒：', contentX, drawY);
            drawY += 30;
            this.ctx.font = '22px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.textDark;
            cond.dietaryNotes.forEach((note) => {
                this.wrapText(`· ${note}`, maxWidth).forEach((line) => {
                    this.ctx.fillText(line, contentX, drawY);
                    drawY += 26;
                });
            });
        }
    }

    /**
     * 將長文字依最大寬度換行，回傳多行陣列
     */
    wrapText(text, maxWidth) {
        const ctx = this.ctx;
        const lines = [];
        const chars = Array.from(text);
        let current = '';
        for (let i = 0; i < chars.length; i++) {
            const test = current + chars[i];
            const metrics = ctx.measureText(test);
            if (metrics.width > maxWidth && current.length > 0) {
                lines.push(current);
                current = chars[i];
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    drawHealthTipsCard(y) {
        const height = 260;
        this.drawRoundedCard(this.padding, y, this.canvas.width - this.padding * 2, height, this.cardRadius, this.colors.cardBg);
        
        const contentX = this.padding + 40;
        const maxTextWidth = this.canvas.width - this.padding * 2 - 80;
        const lineHeight = 28;
        const gapBetweenTips = 8;
        let tipY = y + 58;
        
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 32px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`💊 健康提醒`, contentX, tipY);
        
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        
        tipY += 46;
        const tips = this.data.healthTips.slice(0, 4);
        tips.forEach(tip => {
            const lines = this.wrapText(tip, maxTextWidth);
            lines.forEach(line => {
                this.ctx.fillText(line, contentX, tipY);
                tipY += lineHeight;
            });
            tipY += gapBetweenTips;
        });
    }

    async drawFooter() {
        // 3:4 版面（高度 1440），頁尾自健康提醒卡片下方開始（體型卡含稱讚高度 200）
        const y = 1180;
        
        // 繪製 QR Code（連結至官網首頁，可查門市、最新消息與健康小幫手）
        const qrUrl = 'https://yichai-tw.github.io/';
        await this.drawQRCode(qrUrl, this.canvas.width - this.padding - 130, y, 130);
        
        // 門市資訊
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 28px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText('📍 宜加寵物生活館', this.padding, y + 36);
        
        this.ctx.font = '22px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textLight;
        this.ctx.fillText('專業、用心、愛毛孩，全台多間門市為您服務', this.padding, y + 72);
        this.ctx.fillText('官網、門市與更多健康資訊請掃描 QR Code', this.padding, y + 108);
        
        // 免責聲明（3:4 版面底部）
        this.ctx.textAlign = 'center';
        this.ctx.font = 'italic 18px "Noto Sans TC"';
        this.ctx.fillStyle = '#999999';
        this.ctx.fillText('※ 不能取代專業獸醫，健康疑慮請諮詢獸醫或儘速就醫。', this.canvas.width / 2, 1420);
    }

    drawRoundedCard(x, y, width, height, radius, fillColor) {
        this.ctx.save();
        this.ctx.shadowColor = this.colors.shadow;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 5;
        
        this.ctx.fillStyle = fillColor;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, radius);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawTextWithShadow(text, x, y, fontSize, color, weight = 'normal') {
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0,0,0,0.1)';
        this.ctx.shadowBlur = 4;
        this.ctx.font = `${weight} ${fontSize}px "Noto Sans TC"`;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    async drawQRCode(url, x, y, size) {
        if (typeof QRCode === 'undefined') {
            console.warn('QRCode library 尚未載入，跳過 QR Code 繪製');
            return;
        }

        const qrContainer = document.createElement('div');
        qrContainer.style.display = 'none';
        document.body.appendChild(qrContainer);
        
        try {
            new QRCode(qrContainer, {
                text: url,
                width: size,
                height: size,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // 等待 QRCode 生成（qrcode.js 可能輸出 <img> 或 <canvas>，韋瓦第等瀏覽器常為 canvas）
            let attempts = 0;
            let dataUrl = null;
            
            while (attempts < 10) {
                const qrImg = qrContainer.querySelector('img');
                const qrCanvas = qrContainer.querySelector('canvas');
                if (qrImg && qrImg.src && qrImg.src.startsWith('data:image')) {
                    dataUrl = qrImg.src;
                    break;
                }
                if (qrCanvas && qrCanvas.width > 0) {
                    try {
                        dataUrl = qrCanvas.toDataURL('image/png');
                        if (dataUrl) break;
                    } catch (e) { /* 忽略 toDataURL 失敗 */ }
                }
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (dataUrl) {
                const img = await this.loadImage(dataUrl);
                this.ctx.drawImage(img, x, y, size, size);
            }
        } catch (e) {
            console.error('QR Code 生成失敗:', e);
        } finally {
            document.body.removeChild(qrContainer);
        }
    }

    async toBlob() {
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, 'image/png', 0.9);
        });
    }

    async toDataURL() {
        return this.canvas.toDataURL('image/png', 0.9);
    }
}
