const { chromium } = require('./node_modules/playwright-core');

async function test() {
    console.log('Testing browser launch with channel: msedge or chrome...');
    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
        console.log('Successfully launched msedge!');
    } catch (e) {
        console.log('msedge failed, trying chrome...', e.message);
        browser = await chromium.launch({ channel: 'chrome', headless: true });
        console.log('Successfully launched chrome!');
    }
    const page = await browser.newPage();
    await page.setContent('<h1>Hello Playwright</h1>');
    const h1 = await page.textContent('h1');
    console.log('Extracted text:', h1);
    await browser.close();
    console.log('Browser test completed successfully.');
}

test().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
