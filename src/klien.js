'use strict';

const EventEmitter = require('events');
// const puppeteer = require('puppeteer');
let puppeteer = null;
const { WhatsWebURL, DefaultOptions, logInfo, logError, exposeFunctionIfAbsent, Util } = require('./util');
const { ConsoleWindowF12 } = require('./console/window');
const { PesanMedia } = require('./structures');

const path = require('path');
const fs = require('fs');

class Client extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = Util.mergeDefault(DefaultOptions, options);

        /**
         * @type {puppeteer.Browser}
         */
        this.pupBrowser = null;
        /**
         * @type {puppeteer.Page}
         */
        this.pupPage = null;

        this.currentIndexHtml = null;
        this.lastLoggedOut = false;

        Util.setFfmpegPath(this.options.ffmpegPath);

        this.dataPath = this.options.dataPath
        this.clientId = this.options.IdSession
    }

    async initialize() {

        if (!puppeteer) {
            const puppeteerModule = await import('puppeteer');
            puppeteer = puppeteerModule.default || puppeteerModule;
        }

        let browser, page;

        browser = null;
        page = null;

        await this.persiapanPenyimpananBrowser();

        const puppeteerOpts = this.options.puppeteer;
        if (puppeteerOpts && puppeteerOpts.browserWSEndpoint) {
            browser = await puppeteer.connect(puppeteerOpts);
            page = await browser.newPage();
        } else {
            const browserArgs = [...(puppeteerOpts.args || [])];
            if (!browserArgs.find(arg => arg.includes('--user-agent'))) {
                browserArgs.push(`--user-agent=${this.options.userAgent}`);
                // logInfo(`--user-agent=${this.options.userAgent}`);
            }
            // navigator.webdriver fix
            browserArgs.push('--disable-blink-features=AutomationControlled');

            browser = await puppeteer.launch({ ...puppeteerOpts, args: browserArgs });
            page = (await browser.pages())[0];
        }

        if (this.options.proxyAuthentication !== undefined) {
            await page.authenticate(this.options.proxyAuthentication);
        }

        await page.setUserAgent(this.options.userAgent);
        if (this.options.bypassCSP) await page.setBypassCSP(true);
        const { width, height } = await page.evaluate(() => {
            return { width: window.screen.availWidth, height: window.screen.availHeight };
        });

        // Terapkan ukuran layar ke viewport
        await page.setViewport({ width, height });

        this.pupBrowser = browser;
        this.pupPage = page;

        await page.goto(WhatsWebURL, {
            waitUntil: 'load',
            timeout: 0,
            referer: 'https://whatsapp.com/'
        });

        await this.cekStatusLogin();

        // this.pupPage.on('framenavigated', async (frame) => {
        //     if (frame.url().includes('post_logout=1') || this.lastLoggedOut) {
        //         this.lastLoggedOut = false;
        //     }
        //     await this.cekStatusLogin();
        // });
    }

    async cekModulWindowWAWEB() {
        const hasil = await this.pupPage.evaluate(() => {
            const hasil = {};
            const modul = [
                'statusLogin',
                'codePairingApi',
                'user',
                'koneksi',
                'cmd',
                'offlineHandler',
                'Store',
                'widFactory',
                'findChat',
                'msgKey',
                'EphemeralFields',
                'pesanMasuk',
                'OpaqueData',
                'prepRawMedia',
                'MediaStorage',
                'MediaType',
                'MediaDataUtils',
                'MediaInMemoryBlobCache',
                'MediaMmsV4Upload'
            ];

            for (const nama of modul) {
                try {
                    // Jalankan ConsoleWindowF12
                    // dan cek apakah variabel tersedia
                    if (
                        typeof konsol !== 'undefined' &&
                        konsol[nama] !== undefined &&
                        konsol[nama] !== null
                    ) {
                        hasil[nama] = true;
                    } else {
                        hasil[nama] = false;
                    }
                } catch (error) {
                    hasil[nama] = false;
                }
            }
            return hasil;
        });

        console.log('============================================================');
        console.log('PENGECEKAN KETERSEDIAAN MODUL WINDOW WAWEB PADA WHATSAPP WEB');
        console.log('============================================================');

        for (const [nama, tersedia] of Object.entries(hasil)) {
            if (tersedia) {
                console.log(`✅ ${nama}`);
            } else {
                console.log(`❌ ${nama}`);
            }
        }
    }

    async cekStatusLogin() {
        await this.pupPage.waitForFunction('window.Debug?.VERSION != undefined', { timeout: this.options.authTimeoutMs });
        const version = await this.pupPage.evaluate(() => {
            return window.Debug.VERSION;
        });
        logInfo('Versi Whatsapp Web saat ini : ' + version);

        await this.pupPage.evaluate(ConsoleWindowF12);
        await this.cekModulWindowWAWEB();

        const perluOtentikasi = await this.pupPage.evaluate(async () => {
            let status = konsol.statusLogin.state; //kalau sudah login "CONNECTED"

            if (status === 'OPENING' || status === 'UNLAUNCHED' || status === 'PAIRING') {
                // wait till status changes
                await new Promise(r => {
                    konsol.statusLogin.on('change:state', function waitTillInit(_AppState, state) {
                        if (state !== 'OPENING' && state !== 'UNLAUNCHED' && state !== 'PAIRING') {
                            konsol.statusLogin.off('change:state', waitTillInit);
                            r();
                        }
                    });
                });
            }
            status = konsol.statusLogin.state;
            return status == 'UNPAIRED' || status == 'UNPAIRED_IDLE';
        });

        if (perluOtentikasi) {
            const pairing = await this.pupPage.evaluate(() => {
                return typeof window.onQRChangedEvent !== 'undefined';
            });
            if (!pairing) {
                this.emit('lakukan_pairing');
            }

            await this.pupPage.evaluate(() => {
                return new Promise(resolve => {
                    const listener = (_model, state) => {
                        if (state === 'CONNECTED') {
                            konsol.statusLogin.off(
                                'change:state',
                                listener
                            );

                            resolve();
                        }
                    };
                    konsol.statusLogin.on(
                        'change:state',
                        listener
                    );
                });
            });
            console.log(
                '[AUTH] Pairing berhasil'
            );
            await this.tungguSiap();
        } else {
            await this.tungguSiap();
        }
    }

    async pairingDenganNomor(phoneNumber, showNotification = true) {
        return await this.pupPage.evaluate(async (phoneNumber, showNotification) => {
            konsol.codePairingApi.setPairingType('ALT_DEVICE_LINKING');
            await konsol.codePairingApi.initializeAltDeviceLinking();
            return konsol.codePairingApi.startAltLinkingFlow(phoneNumber, showNotification);
        }, phoneNumber, showNotification);
    }

    async tungguSiap() {
        let lastPercent = null;
        let loadingResolve;

        const loadingFinished = new Promise(resolve => {
            loadingResolve = resolve;
        });
        await exposeFunctionIfAbsent(
            this.pupPage,
            'onOfflineProgressUpdateEvent',
            async (percent) => {
                if (lastPercent !== percent) {
                    lastPercent = percent;
                    this.emit('loading_screen', percent, 'WhatsApp'); // Message is hardcoded as "WhatsApp" for now

                    if (percent >= 99) {
                        loadingResolve();
                    }
                }
            },
        );
        await exposeFunctionIfAbsent(
            this.pupPage,
            'onLogoutEvent',
            async () => {
                this.lastLoggedOut = true;
                await this.pupPage
                    .waitForNavigation({ waitUntil: 'load', timeout: 5000 })
                    .catch((_) => _);
            },
        );
        await this.pupPage.evaluate(() => {
            konsol.cmd.on('offline_progress_update_from_bridge', () => {
                window.onOfflineProgressUpdateEvent(
                    konsol.offlineHandler.getOfflineDeliveryProgress()
                );
            });
            konsol.cmd.on('logout', async () => {
                await window.onLogoutEvent();
            });
            konsol.cmd.on('logout_from_bridge', async () => {
                await window.onLogoutEvent();
            });
        });

        await Promise.race([
            loadingFinished,
            new Promise(resolve =>
                setTimeout(resolve, 30000)
            )
        ]);

        console.log('[INITIALIZING] Sync WhatsApp...');
        let lastCount = -1;
        let stableCount = 0;
        while (stableCount < 5) {
            const count = await this.pupPage.evaluate(() => {
                try {
                    return konsol.Store.Chat._models.length;
                } catch {
                    return 0;
                }
            });
            if (count === lastCount) {
                stableCount++;
            } else {
                stableCount = 0;
                lastCount = count;
            }
            await new Promise(r =>
                setTimeout(r, 1000)
            );
        }
        console.log(
            '[SYNC] Chat selesai dimuat'
        );
        this.info = await this.pupPage.evaluate(() => {
            const me =
                konsol.user.getMaybeMePnUser?.()
                || konsol.user.getMaybeMeLidUser?.();
            return {
                ...konsol.koneksi.serialize(),
                wid: me
            };
        });
        this.emit('siap');
        await this.monitorPesanMasuk();
    }

    async persiapanPenyimpananBrowser() {
        const puppeteerOpts = this.options.puppeteer;
        const sessionDirName = this.clientId ? `session-${this.clientId}` : 'session';
        const dirPath = path.join(this.dataPath, sessionDirName);

        if (puppeteerOpts.userDataDir && puppeteerOpts.userDataDir !== dirPath) {
            throw new Error('LocalAuth is not compatible with a user-supplied userDataDir.');
        }

        fs.mkdirSync(dirPath, { recursive: true });

        this.options.puppeteer = {
            ...puppeteerOpts,
            userDataDir: dirPath
        };

        this.userDataDir = dirPath;
    }

    async monitorPesanMasuk() {
        await this.pupPage.exposeFunction('event_pesan', pesan_baru => {
            let msg = {};
            msg.id = pesan_baru.id;
            msg.type = pesan_baru.type;
            msg.notifyName = pesan_baru.notifyName;
            msg.from = pesan_baru.from;
            msg.to = pesan_baru.to;
            msg.body = pesan_baru.body;
            msg.timestamp = pesan_baru.t;
            msg.author = pesan_baru.author;
            msg.isForwarded = pesan_baru.isForwarded;


            if (pesan_baru.type !== 'chat') {
                msg.caption = pesan_baru.caption;
                msg.deprecatedMms3Url = pesan_baru.deprecatedMms3Url;
                msg.directPath = pesan_baru.directPath;
                msg.mimetype = pesan_baru.mimetype;
                msg.filehash = pesan_baru.filehash;
                msg.encFilehash = pesan_baru.encFilehash;
                msg.size = pesan_baru.size;
                msg.filename = pesan_baru.filename;
                msg.mediaKey = pesan_baru.mediaKey;
                msg.mediaKeyTimestamp = pesan_baru.mediaKeyTimestamp;
                msg.pageCount = pesan_baru.pageCount;
            }

            this.emit('pesan_masuk', msg);
        });

        await this.pupPage.evaluate(() => {
            konsol.pesanMasuk.on('add', (obj_pesan) => {
                if (obj_pesan.isNewMsg) {
                    const msg = obj_pesan.serialize();
                    msg.isEphemeral = obj_pesan.isEphemeral;
                    msg.isStatusV3 = obj_pesan.isStatusV3;

                    if (msg.buttons) {
                        msg.buttons = msg.buttons.serialize();
                    }
                    if (msg.dynamicReplyButtons) {
                        msg.dynamicReplyButtons = JSON.parse(JSON.stringify(msg.dynamicReplyButtons));
                    }
                    if (msg.replyButtons) {
                        msg.replyButtons = JSON.parse(JSON.stringify(msg.replyButtons));
                    }

                    if (typeof msg.id.remote === 'object') {
                        msg.id = Object.assign({}, msg.id, { remote: msg.id.remote._serialized });
                    }

                    delete msg.pendingAckUpdate;
                    // console.log('ada pesan baru masuk', Object.assign({},msg));
                    window.event_pesan(msg);
                }
            });
        });
    }

    async kirimPesan(pesandari, isipesan, options = {}) {
        let internalOptions = {
            sendMediaAsSticker: options.sendMediaAsSticker,
            sendMediaAsDocument: options.sendMediaAsDocument,
            sendMediaAsHd: options.sendMediaAsHd,
            caption: options.caption,
            isCaptionByUser: options.caption ? true : false,
            waitUntilMsgSent: options.waitUntilMsgSent || false,
        };

        if (isipesan instanceof PesanMedia) {
            internalOptions.media = isipesan;
            ((internalOptions.isViewOnce = options.isViewOnce), (isipesan = ''));
        } else if (options.media instanceof PesanMedia) {
            internalOptions.media = options.media;
            internalOptions.caption = isipesan;
            ((internalOptions.isViewOnce = options.isViewOnce), (isipesan = ''));
        }

        const result = await this.pupPage.evaluate(async (pesandari, isipesan, options) => {
            try {
                let chat = null;
                // for (let i = 0; i < 30; i++) {
                //     chat = konsol.Store.Chat.getLatestChatForWid(
                //         konsol.widFactory.createWid(pesandari)
                //     );
                //     if (chat) {
                //         break;
                //     }
                //     await new Promise(r =>
                //         setTimeout(r, 1000)
                //     );
                // }

                const chatWid = konsol.widFactory.createWid(pesandari);
                chat =
                    konsol.Store.Chat.get(chatWid) ||
                    (
                        await konsol.findChat.findOrCreateLatestChat(chatWid)
                    )?.chat;

                if (!chat) {
                    throw new Error(
                        `Chat tidak ditemukan: ${pesandari}`
                    );
                }

                const { getMaybeMeLidUser, getMaybeMePnUser } = konsol.user;

                const lidUser = getMaybeMeLidUser();
                const meUser = getMaybeMePnUser();
                let from = chat.id.isLid() ? lidUser : meUser;

                if (!from) {
                    throw new Error('meUser ataupun lidUser tidak ditemukan');
                }
                const newId = await konsol.msgKey.newId();
                const newMsgId = new konsol.msgKey({
                    from: from,
                    to: chat.id,
                    id: newId,
                    participant: chat.id.isGroup()
                        ? meUser
                        : undefined,
                    selfDir: 'out'
                });
                let ephemeralFields = {};
                if (
                    konsol.EphemeralFields &&
                    typeof konsol.EphemeralFields.getEphemeralFields === 'function'
                ) {
                    ephemeralFields =
                        konsol.EphemeralFields.getEphemeralFields(chat);
                }

                let mediaOptions = {};
                if (options.media) {
                    mediaOptions =
                        options.sendMediaAsSticker
                            ? await konsol.processStickerData(options.media)
                            : await konsol.processMediaData(options.media, {
                                forceSticker: options.sendMediaAsSticker,
                                forceDocument: options.sendMediaAsDocument,
                                forceMediaHd: options.sendMediaAsHd,
                            });
                    mediaOptions.caption = options.caption;
                    isipesan = options.sendMediaAsSticker
                        ? undefined
                        : mediaOptions.preview;
                    mediaOptions.isViewOnce = options.isViewOnce;
                    delete options.media;
                    delete options.sendMediaAsSticker;
                }

                const message = {
                    ...options,
                    id: newMsgId,
                    ack: 0,
                    body: isipesan,
                    from: from,
                    to: chat.id,
                    local: true,
                    self: 'out',
                    t: parseInt(new Date().getTime() / 1000),
                    isNewMsg: true,
                    type: 'chat',
                    ...ephemeralFields,
                    ...mediaOptions,
                    ...(mediaOptions.toJSON ? mediaOptions.toJSON() : {}),
                };

                const [msgPromise, sendMsgResultPromise] = window
                    .require('WAWebSendMsgChatAction')
                    .addAndSendMsgToChat(chat, message);
                await msgPromise;

                if (options.waitUntilMsgSent) await sendMsgResultPromise;

                return window
                    .require('WAWebCollections')
                    .Msg.get(newMsgId.$1);

            } catch (err) {
                return {
                    success: false,
                    error: err.message,
                    stack: err.stack
                };
            }
        }, pesandari, isipesan, internalOptions);

        return result;
    }

    async logout() {
        if (this.userDataDir) {
            await fs.promises.rm(this.userDataDir, { recursive: true, force: true })
                .catch((e) => {
                    throw new Error(e);
                });
        }
    }
}

module.exports = Client;