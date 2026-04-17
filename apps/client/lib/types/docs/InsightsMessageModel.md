
# InsightsMessageModel


## Properties

Name | Type
------------ | -------------
`id` | string
`sessionId` | string
`role` | [InsightsMessageRole](InsightsMessageRole.md)
`content` | string
`citations` | [Array&lt;CitationRef&gt;](CitationRef.md)
`tokenUsage` | [TokenUsage](TokenUsage.md)
`createdAt` | Date
`createdBy` | string

## Example

```typescript
import type { InsightsMessageModel } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "sessionId": null,
  "role": null,
  "content": null,
  "citations": null,
  "tokenUsage": null,
  "createdAt": null,
  "createdBy": null,
} satisfies InsightsMessageModel

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as InsightsMessageModel
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


