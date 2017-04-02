'use strict';

const server = require('../../bin/www');
const rp = require('request-promise');
const wsClient = require('websocket').w3cwebsocket;
const waitForMessageClient = require('../support/wait-for-message');

// TODO: The below implementation of the testing code is garbage. Refactor into a more
// easily-readable WS validation library. Maybe some sort of state machine for WS?

describe('happy path server interaction', () => {
    it('completes a user journey successfully', (done) => {
        const newSessionOpts = {
            method: 'POST',
            uri: 'http://localhost:3000/sessions',
            body:  {},
            headers: {
                'Authorization': 'Basic NjQ4Y2Q1YTEtY2M5Zi00NjMzLTlmMmQtYTRlNzZmNTAwM2EzOjJmMmY5NDM0LWRmZTktNGM5OS1iNWVkLTQ3Y2U0YzA1ZWEyYw=='
            },
            json: true
        };

        rp(newSessionOpts).then((response) => {
            expect(response.uuid).not.toBeUndefined();
            return { uuid: response.uuid};

        }).then((data) => {
            let client = new wsClient(`ws://localhost:3000/sessions/${data.uuid}`);
            
            client = waitForMessageClient(client);    

            client.waitForMessages(3).then(messages => {
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
                client.send(JSON.stringify({verb: 'execute', data: { code: 'let a = 5;' }}));
                return client.waitForMessages(1);
            }).then((messages) => {
                const parsedMessage = JSON.parse(messages[0].data);

                expect(parsedMessage.eventType).toEqual('executionSuccess');
                expect(parsedMessage.data.userId).not.toBeUndefined();
                expect(parsedMessage.data.code).toEqual('let a = 5;');
            }).then(() => {
                client.send(JSON.stringify({verb: 'execute', data: { code: 'a;' }}));
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
});
