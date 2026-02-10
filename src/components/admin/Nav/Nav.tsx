import React, { cache } from 'react'
import { Logout } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import type { NavGroupType } from '@payloadcms/ui/shared'
import { NavWrapper, NavHamburger } from '@payloadcms/next/client'
import type { NavPreferences, PayloadRequest, ServerProps } from 'payload'
import { NavClient } from './NavClient'

const baseClass = 'nav'

const GROUP_ORDER: Record<string, number> = {
  Admin: 1,
  Content: 2,
  ungrouped: 3,
  System: 4,
}

function sortGroups(groups: NavGroupType[]): NavGroupType[] {
  return [...groups].sort((a, b) => {
    const orderA = GROUP_ORDER[a.label] ?? 99
    const orderB = GROUP_ORDER[b.label] ?? 99
    return orderA - orderB
  })
}

const getNavPrefs = cache(
  async (req: PayloadRequest): Promise<NavPreferences> => {
    if (!req?.user?.collection) return null as unknown as NavPreferences
    const result = await req.payload.find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: {
        and: [
          { key: { equals: 'nav' } },
          { 'user.relationTo': { equals: req.user.collection } },
          { 'user.value': { equals: req.user.id } },
        ],
      },
    })
    return result?.docs?.[0]?.value as NavPreferences
  },
)

type NavProps = { req?: PayloadRequest } & ServerProps

const Nav: React.FC<NavProps> = async (props) => {
  const {
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
    viewType,
    visibleEntities,
  } = props

  if (!payload?.config) {
    return null
  }

  const {
    admin: {
      components: { afterNavLinks, beforeNavLinks, logout },
    },
    collections,
    globals,
  } = payload.config

  const groups = groupNavItems(
    [
      ...collections
        .filter(({ slug }) => visibleEntities.collections.includes(slug))
        .map((collection) => ({
          type: EntityType.collection as const,
          entity: collection,
        })),
      ...globals
        .filter(({ slug }) => visibleEntities.globals.includes(slug))
        .map((global) => ({
          type: EntityType.global as const,
          entity: global,
        })),
    ],
    permissions,
    i18n,
  )

  const sortedGroups = sortGroups(groups)
  const navPreferences = await getNavPrefs(req!)

  const serverProps = { i18n, locale, params, payload, permissions, searchParams, user }
  const clientProps = { documentSubViewType, viewType }

  const LogoutComponent = RenderServerComponent({
    clientProps,
    Component: logout?.Button,
    Fallback: Logout,
    importMap: payload.importMap,
    serverProps,
  })

  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        {RenderServerComponent({
          clientProps,
          Component: beforeNavLinks,
          importMap: payload.importMap,
          serverProps,
        })}
        <NavClient groups={sortedGroups} navPreferences={navPreferences} />
        {RenderServerComponent({
          clientProps,
          Component: afterNavLinks,
          importMap: payload.importMap,
          serverProps,
        })}
        <div className={`${baseClass}__controls`}>
          {LogoutComponent}
        </div>
      </nav>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <NavHamburger baseClass={baseClass} />
        </div>
      </div>
    </NavWrapper>
  )
}

export default Nav
