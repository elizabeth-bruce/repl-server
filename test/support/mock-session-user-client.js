'use strict';

const MockSessionUserClient = {
    getInstance() {
        return {
            getUserId(sessionId, token) { return Promise.resolve('abcde'); }
        };
    }
};

module.exports = MockSessionUserClient;
