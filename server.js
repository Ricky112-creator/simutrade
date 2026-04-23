const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN;

let balanceData = null;

// ✅ Single WebSocket connection
const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

// ✅ When connection opens
ws.on('open', () => {
    console.log("Connected to Deriv API");

    if (!API_TOKEN) {
        console.error("❌ API TOKEN is missing!");
        return;
    }

    ws.send(JSON.stringify({
        authorize: API_TOKEN
    }));
});

// ✅ Handle messages
ws.on('message', (message) => {
    const data = JSON.parse(message);

    console.log("RESPONSE:", data);

    // Handle errors
    if (data.error) {
        console.error("❌ Deriv Error:", data.error.message);
        return;
    }

    // After authorization → request balance
    if (data.msg_type === 'authorize') {
        console.log("✅ Authorized successfully");

        ws.send(JSON.stringify({
            balance: 1
        }));
    }

    // Save balance
    if (data.msg_type === 'balance') {
        console.log("💰 Balance received:", data.balance);
        balanceData = data;
    }
});

// ✅ Error handling
ws.on('error', (err) => {
    console.error("WebSocket Error:", err);
});

ws.on('close', () => {
    console.log("WebSocket closed");
});

// ✅ Routes
app.get('/', (req, res) => {
    res.send("Backend is running ✅");
});

app.get('/balance', (req, res) => {
    if (!balanceData) {
        return res.json({
            status: "waiting",
            message: "Connecting to Deriv..."
        });
    }

    res.json({
        status: "success",
        balance: balanceData.balance,
        currency: balanceData.currency
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
