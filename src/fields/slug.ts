import type { Field } from 'payload'

const formatSlug = (val: string): string =>
  val
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()

export const slugField = (fieldToUse = 'title'): Field[] => [
  {
    name: 'slug',
    type: 'text',
    unique: true,
    admin: {
      position: 'sidebar',
    },
    hooks: {
      beforeValidate: [
        ({ data, operation, value }) => {
          if (operation === 'create' || !value) {
            const fieldValue = data?.[fieldToUse]
            if (fieldValue && typeof fieldValue === 'string') {
              return formatSlug(fieldValue)
            }
          }
          return value
        },
      ],
    },
  },
]
