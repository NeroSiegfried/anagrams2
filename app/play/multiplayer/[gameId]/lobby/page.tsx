'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/hooks/use-toast'
import { Navbar } from '@/components/navbar'
import { Copy, Play, Users, Crown, LogOut } from 'lucide-react'

interface Player {
  id: string
  user_id: string
  username: string
  score: number
  is_host: boolean
  ready: boolean
}

interface Game {
  id: string
  base_word: string
  created_by: string
  creator_username?: string
  status: string
  current_round: number
  time_limit: number
  max_players: number
  is_public: boolean
  created_at: string
  started_at: string | null
  player_count: number
  game_players: Player[]
}

export default function GameLobbyPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const gameId = params.gameId as string

  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [ready, setReady] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [allPlayersReady, setAllPlayersReady] = useState(false)

  // Helper function to get a proper username
  const getProperUsername = (player: Player) => {
    // Use username if it's not a UUID
    if (player.username && !player.username.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return player.username;
    }
    
    // Fallback to user ID (shouldn't happen)
    return player.user_id;
  };

  // Fetch game lobby info
  const fetchLobbyInfo = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/lobby`)
      const data = await response.json()
      
      if (response.ok) {
        setGame(data.game)
        
        // Check if game has started
        if (data.game.status === 'active' && data.game.started_at) {
          setGameStarted(true)
          // Redirect to game after a short delay
          setTimeout(() => {
            router.push(`/play/multiplayer/${gameId}`)
          }, 1000)
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load lobby",
          variant: "destructive",
        })
        router.push('/play/multiplayer')
      }
    } catch (error) {
      console.error('Error fetching lobby info:', error)
      toast({
        title: "Error",
        description: "Failed to load lobby",
        variant: "destructive",
      })
      router.push('/play/multiplayer')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (gameId) {
      fetchLobbyInfo()
      const interval = setInterval(fetchLobbyInfo, 2000) // Refresh every 2 seconds
      return () => clearInterval(interval)
    }
  }, [gameId])

  useEffect(() => {
    if (game && game.game_players) {
      // Consider host as always ready, check only non-host players
      const nonHostPlayers = game.game_players.filter(p => !p.is_host)
      const allReady = game.game_players.length > 1 && // Require at least 2 players total
        nonHostPlayers.length > 0 && // Require at least one non-host player
        nonHostPlayers.every(p => p.ready) // All non-host players must be ready
      setAllPlayersReady(allReady)
    }
  }, [game])

  // Mark player as ready
  const markReady = async () => {
    if (!user || !game) return

    try {
      const response = await fetch(`/api/games/${gameId}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()
      
      if (response.ok) {
        setReady(true)
        toast({
          title: "Ready!",
          description: "Waiting for other players...",
        })
        
        // If all players are ready, the game will start automatically
        if (data.started) {
          setGameStarted(true)
          toast({
            title: "Game starting!",
            description: "All players are ready!",
          })
          setTimeout(() => {
            router.push(`/play/multiplayer/${gameId}`)
          }, 1000)
        }
      } else {
        toast({
          title: "Failed to mark ready",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error marking ready:', error)
      toast({
        title: "Error",
        description: "Failed to mark ready",
        variant: "destructive",
      })
    }
  }

  // Mark player as unready
  const markUnready = async () => {
    if (!user || !game) return

    try {
      const response = await fetch(`/api/games/${gameId}/ready`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()
      
      if (response.ok) {
        setReady(false)
        toast({
          title: "Not ready",
          description: "You can mark yourself ready again when you're prepared.",
        })
      } else {
        toast({
          title: "Failed to mark unready",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error marking unready:', error)
      toast({
        title: "Error",
        description: "Failed to mark unready",
        variant: "destructive",
      })
    }
  }

  // Start the game (host only)
  const startGame = async () => {
    if (!user || !game) return

    setStarting(true)
    try {
      const response = await fetch(`/api/games/${gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Game initiated!",
          description: "Waiting for all players to be ready...",
        })
        // The game will start automatically when all players are ready
      } else {
        toast({
          title: "Failed to start game",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error starting game:', error)
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      })
    } finally {
      setStarting(false)
    }
  }

  const handleStartNewRound = async () => {
    if (!user || !game) return;

    setStarting(true);
    try {
      const response = await fetch(`/api/games/${gameId}/new-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "New round created!",
          description: "Get ready...",
        });
        // The fetchLobbyInfo poll will handle updating the UI to the new 'waiting' state
      } else {
        toast({
          title: 'Failed to start new round',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error starting new round:', error);
      toast({
        title: 'Error',
        description: 'Failed to start new round',
        variant: 'destructive',
      });
    } finally {
      setStarting(false);
    }
  };

  // Copy game code
  const copyGameCode = () => {
    navigator.clipboard.writeText(gameId)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Game code copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  // Leave game
  const leaveGame = async () => {
    if (!user) return

    setLeaving(true)
    try {
      const response = await fetch(`/api/games/${gameId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Left game",
          description: data.gameDeleted ? "Game was deleted (no players left)" : "Successfully left the game",
        })
        router.push('/play/multiplayer')
      } else {
        toast({
          title: "Failed to leave game",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error leaving game:', error)
      toast({
        title: "Error",
        description: "Failed to leave game",
        variant: "destructive",
      })
    } finally {
      setLeaving(false)
    }
  }

  // Check if current user is host
  const isHost = game?.created_by === user?.id;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-green-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4"></div>
            <p className="text-amber-200">Loading lobby...</p>
          </div>
        </div>
      </>
    )
  }

  if (!game) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-green-900">
          <div className="text-center">
            <p className="text-amber-200">Game not found</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-green-900 p-4 pt-20">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Game Info */}
          <Card className="score-card">
            <CardHeader>
              <CardTitle className="text-amber-100 flex items-center justify-between">
                <span>Game Lobby</span>
                <Badge variant={game.status === 'waiting' ? 'secondary' : 'default'}>
                  {game.status === 'waiting' ? 'Waiting' : 'Active'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-200">Word Length:</p>
                  <p className="text-2xl font-bold text-amber-300">{game.base_word.length} letters</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-200">Time Limit:</p>
                  <p className="text-xl font-bold text-amber-300">{game.time_limit}s</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-amber-300" />
                  <span className="text-amber-200">
                    {game.player_count}/{game.max_players} Players
                  </span>
                </div>
                <Button
                  onClick={copyGameCode}
                  variant="outline"
                  size="sm"
                  className="text-amber-300 border-amber-600 hover:bg-amber-600/20"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="score-card">
            <CardHeader>
              <CardTitle className="text-amber-100">Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {game.game_players?.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 felt-pattern rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {player.is_host && (
                        <Crown className="h-4 w-4 text-amber-300" />
                      )}
                      <span className="font-semibold text-amber-100">
                        {getProperUsername(player)}
                      </span>
                      {player.is_host && (
                        <Badge variant="outline" className="text-xs">
                          Host
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-amber-300 font-bold">
                        {player.score} pts
                      </span>
                      {(player.ready || player.is_host) && (
                        <Badge variant="default" className="bg-green-600 text-white">
                          Ready
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Game Start Buttons */}
          <Card className="score-card">
            <CardHeader>
              <CardTitle className="text-amber-100">Game Start</CardTitle>
            </CardHeader>
            <CardContent className="mt-4">
              {game.status === 'waiting' && (
                <>
                  <p className="text-center text-gray-400 mb-6">
                    Waiting for players to join and get ready. The host will start the game.
                  </p>
                  {isHost ? (
                    <Button 
                      onClick={startGame} 
                      disabled={starting || gameStarted || !allPlayersReady} 
                      className="w-full text-lg py-6"
                    >
                      <Play className="mr-2 h-5 w-5" /> 
                      {starting ? 'Starting...' : (allPlayersReady ? 'Start Game' : 'Waiting for players...')}
                    </Button>
                  ) : (
                    <Button 
                      onClick={ready ? markUnready : markReady} 
                      disabled={gameStarted} 
                      className="w-full text-lg py-6"
                    >
                      {ready ? 'Mark as Unready' : 'I am Ready!'}
                    </Button>
                  )}
                </>
              )}

              {game.status === 'finished' && (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4">Round Over!</h3>
                  <p className="text-gray-400 mb-6">
                    Final scores are in. The host can start the next round.
                  </p>
                  {isHost ? (
                    <Button onClick={handleStartNewRound} disabled={starting} className="w-full text-lg py-6">
                      <Play className="mr-2 h-5 w-5" /> {starting ? 'Starting...' : 'Start Next Round'}
                    </Button>
                  ) : (
                    <p className="text-lg text-gray-300 p-4 bg-gray-800/50 rounded-lg">
                      Waiting for the host to start the next round...
                    </p>
                  )}
                </div>
              )}

              {game.status === 'active' && (
                <div className="text-center">
                  <p className="text-lg text-green-400 animate-pulse">Game in progress...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leave Game Button */}
          <div className="text-center">
            <Button
              onClick={leaveGame}
              disabled={leaving}
              variant="outline"
              size="lg"
              className="text-red-300 border-red-600 hover:bg-red-600/20 px-8 py-4"
            >
              <LogOut className="h-5 w-5 mr-2" />
              {leaving ? 'Leaving...' : 'Leave Game'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
} 