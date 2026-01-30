/**
 * 寵物健康報告圖片生成器 (Pet Health Report Canvas Generator)
 * 用途：將報告資料繪製成 Canvas 並導出圖片
 */

class PetHealthReportGenerator {
    constructor(reportData) {
        this.data = reportData;
        this.canvas = document.getElementById('reportCanvas') || document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1080;
        this.canvas.height = 1440;
        
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
        
        // 初始繪圖高度
        let currentY = 220;

        // 1. 人類年齡卡片
        this.drawAgeCard(currentY);
        currentY += 220;

        // 2. 生命階段卡片
        this.drawStageCard(currentY);
        currentY += 220;

        // 3. 體況評估卡片 (如果有資料)
        if (this.data.bodyCondition) {
            this.drawBodyConditionCard(currentY);
            currentY += 220;
        }

        // 4. 飲食建議卡片
        this.drawNutritionCard(currentY);
        currentY += 220;

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
        // 繪製 Logo
        if (this.logo) {
            this.ctx.drawImage(this.logo, this.padding, 50, 100, 100);
        }

        // 標題
        this.ctx.textAlign = 'left';
        this.drawTextWithShadow('一鍵毛孩健康小幫手', 170, 105, 48, this.colors.brandOrange, 'bold');
        
        // 生成日期
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textLight;
        this.ctx.fillText(`生成日期：${this.data.generatedDate}`, 170, 145);
        
        // 寵物名字與種類
        const petTitle = `${this.data.petInfo.emoji} ${this.data.petInfo.name} 的專屬報告`;
        this.ctx.textAlign = 'right';
        this.ctx.font = 'bold 32px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(petTitle, this.canvas.width - this.padding, 125);
    }

    drawAgeCard(y) {
        const height = 180;
        this.drawRoundedCard(this.padding, y, this.canvas.width - this.padding * 2, height, this.cardRadius, this.colors.cardBg);
        
        const contentX = this.padding + 40;
        const contentY = y + 70;
        
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 36px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`${this.data.petInfo.emoji} 相當於人類 ${this.data.humanAge.age} 歲`, contentX, contentY);
        
        this.ctx.font = '32px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(this.data.humanAge.comparison, contentX, contentY + 60);
    }

    drawStageCard(y) {
        const height = 180;
        this.drawRoundedCard(this.padding, y, this.canvas.width - this.padding * 2, height, this.cardRadius, this.colors.cardBg);
        
        const contentX = this.padding + 40;
        const contentY = y + 70;
        
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 36px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`📋 目前生命階段：${this.data.humanAge.stage}`, contentX, contentY);
        
        this.ctx.font = '28px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(`建議健檢頻率：${this.data.stageInfo.checkupFrequency}`, contentX, contentY + 60);
    }

    drawBodyConditionCard(y) {
        const height = 180;
        this.drawRoundedCard(this.padding, y, this.canvas.width - this.padding * 2, height, this.cardRadius, this.colors.cardBg);
        
        const contentX = this.padding + 40;
        const contentY = y + 70;
        const bcs = this.data.bodyCondition;
        
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 36px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`⚖️ 體況評估：${bcs.description} (BCS ${bcs.score}/9)`, contentX, contentY);
        
        this.ctx.font = '28px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        this.ctx.fillText(`建議：${bcs.advice}`, contentX, contentY + 60);
    }

    drawNutritionCard(y) {
        const height = 180;
        this.drawRoundedCard(this.padding, y, this.canvas.width - this.padding * 2, height, this.cardRadius, this.colors.cardBg);
        
        const contentX = this.padding + 40;
        const contentY = y + 70;
        const nut = this.data.nutrition;
        
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 36px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`🍲 每日飲食建議`, contentX, contentY);
        
        this.ctx.font = '28px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        
        if (nut.dailyCalories > 0) {
            const text = `熱量：${nut.dailyCalories} kcal | 乾糧：約 ${nut.foodAmount} g | 飲水：${nut.waterIntake} ml`;
            this.ctx.fillText(text, contentX, contentY + 60);
        } else {
            this.ctx.fillText('請填寫體重以獲得精確建議', contentX, contentY + 60);
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
        const height = 320;
        this.drawRoundedCard(this.padding, y, this.canvas.width - this.padding * 2, height, this.cardRadius, this.colors.cardBg);
        
        const contentX = this.padding + 40;
        const maxTextWidth = this.canvas.width - this.padding * 2 - 80;
        const lineHeight = 28;
        const gapBetweenTips = 8;
        let contentY = y + 70;
        
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 36px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText(`💊 健康提醒`, contentX, contentY);
        
        this.ctx.font = '26px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textDark;
        
        contentY += 52;
        const tips = this.data.healthTips.slice(0, 4);
        tips.forEach(tip => {
            const lines = this.wrapText(tip, maxTextWidth);
            lines.forEach(line => {
                this.ctx.fillText(line, contentX, contentY);
                contentY += lineHeight;
            });
            contentY += gapBetweenTips;
        });
    }

    async drawFooter() {
        const y = 1250;
        
        // 繪製 QR Code
        const qrUrl = 'https://yichai-tw.github.io/health-report.html';
        await this.drawQRCode(qrUrl, this.canvas.width - this.padding - 150, y, 150);
        
        // 門市資訊
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 32px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.brandOrange;
        this.ctx.fillText('📍 宜加寵物生活館', this.padding, y + 40);
        
        this.ctx.font = '24px "Noto Sans TC"';
        this.ctx.fillStyle = this.colors.textLight;
        this.ctx.fillText('專業、用心、愛毛孩，全台多間門市為您服務', this.padding, y + 85);
        this.ctx.fillText('更多健康資訊請掃描 QR Code', this.padding, y + 130);
        
        // 免責聲明
        this.ctx.textAlign = 'center';
        this.ctx.font = 'italic 20px "Noto Sans TC"';
        this.ctx.fillStyle = '#999999';
        this.ctx.fillText('※ 本報告僅供參考，不能取代專業獸醫診斷。如有健康疑慮，請儘速就醫。', this.canvas.width / 2, 1410);
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
            
            // 等待 QRCode 生成
            let attempts = 0;
            let qrImg = null;
            
            while (attempts < 10) {
                qrImg = qrContainer.querySelector('img');
                if (qrImg && qrImg.src && qrImg.src.startsWith('data:image')) break;
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (qrImg && qrImg.src) {
                const img = await this.loadImage(qrImg.src);
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
