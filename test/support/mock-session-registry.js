'use strict';

const instance = {
    handleNewConnection: (sessionId, token) => Promise.resolve(token),
    execute: (sessionId, data) => Promise.resolve(data.token),
    registerAlias: (sessionId, token, alias) => Promise.resolve(token),
    resetTimeout: (sessionId, token) => Promise.resolve(token),
    subscribe: (sessionId, token) => ({ unsubscribe: () => true }),
    removeActiveUser: (sessionId, token) => Promise.resolve(token)
};

const MockSessionRegistry = {
    getInstance: () => instance
};

module.exports = MockSessionRegistry;
