'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDownIcon, ListFilter } from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/dashboard/ui/dropdown-menu'
import { CONTACT_TYPE_LABELS, POSITION_LABELS, PROGRAM_LABELS } from '@/lib/contact-display'

const ALL = 'all'

function FilterDropdown({
  paramName,
  label,
  allLabel,
  options,
}: {
  paramName: string
  label: string
  allLabel: string
  options: Record<string, string>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const value = searchParams.get(paramName) ?? ALL

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === ALL) {
      params.delete(paramName)
    } else {
      params.set(paramName, next)
    }
    params.delete('page')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ListFilter className="size-4" />
          {label}
          <ChevronDownIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={handleChange}>
          <DropdownMenuRadioItem value={ALL}>{allLabel}</DropdownMenuRadioItem>
          {Object.entries(options).map(([optionValue, optionLabel]) => (
            <DropdownMenuRadioItem key={optionValue} value={optionValue}>
              {optionLabel}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ContactsFilters() {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterDropdown paramName="type" label="Type" allLabel="All types" options={CONTACT_TYPE_LABELS} />
      <FilterDropdown
        paramName="program"
        label="Program"
        allLabel="All programs"
        options={PROGRAM_LABELS}
      />
      <FilterDropdown
        paramName="position"
        label="Position"
        allLabel="All positions"
        options={POSITION_LABELS}
      />
    </div>
  )
}
