import { MultiplayerLobby } from '@/components/multiplayer-lobby'
import { Navbar } from '@/components/navbar'

export default function MultiplayerPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-green-900 pt-20">
        <MultiplayerLobby />
      </div>
    </>
  )
}
