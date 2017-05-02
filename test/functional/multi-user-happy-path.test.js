'use strict';

const server = require('../../bin/www');
const rp = require('request-promise');
const replClient = require('../support/repl-client');
const createSession = require('../support/create-session');

describe('multi-user happy path server interaction', () => {
    it('completes a user journey successfully', (done) => {
        let uuid, firstClient, secondClient, firstClientId, secondClientId;

        createSession().then((response) => {
            expect(response.uuid).not.toBeUndefined();
            return { uuid: response.uuid };
        }).then((data) => {
            uuid = data.uuid;
        }).then(() => {
            firstClient = replClient(uuid);
            return firstClient.waitForMessages(2); 
        }).then((messages) => {
            firstClientId = JSON.parse(messages[0].data).data.userId;
        }).then(() => {
            secondClient = replClient(uuid);
            return secondClient.waitForMessages(2);
        }).then((messages) => {
            secondClientId = JSON.parse(messages[0].data).data.userId;
        }).then(() => {
            firstClient.sendMessage({ verb: 'execute', data: { code: 'let a = 5;' }});
            return firstClient.waitForMessages(1);
        }).then((messages) => {
            const message = JSON.parse(messages[0].data);

            expect(message.type).toEqual('executionSuccess');
            expect(message.data.code).toEqual('let a = 5;');
            expect(message.data.userId).toEqual(firstClientId);
        }).then(() => {
            secondClient.sendMessage({ verb: 'execute', data: { code: 'let b = 10;' }});
            return secondClient.waitForMessages(1);
        }).then((messages) => {
            const message = JSON.parse(messages[0].data);

            expect(message.type).toEqual('executionSuccess');
            expect(message.data.code).toEqual('let b = 10;');
            expect(message.data.userId).toEqual(secondClientId);
        }).then(() => {
            firstClient.sendMessage({ verb: 'execute', data: { code: 'a + b;' }});
            return firstClient.waitForMessages(1);
        }).then((messages) => {
            const message = JSON.parse(messages[0].data);

            expect(message.type).toEqual('executionSuccess');
            expect(message.data.code).toEqual('a + b;');
            expect(message.data.result).toEqual('15');
            expect(message.data.userId).toEqual(firstClientId);

            done();
        });
    });
});
