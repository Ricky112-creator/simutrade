const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const API_TOKEN = process.env.API_TOKEN;

const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

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
