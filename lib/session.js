'use strict';

const Subject = require('rxjs').Subject;
const uuid = require('node-uuid');
const SessionWorker = require('./session-worker');
const SessionUserClient = require('./session-user-client');

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
        this.worker = new SessionWorker();
        this.subject = new Subject();
        this.tokens = new Set();
        this.activeUsers = new Set();
        this.log = [];
        this.userClient = new SessionUserClient();
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
        
        this.userClient.getUserId(this.sessionId, data.token).then((userId) => {
            data.userId = userId;
            this.worker.postMessage(data);
        });
    }

    subscribe(fn) {
        return this.subject.subscribe(fn, (error) => console.log(error.message));
    }

    handleNewConnection(token) {
        return this.userClient.getUserId(this.sessionId, token).then((userId) => {
            let handleInitialConnection = Promise.resolve(token);

            if (!userId) {
                let newUserId = uuid.v4(),
                    tempAlias = 'Guest User';

                handleInitialConnection = this.registerUserId(token, newUserId).then(() => this.registerAlias(token, tempAlias));
            }

            return handleInitialConnection.then(this.addActiveUser.bind(this));
        });
    }

    registerAlias(token, alias) {
        return this.userClient.setAlias(this.sessionId, token, alias).then(() => {
            this.tokens.add(token);
        }).then(() => {
            return this.userClient.getUserId(this.sessionId, token);
        }).then((userId) => {
            let oldAlias;
            let newAlias = alias;

            for (let activeUser of this.activeUsers) {
                if (activeUser.userId === userId) {
                    oldAlias = activeUser.alias;
                    activeUser.alias = alias;
                }
            }

            const registerEvent = {
                type: 'registerAlias',
                data: {
                    userId,
                    oldAlias,
                    newAlias
                }
            };

            if ([...this.activeUsers].map((user) => user.userId).includes(userId)) {
                handleMessage.bind(this)(registerEvent);
            }

            return token;
        }).catch(console.log);
    }

    registerUserId(token, userId) {
        return this.userClient.setUserId(this.sessionId, token, userId).then(() => token);
    }

    clearAliases() {
        let tokens = Array.from(this.tokens);

        return Promise.all(       
        );
    }

    getAlias(token) {
        return this.userClient.getAlias(this.sessionId, token);
    }

    getActiveUsers() {
        return this.activeUsers;
    }

    addActiveUser(token) {
        const userId = this.userClient.getUserId(this.sessionId, token),
            alias = this.userClient.getAlias(this.sessionId, token);

        return Promise.all([userId, alias]).then((results) => {
            const userId = results[0],
                alias = results[1];

            this.activeUsers.add({ userId, alias });

            const addUserEvent = {
                data: { userId, alias },
                type: 'connectUser'
            };

            handleMessage.bind(this)(addUserEvent);
            return token;
        });
    }

    removeActiveUser(token) {
        const userId = this.userClient.getUserId(this.sessionId, token),
            alias = this.userClient.getAlias(this.sessionId, token);

        return Promise.all([userId, alias]).then((results) => {
            const userId = results[0],
                alias = results[1];

            for (let activeUser of this.activeUsers) {
                if (activeUser.userId === userId) {
                    this.activeUsers.delete(activeUser);
                }
            }

            const removeUserEvent = {
                data: { userId, alias },
                type: 'disconnectUser'
            };

            handleMessage.bind(this)(removeUserEvent);
            return token;
        });
    }
};

module.exports = REPLSession;
