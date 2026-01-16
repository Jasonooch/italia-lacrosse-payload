import type { Block } from 'payload'

export const Code: Block = {
  slug: 'code',
  fields: [
    {
      name: 'language',
      type: 'select',
      options: [
        { label: 'JavaScript', value: 'javascript' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'Python', value: 'python' },
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
      ],
      defaultValue: 'javascript',
      required: true,
    },
    {
      name: 'code',
      type: 'textarea',
      required: true,
    },
  ],
}
