const wsClient = require('websocket').w3cwebsocket;
const waitForMessageClient = require('./wait-for-message');

function replClient(uuid) {
    let client = new wsClient(`ws://localhost:3000/sessions/${uuid}`);
    client = waitForMessageClient(client);
    client.sendMessage = (message) => client.send(JSON.stringify(message));

    return client;
};

module.exports = replClient;
