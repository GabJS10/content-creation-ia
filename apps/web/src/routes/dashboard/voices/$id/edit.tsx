import { useParams } from '@tanstack/react-router'
import { VoiceProfileForm } from '../VoiceProfileForm'

export function VoiceEdit() {
  const params = useParams({ from: '/dashboard/voices/$id/edit' })
  return <VoiceProfileForm profileId={params.id} />
}