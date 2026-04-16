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
    title: 'Blog Page',
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
        title: 'Featured post',
        type: 'object',
        fields: [
          stringField('tag', 'Tag'),
          htmlStringField('titleHtml', 'Title HTML'),
          textField('excerpt', 'Excerpt'),
          stringField('author', 'Author'),
          stringField('readingTime', 'Reading time'),
          stringField('date', 'Date')
        ]
      }),
      defineField({
        name: 'filters',
        title: 'Filters',
        type: 'array',
        of: [defineArrayMember({type: 'string'})]
      }),
      defineField({
        name: 'cards',
        title: 'Cards',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            fields: [
              stringField('tag', 'Tag'),
              htmlStringField('titleHtml', 'Title HTML'),
              textField('excerpt', 'Excerpt'),
              stringField('readingTime', 'Reading time'),
              stringField('date', 'Date')
            ]
          })
        ]
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
    ]
  }),
];
