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
        
        // 繪圖參數：淡淡框線、雙欄、區塊內留白與標題／內文間距
        this.padding = 48;
        this.innerPadding = 28;   // 區塊內左右留白，文字不貼邊
        this.titleToContent = 24; // 標題與內文間距（加大以提升可讀性）
        this.sectionGap = 18;     // 區塊間距
        this.lineHeight = 30;     // 內文行高（統一加大）
        this.colRadius = 16;
        this.contentWidth = this.canvas.width - this.padding * 2;  // 960
        this.colGap = 16;
        this.colWidth = (this.contentWidth - this.colGap) / 2;  // 472
        this.leftColX = this.padding;
        this.rightColX = this.padding + this.colWidth + this.colGap;
        this.colors = {
            backgroundStart: '#FFF9F0',
            backgroundEnd: '#F0F8FF',
            brandOrange: '#DF7621',
            textDark: '#333333',
            textLight: '#666666',
            divider: 'rgba(0,0,0,0.06)',
            frameStroke: 'rgba(0,0,0,0.08)',
            frameFill: 'rgba(255,255,255,0.5)',
            // 人類年齡／生命階段專用：左卡暖色、右卡冷色
            ageCardFill: 'rgba(255,243,230,0.85)',
            ageCardAccent: '#DF7621',
            stageCardFill: 'rgba(230,245,255,0.9)',
            stageCardAccent: '#2E7D9A'
        };
    }

    async generate() {
        await this.loadAssets();
        this.drawBackground();
        this.drawHeader();
        
        // 雙欄＋淡框：第一列年齡｜生命階段，其餘全寬淡框
        let currentY = 156;

        // 1. 人類年齡（左）＋ 生命階段（右）同一列
        this.drawAgeAndStageRow(currentY);
        currentY += 152 + this.sectionGap;

        // 2. 體型與活動參考（全寬淡框）
        if (this.data.bodyCondition) {
            this.drawBodyConditionBlock(currentY);
            currentY += 200 + this.sectionGap;
        }

        // 3. 飲食建議（全寬淡框）
        this.drawNutritionBlock(currentY);
        const nutritionHeight = (this.data.conditionAdvice && this.data.conditionAdvice.dietaryNotes && this.data.conditionAdvice.dietaryNotes.length > 0) ? 280 : 220;
        currentY += nutritionHeight + this.sectionGap;

        // 4. 健康提醒（全寬淡框）
        const healthTipsHeight = 268;
        this.drawHealthTipsBlock(currentY);
        currentY += healthTipsHeight + this.sectionGap;

        // 6. 底部資訊（依上方卡片結束位置繪製，不重疊）
        await this.drawFooter(currentY);
        
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
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textLight;
        this.ctx.fillText(`生成日期：${this.data.generatedDate}`, 158, 124);
        
        // 寵物名字與種類（含性別：綜合計算用）
        const sexLabel = this.data.petInfo.sexLabel || '';
        const petTitle = `${this.data.petInfo.emoji} ${this.data.petInfo.name} 的專屬報告${sexLabel ? ` · ${sexLabel}` : ''}`;
        this.ctx.textAlign = 'right';
        this.ctx.font = 'bold 28px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(petTitle, this.canvas.width - this.padding, 108);
    }

    drawSectionDivider(y) {
        this.ctx.strokeStyle = this.colors.divider;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, y);
        this.ctx.lineTo(this.canvas.width - this.padding, y);
        this.ctx.stroke();
    }

    drawFaintFrame(x, y, w, h) {
        this.ctx.save();
        this.ctx.fillStyle = this.colors.frameFill;
        this.ctx.strokeStyle = this.colors.frameStroke;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, this.colRadius);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
    }

    /**
     * 繪製「人類年齡／生命階段」專用卡片：底色＋左側色條，與其他區塊視覺區隔
     */
    drawSpecialInfoCard(x, y, w, h, fillStyle, accentColor) {
        const radius = this.colRadius;
        const barWidth = 6;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, radius);
        this.ctx.fillStyle = fillStyle;
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.fillStyle = accentColor;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 10, y + 10, barWidth, h - 20, 3);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawAgeAndStageRow(y) {
        const rowHeight = 152;
        const inner = this.innerPadding;
        const lineH = this.lineHeight;
        this.drawSpecialInfoCard(this.leftColX, y, this.colWidth, rowHeight, this.colors.ageCardFill, this.colors.ageCardAccent);
        this.drawSpecialInfoCard(this.rightColX, y, this.colWidth, rowHeight, this.colors.stageCardFill, this.colors.stageCardAccent);
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        const leftX = this.leftColX + inner;
        const rightX = this.rightColX + inner;
        const maxW = this.colWidth - inner * 2;
        const titleY = y + 30;
        const contentY = titleY + this.titleToContent;
        this.ctx.fillText(`${this.data.petInfo.emoji} 相當於人類 ${this.data.humanAge.age} 歲`, leftX, titleY);
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.wrapText(this.data.humanAge.comparison, maxW).forEach((line, i) => {
            this.ctx.fillText(line, leftX, contentY + i * lineH);
        });
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`📋 目前生命階段：${this.data.humanAge.stage}`, rightX, titleY);
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(`建議健檢頻率：${this.data.stageInfo.checkupFrequency}`, rightX, contentY);
    }

    drawBodyConditionBlock(y) {
        const bc = this.data.bodyCondition;
        if (!bc) return;
        const w = this.contentWidth;
        const h = 200;
        const lineH = this.lineHeight;
        this.drawFaintFrame(this.padding, y, w, h);
        const contentX = this.padding + this.innerPadding;
        const innerW = w - this.innerPadding * 2;
        let drawY = y + 30;
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`💝 寵物幸福度`, contentX, drawY);
        drawY += 28 + this.titleToContent;
        const wellnessLevel = bc.wellnessScore != null ? Math.max(1, Math.min(5, bc.wellnessScore)) : 3;
        const heartsStr = '♥'.repeat(wellnessLevel) + '♡'.repeat(5 - wellnessLevel);
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(heartsStr, contentX, drawY);
        drawY += lineH;
        this.ctx.font = '20px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textLight;
        const bodyH = '♥'.repeat(bc.bodyScore != null ? bc.bodyScore : 3) + '♡'.repeat(5 - (bc.bodyScore != null ? bc.bodyScore : 3));
        const actH = '♥'.repeat(bc.activityScore != null ? bc.activityScore : 3) + '♡'.repeat(5 - (bc.activityScore != null ? bc.activityScore : 3));
        this.ctx.fillText(`依體態與活動量綜合計算　體態 ${bodyH}　活動 ${actH}`, contentX, drawY);
        drawY += lineH;
        if (bc.praise) {
            this.ctx.fillStyle = this.colors.brandOrange;
            this.ctx.font = '22px "Noto Sans TC"';
            this.ctx.fillText(`💬 ${bc.praise}`, contentX, drawY);
            drawY += lineH;
        }
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.wrapText(`建議：${bc.advice || '維持均衡飲食與適度活動。'}`, innerW).forEach((line) => {
            this.ctx.fillText(line, contentX, drawY);
            drawY += lineH;
        });
    }

    drawNutritionBlock(y) {
        const nut = this.data.nutrition;
        const cond = this.data.conditionAdvice;
        const hasConditionNotes = cond && cond.dietaryNotes && cond.dietaryNotes.length > 0;
        const baseH = hasConditionNotes ? 280 : 220;
        const lineH = this.lineHeight;
        this.drawFaintFrame(this.padding, y, this.contentWidth, baseH);
        const contentX = this.padding + this.innerPadding;
        const maxWidth = this.contentWidth - this.innerPadding * 2;
        let drawY = y + 30;
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`🍲 飲食建議`, contentX, drawY);
        drawY += 28 + this.titleToContent;
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        const hasNutrition = (nut.dailyCaloriesMin > 0 || nut.dailyCaloriesMax > 0);
        if (hasNutrition) {
            const calMin = nut.dailyCaloriesMin;
            const calMax = nut.dailyCaloriesMax;
            this.wrapText(`每日熱量：${calMin}–${calMax} kcal（參考區間）`, maxWidth).forEach((line) => {
                this.ctx.fillText(line, contentX, drawY);
                drawY += lineH;
            });
            this.ctx.fillText(`乾糧約：${nut.foodAmountMin}–${nut.foodAmountMax} g　飲水：${nut.waterIntakeMin}–${nut.waterIntakeMax} ml`, contentX, drawY);
            drawY += lineH + 6;
            this.ctx.font = '20px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.textLight;
            this.wrapText('以上區間已依品種、年齡、體重、體型、性別綜合計算。', maxWidth).forEach((line) => {
                this.ctx.fillText(line, contentX, drawY);
                drawY += lineH - 2;
            });
        } else {
            this.ctx.fillText('請填寫體重以獲得飲食建議', contentX, drawY);
            drawY += lineH;
        }
        if (hasConditionNotes) {
            drawY += 10;
            this.ctx.font = 'bold 22px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.brandOrange;
            this.ctx.fillText('🏥 依您勾選的健康狀況，飲食與照護提醒：', contentX, drawY);
            drawY += lineH;
            this.ctx.font = '22px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.textDark;
            cond.dietaryNotes.forEach((note) => {
                this.wrapText(`· ${note}`, maxWidth).forEach((line) => {
                    this.ctx.fillText(line, contentX, drawY);
                    drawY += lineH;
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

    drawHealthTipsBlock(y) {
        const h = 268;
        const lineH = this.lineHeight;
        const gapBetweenTips = 12;
        this.drawFaintFrame(this.padding, y, this.contentWidth, h);
        const contentX = this.padding + this.innerPadding;
        const maxTextWidth = this.contentWidth - this.innerPadding * 2;
        let tipY = y + 30;
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`💊 健康提醒`, contentX, tipY);
        tipY += 28 + this.titleToContent;
        this.ctx.font = '22px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        const tips = this.data.healthTips.slice(0, 4);
        tips.forEach(tip => {
            this.wrapText(tip, maxTextWidth).forEach(line => {
                this.ctx.fillText(line, contentX, tipY);
                tipY += lineH;
            });
            tipY += gapBetweenTips;
        });
    }

    async drawFooter(footerY) {
        const y = footerY != null ? footerY : 1200;
        this.drawSectionDivider(y);
        const contentStart = y + 18;
        
        // 繪製 QR Code（連結至官網首頁，可查門市、最新消息與健康小幫手）
        const qrUrl = 'https://yichai-tw.github.io/';
        await this.drawQRCode(qrUrl, this.canvas.width - this.padding - 130, contentStart, 130);
        
        // 門市資訊
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 30px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText('📍 宜加寵物生活館', this.padding, contentStart + 40);
        
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textLight;
        this.ctx.fillText('專業、用心、愛毛孩，全台多間門市為您服務', this.padding, contentStart + 80);
        this.ctx.fillText('官網、門市與更多健康資訊請掃描 QR Code', this.padding, contentStart + 118);
        
        // 免責聲明（版面底部，固定距畫布底 20px）
        this.ctx.textAlign = 'center';
        this.ctx.font = 'italic 20px "Noto Sans TC"';
        this.ctx.fillStyle = '#999999';
        this.ctx.fillText('※ 不能取代專業獸醫，健康疑慮請諮詢獸醫或儘速就醫。', this.canvas.width / 2, this.canvas.height - 22);
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
