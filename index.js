const express = require('express');
const puppeteer = require('puppeteer');

// پلتفرم‌های ابری مانند لیارا و Render به صورت خودکار پورت را از طریق متغیر محیطی PORT تنظیم می‌کنند.
// استفاده از 3000 به عنوان پورت پیش‌فرض برای تست‌های محلی رایج است.
const PORT = process.env.PORT || 3000;

const app = express();

// افزایش محدودیت حجم بدنه درخواست (request body) به ۱۰ مگابایت.
// این کار برای ارسال کدهای HTML و CSS حجیم ضروری است.
app.use(express.json({ limit: '10mb' }));

/**
 * Endpoint اصلی برای تولید تصویر
 * آدرس: POST /generate-image
 * ورودی (JSON): { html, css, google_fonts, viewport_width, viewport_height }
 */
app.post('/generate-image', async (req, res) => {
    // دریافت پارامترها از بدنه درخواست برای انعطاف‌پذیری کامل
    const { html, css, google_fonts, viewport_width, viewport_height } = req.body;

    // بررسی وجود پارامتر الزامی HTML
    if (!html) {
        return res.status(400).json({ error: 'محتوای HTML الزامی است (HTML content is required).' });
    }

    let browser;
    try {
        console.log("در حال اجرای مرورگر (Puppeteer)...");
        
        // تنظیمات کلیدی برای اجرای پایدار Puppeteer در محیط‌های Docker، لیارا و Render
        browser = await puppeteer.launch({
            // استفاده از حالت "headless" جدید که بهینه‌تر است
            headless: 'new', 
            
            // آرگومان‌های حیاتی برای اجرا در محیط‌های لینوکسی محدود و اشتراکی
            args: [
                '--no-sandbox',                 // مهم‌ترین فلگ برای اجرا در Docker
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',      // جلوگیری از خطاهای مربوط به حافظه مشترک در Docker
                '--single-process'              // کاهش مصرف حافظه در پلن‌های اقتصادی
            ]
        });

        const page = await browser.newPage();
        
        // استفاده از ابعاد داینامیک دریافت شده از درخواست، یا استفاده از مقادیر پیش‌فرض
        const width = viewport_width || 1080;
        const height = viewport_height || 1920;

        console.log(`در حال تنظیم ابعاد صفحه به: ${width}x${height}`);
        await page.setViewport({ width, height });

        // ساخت HTML نهایی با قابلیت تزریق فونت گوگل به صورت داینامیک
        const finalHtml = `
            <html>
                <head>
                    <meta charset="UTF-8">
                    ${google_fonts ? `<link href="https://fonts.googleapis.com/css2?family=${google_fonts.replace(/ /g, '+')}:wght@400;500;700;900&display=swap" rel="stylesheet">` : ''}
                    <style>${css || ''}</style>
                </head>
                <body>
                    ${html}
                </body>
            </html>`;

        console.log("در حال بارگذاری محتوای HTML در صفحه...");
        // منتظر می‌مانیم تا تمام درخواست‌های شبکه (مانند لود شدن فونت) به پایان برسند
        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

        console.log("در حال گرفتن اسکرین‌شات با فرمت PNG...");
        const imageBuffer = await page.screenshot({ type: 'png' });

        // بستن مرورگر برای آزاد کردن منابع سیستم
        await browser.close();
        console.log("مرورگر با موفقیت بسته شد. در حال ارسال تصویر...");

        // تنظیم هدر پاسخ به عنوان تصویر PNG و ارسال بافر تصویر
        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);

    } catch (error) {
        console.error('خطای جدی در فرآیند تولید تصویر:', error);
        
        // اطمینان از بسته شدن مرورگر حتی در صورت بروز خطا برای جلوگیری از نشت حافظه
        if (browser) {
            await browser.close();
        }
        
        // ارسال یک پاسخ خطای واضح‌تر با فرمت JSON برای دیباگ آسان‌تر
        res.status(500).json({ 
            error: 'عملیات تولید تصویر با شکست مواجه شد (Failed to generate image).', 
            details: error.message 
        });
    }
});

// اجرای سرور و گوش دادن به درخواست‌ها روی پورت مشخص شده
app.listen(PORT, () => {
    console.log(`سرویس تولید تصویر بر روی پورت ${PORT} با موفقیت اجرا شد و آماده دریافت درخواست است.`);
});
