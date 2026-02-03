# WorkflowApi

All URIs are relative to *http://localhost:8081*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createEdge**](WorkflowApi.md#createedge) | **POST** /api/v1/workflow/graph/edges/workspace/{workspaceId} | Create a new workflow edge |
| [**deleteEdge**](WorkflowApi.md#deleteedge) | **DELETE** /api/v1/workflow/graph/edges/{id} | Delete workflow edge |
| [**deleteNode**](WorkflowApi.md#deletenode) | **DELETE** /api/v1/workflow/graph/nodes/{id} | Delete workflow node (cascades to connected edges) |
| [**deleteWorkflow**](WorkflowApi.md#deleteworkflow) | **DELETE** /api/v1/workflow/definitions/{id} | Delete workflow definition |
| [**getExecution**](WorkflowApi.md#getexecution) | **GET** /api/v1/workflow/executions/{id} | Get workflow execution by ID |
| [**getExecutionSummary**](WorkflowApi.md#getexecutionsummary) | **GET** /api/v1/workflow/executions/{id}/summary | Get execution summary with node details |
| [**getNodeConfigSchemas**](WorkflowApi.md#getnodeconfigschemas) | **GET** /api/v1/workflow/definitions/nodes | Get workflow node configuration schemas |
| [**getWorkflow**](WorkflowApi.md#getworkflow) | **GET** /api/v1/workflow/definitions/{id} | Get workflow definition by ID |
| [**getWorkflowGraph**](WorkflowApi.md#getworkflowgraph) | **GET** /api/v1/workflow/graph/workflow/{workflowDefinitionId} | Get complete workflow graph (nodes and edges) |
| [**listWorkflowExecutions**](WorkflowApi.md#listworkflowexecutions) | **GET** /api/v1/workflow/executions/workflow/{workflowDefinitionId} | List all executions for a workflow definition |
| [**listWorkflows**](WorkflowApi.md#listworkflows) | **GET** /api/v1/workflow/definitions/workspace/{workspaceId} | List all workflow definitions for workspace |
| [**listWorkspaceExecutions**](WorkflowApi.md#listworkspaceexecutions) | **GET** /api/v1/workflow/executions/workspace/{workspaceId} | List all executions for workspace |
| [**saveNode**](WorkflowApi.md#savenode) | **POST** /api/v1/workflow/graph/workspace/{workspaceId}/node | Save a workflow node |
| [**saveWorkflow**](WorkflowApi.md#saveworkflow) | **POST** /api/v1/workflow/definitions/workspace/{workspaceId} | Save a workflow definition |
| [**startExecution**](WorkflowApi.md#startexecution) | **POST** /api/v1/workflow/executions/start | Queue a workflow execution |



## createEdge

> WorkflowEdge createEdge(workspaceId, createWorkflowEdgeRequest)

Create a new workflow edge

Creates a new edge connecting two workflow nodes in the workspace.

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { CreateEdgeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // CreateWorkflowEdgeRequest
    createWorkflowEdgeRequest: ...,
  } satisfies CreateEdgeRequest;

  try {
    const data = await api.createEdge(body);
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
| **createWorkflowEdgeRequest** | [CreateWorkflowEdgeRequest](CreateWorkflowEdgeRequest.md) |  | |

### Return type

[**WorkflowEdge**](WorkflowEdge.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Workflow edge created successfully |  -  |
| **400** | Invalid request data or nodes not found |  -  |
| **401** | Unauthorized - authentication required |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteEdge

> deleteEdge(id, workspaceId)

Delete workflow edge

Soft-deletes a workflow edge. Does not affect connected nodes.

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { DeleteEdgeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies DeleteEdgeRequest;

  try {
    const data = await api.deleteEdge(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |
| **workspaceId** | `string` |  | [Defaults to `undefined`] |

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
| **204** | Workflow edge deleted successfully |  -  |
| **401** | Unauthorized - authentication required |  -  |
| **404** | Workflow edge not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteNode

> deleteNode(id, workspaceId)

Delete workflow node (cascades to connected edges)

Soft-deletes a workflow node and all edges connected to it. This maintains graph consistency.

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { DeleteNodeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies DeleteNodeRequest;

  try {
    const data = await api.deleteNode(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |
| **workspaceId** | `string` |  | [Defaults to `undefined`] |

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
| **204** | Workflow node and connected edges deleted successfully |  -  |
| **401** | Unauthorized - authentication required |  -  |
| **404** | Workflow node not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteWorkflow

> deleteWorkflow(id, workspaceId)

Delete workflow definition

Soft-deletes a workflow definition. The definition can be restored if needed.

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { DeleteWorkflowRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies DeleteWorkflowRequest;

  try {
    const data = await api.deleteWorkflow(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |
| **workspaceId** | `string` |  | [Defaults to `undefined`] |

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
| **204** | Workflow definition deleted successfully |  -  |
| **401** | Unauthorized - authentication required |  -  |
| **404** | Workflow definition not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getExecution

> WorkflowExecutionRecord getExecution(id, workspaceId)

Get workflow execution by ID

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { GetExecutionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetExecutionRequest;

  try {
    const data = await api.getExecution(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |
| **workspaceId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**WorkflowExecutionRecord**](WorkflowExecutionRecord.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Execution retrieved successfully |  -  |
| **401** | Unauthorized access |  -  |
| **404** | Execution not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getExecutionSummary

> WorkflowExecutionSummaryResponse getExecutionSummary(id, workspaceId)

Get execution summary with node details

Returns execution record and status for each node in the workflow

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { GetExecutionSummaryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetExecutionSummaryRequest;

  try {
    const data = await api.getExecutionSummary(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |
| **workspaceId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**WorkflowExecutionSummaryResponse**](WorkflowExecutionSummaryResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Execution summary retrieved successfully |  -  |
| **401** | Unauthorized access |  -  |
| **404** | Execution not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getNodeConfigSchemas

> { [key: string]: WorkflowNodeMetadata; } getNodeConfigSchemas()

Get workflow node configuration schemas

Retrieves the configuration schemas for all workflow node types. Returns a map where keys are node identifiers (e.g., \&#39;ACTION.CREATE_ENTITY\&#39;) and values are lists of configuration fields.

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { GetNodeConfigSchemasRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  try {
    const data = await api.getNodeConfigSchemas();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**{ [key: string]: WorkflowNodeMetadata; }**](WorkflowNodeMetadata.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Node configuration schemas retrieved successfully |  -  |
| **401** | Unauthorized - authentication required |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getWorkflow

> WorkflowDefinition getWorkflow(id, workspaceId)

Get workflow definition by ID

Retrieves a workflow definition by its ID. Requires workspace access.

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { GetWorkflowRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetWorkflowRequest;

  try {
    const data = await api.getWorkflow(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |
| **workspaceId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**WorkflowDefinition**](WorkflowDefinition.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Workflow definition retrieved successfully |  -  |
| **401** | Unauthorized - authentication required |  -  |
| **404** | Workflow definition not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getWorkflowGraph

> WorkflowGraph getWorkflowGraph(workflowDefinitionId, workspaceId)

Get complete workflow graph (nodes and edges)

Returns the complete DAG structure with all nodes and edges for the workflow definition.

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { GetWorkflowGraphRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    workflowDefinitionId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetWorkflowGraphRequest;

  try {
    const data = await api.getWorkflowGraph(body);
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
| **workflowDefinitionId** | `string` |  | [Defaults to `undefined`] |
| **workspaceId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**WorkflowGraph**](WorkflowGraph.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Workflow graph retrieved successfully |  -  |
| **401** | Unauthorized - authentication required |  -  |
| **404** | Workflow definition not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listWorkflowExecutions

> Array&lt;WorkflowExecutionRecord&gt; listWorkflowExecutions(workflowDefinitionId, workspaceId)

List all executions for a workflow definition

Returns execution history ordered by most recent first

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { ListWorkflowExecutionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    workflowDefinitionId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies ListWorkflowExecutionsRequest;

  try {
    const data = await api.listWorkflowExecutions(body);
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
| **workflowDefinitionId** | `string` |  | [Defaults to `undefined`] |
| **workspaceId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**Array&lt;WorkflowExecutionRecord&gt;**](WorkflowExecutionRecord.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Executions retrieved successfully |  -  |
| **401** | Unauthorized access |  -  |
| **404** | Workflow definition not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listWorkflows

> Array&lt;WorkflowDefinition&gt; listWorkflows(workspaceId)

List all workflow definitions for workspace

Retrieves all workflow definitions associated with the specified workspace.

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { ListWorkflowsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies ListWorkflowsRequest;

  try {
    const data = await api.listWorkflows(body);
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

[**Array&lt;WorkflowDefinition&gt;**](WorkflowDefinition.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Workflow definitions retrieved successfully |  -  |
| **401** | Unauthorized - authentication required |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listWorkspaceExecutions

> Array&lt;WorkflowExecutionRecord&gt; listWorkspaceExecutions(workspaceId)

List all executions for workspace

Returns all workflow executions across all workflows in workspace

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { ListWorkspaceExecutionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies ListWorkspaceExecutionsRequest;

  try {
    const data = await api.listWorkspaceExecutions(body);
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

[**Array&lt;WorkflowExecutionRecord&gt;**](WorkflowExecutionRecord.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Executions retrieved successfully |  -  |
| **401** | Unauthorized access |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## saveNode

> SaveWorkflowNodeResponse saveNode(workspaceId, saveWorkflowNodeRequest)

Save a workflow node

Saves a workflow node - creates new if id is null, updates existing if id is provided. Config changes on update create a new version.

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { SaveNodeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // SaveWorkflowNodeRequest
    saveWorkflowNodeRequest: ...,
  } satisfies SaveNodeRequest;

  try {
    const data = await api.saveNode(body);
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
| **saveWorkflowNodeRequest** | [SaveWorkflowNodeRequest](SaveWorkflowNodeRequest.md) |  | |

### Return type

[**SaveWorkflowNodeResponse**](SaveWorkflowNodeResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Workflow node saved successfully |  -  |
| **400** | Invalid request data |  -  |
| **401** | Unauthorized - authentication required |  -  |
| **404** | Workflow node not found (for updates) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## saveWorkflow

> SaveWorkflowDefinitionResponse saveWorkflow(workspaceId, saveWorkflowDefinitionRequest)

Save a workflow definition

Saves a workflow definition - creates new if id is null, updates existing if id is provided. Only metadata is updated on existing definitions.

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { SaveWorkflowRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // SaveWorkflowDefinitionRequest
    saveWorkflowDefinitionRequest: ...,
  } satisfies SaveWorkflowRequest;

  try {
    const data = await api.saveWorkflow(body);
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
| **saveWorkflowDefinitionRequest** | [SaveWorkflowDefinitionRequest](SaveWorkflowDefinitionRequest.md) |  | |

### Return type

[**SaveWorkflowDefinitionResponse**](SaveWorkflowDefinitionResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Workflow definition saved successfully |  -  |
| **400** | Invalid request data |  -  |
| **401** | Unauthorized - authentication required |  -  |
| **404** | Workflow definition not found (for updates) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## startExecution

> ExecutionQueueRequest startExecution(startWorkflowExecutionRequest)

Queue a workflow execution

### Example

```ts
import {
  Configuration,
  WorkflowApi,
} from '';
import type { StartExecutionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WorkflowApi(config);

  const body = {
    // StartWorkflowExecutionRequest
    startWorkflowExecutionRequest: ...,
  } satisfies StartExecutionRequest;

  try {
    const data = await api.startExecution(body);
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
| **startWorkflowExecutionRequest** | [StartWorkflowExecutionRequest](StartWorkflowExecutionRequest.md) |  | |

### Return type

[**ExecutionQueueRequest**](ExecutionQueueRequest.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **202** | Workflow execution queued successfully |  -  |
| **401** | Unauthorized access |  -  |
| **404** | Workflow definition not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

