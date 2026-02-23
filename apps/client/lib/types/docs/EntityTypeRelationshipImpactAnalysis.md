
# EntityTypeRelationshipImpactAnalysis


## Properties

Name | Type
------------ | -------------
`affectedEntityTypes` | Array&lt;string&gt;
`dataLossWarnings` | [Array&lt;EntityTypeRelationshipDataLossWarning&gt;](EntityTypeRelationshipDataLossWarning.md)
`columnsRemoved` | [Array&lt;EntityImpactSummary&gt;](EntityImpactSummary.md)
`columnsModified` | [Array&lt;EntityImpactSummary&gt;](EntityImpactSummary.md)

## Example

```typescript
import type { EntityTypeRelationshipImpactAnalysis } from ''

// TODO: Update the object below with actual values
const example = {
  "affectedEntityTypes": null,
  "dataLossWarnings": null,
  "columnsRemoved": null,
  "columnsModified": null,
} satisfies EntityTypeRelationshipImpactAnalysis

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityTypeRelationshipImpactAnalysis
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


