# 1. استفاده از نسخه پایدار و سازگار Node.js
FROM node:18-bullseye-slim

# 2. نصب تمام کتابخانه‌های سیستمی مورد نیاز برای مرورگر Chromium
RUN apt-get update && apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 \
  libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 \
  libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
  libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
  libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
  libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# 3. ایجاد پوشه کاری
WORKDIR /usr/src/app

# 4. کپی کردن فایل‌های شناسنامه پروژه
COPY package*.json ./

# 5. نصب وابستگی‌های Node.js (express و puppeteer)
RUN npm install

# 6. کپی کردن بقیه کدهای پروژه
COPY . .

# 7. دستور نهایی برای اجرای سرور
CMD ["node", "index.js"]
