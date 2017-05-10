'use strict';

const SessionRegistry = require('./session-registry'),
    uuid = require('uuid');

const SessionConnectionState = class {
    constructor(sessionId, ws, token, registry=SessionRegistry) {
        this.sessionId = sessionId;
        this.registry = registry;
        this.websocket = ws;
        this.token = token;
        this.initialize();
    }

    initialize() {
        this.subscribeToSession();
        this.registry.getInstance().handleNewConnection(this.sessionId, this.token);
    }

    registerAlias(data) {
        this.registry.getInstance().registerAlias(this.sessionId, this.token, data.alias);
    } 

    subscribeToSession() {
        this.subscription = this.registry.getInstance().subscribe(
            this.sessionId, 
            this.websocket.send.bind(this.websocket)
        );
    }

    execute(data) {
        this.registry.getInstance().execute(this.sessionId, { token: this.token, code: data.code });
    }

    keepAlive() {
        this.registry.getInstance().resetTimeout(this.sessionId);
    }

    terminate() {
        this.registry.getInstance().removeActiveUser(this.sessionId, this.token);
 
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    handleMessage(msg) {
        const handleMethods = new Set(['execute', 'keepAlive', 'registerAlias']);

        try {
            const payload = JSON.parse(msg);

            if (!handleMethods.has(payload.verb)) {
                throw new Error(`Verb '${payload.verb}' not recognized`);
            }
            this[payload.verb](payload.data);
        }
        catch (error) {
            const errorMessage = { status: 'ERROR', error: error.message };
            this.websocket.send(JSON.stringify(errorMessage));
        }
    }
};

module.exports = SessionConnectionState;
