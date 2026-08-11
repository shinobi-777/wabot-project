# Wabot Project

**Wabot Project** adalah library bot WhatsApp Web berbasis Node.js yang dibuat dalam versi **mini dan ringan**.

Project ini dirancang dengan tujuan menyediakan fungsi dasar WhatsApp Web tanpa membawa terlalu banyak fitur yang tidak diperlukan. Karena itu, sebagian fungsi yang umumnya tersedia pada library bot WhatsApp yang lebih lengkap sengaja dihilangkan agar project tetap sederhana dan fokus pada kebutuhan utama.

## ✨ Fitur

Wabot Project saat ini berfokus pada fungsi dasar berikut:

* 📩 Menerima pesan teks
* 💬 Mengirim pesan teks
* 📎 Menerima file
* 🖼️ Menerima gambar
* 📄 Menerima dokumen
* 📤 Mengirim gambar
* 📤 Mengirim dokumen
* 🔄 Berkomunikasi melalui WhatsApp Web
* 🪶 Struktur library yang relatif ringan dan sederhana

### Batasan Fitur

Wabot Project **bukan library WhatsApp bot lengkap**.

Banyak fungsi yang terdapat pada library WhatsApp Web yang lebih besar sengaja tidak disertakan. Project ini hanya mempertahankan fungsi yang dianggap penting untuk kebutuhan bot sederhana, terutama:

> **Text Message + Image + Document**

Fitur seperti audio, video, sticker, group management, reaction, polling, presence, dan berbagai fungsi WhatsApp lainnya tidak menjadi fokus project ini.

Dengan pendekatan tersebut, project diharapkan lebih mudah dipahami, digunakan, dan dikembangkan sesuai kebutuhan.

---

# 📦 Instalasi

Wabot Project dapat dipasang langsung dari repository GitHub menggunakan NPM.

```bash
npm install https://github.com/shinobi-777/wabot-project.git
atau
npm install https://github.com/shinobi-777/wabot-project/archive/refs/heads/main.tar.gz
```

Setelah proses instalasi selesai, library akan tersedia di folder project kamu:

```text
node_modules/wabot-project/
app.js
```

Dependency yang tercantum pada `package.json` akan dipasang oleh NPM secara otomatis.

---

# 🚀 Penggunaan

Package entry point berada pada:

```text
app.js
- Pastikan app.js sudah diedit sesuai nomor WA yang akan dijadikan Bot.
- Saat app.js dijalankan pertama kali akan meminta autentikasi dengan mengirimkan kode tautan.
- Pairing hanya menggunakan Kode Tautan bukan Scan Barcode!!
- Tautkan Perangkat pada Whatsapp telepon dengan memilih Tautkan By Nomor Telepon.
- Lalu masukan kode yang muncul pada terminal.
```

Setelah berhasil di Install lalu buat edit file app.js yang sudah tersedia:

```js
const nomorWAbot = '628xxxxxxxxx'; //ganti dengan nomor bot whatsapp milikmu
const nomorWAtujuan = '628xxxxxxxxx'; //ganti dengan nomor tujuan untuk mengirim pesan bahwa bot sudah Ready
```

Setelah app.js berhasil diedit lalu jalankan program lewat terminal dengan perintah:

```bash
node --no-deprecation app.js
```

Contoh sederhana isi file app.js:

```js
const { Client, PesanMedia } = require("wabot-project");
const nomorWAbot = '628xxxxxxxxx';
const nomorWAtujuan = '628xxxxxxxxx';

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

```

> API dan struktur penggunaan dapat berkembang seiring pengembangan project.

---

# 📁 Struktur Project

Struktur utama project kurang lebih terdiri dari:

```text
wabot-Project/
├── index.js
├── package.json
├── README.md
├── .gitignore
├── .npmignore
└── src/
    ├── console/
    ├── structures/
    └── util/
```

### `index.js`

Merupakan entry point utama package dan menyediakan export yang dapat digunakan oleh project lain.

### `src/structures/`

Berisi struktur/class yang digunakan oleh Wabot Project, termasuk pengelolaan pesan dan media.

### `src/util/`

Berisi fungsi utilitas dan konfigurasi yang digunakan oleh project.

---

# ⚙️ Dependency

Project ini menggunakan beberapa library Node.js untuk menjalankan fungsinya:

* **Puppeteer** — digunakan untuk menjalankan dan mengendalikan browser.
* **node-fetch** — digunakan untuk kebutuhan pengambilan data melalui HTTP.
* **mime** — digunakan untuk membantu mengenali MIME type file.
* **fluent-ffmpeg** — digunakan sebagai bagian dari utilitas media yang tersedia pada source project.

Dependency akan di-install otomatis ketika project dipasang melalui NPM.

---

# ⚠️ Catatan

Wabot Project menggunakan WhatsApp Web sebagai media komunikasi.

Karena project ini berinteraksi dengan WhatsApp Web, perubahan pada WhatsApp Web dapat menyebabkan beberapa fungsi tidak bekerja sebagaimana mestinya.

Project ini juga **bukan merupakan project resmi dari WhatsApp** dan tidak berafiliasi dengan WhatsApp atau Meta.

Gunakan project ini secara bertanggung jawab dan sesuai dengan ketentuan layanan yang berlaku.

---

# 🙏 Terima Kasih

Project ini tidak dibuat sepenuhnya dari nol.

Saya ingin menyampaikan **terima kasih kepada Developer wwebjs.dev**, serta para kontributor **[whatsapp-web.js](https://github.com/wwebjs/whatsapp-web.js)** atas kode, struktur, referensi, ide, dan library yang sangat membantu dalam proses pengembangan project ini.

`whatsapp-web.js` merupakan salah satu referensi penting dalam memahami bagaimana interaksi dengan WhatsApp Web dapat dilakukan melalui Node.js.

Wabot Project mengambil inspirasi dan pembelajaran dari ekosistem tersebut, kemudian dikembangkan menjadi versi yang lebih **mini, sederhana, dan terbatas pada kebutuhan pengiriman serta penerimaan pesan teks dan file**.

Terima kasih juga kepada seluruh contributor dan komunitas open-source yang telah berbagi pengetahuan, kode, dokumentasi, dan berbagai solusi yang membantu pengembangan project ini.

> **Wabot Project is a small and lightweight project inspired by the work and ecosystem of whatsapp-web.js.**

---

# 📄 Lisensi & Open Source

Project ini dibuat untuk tujuan pembelajaran, eksperimen, dan pengembangan bot WhatsApp Web sederhana.

Jika kamu ingin mengembangkan project ini lebih lanjut, dipersilakan untuk melakukan fork, modifikasi, dan menyesuaikannya dengan kebutuhan project masing-masing dengan tetap memperhatikan lisensi dari dependency yang digunakan.

---

## ❤️ Credits

Special thanks to:

**Developer wwebjs.dev**

dan seluruh contributor:

**whatsapp-web.js**

Repository:

https://github.com/wwebjs/whatsapp-web.js

Terima kasih atas kontribusi dan kerja keras dalam membangun library yang menjadi salah satu referensi penting dalam pengembangan project ini.

---

**Wabot Project**
*Mini • Lightweight • Simple WhatsApp Web Bot*
