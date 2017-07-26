# Function Development Kit

> This library is an **experiment**. API will probably change.

[![Build Status](https://travis-ci.org/serverless/fdk.svg?branch=master)](https://travis-ci.org/serverless/fdk)

#### Create an Event Gateway Client

ES5

```js
const fdk = require('fdk');
const gateway = fdk.createEventGatewayClient({
  host: 'localhost:3000'
  version: 'v1' // optional and defaults to v1 fro the REST API version
  fetchClient: fetch // optional property allowing the developer to provide their own http lib
})
```

ES2015

```js
import { createEventGatewayClient } from 'fdk';
const gateway = createEventGatewayClient({
  host: 'localhost:3000'
  version: 'v1' // optional and default to v1
  fetchClient: fetch // optional property allowing the developer to provide their own http lib
})
```

Optional Properties for `createEventGatewayClient`

```js
{
  version: 'v2' // defaults to 'v1' and represents the Event Gateway API version to connect to
  fetchClient: fetch // optional property allowing the developer to provide their own http lib. ideal for mocking or to cover edge cases like passing in special headers for passing a proxy
}
```

#### Configure an Event Gateway

Configure accepts an object of function and subscription definitions. The idea of exposing one configuration function is to provide developers with convenient utility to configure an Event Gateway in one call rather then dealing with a chain of Promise based calls. Nevertheless in addition we expose a wrapper function for each low-level API call to the Event Gateway

```js
gateway.configure({
  // list of all the functions that should be registered
  functions: [
    {
      functionId: "hello-world"
      provider: {
        type: "awslambda"
        arn: "xxx",
        region: "us-west-2",
      }
    },
    {
      functionId: "sendWelcomeMail"
      provider: {
        type: "gcloudfunction"
        name: "sendWelcomeEmail",
        region: "us-west-2",
      }
    }
  ],
  // list of all the subscriptions that should be created
  subscriptions: [
    {
      event: "http",
      method: "GET",
      path: "/users",
      functionId: "hello-world"
    },
    {
      event: "user.created",
      functionId: "sendEmail"
    }
  ]
})
```

##### Result

Returns a promise which contains all the same list of functions and subscriptions in the same structure and order as provided in the configuration argument.

ES5

```js
gateway.configure({ config })
  .then((response) => {
    console.log(response)
    // {
    //   functions: [
    //     { functionId: 'xxx', … },
    //     { functionId: 'xxx', … }
    //   ],
    //   subscriptions: [
    //     { subscriptionId: 'xxx', … },
    //     { subscriptionId: 'xxx', … }
    //   ]
    // }
  })
```

ES2015

```js
const response = await gateway.configure({ config })
console.log(response)
```

##### Internal Steps

1. Retrieve all the subscriptions from the Event Gateway
2. Remove all the existing subscriptions
3. Retrieve all the functions from the Event Gateway
4. Remove all the existing functions
5. Create all described functions
6. Create all described subscriptions

In the initial implementation the returned Promise is rejected, but there will be no attempt of retries or recovering a healthy state.

##### Further Improvements

1. Allow to attach a `transactionId` or `ownerId` to each function and subscription so we can determine that a client only removes the functions and subscriptions created by itself.
2. Proper failure retries or recovery of the old state in case one or multiple requests fail.
3. Checking for valid configurations by fetching all existing functions and subscriptions and verify that there are no functions collisions nor invalid subscriptions to functions that don't exist.

#### Invoke a Function

```js
gateway.invoke({
  function: "createUser",
  data: JSON.stringify({ name: "Austen" }),
})
```

Returns a Promise with the response.

#### Emit an Event

```js
gateway.emit({
  event: "image.upload",
  encoding: "binary",
  data: <binary>,
  meta: {
    filename: "some-photo.png"
  }
})
```

Returns a Promise and when resolved the response only indicates if the Event Gateway received the event.
Responses from any subscribed functions are not part of the response.

##### To be discussed

- What happens if someone emits a custom http event?

#### Handler & Middlewares

A generic function handler with first-class Promise support.

```js
import { handler } from 'fdk';

module.exports.run = handler(event => {
  return { message: 'Success' }
})
```

Middlewares will be implemented at a later stage.

#### Further Event Gateway Functions

```js
gateway.registerFunction({
  functionId: "hello-world"
  provider: {
    type: "awslambda"
    arn: "xxx",
    region: "us-west-2",
  }
})

gateway.removeFunction({ functionId: "hello-world" })

gateway.listFunctions()

gateway.createSubscription({
  event: "user.created",
  functionId: "sendEmail"
})

gateway.removeSubscription({
  event: "user.created",
  functionId: "sendEmail"
})

gateway.listSubscriptions()
```
