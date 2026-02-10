'use client'

import React, { Fragment } from 'react'
import { NavGroup, useConfig } from '@payloadcms/ui'
import { EntityType } from '@payloadcms/ui/shared'
import { formatAdminURL } from 'payload/shared'
import type { NavGroupType } from '@payloadcms/ui/shared'
import type { NavPreferences } from 'payload'
import { NavLink } from './NavLink'

export const NavClient: React.FC<{
  groups: NavGroupType[]
  navPreferences: NavPreferences
}> = ({ groups, navPreferences }) => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  return (
    <Fragment>
      <NavLink href={adminRoute} id="nav-dashboard" label="Dashboard" slug="dashboard" exact />
      {groups.map(({ entities, label }, groupIndex) => (
        <NavGroup key={groupIndex} isOpen={navPreferences?.groups?.[label]?.open} label={label}>
          {entities.map(({ slug, type, label: entityLabel }, i) => {
            const href =
              type === EntityType.collection
                ? formatAdminURL({ adminRoute, path: `/collections/${slug}` })
                : formatAdminURL({ adminRoute, path: `/globals/${slug}` })
            const id =
              type === EntityType.collection ? `nav-${slug}` : `nav-global-${slug}`

            return <NavLink key={i} href={href} id={id} label={entityLabel} slug={slug} />
          })}
        </NavGroup>
      ))}
    </Fragment>
  )
}
