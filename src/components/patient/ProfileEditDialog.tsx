import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'

import { Field, INPUT_CLASS } from '@/components/shared/Field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useActivePatient, usePatient } from '@/store/patient'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Edit the My Care sidebar profile card: name, age, city, and status line.
 */
export function ProfileEditDialog({ open, onOpenChange }: Props) {
  const patient = useActivePatient()
  const updateSidebarProfile = usePatient((s) => s.updateSidebarProfile)

  const [name, setName] = useState(patient.name)
  const [age, setAge] = useState(patient.age > 0 ? String(patient.age) : '')
  const [city, setCity] = useState(patient.city)
  const [short, setShort] = useState(patient.short)

  useEffect(() => {
    if (!open) return
    setName(patient.name)
    setAge(patient.age > 0 ? String(patient.age) : '')
    setCity(patient.city)
    setShort(patient.short)
  }, [open, patient.name, patient.age, patient.city, patient.short])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Add your name.')
      return
    }
    const ageNum = Number.parseInt(age, 10)
    updateSidebarProfile({
      name: trimmed,
      age: Number.isFinite(ageNum) && ageNum > 0 ? ageNum : 0,
      city: city.trim(),
      short: short.trim(),
    })
    toast.success('Profile updated.')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Pencil className="size-4 text-brand-600" aria-hidden="true" />
            Edit profile
          </DialogTitle>
          <DialogDescription>
            Update the name, age, city, and status line shown on your care chart.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          <Field label="Full name" id="profile-name">
            <input
              id="profile-name"
              className={INPUT_CLASS}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Age" id="profile-age">
            <input
              id="profile-age"
              type="number"
              min={1}
              max={120}
              inputMode="numeric"
              className={INPUT_CLASS}
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="e.g. 61"
            />
          </Field>
          <Field label="City" id="profile-city">
            <input
              id="profile-city"
              className={INPUT_CLASS}
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Alexandria"
            />
          </Field>
          <Field label="Status line" id="profile-short">
            <input
              id="profile-short"
              className={INPUT_CLASS}
              value={short}
              onChange={(e) => setShort(e.target.value)}
              placeholder="e.g. Alexandria, LA · Survivorship, year 6"
            />
          </Field>

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="font-bold">
              Save profile
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
