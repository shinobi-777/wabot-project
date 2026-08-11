const { Client } = require("wabot-project");
const nomorWA = '628xxxxxxxxx'; //ganti dengan nomor bot whatsapp milikmu
let pairingCodeRequested = false;

const client = new Client({
    puppeteer: {
        headless: 'new',
    }
});

client.on('lakukan_pairing', async () => {
    const pairingCodeEnabled = true;
    if (pairingCodeEnabled && !pairingCodeRequested) {
        const pairingCode = await client.pairingDenganNomor(nomorWA); // enter the target phone number
        console.log(`Nomor : ${nomorWA}\nSilahkan Lakukan Pairing, code: ${pairingCode}`);
        pairingCodeRequested = true;
    }
});


client.on('loading_screen', (percent, message) => {
    console.log('[LOADING]', percent, "%");
});

client.on('siap', async () => {
    let info = client.info;
    console.log(
        `[READY] CLIENT INFO :

    NAMA : ${(info.pushname).toUpperCase()}
    LID : +${info.wid.user}
    DEVICE : ${(info.platform).toUpperCase()}`);

    await client.kirimPesan('628xxxx', "Ready"); //ganti 628xxxx dengan nomor tujuan untuk mengirim pesan bahwa bot sudah Ready
});

client.on('pesan_masuk', async (message) => {
    try {
        console.log(message);
    } catch (e) {
        console.log('Error 101 :', e.message);
    }
});

client.initialize();
