const { Client, PesanMedia } = require("wabot-project");
const nomorWAbot = '628xxxxxxxxx'; //edit dahulu
const nomorWAtujuan = '628xxxxxxxxx'; //edit dahulu

const client = new Client({
    puppeteer: {
        headless: 'new',
    }
});

client.on('lakukan_pairing', async () => {
    const pairingCode = await client.pairingDenganNomor(nomorWA); // enter the target phone number
    console.log(`Nomor : ${nomorWA}\nSilahkan Lakukan Pairing, code: ${pairingCode}`);
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

    await client.kirimPesan(`${nomorWAtujuan}@c.us`, "Ready");
});

client.on('pesan_masuk', async (message) => {
    try {
        const isipesan = message.body;
        if (isipesan === '/kirimpesan') {
            await client.kirimPesan(nomorWAtujuan, "Haii Saya Bot Whatsapp by Ammar!!");
        } else if (isipesan === '/kirimgambar') {
            // const gambar = await PesanMedia.fromFilePath('gambar.jpg');
            const gambar = await PesanMedia.fromUrl('https://upload.wikimedia.org/wikipedia/commons/3/3f/JPEG_example_flower.jpg');
            await client.kirimPesan(nomorWAtujuan, gambar);
        }
    } catch (e) {
        console.log('Error 101 :', e.message);
    }
});

client.initialize();
