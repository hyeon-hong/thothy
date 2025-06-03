# SDK (JS/TS)
[](https://github.com/langchain-ai/langgraph/edit/main/docs/docs/cloud/reference/sdk/js_ts_sdk_ref.md "Edit this page")

**[@langchain/langgraph-sdk](https://github.com/langchain-ai/langgraph/tree/main/libs/sdk-js)**

* * *

[@langchain/langgraph-sdk](https://github.com/langchain-ai/langgraph/tree/main/libs/sdk-js)
----------------------------------------------------------------------------------------------------------------------------------------

### Classes

*   [AssistantsClient](#classesassistantsclientmd)
*   [Client](#classesclientmd)
*   [CronsClient](#classescronsclientmd)
*   [RunsClient](#classesrunsclientmd)
*   [StoreClient](#classesstoreclientmd)
*   [ThreadsClient](#classesthreadsclientmd)

### Interfaces

*   [ClientConfig](#interfacesclientconfigmd)

### Functions

*   [getApiKey](#functionsgetapikeymd)

[**@langchain/langgraph-sdk**](#readmemd)

* * *

[@langchain/langgraph-sdk](#readmemd) / AssistantsClient

Class: AssistantsClient
--------------------------------------------------------------------

Defined in: [client.ts:270](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L270)

### Extends

*   `BaseClient`

### Constructors

#### new AssistantsClient()

> **new AssistantsClient**(`config`?): [`AssistantsClient`](#classesassistantsclientmd)

Defined in: [client.ts:85](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L85)

##### Parameters

###### config?

[`ClientConfig`](#interfacesclientconfigmd)

##### Returns

[`AssistantsClient`](#classesassistantsclientmd)

##### Inherited from

`BaseClient.constructor`

### Methods

#### create()

> **create**(`payload`): `Promise`\\<`Assistant`\>

Defined in: [client.ts:335](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L335)

Create a new assistant.

##### Parameters

###### payload

Payload for creating an assistant.

###### \# assistantId?

`string`

###### \# config?

`Config`

###### \# graphId

`string`

###### \# ifExists?

`OnConflictBehavior`

###### \# metadata?

`Metadata`

###### \# name?

`string`

##### Returns

`Promise`\\<`Assistant`\>

The created assistant.

* * *

#### delete()

> **delete**(`assistantId`): `Promise`\\<`void`\>

Defined in: [client.ts:387](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L387)

Delete an assistant.

##### Parameters

###### assistantId

`string`

ID of the assistant.

##### Returns

`Promise`\\<`void`\>

* * *

#### get()

> **get**(`assistantId`): `Promise`\\<`Assistant`\>

Defined in: [client.ts:277](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L277)

Get an assistant by ID.

##### Parameters

###### assistantId

`string`

The ID of the assistant.

##### Returns

`Promise`\\<`Assistant`\>

Assistant

* * *

#### getGraph()

> **getGraph**(`assistantId`, `options`?): `Promise`\\<`AssistantGraph`\>

Defined in: [client.ts:287](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L287)

Get the JSON representation of the graph assigned to a runnable

##### Parameters

###### assistantId

`string`

The ID of the assistant.

###### options?

###### \# xray?

`number` | `boolean`

Whether to include subgraphs in the serialized graph representation. If an integer value is provided, only subgraphs with a depth less than or equal to the value will be included.

##### Returns

`Promise`\\<`AssistantGraph`\>

Serialized graph

* * *

#### getSchemas()

> **getSchemas**(`assistantId`): `Promise`\\<`GraphSchema`\>

Defined in: [client.ts:301](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L301)

Get the state and config schema of the graph assigned to a runnable

##### Parameters

###### assistantId

`string`

The ID of the assistant.

##### Returns

`Promise`\\<`GraphSchema`\>

Graph schema

* * *

#### getSubgraphs()

> **getSubgraphs**(`assistantId`, `options`?): `Promise`\\<`Subgraphs`\>

Defined in: [client.ts:312](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L312)

Get the schemas of an assistant by ID.

##### Parameters

###### assistantId

`string`

The ID of the assistant to get the schema of.

###### options?

Additional options for getting subgraphs, such as namespace or recursion extraction.

###### \# namespace?

`string`

###### \# recurse?

`boolean`

##### Returns

`Promise`\\<`Subgraphs`\>

The subgraphs of the assistant.

* * *

#### getVersions()

> **getVersions**(`assistantId`, `payload`?): `Promise`\\<`AssistantVersion`\[\]>

Defined in: [client.ts:421](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L421)

List all versions of an assistant.

##### Parameters

###### assistantId

`string`

ID of the assistant.

###### payload?

###### \# limit?

`number`

###### \# metadata?

`Metadata`

###### \# offset?

`number`

##### Returns

`Promise`\\<`AssistantVersion`\[\]>

List of assistant versions.

* * *

#### search()

> **search**(`query`?): `Promise`\\<`Assistant`\[\]>

Defined in: [client.ts:398](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L398)

List assistants.

##### Parameters

###### query?

Query options.

###### \# graphId?

`string`

###### \# limit?

`number`

###### \# metadata?

`Metadata`

###### \# offset?

`number`

##### Returns

`Promise`\\<`Assistant`\[\]>

List of assistants.

* * *

#### setLatest()

> **setLatest**(`assistantId`, `version`): `Promise`\\<`Assistant`\>

Defined in: [client.ts:449](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L449)

Change the version of an assistant.

##### Parameters

###### assistantId

`string`

ID of the assistant.

###### version

`number`

The version to change to.

##### Returns

`Promise`\\<`Assistant`\>

The updated assistant.

* * *

#### update()

> **update**(`assistantId`, `payload`): `Promise`\\<`Assistant`\>

Defined in: [client.ts:362](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L362)

Update an assistant.

##### Parameters

###### assistantId

`string`

ID of the assistant.

###### payload

Payload for updating the assistant.

###### \# config?

`Config`

###### \# graphId?

`string`

###### \# metadata?

`Metadata`

###### \# name?

`string`

##### Returns

`Promise`\\<`Assistant`\>

The updated assistant.

[**@langchain/langgraph-sdk**](#readmemd)

* * *

[@langchain/langgraph-sdk](#readmemd) / Client

Class: Client\\<TStateType, TUpdateType, TCustomEventType>
------------------------------------------------------------------------------------------------------------------------------------

Defined in: [client.ts:1370](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1370)

### Type Parameters

• **TStateType** = `DefaultValues`

• **TUpdateType** = `TStateType`

• **TCustomEventType** = `unknown`

### Constructors

#### new Client()

> **new Client**\\<`TStateType`, `TUpdateType`, `TCustomEventType`\>(`config`?): [`Client`](#classesclientmd)\\<`TStateType`, `TUpdateType`, `TCustomEventType`\>

Defined in: [client.ts:1406](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1406)

##### Parameters

###### config?

[`ClientConfig`](#interfacesclientconfigmd)

##### Returns

[`Client`](#classesclientmd)\\<`TStateType`, `TUpdateType`, `TCustomEventType`\>

### Properties

#### ~ui

> **~ui**: `UiClient`

Defined in: [client.ts:1404](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1404)

**`Internal`**

The client for interacting with the UI. Used by LoadExternalComponent and the API might change in the future.

* * *

#### assistants

> **assistants**: [`AssistantsClient`](#classesassistantsclientmd)

Defined in: [client.ts:1378](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1378)

The client for interacting with assistants.

* * *

#### crons

> **crons**: [`CronsClient`](#classescronsclientmd)

Defined in: [client.ts:1393](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1393)

The client for interacting with cron runs.

* * *

#### runs

> **runs**: [`RunsClient`](#classesrunsclientmd)\\<`TStateType`, `TUpdateType`, `TCustomEventType`\>

Defined in: [client.ts:1388](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1388)

The client for interacting with runs.

* * *

#### store

> **store**: [`StoreClient`](#classesstoreclientmd)

Defined in: [client.ts:1398](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1398)

The client for interacting with the KV store.

* * *

#### threads

> **threads**: [`ThreadsClient`](#classesthreadsclientmd)\\<`TStateType`, `TUpdateType`\>

Defined in: [client.ts:1383](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1383)

The client for interacting with threads.

[**@langchain/langgraph-sdk**](#readmemd)

* * *

[@langchain/langgraph-sdk](#readmemd) / CronsClient

Class: CronsClient
----------------------------------------------------------

Defined in: [client.ts:175](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L175)

### Extends

*   `BaseClient`

### Constructors

#### new CronsClient()

> **new CronsClient**(`config`?): [`CronsClient`](#classescronsclientmd)

Defined in: [client.ts:85](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L85)

##### Parameters

###### config?

[`ClientConfig`](#interfacesclientconfigmd)

##### Returns

[`CronsClient`](#classescronsclientmd)

##### Inherited from

`BaseClient.constructor`

### Methods

#### create()

> **create**(`assistantId`, `payload`?): `Promise`\\<`CronCreateResponse`\>

Defined in: [client.ts:215](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L215)

##### Parameters

###### assistantId

`string`

Assistant ID to use for this cron job.

###### payload?

`CronsCreatePayload`

Payload for creating a cron job.

##### Returns

`Promise`\\<`CronCreateResponse`\>

* * *

#### createForThread()

> **createForThread**(`threadId`, `assistantId`, `payload`?): `Promise`\\<`CronCreateForThreadResponse`\>

Defined in: [client.ts:183](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L183)

##### Parameters

###### threadId

`string`

The ID of the thread.

###### assistantId

`string`

Assistant ID to use for this cron job.

###### payload?

`CronsCreatePayload`

Payload for creating a cron job.

##### Returns

`Promise`\\<`CronCreateForThreadResponse`\>

The created background run.

* * *

#### delete()

> **delete**(`cronId`): `Promise`\\<`void`\>

Defined in: [client.ts:241](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L241)

##### Parameters

###### cronId

`string`

Cron ID of Cron job to delete.

##### Returns

`Promise`\\<`void`\>

* * *

#### search()

> **search**(`query`?): `Promise`\\<`Cron`\[\]>

Defined in: [client.ts:252](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L252)

##### Parameters

###### query?

Query options.

###### \# assistantId?

`string`

###### \# limit?

`number`

###### \# offset?

`number`

###### \# threadId?

`string`

##### Returns

`Promise`\\<`Cron`\[\]>

List of crons.

[**@langchain/langgraph-sdk**](#readmemd)

* * *

[@langchain/langgraph-sdk](#readmemd) / RunsClient

Class: RunsClient\\<TStateType, TUpdateType, TCustomEventType>
--------------------------------------------------------------------------------------------------------------------------------------------

Defined in: [client.ts:701](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L701)

### Extends

*   `BaseClient`

### Type Parameters

• **TStateType** = `DefaultValues`

• **TUpdateType** = `TStateType`

• **TCustomEventType** = `unknown`

### Constructors

#### new RunsClient()

> **new RunsClient**\\<`TStateType`, `TUpdateType`, `TCustomEventType`\>(`config`?): [`RunsClient`](#classesrunsclientmd)\\<`TStateType`, `TUpdateType`, `TCustomEventType`\>

Defined in: [client.ts:85](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L85)

##### Parameters

###### config?

[`ClientConfig`](#interfacesclientconfigmd)

##### Returns

[`RunsClient`](#classesrunsclientmd)\\<`TStateType`, `TUpdateType`, `TCustomEventType`\>

##### Inherited from

`BaseClient.constructor`

### Methods

#### cancel()

> **cancel**(`threadId`, `runId`, `wait`, `action`): `Promise`\\<`void`\>

Defined in: [client.ts:985](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L985)

Cancel a run.

##### Parameters

###### threadId

`string`

The ID of the thread.

###### runId

`string`

The ID of the run.

###### wait

`boolean` = `false`

Whether to block when canceling

###### action

`CancelAction` = `"interrupt"`

Action to take when cancelling the run. Possible values are `interrupt` or `rollback`. Default is `interrupt`.

##### Returns

`Promise`\\<`void`\>

* * *

#### create()

> **create**(`threadId`, `assistantId`, `payload`?): `Promise`\\<`Run`\>

Defined in: [client.ts:809](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L809)

Create a run.

##### Parameters

###### threadId

`string`

The ID of the thread.

###### assistantId

`string`

Assistant ID to use for this run.

###### payload?

`RunsCreatePayload`

Payload for creating a run.

##### Returns

`Promise`\\<`Run`\>

The created run.

* * *

#### createBatch()

> **createBatch**(`payloads`): `Promise`\\<`Run`\[\]>

Defined in: [client.ts:844](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L844)

Create a batch of stateless background runs.

##### Parameters

###### payloads

`RunsCreatePayload` & `object`\[\]

An array of payloads for creating runs.

##### Returns

`Promise`\\<`Run`\[\]>

An array of created runs.

* * *

#### delete()

> **delete**(`threadId`, `runId`): `Promise`\\<`void`\>

Defined in: [client.ts:1079](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1079)

Delete a run.

##### Parameters

###### threadId

`string`

The ID of the thread.

###### runId

`string`

The ID of the run.

##### Returns

`Promise`\\<`void`\>

* * *

#### get()

> **get**(`threadId`, `runId`): `Promise`\\<`Run`\>

Defined in: [client.ts:972](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L972)

Get a run by ID.

##### Parameters

###### threadId

`string`

The ID of the thread.

###### runId

`string`

The ID of the run.

##### Returns

`Promise`\\<`Run`\>

The run.

* * *

#### join()

> **join**(`threadId`, `runId`, `options`?): `Promise`\\<`void`\>

Defined in: [client.ts:1007](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1007)

Block until a run is done.

##### Parameters

###### threadId

`string`

The ID of the thread.

###### runId

`string`

The ID of the run.

###### options?

###### \# signal?

`AbortSignal`

##### Returns

`Promise`\\<`void`\>

* * *

#### joinStream()

> **joinStream**(`threadId`, `runId`, `options`?): `AsyncGenerator`\\<{ `data`: `any`; `event`: `StreamEvent`; }>

Defined in: [client.ts:1033](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1033)

Stream output from a run in real-time, until the run is done. Output is not buffered, so any output produced before this call will not be received here.

##### Parameters

###### threadId

`string`

The ID of the thread.

###### runId

`string`

The ID of the run.

###### options?

Additional options for controlling the stream behavior: - signal: An AbortSignal that can be used to cancel the stream request - cancelOnDisconnect: When true, automatically cancels the run if the client disconnects from the stream - streamMode: Controls what types of events to receive from the stream (can be a single mode or array of modes) Must be a subset of the stream modes passed when creating the run. Background runs default to having the union of all stream modes enabled.

`AbortSignal` | { `cancelOnDisconnect`: `boolean`; `signal`: `AbortSignal`; `streamMode`: `StreamMode` | `StreamMode`\[\]; }

##### Returns

`AsyncGenerator`\\<{ `data`: `any`; `event`: `StreamEvent`; }>

An async generator yielding stream parts.

* * *

#### list()

> **list**(`threadId`, `options`?): `Promise`\\<`Run`\[\]>

Defined in: [client.ts:935](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L935)

List all runs for a thread.

##### Parameters

###### threadId

`string`

The ID of the thread.

###### options?

Filtering and pagination options.

###### \# limit?

`number`

Maximum number of runs to return. Defaults to 10

###### \# offset?

`number`

Offset to start from. Defaults to 0.

###### \# status?

`RunStatus`

Status of the run to filter by.

##### Returns

`Promise`\\<`Run`\[\]>

List of runs.

* * *

#### stream()

Create a run and stream the results.

##### Param

The ID of the thread.

##### Param

Assistant ID to use for this run.

##### Param

Payload for creating a run.

##### Call Signature

> **stream**\\<`TStreamMode`, `TSubgraphs`\>(`threadId`, `assistantId`, `payload`?): `TypedAsyncGenerator`\\<`TStreamMode`, `TSubgraphs`, `TStateType`, `TUpdateType`, `TCustomEventType`\>

Defined in: [client.ts:706](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L706)

###### Type Parameters

• **TStreamMode** _extends_ `StreamMode` | `StreamMode`\[\] = `StreamMode`

• **TSubgraphs** _extends_ `boolean` = `false`

###### Parameters

###### \# threadId

`null`

###### \# assistantId

`string`

###### \# payload?

`Omit`\\<`RunsStreamPayload`\\<`TStreamMode`, `TSubgraphs`\>, `"multitaskStrategy"` | `"onCompletion"`\>

###### Returns

`TypedAsyncGenerator`\\<`TStreamMode`, `TSubgraphs`, `TStateType`, `TUpdateType`, `TCustomEventType`\>

##### Call Signature

> **stream**\\<`TStreamMode`, `TSubgraphs`\>(`threadId`, `assistantId`, `payload`?): `TypedAsyncGenerator`\\<`TStreamMode`, `TSubgraphs`, `TStateType`, `TUpdateType`, `TCustomEventType`\>

Defined in: [client.ts:724](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L724)

###### Type Parameters

• **TStreamMode** _extends_ `StreamMode` | `StreamMode`\[\] = `StreamMode`

• **TSubgraphs** _extends_ `boolean` = `false`

###### Parameters

###### \# threadId

`string`

###### \# assistantId

`string`

###### \# payload?

`RunsStreamPayload`\\<`TStreamMode`, `TSubgraphs`\>

###### Returns

`TypedAsyncGenerator`\\<`TStreamMode`, `TSubgraphs`, `TStateType`, `TUpdateType`, `TCustomEventType`\>

* * *

#### wait()

Create a run and wait for it to complete.

##### Param

The ID of the thread.

##### Param

Assistant ID to use for this run.

##### Param

Payload for creating a run.

##### Call Signature

> **wait**(`threadId`, `assistantId`, `payload`?): `Promise`\\<`DefaultValues`\>

Defined in: [client.ts:861](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L861)

###### Parameters

###### \# threadId

`null`

###### \# assistantId

`string`

###### \# payload?

`Omit`\\<`RunsWaitPayload`, `"multitaskStrategy"` | `"onCompletion"`\>

###### Returns

`Promise`\\<`DefaultValues`\>

##### Call Signature

> **wait**(`threadId`, `assistantId`, `payload`?): `Promise`\\<`DefaultValues`\>

Defined in: [client.ts:867](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L867)

###### Parameters

###### \# threadId

`string`

###### \# assistantId

`string`

###### \# payload?

`RunsWaitPayload`

###### Returns

`Promise`\\<`DefaultValues`\>

[**@langchain/langgraph-sdk**](#readmemd)

* * *

[@langchain/langgraph-sdk](#readmemd) / StoreClient

Class: StoreClient
----------------------------------------------------------

Defined in: [client.ts:1097](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1097)

### Extends

*   `BaseClient`

### Constructors

#### new StoreClient()

> **new StoreClient**(`config`?): [`StoreClient`](#classesstoreclientmd)

Defined in: [client.ts:85](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L85)

##### Parameters

###### config?

[`ClientConfig`](#interfacesclientconfigmd)

##### Returns

[`StoreClient`](#classesstoreclientmd)

##### Inherited from

`BaseClient.constructor`

### Methods

#### deleteItem()

> **deleteItem**(`namespace`, `key`): `Promise`\\<`void`\>

Defined in: [client.ts:1218](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1218)

Delete an item.

##### Parameters

###### namespace

`string`\[\]

A list of strings representing the namespace path.

###### key

`string`

The unique identifier for the item.

##### Returns

`Promise`\\<`void`\>

Promise

* * *

#### getItem()

> **getItem**(`namespace`, `key`, `options`?): `Promise`\\<`null` | `Item`\>

Defined in: [client.ts:1174](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1174)

Retrieve a single item.

##### Parameters

###### namespace

`string`\[\]

A list of strings representing the namespace path.

###### key

`string`

The unique identifier for the item.

###### options?

###### \# refreshTtl?

`null` | `boolean`

Whether to refresh the TTL on this read operation. If null, uses the store's default behavior.

##### Returns

`Promise`\\<`null` | `Item`\>

Promise

##### Example

```
const item = await client.store.getItem(
  ["documents", "user123"],
  "item456",
  { refreshTtl: true }
);
console.log(item);
// {
//   namespace: ["documents", "user123"],
//   key: "item456",
//   value: { title: "My Document", content: "Hello World" },
//   createdAt: "2024-07-30T12:00:00Z",
//   updatedAt: "2024-07-30T12:00:00Z"
// }

```


* * *

#### listNamespaces()

> **listNamespaces**(`options`?): `Promise`\\<`ListNamespaceResponse`\>

Defined in: [client.ts:1314](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1314)

List namespaces with optional match conditions.

##### Parameters

###### options?

###### \# limit?

`number`

Maximum number of namespaces to return (default is 100).

###### \# maxDepth?

`number`

Optional integer specifying the maximum depth of namespaces to return.

###### \# offset?

`number`

Number of namespaces to skip before returning results (default is 0).

###### \# prefix?

`string`\[\]

Optional list of strings representing the prefix to filter namespaces.

###### \# suffix?

`string`\[\]

Optional list of strings representing the suffix to filter namespaces.

##### Returns

`Promise`\\<`ListNamespaceResponse`\>

Promise

* * *

#### putItem()

> **putItem**(`namespace`, `key`, `value`, `options`?): `Promise`\\<`void`\>

Defined in: [client.ts:1118](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1118)

Store or update an item.

##### Parameters

###### namespace

`string`\[\]

A list of strings representing the namespace path.

###### key

`string`

The unique identifier for the item within the namespace.

###### value

`Record`\\<`string`, `any`\>

A dictionary containing the item's data.

###### options?

###### \# index?

`null` | `false` | `string`\[\]

Controls search indexing - null (use defaults), false (disable), or list of field paths to index.

###### \# ttl?

`null` | `number`

Optional time-to-live in minutes for the item, or null for no expiration.

##### Returns

`Promise`\\<`void`\>

Promise

##### Example

```
await client.store.putItem(
  ["documents", "user123"],
  "item456",
  { title: "My Document", content: "Hello World" },
  { ttl: 60 } // expires in 60 minutes
);

```


* * *

#### searchItems()

> **searchItems**(`namespacePrefix`, `options`?): `Promise`\\<`SearchItemsResponse`\>

Defined in: [client.ts:1269](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L1269)

Search for items within a namespace prefix.

##### Parameters

###### namespacePrefix

`string`\[\]

List of strings representing the namespace prefix.

###### options?

###### \# filter?

`Record`\\<`string`, `any`\>

Optional dictionary of key-value pairs to filter results.

###### \# limit?

`number`

Maximum number of items to return (default is 10).

###### \# offset?

`number`

Number of items to skip before returning results (default is 0).

###### \# query?

`string`

Optional search query.

###### \# refreshTtl?

`null` | `boolean`

Whether to refresh the TTL on items returned by this search. If null, uses the store's default behavior.

##### Returns

`Promise`\\<`SearchItemsResponse`\>

Promise

##### Example

```
const results = await client.store.searchItems(
  ["documents"],
  {
    filter: { author: "John Doe" },
    limit: 5,
    refreshTtl: true
  }
);
console.log(results);
// {
//   items: [
//     {
//       namespace: ["documents", "user123"],
//       key: "item789",
//       value: { title: "Another Document", author: "John Doe" },
//       createdAt: "2024-07-30T12:00:00Z",
//       updatedAt: "2024-07-30T12:00:00Z"
//     },
//     // ... additional items ...
//   ]
// }

```


[**@langchain/langgraph-sdk**](#readmemd)

* * *

[@langchain/langgraph-sdk](#readmemd) / ThreadsClient

Class: ThreadsClient\\<TStateType, TUpdateType>
---------------------------------------------------------------------------------------------------------------

Defined in: [client.ts:457](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L457)

### Extends

*   `BaseClient`

### Type Parameters

• **TStateType** = `DefaultValues`

• **TUpdateType** = `TStateType`

### Constructors

#### new ThreadsClient()

> **new ThreadsClient**\\<`TStateType`, `TUpdateType`\>(`config`?): [`ThreadsClient`](#classesthreadsclientmd)\\<`TStateType`, `TUpdateType`\>

Defined in: [client.ts:85](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L85)

##### Parameters

###### config?

[`ClientConfig`](#interfacesclientconfigmd)

##### Returns

[`ThreadsClient`](#classesthreadsclientmd)\\<`TStateType`, `TUpdateType`\>

##### Inherited from

`BaseClient.constructor`

### Methods

#### copy()

> **copy**(`threadId`): `Promise`\\<`Thread`\\<`TStateType`\>>

Defined in: [client.ts:502](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L502)

Copy an existing thread

##### Parameters

###### threadId

`string`

ID of the thread to be copied

##### Returns

`Promise`\\<`Thread`\\<`TStateType`\>>

Newly copied thread

* * *

#### create()

> **create**(`payload`?): `Promise`\\<`Thread`\\<`TStateType`\>>

Defined in: [client.ts:479](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L479)

Create a new thread.

##### Parameters

###### payload?

Payload for creating a thread.

###### \# ifExists?

`OnConflictBehavior`

###### \# metadata?

`Metadata`

Metadata for the thread.

###### \# threadId?

`string`

##### Returns

`Promise`\\<`Thread`\\<`TStateType`\>>

The created thread.

* * *

#### delete()

> **delete**(`threadId`): `Promise`\\<`void`\>

Defined in: [client.ts:535](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L535)

Delete a thread.

##### Parameters

###### threadId

`string`

ID of the thread.

##### Returns

`Promise`\\<`void`\>

* * *

#### get()

> **get**\\<`ValuesType`\>(`threadId`): `Promise`\\<`Thread`\\<`ValuesType`\>>

Defined in: [client.ts:467](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L467)

Get a thread by ID.

##### Type Parameters

• **ValuesType** = `TStateType`

##### Parameters

###### threadId

`string`

ID of the thread.

##### Returns

`Promise`\\<`Thread`\\<`ValuesType`\>>

The thread.

* * *

#### getHistory()

> **getHistory**\\<`ValuesType`\>(`threadId`, `options`?): `Promise`\\<`ThreadState`\\<`ValuesType`\>\[\]>

Defined in: [client.ts:677](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L677)

Get all past states for a thread.

##### Type Parameters

• **ValuesType** = `TStateType`

##### Parameters

###### threadId

`string`

ID of the thread.

###### options?

Additional options.

###### \# before?

`Config`

###### \# checkpoint?

`Partial`\\<`Omit`\\<`Checkpoint`, `"thread_id"`\>>

###### \# limit?

`number`

###### \# metadata?

`Metadata`

##### Returns

`Promise`\\<`ThreadState`\\<`ValuesType`\>\[\]>

List of thread states.

* * *

#### getState()

> **getState**\\<`ValuesType`\>(`threadId`, `checkpoint`?, `options`?): `Promise`\\<`ThreadState`\\<`ValuesType`\>>

Defined in: [client.ts:584](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L584)

Get state for a thread.

##### Type Parameters

• **ValuesType** = `TStateType`

##### Parameters

###### threadId

`string`

ID of the thread.

###### checkpoint?

`string` | `Checkpoint`

###### options?

###### \# subgraphs?

`boolean`

##### Returns

`Promise`\\<`ThreadState`\\<`ValuesType`\>>

Thread state.

* * *

#### patchState()

> **patchState**(`threadIdOrConfig`, `metadata`): `Promise`\\<`void`\>

Defined in: [client.ts:647](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L647)

Patch the metadata of a thread.

##### Parameters

###### threadIdOrConfig

Thread ID or config to patch the state of.

`string` | `Config`

###### metadata

`Metadata`

Metadata to patch the state with.

##### Returns

`Promise`\\<`void`\>

* * *

#### search()

> **search**\\<`ValuesType`\>(`query`?): `Promise`\\<`Thread`\\<`ValuesType`\>\[\]>

Defined in: [client.ts:547](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L547)

List threads

##### Type Parameters

• **ValuesType** = `TStateType`

##### Parameters

###### query?

Query options

###### \# limit?

`number`

Maximum number of threads to return. Defaults to 10

###### \# metadata?

`Metadata`

Metadata to filter threads by.

###### \# offset?

`number`

Offset to start from.

###### \# status?

`ThreadStatus`

Thread status to filter on. Must be one of 'idle', 'busy', 'interrupted' or 'error'.

##### Returns

`Promise`\\<`Thread`\\<`ValuesType`\>\[\]>

List of threads

* * *

#### update()

> **update**(`threadId`, `payload`?): `Promise`\\<`Thread`\\<`DefaultValues`\>>

Defined in: [client.ts:515](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L515)

Update a thread.

##### Parameters

###### threadId

`string`

ID of the thread.

###### payload?

Payload for updating the thread.

###### \# metadata?

`Metadata`

Metadata for the thread.

##### Returns

`Promise`\\<`Thread`\\<`DefaultValues`\>>

The updated thread.

* * *

#### updateState()

> **updateState**\\<`ValuesType`\>(`threadId`, `options`): `Promise`\\<`Pick`\\<`Config`, `"configurable"`\>>

Defined in: [client.ts:618](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L618)

Add state to a thread.

##### Type Parameters

• **ValuesType** = `TUpdateType`

##### Parameters

###### threadId

`string`

The ID of the thread.

###### options

###### \# asNode?

`string`

###### \# checkpoint?

`Checkpoint`

###### \# checkpointId?

`string`

###### \# values

`ValuesType`

##### Returns

`Promise`\\<`Pick`\\<`Config`, `"configurable"`\>>

[**@langchain/langgraph-sdk**](#readmemd)

* * *

[@langchain/langgraph-sdk](#readmemd) / getApiKey

Function: getApiKey()
--------------------------------------------------------------

> **getApiKey**(`apiKey`?): `undefined` | `string`

Defined in: [client.ts:50](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L50)

Get the API key from the environment. Precedence: 1. explicit argument 2. LANGGRAPH\_API\_KEY 3. LANGSMITH\_API\_KEY 4. LANGCHAIN\_API\_KEY

### Parameters

#### apiKey?

`string`

Optional API key provided as an argument

### Returns

`undefined` | `string`

The API key if found, otherwise undefined

[**@langchain/langgraph-sdk**](#readmemd)

* * *

[@langchain/langgraph-sdk](#readmemd) / ClientConfig

Interface: ClientConfig
--------------------------------------------------------------------

Defined in: [client.ts:68](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L68)

### Properties

#### apiKey?

> `optional` **apiKey**: `string`

Defined in: [client.ts:70](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L70)

* * *

#### apiUrl?

> `optional` **apiUrl**: `string`

Defined in: [client.ts:69](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L69)

* * *

#### callerOptions?

> `optional` **callerOptions**: `AsyncCallerParams`

Defined in: [client.ts:71](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L71)

* * *

> `optional` **defaultHeaders**: `Record`\\<`string`, `undefined` | `null` | `string`\>

Defined in: [client.ts:73](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L73)

* * *

#### timeoutMs?

> `optional` **timeoutMs**: `number`

Defined in: [client.ts:72](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/client.ts#L72)

**[langchain/langgraph-sdk](https://github.com/langchain/langgraph-sdk "GitHub Repository: langchain/langgraph-sdk")**

* * *

[langchain/langgraph-sdk](https://github.com/langchain/langgraph-sdk "GitHub Repository: langchain/langgraph-sdk")/react
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### Type Aliases

*   [MessageMetadata](#reacttype-aliasesmessagemetadatamd)

### Functions

*   [useStream](#reactfunctionsusestreammd)

[**@langchain/langgraph-sdk**](#reactreadmemd)

* * *

[@langchain/langgraph-sdk](#reactreadmemd) / useStream

Function: useStream()
--------------------------------------------------------------

> **useStream**\\<`StateType`, `Bag`\>(`options`): `UseStream`\\<`StateType`, `Bag`\>

Defined in: [stream.tsx:601](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/react/stream.tsx#L601)

### Type Parameters

• **StateType** _extends_ `Record`\\<`string`, `unknown`\> = `Record`\\<`string`, `unknown`\>

• **Bag** _extends_ `object` = `BagTemplate`

### Parameters

#### options

`UseStreamOptions`\\<`StateType`, `Bag`\>

### Returns

`UseStream`\\<`StateType`, `Bag`\>

[**@langchain/langgraph-sdk**](#reactreadmemd)

* * *

[@langchain/langgraph-sdk](#reactreadmemd) / MessageMetadata

> **MessageMetadata**\\<`StateType`\>: `object`

Defined in: [stream.tsx:169](https://github.com/langchain-ai/langgraph/blob/2e1adaa867303da9fccc5ed910f7d7d1b1ccf7c5/libs/sdk-js/src/react/stream.tsx#L169)

### Type Parameters

• **StateType** _extends_ `Record`\\<`string`, `unknown`\>

### Type declaration

#### branch

> **branch**: `string` | `undefined`

The branch of the message.

#### branchOptions

> **branchOptions**: `string`\[\] | `undefined`

The list of branches this message is part of. This is useful for displaying branching controls.

#### firstSeenState

> **firstSeenState**: `ThreadState`\\<`StateType`\> | `undefined`

The first thread state the message was seen in.

#### messageId

> **messageId**: `string`

The ID of the message used.