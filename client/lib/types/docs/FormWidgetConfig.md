# FormWidgetConfig

## Properties

| Name          | Type                                          |
| ------------- | --------------------------------------------- |
| `type`        | [BlockFormWidgetType](BlockFormWidgetType.md) |
| `label`       | string                                        |
| `description` | string                                        |
| `tooltip`     | string                                        |
| `placeholder` | string                                        |
| `options`     | [Array&lt;Option&gt;](Option.md)              |

## Example

```typescript
import type { FormWidgetConfig } from '';

// TODO: Update the object below with actual values
const example = {
  type: null,
  label: null,
  description: null,
  tooltip: null,
  placeholder: null,
  options: null,
} satisfies FormWidgetConfig;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FormWidgetConfig;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
