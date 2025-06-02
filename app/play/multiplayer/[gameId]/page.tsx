import { GameBoard } from "@/components/game-board"

export default function MultiplayerGamePage({
  params,
}: {
  params: { gameId: string }
}) {
  return <GameBoard gameId={params.gameId} multiplayer />
}
