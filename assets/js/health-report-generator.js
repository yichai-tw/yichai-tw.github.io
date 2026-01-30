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
        
        // 繪圖參數：縮小左右邊距以減少右側留白、區塊內留白與標題／內文間距
        this.padding = 32;
        this.innerPadding = 24;   // 區塊內左右留白，文字不貼邊
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
            headerOrangeStart: '#FF6B35',
            headerOrangeEnd: '#FF8E53',
            footerDark: '#2C3E50',
            textDark: '#2C3E50',
            textLight: '#64748B',
            bodyText: '#475569',  /* 內文用較深灰，確保任何螢幕都看得見 */
            onDarkText: '#FFFFFF',
            divider: 'rgba(0,0,0,0.06)',
            frameStroke: 'rgba(0,0,0,0.08)',
            frameFill: 'rgba(255,255,255,0.7)',
            ageCardFill: 'rgba(253,249,246,0.95)',
            stageCardFill: 'rgba(241,245,249,0.9)',
            dietHighlightFill: 'rgba(223,118,33,0.08)',
            speechBubbleFill: 'rgba(253,249,246,0.95)',
            statHighlightFill: 'rgba(255,243,224,0.95)'
        };
    }

    async generate() {
        await this.loadAssets();
        this.drawBackground();
        this.drawHeader();
        
        let currentY = 228;

        // 1. 人類年齡＋生命階段（兩張獨立卡、數字突出、右欄高亮框）
        this.drawAgeAndStageRow(currentY);
        currentY += 188 + this.sectionGap;

        // 2. 體型與活動參考（標題＋左右兩欄：體型｜運動量）
        if (this.data.bodyCondition) {
            this.drawBodyConditionBlock(currentY);
            currentY += 248 + this.sectionGap;
        }

        // 3. 飲食建議（三張小卡橫排＋照護框）
        this.drawNutritionBlock(currentY);
        const hasCondNotes = this.data.conditionAdvice && this.data.conditionAdvice.dietaryNotes && this.data.conditionAdvice.dietaryNotes.length > 0;
        const hasNut = (this.data.nutrition.dailyCaloriesMin > 0 || this.data.nutrition.dailyCaloriesMax > 0);
        const nutritionHeight = hasCondNotes ? 280 : (hasNut ? 220 : 200);
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
        const headerH = 200;
        const g = this.ctx.createLinearGradient(0, 0, 0, headerH);
        g.addColorStop(0, this.colors.headerOrangeStart);
        g.addColorStop(1, this.colors.headerOrangeEnd);
        this.ctx.fillStyle = g;
        this.ctx.fillRect(0, 0, this.canvas.width, headerH);

        const leftX = this.padding + 8;
        if (this.logo) {
            this.ctx.drawImage(this.logo, leftX, 44, 80, 80);
        } else {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255,255,255,0.95)';
            this.ctx.beginPath();
            this.ctx.arc(leftX + 40, 84, 40, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.font = '40px "Noto Sans TC"';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = this.colors.brandOrange;
            this.ctx.fillText(this.data.petInfo.emoji || '🐱', leftX + 40, 94);
            this.ctx.restore();
        }
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 36px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.onDarkText;
        this.ctx.fillText('一鍵毛孩健康小幫手', leftX + 96, 88);
        this.ctx.font = '22px "Noto Sans TC"';
        this.ctx.fillStyle = 'rgba(255,255,255,0.95)';
        this.ctx.fillText(this.data.generatedDate, leftX + 96, 122);

        const sexLabel = this.data.petInfo.sexLabel || '';
        const petMeta = sexLabel ? `${sexLabel} · ${this.data.generatedDate}` : this.data.generatedDate;
        const cardW = 340;
        const cardH = 100;
        const cardX = this.canvas.width - this.padding - cardW;
        const cardY = 50;
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255,255,255,0.25)';
        this.ctx.beginPath();
        this.ctx.roundRect(cardX, cardY, cardW, cardH, 20);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.restore();
        this.ctx.fillStyle = 'rgba(255,255,255,0.95)';
        this.ctx.beginPath();
        this.ctx.arc(cardX + 52, cardY + 50, 40, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.font = '38px "Noto Sans TC"';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(this.data.petInfo.emoji || '🐱', cardX + 52, cardY + 58);
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 28px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.onDarkText;
        this.ctx.fillText(`${this.data.petInfo.name} 的專屬報告`, cardX + 100, cardY + 42);
        this.ctx.font = '20px "Noto Sans TC"';
        this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
        this.ctx.fillText(petMeta, cardX + 100, cardY + 72);
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

    /** 年齡＋生命階段：兩張獨立卡、數字突出、右卡高亮框（參考 HTML 版） */
    drawAgeAndStageRow(y) {
        const rowHeight = 188;
        const halfW = (this.contentWidth - this.colGap) / 2;
        const leftX = this.padding;
        const rightX = this.padding + halfW + this.colGap;
        const inner = 28;
        const cardTop = 36;

        this.drawTintedCard(leftX, y, halfW, rowHeight, '#FFFFFF');
        this.drawTintedCard(rightX, y, halfW, rowHeight, '#FFFFFF');

        this.ctx.textAlign = 'center';
        this.ctx.font = '48px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(this.data.petInfo.emoji || '🐱', leftX + halfW / 2, y + 52);
        this.ctx.font = 'bold 56px "Noto Sans TC"';
        this.ctx.fillText(`${this.data.humanAge.age}`, leftX + halfW / 2, y + 108);
        this.ctx.font = '26px "Noto Sans TC"';
        this.ctx.fillText('歲', leftX + halfW / 2, y + 138);
        this.ctx.font = '20px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.bodyText;
        this.wrapText(this.data.humanAge.comparison, halfW - inner * 2).slice(0, 2).forEach((line, i) => {
            this.ctx.fillText(line, leftX + halfW / 2, y + 162 + i * 24);
        });

        this.ctx.textAlign = 'center';
        this.ctx.font = '44px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`📋 ${this.data.humanAge.stage}`, rightX + halfW / 2, y + 72);
        this.ctx.font = '20px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.bodyText;
        this.ctx.fillText('目前生命階段', rightX + halfW / 2, y + 108);
        const boxPad = 14;
        const boxW = halfW - inner * 2;
        const boxH = 44;
        const boxY = y + 124;
        const boxX = rightX + inner;
        this.ctx.save();
        this.ctx.fillStyle = this.colors.statHighlightFill;
        this.ctx.beginPath();
        this.ctx.roundRect(boxX, boxY, boxW, boxH, 12);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(223,118,33,0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.restore();
        this.ctx.font = 'bold 20px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.data.stageInfo.checkupFrequency, rightX + halfW / 2, boxY + 28);
    }

    drawBodyConditionBlock(y) {
        const bc = this.data.bodyCondition;
        if (!bc) return;
        const sectionH = 248;
        const titleH = 52;
        const cardsY = y + titleH;
        const cardsH = 192;
        const halfW = (this.contentWidth - this.colGap) / 2;
        const leftX = this.padding;
        const rightX = this.padding + halfW + this.colGap;
        const actScore = bc.activityScore != null ? bc.activityScore : 3;
        const bodyScore = bc.bodyScore != null ? bc.bodyScore : 3;
        const inner = 24;
        const lineH = 26;

        this.ctx.save();
        this.drawTintedCard(this.padding, y, this.contentWidth, sectionH, '#FFFFFF');
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`⚖️ 體型與活動`, this.padding + this.innerPadding, y + 34);
        this.drawTintedCard(leftX, cardsY, halfW, cardsH, this.colors.speechBubbleFill);
        this.drawTintedCard(rightX, cardsY, halfW, cardsH, this.colors.speechBubbleFill);

        let drawY = cardsY + 28;
        this.ctx.font = 'bold 20px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText('體型參考', leftX + inner, drawY);
        drawY += 26;
        const bodyH = '♥'.repeat(bodyScore) + '♡'.repeat(5 - bodyScore);
        this.ctx.font = '28px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(bodyH, leftX + inner, drawY);
        const bodyLabel = (bc.bodyShapeLabel && bc.bodyShapeLabel.trim()) ? ` (${bc.bodyShapeLabel.trim()})` : ' (標準)';
        const heartW = this.ctx.measureText(bodyH).width;
        this.ctx.font = '20px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(bodyLabel, leftX + inner + heartW + 10, drawY);
        drawY += lineH + 10;
        this.ctx.font = '18px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.wrapText(bc.praise || bc.advice || '持續關心體態更健康', halfW - inner * 2).forEach((line, i) => {
            this.ctx.fillText(line, leftX + inner, drawY + i * lineH);
        });

        drawY = cardsY + 28;
        this.ctx.font = 'bold 20px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText('運動量', rightX + inner, drawY);
        drawY += 26;
        const activityLabels = ['', '很少動', '偶爾動', '適中', '活潑', '非常活潑'];
        const activityLabel = activityLabels[Math.min(5, Math.max(1, actScore))] || '適中';
        this.ctx.save();
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.beginPath();
        this.ctx.roundRect(rightX + inner, drawY - 12, 90, 28, 14);
        this.ctx.fill();
        this.ctx.restore();
        this.ctx.font = 'bold 18px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.onDarkText;
        this.ctx.fillText(activityLabel, rightX + inner + 45, drawY + 6);
        drawY += 40;
        const segW = 24;
        const segGap = 6;
        const barX = rightX + inner;
        const barY = drawY;
        for (let i = 0; i < 5; i++) {
            const sx = barX + i * (segW + segGap);
            this.ctx.fillStyle = i < actScore ? this.colors.brandOrange : 'rgba(0,0,0,0.12)';
            this.ctx.fillRect(sx, barY, segW, 16);
        }
        drawY += 26;
        this.ctx.font = '18px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(actScore <= 2 ? '可適度增加日常活動' : '維持目前活動習慣', rightX + inner, drawY);
        this.ctx.restore();
    }

    drawNutritionBlock(y) {
        const nut = this.data.nutrition;
        const cond = this.data.conditionAdvice;
        const hasConditionNotes = cond && cond.dietaryNotes && cond.dietaryNotes.length > 0;
        const hasNutrition = (nut.dailyCaloriesMin > 0 || nut.dailyCaloriesMax > 0);
        const lineH = this.lineHeight;
        const cardGap = 14;
        const cardW = (this.contentWidth - cardGap * 2) / 3;
        const cardH = 100;
        const baseH = hasConditionNotes ? 280 : (hasNutrition ? 220 : 200);
        this.drawTintedCard(this.padding, y, this.contentWidth, baseH, '#FFFFFF');
        const contentX = this.padding + this.innerPadding;
        const maxWidth = this.contentWidth - this.innerPadding * 2;
        let drawY = y + 28;
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`🍽️ 飲食建議`, contentX, drawY);
        drawY += 36;
        if (hasNutrition) {
            const cx1 = this.padding + cardGap + cardW / 2;
            const cx2 = this.padding + cardGap + cardW + cardGap + cardW / 2;
            const cx3 = this.padding + cardGap * 2 + cardW * 2 + cardW / 2;
            const cardY = drawY;
            this.drawTintedCard(this.padding + cardGap, cardY, cardW, cardH, 'rgba(227,242,253,0.8)');
            this.drawTintedCard(this.padding + cardGap + cardW + cardGap, cardY, cardW, cardH, 'rgba(227,242,253,0.8)');
            this.drawTintedCard(this.padding + cardGap * 2 + cardW * 2, cardY, cardW, cardH, 'rgba(227,242,253,0.8)');
            this.ctx.textAlign = 'center';
            this.ctx.font = '32px "Noto Sans TC"';
            this.ctx.fillText('🔥', cx1, cardY + 32);
            this.ctx.fillText('🥩', cx2, cardY + 32);
            this.ctx.fillText('💧', cx3, cardY + 32);
            this.ctx.font = 'bold 26px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.textDark;
            this.ctx.fillText(`${nut.dailyCaloriesMin}–${nut.dailyCaloriesMax}`, cx1, cardY + 62);
            this.ctx.fillText(`${nut.foodAmountMin}–${nut.foodAmountMax}`, cx2, cardY + 62);
            this.ctx.fillText(`${nut.waterIntakeMin}–${nut.waterIntakeMax}`, cx3, cardY + 62);
            this.ctx.font = '17px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.textDark;
            this.ctx.fillText('kcal/日', cx1, cardY + 86);
            this.ctx.fillText('乾糧 g', cx2, cardY + 86);
            this.ctx.fillText('飲水 ml', cx3, cardY + 86);
            drawY = cardY + cardH + 18;
            this.ctx.textAlign = 'left';
            this.ctx.font = '18px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.bodyText;
            this.wrapText('以上區間已依品種、年齡、體重、體型、性別綜合計算。', maxWidth).forEach((line) => {
                this.ctx.fillText(line, contentX, drawY);
                drawY += lineH - 2;
            });
        } else {
            this.ctx.font = '22px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.textDark;
            this.ctx.fillText('請填寫體重以獲得飲食建議', contentX, drawY);
            drawY += lineH + 18;
        }
        if (hasConditionNotes) {
            drawY += 12;
            this.ctx.save();
            this.ctx.fillStyle = this.colors.dietHighlightFill;
            this.ctx.beginPath();
            this.ctx.roundRect(contentX, drawY - 2, maxWidth, 52, 12);
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(247,183,49,0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.restore();
            this.ctx.font = 'bold 18px "Noto Sans TC"';
            this.ctx.fillStyle = this.colors.textDark;
            this.ctx.fillText('⚠️ 健康狀況提醒：', contentX + 14, drawY + 18);
            this.ctx.font = '18px "Noto Sans TC"';
            this.ctx.fillText(cond.dietaryNotes[0] || '', contentX + 14, drawY + 42);
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
        const gapBetweenTips = 10;
        const leftBorderW = 6;
        this.ctx.save();
        this.drawTintedCard(this.padding, y, this.contentWidth, h, '#FFFFFF');
        const contentX = this.padding + this.innerPadding + leftBorderW + 12;
        const maxTextWidth = this.contentWidth - this.innerPadding * 2 - leftBorderW - 24;
        let tipY = y + 34;
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`🏥 健康提醒`, this.padding + this.innerPadding, tipY);
        tipY += 30 + this.titleToContent;
        this.ctx.font = '21px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        const tips = this.data.healthTips.slice(0, 4);
        tips.forEach(tip => {
            const rowY = tipY;
            const lines = this.wrapText(tip, maxTextWidth);
            const rowH = Math.max(44, lines.length * lineH + 16);
            this.ctx.fillStyle = this.colors.brandOrange;
            this.ctx.fillRect(this.padding + this.innerPadding, rowY - 12, leftBorderW, rowH);
            this.ctx.fillStyle = this.colors.textDark;
            lines.forEach(line => {
                this.ctx.fillText(line, contentX, tipY);
                tipY += lineH;
            });
            tipY += gapBetweenTips;
        });
        this.ctx.restore();
    }

    async drawFooter(footerY) {
        const y = footerY != null ? footerY : 1200;
        const footerH = 150;
        this.ctx.save();
        this.ctx.fillStyle = this.colors.footerDark;
        this.ctx.fillRect(0, y, this.canvas.width, footerH);
        this.ctx.restore();
        const contentStart = y + 32;
        const qrSize = 108;
        const qrX = this.canvas.width - this.padding - qrSize - 8;
        const textMaxW = qrX - this.padding - 24;
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 28px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.onDarkText;
        this.ctx.fillText('🏥 宜加寵物生活館', this.padding, contentStart + 38);
        this.ctx.font = '20px "Noto Sans TC"';
        this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
        this.wrapText('專業、用心、愛毛孩，全台多門市為您服務', textMaxW).forEach((line, i) => {
            this.ctx.fillText(line, this.padding, contentStart + 72 + i * 28);
        });
        this.wrapText('官網、門市與更多健康資訊請掃描 QR Code', textMaxW).forEach((line, i) => {
            this.ctx.fillText(line, this.padding, contentStart + 108 + i * 28);
        });
        const qrUrl = 'https://yichai-tw.github.io/';
        await this.drawQRCode(qrUrl, qrX, contentStart, qrSize);
        this.ctx.restore();
        this.ctx.textAlign = 'center';
        this.ctx.font = 'italic 20px "Noto Sans TC"';
        this.ctx.fillStyle = '#555555';
        this.ctx.fillText('※ 不能取代專業獸醫，健康疑慮請諮詢獸醫或儘速就醫。', this.canvas.width / 2, this.canvas.height - 36);
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
