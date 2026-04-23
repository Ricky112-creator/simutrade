const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🔐 Secure token from environment variables
const API_TOKEN = process.env.API_TOKEN;

// Connect to Deriv WebSocket
const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

let balanceData = null;

ws.onopen = () => {
    console.log("Connected to Deriv API");

    ws.send(JSON.stringify({
        authorize: API_TOKEN
    }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    console.log("Response:", data);

    if (data.msg_type === 'authorize') {
        console.log("Authorized successfully");

        ws.send(JSON.stringify({ balance: 1 }));
    }

    if (data.msg_type === 'balance') {
        balanceData = data.balance;
    }
};

// Root route
app.get('/', (req, res) => {
    res.send("Backend is running ✅");
});

// Balance route
app.get('/balance', (req, res) => {
    res.json(balanceData);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
