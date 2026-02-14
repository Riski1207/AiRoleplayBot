const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(express.json());
app.use(cors());

// Konfigurasi Environment Variables di Vercel Dashboard nanti
const BOT_TOKEN = process.env.BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// 1. ENDPOINT CHAT AI
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Luna adalah penyihir AI yang bijaksana." },
                    { role: "user", content: message }
                ]
            })
        });
        const data = await response.json();
        res.json({ reply: data.choices[0].message.content });
    } catch (error) { res.status(500).json({ reply: "Sihirku terganggu." }); }
});

// 2. ENDPOINT TELEGRAM STARS
app.post('/api/create-stars-invoice', async (req, res) => {
    try {
        const { userId, starsAmount, energyAmount } = req.body;
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: `Top Up ${energyAmount} Energi`,
                description: `Energi sihir Luna.`,
                payload: `user_${userId}_topup_${energyAmount}`,
                provider_token: "", 
                currency: "XTR", 
                prices: [{ label: "Energi", amount: starsAmount }] 
            })
        });
        const data = await response.json();
        res.json({ invoiceLink: data.result });
    } catch (error) { res.status(500).json({ error: "Gagal." }); }
});

// 3. WEBHOOK UNTUK STARS (Wajib agar pembayaran masuk)
app.post('/api/telegram-webhook', async (req, res) => {
    const update = req.body;
    if (update.pre_checkout_query) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pre_checkout_query_id: update.pre_checkout_query.id, ok: true })
        });
    }
    res.sendStatus(200);
});

module.exports = app; // PENTING: Untuk Vercel, jangan pakai app.listen