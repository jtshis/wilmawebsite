import type {StructureResolver} from 'sanity/structure';

export const structure: StructureResolver = S =>
  S.list()
    .title('Wilma Collective - Blog')
    .items([
      S.documentTypeListItem('blogPost')
        .title('Blog Posts')
    ]);
