'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/dashboard/ui/button'
import { Calendar } from '@/components/dashboard/ui/calendar'
import { Input } from '@/components/dashboard/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/dashboard/ui/popover'

/** Combined date + time picker, following shadcn's Calendar-in-a-Popover
 * recipe with a time input added below it. Works entirely in terms of real
 * Date objects, so callers never have to reason about timezone offsets. */
export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick a date and time',
  disabled,
}: {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  function handleDaySelect(day: Date | undefined) {
    if (!day) {
      onChange(undefined)
      return
    }
    // Changing just the date shouldn't reset a time the user already picked.
    const next = new Date(day)
    if (value) next.setHours(value.getHours(), value.getMinutes())
    onChange(next)
  }

  function handleTimeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const [hours, minutes] = event.target.value.split(':').map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return
    const next = new Date(value ?? new Date())
    next.setHours(hours, minutes, 0, 0)
    onChange(next)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="size-4" />
          {value ? format(value, "MMM d, yyyy 'at' h:mm a") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={value} onSelect={handleDaySelect} autoFocus />
        <div className="border-t p-3">
          <Input type="time" value={value ? format(value, 'HH:mm') : ''} onChange={handleTimeChange} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
