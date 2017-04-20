'use strict';

const server = require('../../bin/www');
const rp = require('request-promise');
const replClient = require('../support/repl-client');
const createSession = require('../support/create-session');

describe('multi-user scale test', () => {
    it('successfully processes a large burst of commands from a large number of users in a timely manner', (done) => {
        const NUM_CLIENTS = 100;
        
        let clients = new Array(NUM_CLIENTS);

        createSession().then((response) => {
            expect(response.uuid).not.toBeUndefined();
            return { uuid: response.uuid };
        }).then((data) => {    
            for (let index = 0; index < clients.length; index++) {
                clients[index] = replClient(data.uuid);
            } 
        }).then(() => {
            // Each user registration has three events transmitted with it
            return clients[0].waitForMessages(3 * NUM_CLIENTS); 
        }).then((messages) => {
            clients[0].sendMessage({ verb: 'execute', data: { code: 'let testArray = [];' }});
        }).then(() => {
            return clients[0].waitForMessages(1);
        }).then((messages) => {
            const message = JSON.parse(messages[0].data);
            expect(message.type).toEqual('executionSuccess');
            expect(message.data.code).toEqual('let testArray = [];');
        }).then(() => {
            clients.forEach((client) => {
                client.sendMessage({ verb: 'execute', data: { code: 'testArray.push("a");' }});
            });
            return clients[0].waitForMessages(NUM_CLIENTS);
        }).then(() => {
            clients[0].sendMessage({ verb: 'execute', data: { code: 'testArray.length;' }});
            return clients[0].waitForMessages(1);
        }).then((messages) => {
            const message = JSON.parse(messages[0].data);

            expect(message.type).toEqual('executionSuccess');
            expect(message.data.code).toEqual('testArray.length;');
            expect(message.data.result).toEqual(NUM_CLIENTS);

            done();
        });
    });
});
