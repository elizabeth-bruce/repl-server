'use strict';

const server = require('../../bin/www');
const rp = require('request-promise');
const replClient = require('../support/repl-client');
const createSession = require('../support/create-session');

describe('happy path server interaction', () => {
    it('completes a user journey successfully', (done) => {
        let client;

        createSession().then((response) => {
            expect(response.uuid).not.toBeUndefined();
            return { uuid: response.uuid};
        }).then((data) => {
            client = replClient(data.uuid);
            return client.waitForMessages(3);
        }).then((messages) => {
            const parsedMessages = messages.map((message) => message.data).map(JSON.parse);
            expect(parsedMessages[0].eventType).toEqual('registerUser');
            expect(parsedMessages[0].data.userId).not.toBeUndefined();

            expect(parsedMessages[1].eventType).toEqual('registerAlias');
            expect(parsedMessages[1].data.userId).not.toBeUndefined();
            expect(parsedMessages[1].data.alias).not.toBeUndefined();

            expect(parsedMessages[2].eventType).toEqual('connectUser');
            expect(parsedMessages[2].data.userId).not.toBeUndefined();
            expect(parsedMessages[2].data.activeUsers.length).toEqual(1);
        }).then(() => {
            client.sendMessage({ verb: 'execute', data: { code: 'let a = 5;' }});
            return client.waitForMessages(1);
        }).then((messages) => {
            const parsedMessage = JSON.parse(messages[0].data);

            expect(parsedMessage.eventType).toEqual('executionSuccess');
            expect(parsedMessage.data.userId).not.toBeUndefined();
            expect(parsedMessage.data.code).toEqual('let a = 5;');
        }).then(() => {
            client.sendMessage({ verb: 'execute', data: { code: 'a;' }});
            return client.waitForMessages(1);
        }).then((messages) => {
            const parsedMessage = JSON.parse(messages[0].data);

            expect(parsedMessage.eventType).toEqual('executionSuccess');
            expect(parsedMessage.data.userId).not.toBeUndefined();
            expect(parsedMessage.data.code).toEqual('a;');
            expect(parsedMessage.data.result).toEqual(5);

            done();
        });
    });
});
