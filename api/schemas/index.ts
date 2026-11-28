// JSON Schemas of the API answers, one file per schema: the contract the tests hold the API to.
// JSONSchemaType<T> ties each schema to its TypeScript type, so a field added to the type but not
// to the schema, or the other way round, is a compile error. additionalProperties: false makes
// an unexpected field, such as a leaked password hash, fail the check.
export { apiErrorSchema } from './apiErrorSchema';
export { expenseListSchema } from './expenseListSchema';
export { expenseSchema } from './expenseSchema';
export { userSchema } from './userSchema';
