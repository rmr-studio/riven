# InsightsApi

All URIs are relative to *http://localhost:8081*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createSession**](InsightsApi.md#createsessionoperation) | **POST** /api/v1/insights/workspace/{workspaceId}/sessions | Create a new insights chat session |
| [**deleteSession**](InsightsApi.md#deletesession) | **DELETE** /api/v1/insights/workspace/{workspaceId}/sessions/{sessionId} | Soft-delete an insights chat session |
| [**ensureDemoReady**](InsightsApi.md#ensuredemoready) | **POST** /api/v1/insights/workspace/{workspaceId}/demo/ensure-ready | Ensure the workspace is demo-ready |
| [**getMessages**](InsightsApi.md#getmessages) | **GET** /api/v1/insights/workspace/{workspaceId}/sessions/{sessionId}/messages | Get the full message history for a session |
| [**getSuggestedPrompts**](InsightsApi.md#getsuggestedprompts) | **GET** /api/v1/insights/workspace/{workspaceId}/demo/suggested-prompts | Suggested demo prompts for the insights chat |
| [**listSessions**](InsightsApi.md#listsessions) | **GET** /api/v1/insights/workspace/{workspaceId}/sessions | List insights chat sessions for a workspace |
| [**sendMessage**](InsightsApi.md#sendmessageoperation) | **POST** /api/v1/insights/workspace/{workspaceId}/sessions/{sessionId}/messages | Send a user message and receive an assistant reply |



## createSession

> InsightsChatSessionModel createSession(workspaceId, createSessionRequest)

Create a new insights chat session

Creates an empty chat session in the workspace. The demo entity pool is seeded lazily on the first message.

### Example

```ts
import {
  Configuration,
  InsightsApi,
} from '';
import type { CreateSessionOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new InsightsApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // CreateSessionRequest
    createSessionRequest: ...,
  } satisfies CreateSessionOperationRequest;

  try {
    const data = await api.createSession(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | `string` |  | [Defaults to `undefined`] |
| **createSessionRequest** | [CreateSessionRequest](CreateSessionRequest.md) |  | |

### Return type

[**InsightsChatSessionModel**](InsightsChatSessionModel.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Session created |  -  |
| **401** | Unauthorised |  -  |
| **403** | Forbidden — workspace access denied |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteSession

> deleteSession(workspaceId, sessionId)

Soft-delete an insights chat session

Soft-deletes the session and cleans up its seeded demo entity pool.

### Example

```ts
import {
  Configuration,
  InsightsApi,
} from '';
import type { DeleteSessionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new InsightsApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    sessionId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies DeleteSessionRequest;

  try {
    const data = await api.deleteSession(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | `string` |  | [Defaults to `undefined`] |
| **sessionId** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Session deleted |  -  |
| **401** | Unauthorised |  -  |
| **403** | Forbidden |  -  |
| **404** | Session not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## ensureDemoReady

> EnsureDemoReadyResult ensureDemoReady(workspaceId)

Ensure the workspace is demo-ready

Idempotently seeds a curated set of business definitions (valuable customer, active customer, power user, at risk, retention) so the insights chat and suggested prompts return bespoke results out of the box. Existing definitions matching one of the curated terms (by normalized term) are left untouched.

### Example

```ts
import {
  Configuration,
  InsightsApi,
} from '';
import type { EnsureDemoReadyRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new InsightsApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies EnsureDemoReadyRequest;

  try {
    const data = await api.ensureDemoReady(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**EnsureDemoReadyResult**](EnsureDemoReadyResult.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Seed summary returned |  -  |
| **401** | Unauthorised |  -  |
| **403** | Forbidden — workspace access denied |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getMessages

> Array&lt;InsightsMessageModel&gt; getMessages(workspaceId, sessionId)

Get the full message history for a session

### Example

```ts
import {
  Configuration,
  InsightsApi,
} from '';
import type { GetMessagesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new InsightsApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    sessionId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetMessagesRequest;

  try {
    const data = await api.getMessages(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | `string` |  | [Defaults to `undefined`] |
| **sessionId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**Array&lt;InsightsMessageModel&gt;**](InsightsMessageModel.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Messages returned |  -  |
| **401** | Unauthorised |  -  |
| **403** | Forbidden |  -  |
| **404** | Session not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getSuggestedPrompts

> Array&lt;SuggestedPrompt&gt; getSuggestedPrompts(workspaceId)

Suggested demo prompts for the insights chat

Returns a curated, data-signal-aware list of demo-ready prompts ranked by relevance. Prompts whose required data signals are not present in the workspace are filtered out.

### Example

```ts
import {
  Configuration,
  InsightsApi,
} from '';
import type { GetSuggestedPromptsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new InsightsApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetSuggestedPromptsRequest;

  try {
    const data = await api.getSuggestedPrompts(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**Array&lt;SuggestedPrompt&gt;**](SuggestedPrompt.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Suggested prompts returned |  -  |
| **401** | Unauthorised |  -  |
| **403** | Forbidden — workspace access denied |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listSessions

> PageInsightsChatSessionModel listSessions(workspaceId, pageable)

List insights chat sessions for a workspace

### Example

```ts
import {
  Configuration,
  InsightsApi,
} from '';
import type { ListSessionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new InsightsApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // Pageable
    pageable: ...,
  } satisfies ListSessionsRequest;

  try {
    const data = await api.listSessions(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | `string` |  | [Defaults to `undefined`] |
| **pageable** | [](.md) |  | [Defaults to `undefined`] |

### Return type

[**PageInsightsChatSessionModel**](PageInsightsChatSessionModel.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Sessions returned |  -  |
| **401** | Unauthorised |  -  |
| **403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## sendMessage

> InsightsMessageModel sendMessage(workspaceId, sessionId, sendMessageRequest)

Send a user message and receive an assistant reply

Persists the user message, lazily seeds the demo entity pool, calls the LLM, and returns the assistant\&#39;s reply.

### Example

```ts
import {
  Configuration,
  InsightsApi,
} from '';
import type { SendMessageOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new InsightsApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    sessionId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // SendMessageRequest
    sendMessageRequest: ...,
  } satisfies SendMessageOperationRequest;

  try {
    const data = await api.sendMessage(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | `string` |  | [Defaults to `undefined`] |
| **sessionId** | `string` |  | [Defaults to `undefined`] |
| **sendMessageRequest** | [SendMessageRequest](SendMessageRequest.md) |  | |

### Return type

[**InsightsMessageModel**](InsightsMessageModel.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Assistant reply returned |  -  |
| **400** | Invalid request |  -  |
| **401** | Unauthorised |  -  |
| **403** | Forbidden |  -  |
| **404** | Session not found |  -  |
| **502** | LLM upstream failure |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

