'use strict';

exports.WhatsWebURL = 'https://web.whatsapp.com/';

exports.DefaultOptions = {
    puppeteer: {
        headless: false,
        args: ['--start-maximized'],
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    },
    authTimeoutMs: 0,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36',
    proxyAuthentication: undefined,
    dataPath: './.lokal_sesi/', //lokasi penyimpanan browser, cache cookies pengaturan browser dan lain-lain
    IdSession: null, //nama session folder yg diinginkan, jika null otomatis nama folder 'session'

};