import type { Block } from 'payload'

export const Button: Block = {
  slug: 'button',
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: {
        description: 'Button text (e.g., "Register Now", "Learn More")',
      },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'Where the button links to',
      },
      validate: (val: string | null | undefined) => {
        if (!val) return 'URL is required'
        return /^(https?:\/\/|\/|#)/.test(val) || 'Must be a valid URL or path'
      },
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Outline', value: 'outline' },
      ],
      admin: {
        description: 'Button style/color',
      },
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Open link in new tab?',
      },
    },
  ],
}
