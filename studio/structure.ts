import type {StructureResolver} from 'sanity/structure';

export const structure: StructureResolver = S =>
  S.list()
    .title('Wilma Collective')
    .items([
      S.listItem()
        .title('Journal Page')
        .child(S.document().schemaType('blogPage').documentId('blogPage')),
      S.divider(),
      S.listItem()
        .title('Journal Articles')
        .child(
          S.list()
            .title('Articles')
            .items([
              S.listItem()
                .title('🟢 Live')
                .child(
                  S.documentList()
                    .id('published-articles')
                    .schemaType('journalPost')
                    .filter('_type == "journalPost" && !(_id in path("drafts.**"))')
                    .defaultOrdering([{field: 'publishedAt', direction: 'desc'}])
                ),
              S.listItem()
                .title('✏️ Drafts')
                .child(
                  S.documentList()
                    .id('draft-articles')
                    .schemaType('journalPost')
                    .filter('_type == "journalPost" && _id in path("drafts.**")')
                    .defaultOrdering([{field: '_updatedAt', direction: 'desc'}])
                ),
              S.listItem()
                .title('All Articles')
                .child(
                  S.documentList()
                    .id('all-articles')
                    .schemaType('journalPost')
                    .filter('_type == "journalPost"')
                    .defaultOrdering([{field: 'publishedAt', direction: 'desc'}])
                ),
            ])
        ),
    ]);
