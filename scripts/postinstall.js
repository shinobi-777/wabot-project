"use strict";

const fs = require("fs");
const path = require("path");

console.log("");
console.log("======================================");
console.log("       WABOT PROJECT INSTALLER");
console.log("======================================");
console.log("");

try {

    /*
     * INIT_CWD adalah folder tempat user
     * menjalankan npm install.
     *
     * Contoh:
     *
     * E:\project_node\mybot
     *
     * maka app.js akan dibuat di:
     *
     * E:\project_node\mybot\app.js
     */
    const projectDir = process.env.INIT_CWD || process.cwd();

    const sourceFile = path.join(
        __dirname,
        "..",
        "app.example.js"
    );

    const targetFile = path.join(
        projectDir,
        "app.js"
    );

    /*
     * Pastikan template tersedia.
     */
    if (!fs.existsSync(sourceFile)) {

        console.error(
            "[WABOT] File app.example.js tidak ditemukan."
        );

        process.exit(1);
    }

    /*
     * Jangan menimpa app.js milik user.
     */
    if (fs.existsSync(targetFile)) {

        console.log(
            "[WABOT] app.js sudah ada."
        );

        console.log(
            "[WABOT] File tidak ditimpa."
        );

        console.log("");

        process.exit(0);
    }

    /*
     * Membuat app.js.
     */
    fs.copyFileSync(
        sourceFile,
        targetFile
    );

    console.log(
        "[WABOT] app.js berhasil dibuat."
    );

    console.log(
        "[WABOT] Lokasi:"
    );

    console.log(
        targetFile
    );

    console.log("");

    console.log(
        "Silahkan edit app.js sebelum menjalankan:"
    );

    console.log("");

    console.log(
        "    node app.js"
    );

    console.log("");

    console.log("======================================");

} catch (error) {

    console.error("");

    console.error(
        "[WABOT] Gagal membuat app.js"
    );

    console.error(
        error.message
    );

    console.error("");

    /*
     * Jangan membuat npm install gagal
     * hanya karena app.js gagal dibuat.
     */
    process.exit(0);
}
