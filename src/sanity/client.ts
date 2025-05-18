import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: 'inuy50tz',
  dataset: 'production',
  apiVersion: '2024-11-01',
  useCdn: false,
});
