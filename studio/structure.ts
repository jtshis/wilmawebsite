import type {StructureResolver} from 'sanity/structure';

export const structure: StructureResolver = S =>
  S.list()
    .title('Wilma Collective')
    .items([
      S.listItem()
        .title('Site settings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      S.listItem()
        .title('Home page')
        .child(S.document().schemaType('homePage').documentId('homePage')),
      S.listItem()
        .title('About page')
        .child(S.document().schemaType('aboutPage').documentId('aboutPage')),
      S.listItem()
        .title('Blog page')
        .child(S.document().schemaType('blogPage').documentId('blogPage'))
    ]);
