# EntityImpactSummary

## Properties

| Name               | Type   |
| ------------------ | ------ |
| `entityTypeKey`    | string |
| `relationshipId`   | string |
| `relationshipName` | string |
| `impact`           | string |

## Example

```typescript
import type { EntityImpactSummary } from '';

// TODO: Update the object below with actual values
const example = {
  entityTypeKey: null,
  relationshipId: null,
  relationshipName: null,
  impact: null,
} satisfies EntityImpactSummary;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityImpactSummary;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
