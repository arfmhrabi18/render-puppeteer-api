const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 10000; // Render از این پورت استفاده می‌کند

app.use(express.json({ limit: '10mb' }));

app.post('/generate-image', async (req, res) => {
    const { html, css } = req.body;

    if (!html) {
        return res.status(400).send({ error: 'HTML content is required.' });
    }

    let browser;
    try {
        console.log("Launching browser...");
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        console.log("Setting viewport...");
        await page.setViewport({ width: 1080, height: 1920 });

        const fullHtml = `<html><head><style>${css || ''}</style></head><body>${html}</body></html>`;

        console.log("Setting HTML content...");
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
        
        console.log("Taking screenshot...");
        const imageBuffer = await page.screenshot({ type: 'png' });
        
        await browser.close();
        console.log("Browser closed. Sending image.");

        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);

    } catch (error) {
        console.error('Error generating image:', error);
        if (browser) await browser.close();
        res.status(500).send({ error: 'Failed to generate image.', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Image generation API is running on port ${PORT}`);
});
