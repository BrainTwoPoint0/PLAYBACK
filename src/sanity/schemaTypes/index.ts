import { type SchemaTypeDefinition } from 'sanity';
import { pressRelease } from './pressRelease';
import { category } from './category';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [pressRelease, category],
};
