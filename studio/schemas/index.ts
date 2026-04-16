import {defineArrayMember, defineField, defineType} from 'sanity';

const stringField = (name: string, title: string, extra = {}) =>
  defineField({
    name,
    title,
    type: 'string',
    ...extra
  });

const textField = (name: string, title: string, extra = {}) =>
  defineField({
    name,
    title,
    type: 'text',
    rows: 3,
    ...extra
  });

const htmlStringField = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'string',
    description: 'HTML allowed for emphasis and line breaks.'
  });

export const schemaTypes = [
  defineType({
    name: 'siteSettings',
    title: 'Site Settings',
    type: 'document',
    fields: [
      stringField('brandName', 'Brand name'),
      stringField('tagline', 'Tagline'),
      stringField('registrationNumber', 'Registration number'),
      stringField('companyLinkedIn', 'Company LinkedIn'),
      stringField('founderLinkedIn', 'Founder LinkedIn'),
      stringField('emailSubject', 'Email subject'),
      textField('description', 'SEO description'),
      stringField('ogImage', 'Open Graph image'),
      stringField('themeColor', 'Theme color')
    ]
  }),
  defineType({
    name: 'homePage',
    title: 'Home Page',
    type: 'document',
    fields: [
      defineField({
        name: 'hero',
        title: 'Hero',
        type: 'object',
        fields: [
          stringField('eyebrow', 'Eyebrow'),
          htmlStringField('headlineHtml', 'Headline HTML'),
          textField('subheadline', 'Subheadline'),
          stringField('ctaLabel', 'CTA label')
        ]
      }),
      defineField({
        name: 'howWeWork',
        title: 'How we work',
        type: 'object',
        fields: [
          stringField('label', 'Label'),
          htmlStringField('titleHtml', 'Title HTML'),
          defineField({
            name: 'cards',
            title: 'Cards',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'object',
                fields: [
                  stringField('num', 'Number'),
                  stringField('title', 'Title'),
                  textField('body', 'Body')
                ]
              })
            ]
          })
        ]
      }),
      defineField({
        name: 'commaMoment',
        title: 'Comma moment',
        type: 'object',
        fields: [textField('text', 'Text')]
      }),
      defineField({
        name: 'manifesto',
        title: 'Our belief',
        type: 'object',
        fields: [
          stringField('label', 'Label'),
          htmlStringField('headlineHtml', 'Headline HTML'),
          textField('body', 'Body'),
          stringField('ctaLabel', 'CTA label')
        ]
      }),
      defineField({
        name: 'whoWeWorkWith',
        title: 'Who we work with',
        type: 'object',
        fields: [
          stringField('label', 'Label'),
          htmlStringField('titleHtml', 'Title HTML'),
          defineField({
            name: 'cards',
            title: 'Cards',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'object',
                fields: [stringField('title', 'Title'), textField('body', 'Body')]
              })
            ]
          })
        ]
      }),
      defineField({
        name: 'selectedWork',
        title: 'Selected work',
        type: 'object',
        fields: [
          stringField('label', 'Label'),
          defineField({
            name: 'items',
            title: 'Items',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'object',
                fields: [stringField('name', 'Name'), stringField('type', 'Type')]
              })
            ]
          })
        ]
      }),
      defineField({
        name: 'cases',
        title: 'Case studies',
        type: 'object',
        fields: [
          stringField('label', 'Label'),
          htmlStringField('titleHtml', 'Title HTML'),
          defineField({
            name: 'items',
            title: 'Items',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'object',
                fields: [
                  stringField('tag', 'Tag'),
                  stringField('client', 'Client'),
                  stringField('sub', 'Subtitle'),
                  stringField('image', 'Image path'),
                  stringField('imageAlt', 'Image alt'),
                  defineField({
                    name: 'stats',
                    title: 'Stats',
                    type: 'array',
                    of: [
                      defineArrayMember({
                        type: 'object',
                        fields: [stringField('value', 'Value'), textField('labelHtml', 'Label HTML')]
                      })
                    ]
                  }),
                  textField('body', 'Body'),
                  stringField('duration', 'Duration')
                ]
              })
            ]
          })
        ]
      })
    ]
  }),
  defineType({
    name: 'aboutPage',
    title: 'About Page',
    type: 'document',
    fields: [
      defineField({
        name: 'hero',
        title: 'Hero',
        type: 'object',
        fields: [stringField('eyebrow', 'Eyebrow'), htmlStringField('titleHtml', 'Title HTML')]
      }),
      defineField({
        name: 'agency',
        title: 'Agency section',
        type: 'object',
        fields: [
          stringField('eyebrow', 'Eyebrow'),
          htmlStringField('titleHtml', 'Title HTML'),
          defineField({
            name: 'bodies',
            title: 'Bodies',
            type: 'array',
            of: [defineArrayMember({type: 'text', rows: 4})]
          }),
          defineField({
            name: 'stats',
            title: 'Stats',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'object',
                fields: [stringField('num', 'Number'), stringField('label', 'Label')]
              })
            ]
          })
        ]
      }),
      defineField({
        name: 'values',
        title: 'Core values',
        type: 'object',
        fields: [
          stringField('eyebrow', 'Eyebrow'),
          htmlStringField('titleHtml', 'Title HTML'),
          defineField({
            name: 'cards',
            title: 'Cards',
            type: 'array',
            of: [
              defineArrayMember({
                type: 'object',
                fields: [stringField('title', 'Title'), textField('body', 'Body')]
              })
            ]
          })
        ]
      }),
      defineField({
        name: 'founder',
        title: 'Founder',
        type: 'object',
        fields: [
          stringField('eyebrow', 'Eyebrow'),
          htmlStringField('titleHtml', 'Title HTML'),
          textField('intro', 'Intro'),
          textField('body', 'Body'),
          stringField('funFactLabel', 'Fun fact label'),
          stringField('funFactLead', 'Fun fact lead'),
          textField('funFactBody', 'Fun fact body'),
          stringField('linkedinLabel', 'LinkedIn button label')
        ]
      })
    ]
  }),
  defineType({
    name: 'blogPage',
    title: 'Journal Page',
    type: 'document',
    fields: [
      defineField({
        name: 'hero',
        title: 'Hero',
        type: 'object',
        fields: [
          stringField('eyebrow', 'Eyebrow'),
          htmlStringField('titleHtml', 'Title HTML'),
          textField('description', 'Description'),
          stringField('issue', 'Issue line')
        ]
      }),
      defineField({
        name: 'featured',
        title: 'Featured article',
        type: 'reference',
        to: [{type: 'journalPost'}],
        description: 'Select a published article to feature at the top'
      }),
      defineField({
        name: 'filterCategories',
        title: 'Filter categories',
        type: 'array',
        of: [defineArrayMember({type: 'string'})],
        description: 'Categories to show as filter buttons (auto-populated from articles)'
      }),
      defineField({
        name: 'articlesToShow',
        title: 'Articles to display',
        type: 'number',
        initialValue: 6,
        description: 'How many recent articles to show on landing page (newest first)'
      }),
      defineField({
        name: 'pinned',
        title: 'Pinned articles',
        type: 'array',
        of: [defineArrayMember({type: 'reference', to: [{type: 'journalPost'}]})],
        description: 'Articles to always show at the top (in addition to featured)'
      }),
      defineField({
        name: 'newsletter',
        title: 'Newsletter',
        type: 'object',
        fields: [
          stringField('eyebrow', 'Eyebrow'),
          htmlStringField('titleHtml', 'Title HTML'),
          textField('body', 'Body'),
          stringField('ctaLabel', 'CTA label')
        ]
      })
    ],
    preview: {
      select: {
        featuredAuthor: 'featured.author',
        featuredDate: 'featured.date'
      },
      prepare({featuredAuthor, featuredDate}) {
        const subtitleParts = ['Journal landing page'];
        if (featuredAuthor) subtitleParts.push(`Featured: ${featuredAuthor}`);
        if (featuredDate) subtitleParts.push(featuredDate);

        return {
          title: 'Journal Page',
          subtitle: subtitleParts.join(' · ')
        };
      }
    }
  }),
  defineType({
    name: 'journalPost',
    title: 'Journal Article',
    type: 'document',
    fields: [
      stringField('title', 'Title', {validation: Rule => Rule.required()}),
      defineField({
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        options: {
          source: 'title',
          maxLength: 96
        },
        validation: Rule => Rule.required()
      }),
      stringField('category', 'Category', {validation: Rule => Rule.required()}),
      defineField({
        name: 'status',
        title: 'Status',
        type: 'string',
        options: {
          list: ['draft', 'published'],
          layout: 'radio'
        },
        initialValue: 'draft'
      }),
      defineField({
        name: 'publishedAt',
        title: 'Published date',
        type: 'datetime'
      }),
      stringField('author', 'Author', {initialValue: 'Lise Kriekemans'}),
      textField('excerpt', 'Excerpt', {rows: 3, validation: Rule => Rule.required()}),
      defineField({
        name: 'image',
        title: 'Featured image',
        type: 'image',
        options: {
          hotspot: true
        }
      }),
      defineField({
        name: 'imageAlt',
        title: 'Image alt text',
        type: 'string',
        description: 'Describe the image for accessibility'
      }),
      defineField({
        name: 'body',
        title: 'Article body',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'block',
            styles: [
              {title: 'Paragraph', value: 'normal'},
              {title: 'Heading 2', value: 'h2'},
              {title: 'Heading 3', value: 'h3'}
            ],
            marks: {
              decorators: [
                {title: 'Bold', value: 'strong'},
                {title: 'Italic', value: 'em'},
                {title: 'Underline', value: 'underline'}
              ],
              annotations: [
                {
                  name: 'link',
                  type: 'object',
                  title: 'Link',
                  fields: [{name: 'href', type: 'string'}]
                }
              ]
            },
            lists: [{title: 'Bullet', value: 'bullet'}, {title: 'Numbered', value: 'number'}]
          })
        ],
        validation: Rule => Rule.required()
      }),
      defineField({
        name: 'seoDescription',
        title: 'SEO description',
        type: 'text',
        rows: 2,
        description: 'For search results (60-160 chars)'
      }),
      defineField({
        name: 'ogImage',
        title: 'Social share image',
        type: 'image',
        description: 'Image for when shared on social media'
      })
    ],
    preview: {
      select: {
        title: 'title',
        category: 'category',
        status: 'status',
        date: 'publishedAt',
        image: 'image'
      },
      prepare({title, category, status, date, image}) {
        const statusEmoji = status === 'published' ? '✓' : '✎';
        const parts = [statusEmoji, category || 'Journal', date || 'No date'];
        return {
          title: title || 'Untitled',
          subtitle: parts.join(' · '),
          media: image
        };
      }
    }
  }),
];
