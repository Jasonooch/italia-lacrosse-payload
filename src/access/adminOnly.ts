import type { Access } from 'payload'

export const adminOnly: Access = ({ req: { user } }) => {
  return Boolean(user?.roles?.includes('admin'))
}
