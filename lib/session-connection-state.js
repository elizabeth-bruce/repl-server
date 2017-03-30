'use strict';

const SessionRegistry = require('./session-registry'),
    uuid = require('uuid');

const SessionConnectionState = class {
    constructor(sessionId, ws, token) {
        this.sessionId = sessionId;
        this.websocket = ws;
        this.token = token;
        this.initialize();
    }

    initialize() {
        this.subscribeToSession();
        SessionRegistry.getInstance().handleNewConnection(this.sessionId, this.token);          
       
    }

    registerAlias(data) {
        SessionRegistry.getInstance().registerAlias(this.sessionId, this.token, data.alias);
    } 

    subscribeToSession() {
        this.subscription = SessionRegistry.getInstance().subscribe(
            this.sessionId, 
            this.websocket.send.bind(this.websocket)
        );
    }

    execute(data) {
        SessionRegistry.getInstance().execute(this.sessionId, { token: this.token, code: data.code });
    }

    keepAlive() {
        SessionRegistry.getInstance().resetTimeout(this.sessionId);
    }

    terminate() {
        SessionRegistry.getInstance().removeActiveUser(this.sessionId, this.token);
 
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    handleMessage(msg) {
        const handleMethods = new Set(['execute', 'keepAlive', 'registerAlias']);

        try {
            const payload = JSON.parse(msg);

            if (!handleMethods.has(payload.verb)) {
                throw new Error('Verb not recognized');
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
