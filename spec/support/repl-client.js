const wsClient = require('websocket').w3cwebsocket;
const waitForMessageClient = require('./wait-for-message');
const getCookies = require('./get-cookies');
const getActiveUsers = require('./get-active-users');
const createSession = require('./create-session');

class replClient {
    constructor(sessionId) {
        this.sessionId = sessionId;
    }

    getCookies() {
        return getCookies().then((jar) => {
            this.jar = jar;
        });
    }

    connect() {
        this.client = new wsClient(
            `ws://localhost:3000/sessions/${this.sessionId}`,
            'json',
            'http://localhost:3001',
            { Cookie: this.jar.getCookieString('http://localhost:3000') }
        );
        this.client = waitForMessageClient(this.client);
        this.client.sendMessage = (message) => {
            return this.client.send(JSON.stringify(message));
        };
        this.client.delegatedClose = this.client.close;
        this.client.close = this.disconnect;
    }

    waitForMessages(numMessages) {
        return this.client.waitForMessages(numMessages);
    }

    disconnect() {
        this.client.delegatedClose();
        this.client = null;
    }

    sendMessage(message) {
        return this.client.sendMessage(message);
    }

    execute(code) {
        this.client.sendMessage({
            verb: 'execute',
            data: { code }
        });
    }

    registerAlias(alias) {
        this.client.sendMessage({
            verb: 'registerAlias',
            data: { alias }
        });
    }

    getActiveUsers() {
        return getActiveUsers(this.jar, this.sessionId);
    }

    createSession() {
        return createSession(this.jar);
    }
}

module.exports = replClient;
