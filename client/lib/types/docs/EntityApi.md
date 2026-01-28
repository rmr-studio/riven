# EntityApi

All URIs are relative to *http://localhost:8081*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createEntityType**](EntityApi.md#createentitytypeoperation) | **POST** /api/v1/entity/schema/workspace/{workspaceId} | Create a new entity type |
| [**deleteEntity**](EntityApi.md#deleteentity) | **DELETE** /api/v1/entity/workspace/{workspaceId} | Deletes an entity instance |
| [**deleteEntityTypeByKey**](EntityApi.md#deleteentitytypebykey) | **DELETE** /api/v1/entity/schema/workspace/{workspaceId}/key/{key} | Delete an entity type by key |
| [**deleteEntityTypeDefinition**](EntityApi.md#deleteentitytypedefinition) | **DELETE** /api/v1/entity/schema/workspace/{workspaceId}/definition | Removes an attribute or relationship from an entity type |
| [**getEntityByTypeIdForWorkspace**](EntityApi.md#getentitybytypeidforworkspace) | **GET** /api/v1/entity/workspace/{workspaceId}/type/{id} | Get all entity types for an workspace for a provided entity type |
| [**getEntityByTypeIdInForWorkspace**](EntityApi.md#getentitybytypeidinforworkspace) | **GET** /api/v1/entity/workspace/{workspaceId} | Get all entity types for an workspace for all provided type keys |
| [**getEntityTypeByKeyForWorkspace**](EntityApi.md#getentitytypebykeyforworkspace) | **GET** /api/v1/entity/schema/workspace/{workspaceId}/key/{key} | Get an entity type by key for an workspace |
| [**getEntityTypesForWorkspace**](EntityApi.md#getentitytypesforworkspace) | **GET** /api/v1/entity/schema/workspace/{workspaceId} | Get all entity types for an workspace |
| [**saveEntity**](EntityApi.md#saveentityoperation) | **POST** /api/v1/entity/workspace/{workspaceId}/type/{entityTypeId} | Saves an entity instance |
| [**saveEntityTypeDefinition**](EntityApi.md#saveentitytypedefinition) | **POST** /api/v1/entity/schema/workspace/{workspaceId}/definition | Add or update an attribute or relationship |
| [**updateEntityType**](EntityApi.md#updateentitytype) | **PUT** /api/v1/entity/schema/workspace/{workspaceId}/configuration | Updates an existing entity type configuration |



## createEntityType

> EntityType createEntityType(workspaceId, createEntityTypeRequest)

Create a new entity type

Creates and publishes a new entity type for the specified workspace.

### Example

```ts
import {
  Configuration,
  EntityApi,
} from '';
import type { CreateEntityTypeOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EntityApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // CreateEntityTypeRequest
    createEntityTypeRequest: ...,
  } satisfies CreateEntityTypeOperationRequest;

  try {
    const data = await api.createEntityType(body);
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
| **createEntityTypeRequest** | [CreateEntityTypeRequest](CreateEntityTypeRequest.md) |  | |

### Return type

[**EntityType**](EntityType.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Entity type created successfully |  -  |
| **400** | Invalid request data |  -  |
| **401** | Unauthorized access |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteEntity

> DeleteEntityResponse deleteEntity(workspaceId, requestBody)

Deletes an entity instance

Deleted the specified entity instance within the workspace.

### Example

```ts
import {
  Configuration,
  EntityApi,
} from '';
import type { DeleteEntityRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EntityApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // Array<string>
    requestBody: ...,
  } satisfies DeleteEntityRequest;

  try {
    const data = await api.deleteEntity(body);
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
| **requestBody** | `Array<string>` |  | |

### Return type

[**DeleteEntityResponse**](DeleteEntityResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Entity instance deleted successfully |  -  |
| **401** | Unauthorized access |  -  |
| **404** | Workspace or entity not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteEntityTypeByKey

> EntityTypeImpactResponse deleteEntityTypeByKey(workspaceId, key, impactConfirmed)

Delete an entity type by key

Deletes the specified entity type by its key for the given workspace.

### Example

```ts
import {
  Configuration,
  EntityApi,
} from '';
import type { DeleteEntityTypeByKeyRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EntityApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    key: key_example,
    // boolean (optional)
    impactConfirmed: true,
  } satisfies DeleteEntityTypeByKeyRequest;

  try {
    const data = await api.deleteEntityTypeByKey(body);
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
| **key** | `string` |  | [Defaults to `undefined`] |
| **impactConfirmed** | `boolean` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**EntityTypeImpactResponse**](EntityTypeImpactResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Entity type deleted successfully |  -  |
| **401** | Unauthorized access |  -  |
| **404** | Entity type not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteEntityTypeDefinition

> EntityTypeImpactResponse deleteEntityTypeDefinition(workspaceId, deleteTypeDefinitionRequest, impactConfirmed)

Removes an attribute or relationship from an entity type

Removes an attribute or relationship from the specified entity type for the given workspace.

### Example

```ts
import {
  Configuration,
  EntityApi,
} from '';
import type { DeleteEntityTypeDefinitionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EntityApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // DeleteTypeDefinitionRequest
    deleteTypeDefinitionRequest: ...,
    // boolean (optional)
    impactConfirmed: true,
  } satisfies DeleteEntityTypeDefinitionRequest;

  try {
    const data = await api.deleteEntityTypeDefinition(body);
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
| **deleteTypeDefinitionRequest** | [DeleteTypeDefinitionRequest](DeleteTypeDefinitionRequest.md) |  | |
| **impactConfirmed** | `boolean` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**EntityTypeImpactResponse**](EntityTypeImpactResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Entity type definition removed successfully |  -  |
| **409** | Conflict due to cascading impacts on existing entities as a result of aforementioned changes |  -  |
| **400** | Invalid request data |  -  |
| **401** | Unauthorized access |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getEntityByTypeIdForWorkspace

> Array&lt;Entity&gt; getEntityByTypeIdForWorkspace(workspaceId, id)

Get all entity types for an workspace for a provided entity type

Retrieves all entity associated with the specified workspace and specified entity type.This will also fetch all relevant linked entities.

### Example

```ts
import {
  Configuration,
  EntityApi,
} from '';
import type { GetEntityByTypeIdForWorkspaceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EntityApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    id: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetEntityByTypeIdForWorkspaceRequest;

  try {
    const data = await api.getEntityByTypeIdForWorkspace(body);
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
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**Array&lt;Entity&gt;**](Entity.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Entity types retrieved successfully |  -  |
| **401** | Unauthorized access |  -  |
| **404** | Workspace not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getEntityByTypeIdInForWorkspace

> { [key: string]: Array&lt;Entity&gt;; } getEntityByTypeIdInForWorkspace(workspaceId, ids)

Get all entity types for an workspace for all provided type keys

Retrieves all entity associated with the specified workspace and specified entity types.This will also fetch all relevant linked entities.

### Example

```ts
import {
  Configuration,
  EntityApi,
} from '';
import type { GetEntityByTypeIdInForWorkspaceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EntityApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // Array<string>
    ids: ...,
  } satisfies GetEntityByTypeIdInForWorkspaceRequest;

  try {
    const data = await api.getEntityByTypeIdInForWorkspace(body);
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
| **ids** | `Array<string>` |  | |

### Return type

**{ [key: string]: Array<Entity>; }**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Entity types retrieved successfully |  -  |
| **401** | Unauthorized access |  -  |
| **404** | Workspace not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getEntityTypeByKeyForWorkspace

> EntityType getEntityTypeByKeyForWorkspace(workspaceId, key)

Get an entity type by key for an workspace

Retrieves a specific entity type by its key associated with the specified workspace.

### Example

```ts
import {
  Configuration,
  EntityApi,
} from '';
import type { GetEntityTypeByKeyForWorkspaceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EntityApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    key: key_example,
  } satisfies GetEntityTypeByKeyForWorkspaceRequest;

  try {
    const data = await api.getEntityTypeByKeyForWorkspace(body);
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
| **key** | `string` |  | [Defaults to `undefined`] |

### Return type

[**EntityType**](EntityType.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Entity type retrieved successfully |  -  |
| **401** | Unauthorized access |  -  |
| **404** | Entity type not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getEntityTypesForWorkspace

> Array&lt;EntityType&gt; getEntityTypesForWorkspace(workspaceId)

Get all entity types for an workspace

Retrieves all entity types associated with the specified workspace.

### Example

```ts
import {
  Configuration,
  EntityApi,
} from '';
import type { GetEntityTypesForWorkspaceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EntityApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
  } satisfies GetEntityTypesForWorkspaceRequest;

  try {
    const data = await api.getEntityTypesForWorkspace(body);
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

[**Array&lt;EntityType&gt;**](EntityType.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Entity types retrieved successfully |  -  |
| **401** | Unauthorized access |  -  |
| **404** | Workspace not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## saveEntity

> SaveEntityResponse saveEntity(workspaceId, entityTypeId, saveEntityRequest)

Saves an entity instance

Saves either a new entity, or an updated instance within the specified workspace.

### Example

```ts
import {
  Configuration,
  EntityApi,
} from '';
import type { SaveEntityOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EntityApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // string
    entityTypeId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // SaveEntityRequest
    saveEntityRequest: ...,
  } satisfies SaveEntityOperationRequest;

  try {
    const data = await api.saveEntity(body);
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
| **entityTypeId** | `string` |  | [Defaults to `undefined`] |
| **saveEntityRequest** | [SaveEntityRequest](SaveEntityRequest.md) |  | |

### Return type

[**SaveEntityResponse**](SaveEntityResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`, `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Entity instance saved successfully |  -  |
| **400** | Invalid entity data provided |  -  |
| **401** | Unauthorized access |  -  |
| **404** | Workspace or entity type not found |  -  |
| **409** | Conflict of data or unconfirmed impacts |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## saveEntityTypeDefinition

> EntityTypeImpactResponse saveEntityTypeDefinition(workspaceId, saveTypeDefinitionRequest, impactConfirmed)

Add or update an attribute or relationship

Adds or updates an attribute or relationship in the specified entity type for the given workspace.

### Example

```ts
import {
  Configuration,
  EntityApi,
} from '';
import type { SaveEntityTypeDefinitionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EntityApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // SaveTypeDefinitionRequest
    saveTypeDefinitionRequest: ...,
    // boolean (optional)
    impactConfirmed: true,
  } satisfies SaveEntityTypeDefinitionRequest;

  try {
    const data = await api.saveEntityTypeDefinition(body);
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
| **saveTypeDefinitionRequest** | [SaveTypeDefinitionRequest](SaveTypeDefinitionRequest.md) |  | |
| **impactConfirmed** | `boolean` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**EntityTypeImpactResponse**](EntityTypeImpactResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Entity type definition saved successfully |  -  |
| **409** | Conflict due to cascading impacts on existing entities as a result of aforementioned changes |  -  |
| **400** | Invalid request data |  -  |
| **401** | Unauthorized access |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateEntityType

> EntityType updateEntityType(workspaceId, entityType)

Updates an existing entity type configuration

Updates the data for an already existing entity type for the specified workspace.

### Example

```ts
import {
  Configuration,
  EntityApi,
} from '';
import type { UpdateEntityTypeRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EntityApi(config);

  const body = {
    // string
    workspaceId: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // EntityType
    entityType: ...,
  } satisfies UpdateEntityTypeRequest;

  try {
    const data = await api.updateEntityType(body);
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
| **entityType** | [EntityType](EntityType.md) |  | |

### Return type

[**EntityType**](EntityType.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Entity type updated successfully |  -  |
| **400** | Invalid request data |  -  |
| **401** | Unauthorized access |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

