const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const API_TOKEN = process.env.API_TOKEN;

const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

let balanceData = null;

// When connection opens
ws.on('open', () => {
    console.log("Connected to Deriv API");

    if (!API_TOKEN) {
        console.error("API TOKEN is missing!");
        return;
    }

    ws.send(JSON.stringify({
        authorize: API_TOKEN
    }));
});

// Listen for messages
ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    console.log("FULL RESPONSE:", data);

    // If error from Deriv
    if (data.error) {
        console.error("Deriv Error:", data.error.message);
        return;
    }

    if (data.msg_type === 'authorize') {
        console.log("Authorized successfully");

        ws.send(JSON.stringify({
            balance: 1
        }));
    }

    if (data.msg_type === 'balance') {
        console.log("Balance received:", data.balance);
        balanceData = data;
    }
});

// Error handling
ws.on('error', (err) => {
    console.error("WebSocket Error:", err);
});

ws.on('close', () => {
    console.log("WebSocket closed");
});
let balanceData = null;

ws.onopen = () => {
    console.log("Connected to Deriv");

    ws.send(JSON.stringify({
        authorize: API_TOKEN
    }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.msg_type === 'authorize') {
        ws.send(JSON.stringify({ balance: 1 }));
    }

    if (data.msg_type === 'balance') {
        balanceData = data.balance;
    }
};

app.get('/', (req, res) => {
    res.send("Backend is running ✅");
});

app.get('/balance', (req, res) => {
    res.json(balanceData);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
