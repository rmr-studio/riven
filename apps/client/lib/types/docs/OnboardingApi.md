# OnboardingApi

All URIs are relative to *http://localhost:8081*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**completeOnboarding**](OnboardingApi.md#completeonboardingoperation) | **POST** /api/v1/onboarding/complete | Complete user onboarding |



## completeOnboarding

> CompleteOnboardingResponse completeOnboarding(request, profileAvatar, workspaceAvatar)

Complete user onboarding

Creates a workspace, updates user profile, installs templates, and sends invitations in a single request.

### Example

```ts
import {
  Configuration,
  OnboardingApi,
} from '';
import type { CompleteOnboardingOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new OnboardingApi(config);

  const body = {
    // CompleteOnboardingRequest
    request: ...,
    // Blob (optional)
    profileAvatar: BINARY_DATA_HERE,
    // Blob (optional)
    workspaceAvatar: BINARY_DATA_HERE,
  } satisfies CompleteOnboardingOperationRequest;

  try {
    const data = await api.completeOnboarding(body);
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
| **request** | [CompleteOnboardingRequest](CompleteOnboardingRequest.md) |  | [Defaults to `undefined`] |
| **profileAvatar** | `Blob` |  | [Optional] [Defaults to `undefined`] |
| **workspaceAvatar** | `Blob` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**CompleteOnboardingResponse**](CompleteOnboardingResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `multipart/form-data`
- **Accept**: `*/*`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Onboarding completed successfully |  -  |
| **409** | User has already completed onboarding |  -  |
| **400** | Invalid request data |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

