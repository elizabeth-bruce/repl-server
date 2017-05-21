'use strict';

const Redis = require('redis-mock');
const Bluebird = require('bluebird');
const SessionUserClient = require('../../lib/session-user-client');

Bluebird.promisifyAll(Redis.RedisClient.prototype);

describe('SessionUserClient', () => {
    describe('.setAlias', () => {
        it('passes a set command to Redis', () => {
            let redisClient = Redis.createClient(),
                client = new SessionUserClient(redisClient);

            spyOn(redisClient, 'hsetAsync');

            client.setAlias('foo', 'token', 'alias');
            expect(redisClient.hsetAsync).toHaveBeenCalledWith('alias:foo:token', 'alias', 'alias');
        });
    });
    describe('.setUserId', () => {
        it('passes a set command to Redis', () => {
            let redisClient = Redis.createClient(),
                client = new SessionUserClient(redisClient);

            spyOn(redisClient, 'hsetAsync');

            client.setUserId('foo', 'token', 'bar');
            expect(redisClient.hsetAsync).toHaveBeenCalledWith('alias:foo:token', 'userId', 'bar');

        });
    });
    describe('.expireUser', () => {
        it('passes an expire command to Redis', () => {
            let redisClient = Redis.createClient(),
                client = new SessionUserClient(redisClient);

            spyOn(redisClient, 'expireAsync');

            client.expireUser('foo', 'token', 1500);
            expect(redisClient.expireAsync).toHaveBeenCalledWith('alias:foo:token', 1500);
        });
    });
    describe('.getAlias', () => {
        it('passes a get command to Redis', () => {
            let redisClient = Redis.createClient(),
                client = new SessionUserClient(redisClient);

            spyOn(redisClient, 'hgetAsync');

            client.getAlias('foo', 'token');
            expect(redisClient.hgetAsync).toHaveBeenCalledWith('alias:foo:token', 'alias');
        });
    });
    describe('.getUserId', () => {
        it('passes a get command to Redis', () => {
            let redisClient = Redis.createClient(),
                client = new SessionUserClient(redisClient);

            spyOn(redisClient, 'hgetAsync');

            client.getUserId('foo', 'token');
            expect(redisClient.hgetAsync).toHaveBeenCalledWith('alias:foo:token', 'userId');

        });
    });
    describe('.clearUser', () => {
        it('passes a del command to Redis', () => {
            let redisClient = Redis.createClient(),
                client = new SessionUserClient(redisClient);

            spyOn(redisClient, 'delAsync');

            client.clearUser('foo', 'token');
            expect(redisClient.delAsync).toHaveBeenCalledWith('alias:foo:token');

        });
    });

});
