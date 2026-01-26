# WorkspaceInvite

## Properties

| Name          | Type                                              |
| ------------- | ------------------------------------------------- |
| `id`          | string                                            |
| `workspaceId` | string                                            |
| `email`       | string                                            |
| `inviteToken` | string                                            |
| `invitedBy`   | string                                            |
| `createdAt`   | Date                                              |
| `expiresAt`   | Date                                              |
| `role`        | [WorkspaceRoles](WorkspaceRoles.md)               |
| `status`      | [WorkspaceInviteStatus](WorkspaceInviteStatus.md) |

## Example

```typescript
import type { WorkspaceInvite } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  workspaceId: null,
  email: null,
  inviteToken: null,
  invitedBy: null,
  createdAt: null,
  expiresAt: null,
  role: null,
  status: null,
} satisfies WorkspaceInvite;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkspaceInvite;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
