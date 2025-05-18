import imageUrlBuilder from '@sanity/image-url';
import { dataset, projectId } from '../env';

const builder = imageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
});

export function urlForImage(source: any) {
  if (!source) return '';
  return builder.image(source).auto('format').url();
}
