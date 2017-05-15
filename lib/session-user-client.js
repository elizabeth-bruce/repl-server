'use strict';

const Redis = require('redis');
const Bluebird = require('bluebird');

Bluebird.promisifyAll(Redis.RedisClient.prototype);

class SessionUserClient {
    constructor(client=Redis.createClient()) {
        this.redisKeys = {
            ALIAS: 'alias',
            USER_ID: 'userId'
        };

        this.client = client;
    }

    keyOf(sessionId, sessionToken) {
        return `alias:${sessionId}:${sessionToken}`;
    }

    setAlias(sessionId, sessionToken, alias) {
        return this.client.hsetAsync(this.keyOf(sessionId, sessionToken), this.redisKeys.ALIAS, alias);
    }

    setUserId(sessionId, sessionToken, userId) {
        return this.client.hsetAsync(this.keyOf(sessionId, sessionToken), this.redisKeys.USER_ID, userId);
    }

    expireUser(sessionId, sessionToken, timeout) {
        return this.client.expireAsync(this.keyOf(sessionId, sessionToken), timeout);
    }

    getAlias(sessionId, sessionToken) {
        return this.client.hgetAsync(this.keyOf(sessionId, sessionToken), this.redisKeys.ALIAS);
    }

    getUserId(sessionId, sessionToken) {
        return this.client.hgetAsync(this.keyOf(sessionId, sessionToken), this.redisKeys.USER_ID);
    }

    clearUser(sessionId, sessionToken) {
        return this.client.delAsync(this.keyOf(sessionId, sessionToken));
    }
}

module.exports = SessionUserClient;
