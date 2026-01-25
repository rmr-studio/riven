# ReferenceItemEntity

## Properties

| Name         | Type                                              |
| ------------ | ------------------------------------------------- |
| `id`         | string                                            |
| `path`       | string                                            |
| `orderIndex` | number                                            |
| `entity`     | [Entity](Entity.md)                               |
| `warning`    | [BlockReferenceWarning](BlockReferenceWarning.md) |

## Example

```typescript
import type { ReferenceItemEntity } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  path: null,
  orderIndex: null,
  entity: null,
  warning: null,
} satisfies ReferenceItemEntity;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ReferenceItemEntity;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
