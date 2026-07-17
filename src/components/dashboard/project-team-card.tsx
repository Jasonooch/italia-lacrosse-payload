'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import type { User } from '@/payload-types'
import { getInitials } from '@/lib/contact-display'
import { addTeamMember, removeTeamMember } from '@/app/(dashboard)/dashboard/projects/actions'
import { Avatar, AvatarFallback } from '@/components/dashboard/ui/avatar'
import { Button } from '@/components/dashboard/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/dashboard/ui/popover'

export function ProjectTeamCard({
  projectId,
  owner,
  team,
  allUsers,
}: {
  projectId: number
  owner: User | null
  team: User[]
  allUsers: User[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const teamWithoutOwner = team.filter((member) => member.id !== owner?.id)
  const assignedIds = new Set([owner?.id, ...team.map((member) => member.id)].filter(Boolean))
  const addableUsers = allUsers.filter((candidate) => !assignedIds.has(candidate.id))

  function handleAdd(userId: number) {
    startTransition(async () => {
      await addTeamMember(projectId, userId)
      setOpen(false)
    })
  }

  function handleRemove(userId: number) {
    startTransition(async () => {
      await removeTeamMember(projectId, userId)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          Team
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Add team member"
                disabled={addableUsers.length === 0}
              >
                <Plus className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              {addableUsers.length === 0 ? (
                <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                  Everyone is already on this team.
                </p>
              ) : (
                addableUsers.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => handleAdd(candidate.id)}
                    disabled={isPending}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(candidate.firstName, candidate.lastName)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 truncate">{candidate.name || candidate.email}</span>
                  </button>
                ))
              )}
            </PopoverContent>
          </Popover>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {owner && (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{getInitials(owner.firstName, owner.lastName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm">{owner.name || owner.email}</p>
              <p className="truncate text-xs text-muted-foreground">Owner</p>
            </div>
          </div>
        )}
        {teamWithoutOwner.map((member) => (
          <div key={member.id} className="group flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
            </Avatar>
            <p className="min-w-0 flex-1 truncate text-sm">{member.name || member.email}</p>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${member.name || member.email}`}
              onClick={() => handleRemove(member.id)}
              disabled={isPending}
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        {!owner && teamWithoutOwner.length === 0 && (
          <p className="text-sm text-muted-foreground">No team assigned yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
