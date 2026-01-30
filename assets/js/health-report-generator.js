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
            textDark: '#2C3E50',
            textLight: '#64748B',
            divider: 'rgba(0,0,0,0.06)',
            frameStroke: 'rgba(0,0,0,0.08)',
            frameFill: 'rgba(255,255,255,0.7)',
            // 與網頁一致：淺底、橘點綴、深色內文
            ageCardFill: 'rgba(253,249,246,0.95)',
            stageCardFill: 'rgba(241,245,249,0.9)',
            dietHighlightFill: 'rgba(223,118,33,0.08)',
            speechBubbleFill: 'rgba(253,249,246,0.95)'
        };
    }

    async generate() {
        await this.loadAssets();
        this.drawBackground();
        this.drawHeader();
        
        let currentY = 156;

        // 1. 人類年齡＋生命階段（淺暖色卡、雙欄）
        this.drawAgeAndStageRow(currentY);
        currentY += 168 + this.sectionGap;

        // 2. 體型與活動參考（藍底白字＋白泡泡綠字＋活動條）
        if (this.data.bodyCondition) {
            this.drawBodyConditionBlock(currentY);
            currentY += 230 + this.sectionGap;
        }

        // 3. 飲食建議（全寬淡框）
        this.drawNutritionBlock(currentY);
        const nutritionHeight = (this.data.conditionAdvice && this.data.conditionAdvice.dietaryNotes && this.data.conditionAdvice.dietaryNotes.length > 0) ? 300 : 220;
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
        if (this.logo) {
            this.ctx.drawImage(this.logo, this.padding, 36, 88, 88);
        }
        this.ctx.textAlign = 'left';
        this.drawTextWithShadow('一鍵毛孩健康小幫手', 158, 88, 42, this.colors.brandOrange, 'bold');
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textLight;
        this.ctx.fillText(`生成日期：${this.data.generatedDate}`, 158, 124);
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

    /** 參考圖：單一底色卡片（無色條），用於年齡/階段、飲食、健康提醒 */
    drawTintedCard(x, y, w, h, fillStyle) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, this.colRadius);
        this.ctx.fillStyle = fillStyle;
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.restore();
    }

    /** 年齡＋生命階段合併為一張淺暖色卡，內部分雙欄 */
    drawAgeAndStageRow(y) {
        const rowHeight = 168;
        const cardInner = 38;
        const cardTop = 36;
        const titleToContentGap = 32;
        const lineH = this.lineHeight;
        const midX = this.padding + this.contentWidth / 2;
        this.drawTintedCard(this.padding, y, this.contentWidth, rowHeight, this.colors.ageCardFill);
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        const leftX = this.padding + cardInner;
        const rightX = midX + 12;
        const maxW = this.colWidth - cardInner;
        const titleY = y + cardTop;
        const contentY = titleY + titleToContentGap;
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
        const h = 230;
        const lineH = this.lineHeight;
        const contentX = this.padding + this.innerPadding;
        const innerW = w - this.innerPadding * 2;
        this.drawFaintFrame(this.padding, y, w, h);
        let drawY = y + 32;
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`體型與活動參考`, contentX, drawY);
        drawY += 26;
        this.ctx.font = '20px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textLight;
        this.ctx.fillText(bc.advice || '維持目前飲食與活動習慣', contentX, drawY);
        drawY += lineH + this.titleToContent;
        const bodyScore = bc.bodyScore != null ? bc.bodyScore : 3;
        const actScore = bc.activityScore != null ? bc.activityScore : 3;
        const bodyH = '♥'.repeat(bodyScore) + '♡'.repeat(5 - bodyScore);
        this.ctx.font = '20px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(`體型參考`, contentX, drawY);
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(` ${bodyH} (標準)`, contentX + 72, drawY);
        drawY += lineH + 6;
        if (bc.praise) {
            const bubblePad = 14;
            this.ctx.font = '22px "Noto Sans TC"';
            const bubbleW = Math.min(innerW, 440);
            const bubbleH = 40;
            this.ctx.save();
            this.ctx.fillStyle = this.colors.speechBubbleFill;
            this.ctx.beginPath();
            this.ctx.roundRect(contentX, drawY - 24, bubbleW, bubbleH, 12);
            this.ctx.fill();
            this.ctx.strokeStyle = this.colors.frameStroke;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.restore();
            this.ctx.fillStyle = this.colors.brandOrange;
            this.ctx.fillText(`💬 ${bc.praise}`, contentX + bubblePad, drawY + 4);
            drawY += bubbleH + 10;
        }
        const activityLabels = ['', '很少動', '偶爾動', '適中', '活潑', '非常活潑'];
        const activityLabel = activityLabels[Math.min(5, Math.max(1, actScore))] || '適中';
        this.ctx.font = '20px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(`運動量`, contentX, drawY);
        this.ctx.font = 'bold 24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(` ${activityLabel}`, contentX + 72, drawY);
        drawY += lineH;
        const barX = contentX + 72;
        const barY = drawY - 18;
        const segW = 28;
        const segGap = 6;
        for (let i = 0; i < 5; i++) {
            const sx = barX + i * (segW + segGap);
            this.ctx.fillStyle = i < actScore ? this.colors.brandOrange : 'rgba(0,0,0,0.1)';
            this.ctx.fillRect(sx, barY, segW, 22);
        }
    }

    drawNutritionBlock(y) {
        const nut = this.data.nutrition;
        const cond = this.data.conditionAdvice;
        const hasConditionNotes = cond && cond.dietaryNotes && cond.dietaryNotes.length > 0;
        const baseH = hasConditionNotes ? 300 : 220;
        const lineH = this.lineHeight;
        this.drawTintedCard(this.padding, y, this.contentWidth, baseH, this.colors.ageCardFill);
        const contentX = this.padding + this.innerPadding;
        const maxWidth = this.contentWidth - this.innerPadding * 2;
        let drawY = y + 32;
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`飲食建議`, contentX, drawY);
        drawY += 28 + this.titleToContent;
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        const hasNutrition = (nut.dailyCaloriesMin > 0 || nut.dailyCaloriesMax > 0);
        if (hasNutrition) {
            const calMin = nut.dailyCaloriesMin;
            const calMax = nut.dailyCaloriesMax;
            this.ctx.fillText(`每日熱量：${calMin}–${calMax} kcal（參考區間）`, contentX, drawY);
            drawY += lineH;
            this.ctx.fillText(`乾糧約：${nut.foodAmountMin}–${nut.foodAmountMax} g　飲水：${nut.waterIntakeMin}–${nut.waterIntakeMax} ml`, contentX, drawY);
            drawY += lineH + 8;
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
            drawY += 14;
            this.ctx.font = 'bold 22px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.brandOrange;
            this.ctx.fillText(`▲ 依您勾選的健康狀況，飲食與照護提醒：`, contentX, drawY);
            drawY += lineH + 6;
            const boxPad = 14;
            const boxW = maxWidth;
            this.ctx.font = '22px "Noto Sans TC"';
            let boxH = 0;
            cond.dietaryNotes.forEach((note) => {
                const lines = this.wrapText(`· ${note}`, boxW - boxPad * 2);
                boxH += lines.length * lineH;
            });
            boxH += boxPad * 2;
            const boxY = drawY - 4;
            this.ctx.save();
            this.ctx.fillStyle = this.colors.dietHighlightFill;
            this.ctx.beginPath();
            this.ctx.roundRect(contentX, boxY, boxW, boxH, 10);
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(223,118,33,0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.restore();
            this.ctx.fillStyle = this.colors.textDark;
            drawY = boxY + boxPad + 22;
            cond.dietaryNotes.forEach((note) => {
                this.wrapText(`· ${note}`, boxW - boxPad * 2).forEach((line) => {
                    this.ctx.fillText(line, contentX + boxPad, drawY);
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
        this.drawTintedCard(this.padding, y, this.contentWidth, h, this.colors.stageCardFill);
        const contentX = this.padding + this.innerPadding;
        const maxTextWidth = this.contentWidth - this.innerPadding * 2;
        let tipY = y + 32;
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`健康提醒`, contentX, tipY);
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
