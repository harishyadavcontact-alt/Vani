import { PlayerShell } from '@/components/player/PlayerShell'

type Props = {
  searchParams?: {
    publicSource?: string
  }
}

export default function ListenPage({ searchParams }: Props) {
  return <PlayerShell initialPublicSource={searchParams?.publicSource ?? ''} />
}
