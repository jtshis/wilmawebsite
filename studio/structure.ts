import type {StructureResolver} from 'sanity/structure';

export const structure: StructureResolver = S =>
  S.list()
    .title('Wilma Collective')
    .items([
      S.listItem()
        .title('Journal Page')
        .child(S.document().schemaType('blogPage').documentId('blogPage')),
      S.documentTypeListItem('blogPost')
        .title('Blog Posts (legacy)')
    ]);
