# DraggableOptions

## Properties

| Name       | Type    |
| ---------- | ------- |
| `cancel`   | string  |
| `pause`    | number  |
| `handle`   | string  |
| `appendTo` | string  |
| `scroll`   | boolean |

## Example

```typescript
import type { DraggableOptions } from '';

// TODO: Update the object below with actual values
const example = {
  cancel: null,
  pause: null,
  handle: null,
  appendTo: null,
  scroll: null,
} satisfies DraggableOptions;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DraggableOptions;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
