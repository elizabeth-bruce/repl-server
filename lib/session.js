'use strict';

const Worker = require('tiny-worker');
const Subject = require('rxjs').Subject;
const uuid = require('node-uuid');
const SessionUserClient = require('./session-user-client');

const workerFunction = function() {
    const vm = require('vm');

    const EXEC_TIMEOUT = 5000;

    let sandbox = {};
    vm.createContext(sandbox);

    self.onmessage = function(event) {
        const code = event.data.code,
            userId = event.data.userId;

        try {
            let script = new vm.Script(code),
                result = script.runInContext(sandbox, { timeout: EXEC_TIMEOUT });

            postMessage({ data: { userId, code, result }, eventType: 'executionSuccess' });
        }
        catch (error) {
            postMessage({ data: { userId, code, error: error.message }, eventType: 'executionFailure' });
        }
    }
};

const handleWorkerMessage = function(msg) {
    handleMessage.bind(this)(msg.data);
};

const handleMessage = function(data) {
    this.log.push(data);
    this.subject.next(JSON.stringify(data));
};

const REPLSession = class {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.worker = new Worker(workerFunction);
        this.subject = new Subject();
        this.tokens = new Set();
        this.activeUsers = new Set();
        this.log = [];

        this.userClient = SessionUserClient;

        this.worker.onmessage = handleWorkerMessage.bind(this);
    }

    terminate() {
        this.subject.complete();
        this.subject.unsubscribe();
        this.worker.terminate();
        // this.clearAliases();
    }

    execute(data) {
        if (!data.code || !data.token) {
            throw new Error(`Incomplete code object sent to be evaluated`);
        }
        
        this.userClient.getInstance().getUserId(this.sessionId, data.token).then((userId) => {
            data.userId = userId;
            this.worker.postMessage(data);
        });
    }

    subscribe(fn) {
        return this.subject.subscribe(fn, (error) => console.log(error.message));
    }

    handleNewConnection(token) {
        return this.userClient.getInstance().getUserId(this.sessionId, token).then((userId) => {
            let handleInitialConnection = Promise.resolve(userId);

            if (!userId) {
                let newUserId = uuid.v4(),
                    tempAlias = 'SHARKLE SHARK';

                handleInitialConnection = this.registerUserId(token, newUserId).then(() => this.registerAlias(token, tempAlias));
            }

            return handleInitialConnection.then(this.addActiveUser.bind(this));
        });
    }

    registerAlias(token, alias) {
        return this.userClient.getInstance().setAlias(this.sessionId, token, alias).then(() => {
            this.tokens.add(token);
        }).then(() => {
            return this.userClient.getInstance().getUserId(this.sessionId, token)
        }).then((userId) => {
            const registerEvent = {
                eventType: 'registerAlias',
                data: {
                    userId: userId,
                    alias: alias
                }
            };
            handleMessage.bind(this)(registerEvent);
            return token;
        });
    }

    registerUserId(token, userId) {
        return this.userClient.getInstance().setUserId(this.sessionId, token, userId).then(() => {
            const registerEvent = {
                eventType: 'registerUser',
                data: {
                    userId: userId
                }
            };
            handleMessage.bind(this)(registerEvent);
            return token;
        });
    }

    clearAliases() {
        let tokens = Array.from(this.tokens);

        return Promise.all(       
        );
    }

    getAlias(token) {
        return this.userClient.getInstance().getAlias(this.sessionId, token);
    }

    addActiveUser(token) {
        return this.userClient.getInstance().getUserId(this.sessionId, token).then((userId) => {
            this.activeUsers.add(userId);
            const addUserEvent = {
                eventType: 'connectUser',
                data: {
                    userId: userId,
                    activeUsers: Array.from(this.activeUsers)
                }
            };

            handleMessage.bind(this)(addUserEvent);
            return token;
        });
    }

    removeActiveUser(token) {
        return this.userClient.getInstance.getUserId(this.sessionId, token).then((userId) => {
            this.activeUsers.delete(userId);
            const removeUserEvent = {
                eventType: 'disconnectUser',
                data: {
                    userId: userId,
                    activeUsers: Array.from(this.activeUsers)
                }
            };

            handleMessage.bind(this)(removeUserEvent);
            return token;
        });
    }
};

module.exports = REPLSession;
