# repl-server

Service that allows multiple people to view and manipulate a shared Node REPL instance.

### Installation

`repl-server`requires a working instance of Redis on the server with the default port open. Once this is available, 

```
npm install
```

### Overview

The service is composed of a Websocket endpoint through which users send REPL commands and receive events triggered by other users, augmented by a small set of convenience HTTP endpoints to track REPL session state.

#### Websocket Initialization

In order to access the Websocket connection, users must first have a service cookie stored locally. A convenience endpoint, `GET /sessions/touch` is provided that returns nothing but instantiates the required cookie.

Once the cookie is stored, users can then either create a session via `POST /sessions` or connect to a preexisting session via `WS /sessions/sessionId`. See the below API for additional details.

#### Outgoing Websocket Events

All outgoing Websocket events are transmitted via JSON.

**execute**

Executes a given code snippet in the REPL context.

```
{
    verb: 'execute',
    data: { code: <code> }
}
```

**registerAlias**

Renames the current user's alias in the session.

```
{
    verb: 'registerAlias',
    data: { alias: <alias> }
}
```

#### Incoming Websocket Events

All incoming Websocket events are transmitted via JSON.

**connectUser**

A user has connected to the session.

```
{
    type: 'connectUser',
    data: {
        userId: <userId>,
        alias: <alias>
    }
}
```

**disconnectUser**

A user has disconnected from the session.

```
{
    type: 'disconnectUser',
    data: {
        userId: <userId>,
        alias: <alias>
    }
}
```

**executionSuccess**

A command has beeen executed successfully by a user.

```
{
    type: 'executionSuccess',
    data: {
        userId: <userId>,
        code: <code>,
        result: <result>
    }
}
```

**executionFailure**

A command executed by a user has thrown an error.

```
{
    type: 'executionFailure',
    data: {
        userId: <userId>,
        code: <code>,
        error: <errorMessage>
    }
}
```

**registerAlias**

A user has renamed themselves.

```
{
    type: 'registerAlias',
    data: {
        userId: <userId>,
        oldAlias: <oldAlias>,
        newAlias: <newAlias>
    }
}
```


#### HTTP API

**GET /touch**

Returns an empty session and, if the user does not have a service cookie store, persists the service cookie.

*Parameters:* None

*Returns:* None


**POST /sessions**

Creates a new multi-user Node REPL session.

*Parameters:* None

*Returns:* 
The sessionId of the created session.

```
{
    sessionId: <sessionId>
}
```

**GET /sessions/[sessionId]/activeUsers**

Returns the list of users currently connected to the session with the provided sessionId.

*Parameters:* sessionId

*Returns:* The list of users connected to the session.
```
[
    {
        userId: <userId>,
        alias: <alias>    
    },
    ...
]
```

#### Further Development

This is a proof-of-concept service above all else and is not intended to be used in a production environment. A nonexhaustive list of work to productionalize the service would include:

* Adding HTTPS support
* Hooking in an auth service - all users can join and see all sessions by default
* Upgrading the service to support deployment on a distributed system, including
    * Migrating all in-memory current session state to Redis or similar system
    * Creating a router layer to route session commands to the correct box for execution
* Removing the dependency on forked worker processes. 
    * Currently, each session is executed in the context of a forked child process of the server, which is active for the lifetime of the session
    * This places a low ceiling on the number of sessions that may be run in a given server.
    * I'd like to explore persisting Node VM session state via a sufficiently inexpensive serialization process and calling a transient child thread to hydrate/dehydrate the VM on an as-required basis. More research on this is needed.
* Adding in more advanced terminal emulation features, like console output independent of the evaluation of an expression.