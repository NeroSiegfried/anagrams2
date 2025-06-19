import { GameBoard } from "@/components/game-board"

export default function MultiplayerGamePage({
  params,
}: {
  params: { gameId: string }
}) {
  console.log('[MultiplayerGamePage] Rendered');
  return <GameBoard gameId={params.gameId} multiplayer />
}
