'use strict';

const Client = require('./src/klien');
const PesanMedia = require('./src/structures/PesanMedia');
const konfigurasi = require('./src/util/konfigurasi');

module.exports = {
    Client,
    PesanMedia,
    ...konfigurasi
};
