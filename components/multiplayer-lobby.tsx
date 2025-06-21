"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

interface Game {
  id: string
  base_word: string
  created_by: string
  creator_username?: string
  status: string
  current_round: number
  time_limit: number
  max_players: number
  created_at: string
  player_count: number
  available_slots: number
  players?: Array<{
    username: string
    score: number
  }>
  game_players: Array<{
    id: string
    user_id: string
    username: string
    score: number
    is_host: boolean
    is_ready?: boolean
  }>
}

export function MultiplayerLobby() {
  const { user } = useAuth()
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [gameCode, setGameCode] = useState('')
  const [wordLength, setWordLength] = useState(6)
  const [timeLimit, setTimeLimit] = useState(120)
  const [isFetching, setIsFetching] = useState(false)

  // Helper function to get a proper username
  const getProperUsername = (user: any) => {
    if (user.displayName) {
      return user.displayName
    }
    
    if (user.username && !user.username.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return user.username
    }
    
    if (user.email) {
      const emailPart = user.email.split('@')[0]
      return emailPart.charAt(0).toUpperCase() + emailPart.slice(1)
    }
    
    return user.id
  }

  // Force refresh public games
  const forceRefreshGames = async () => {
    if (isFetching) return // Prevent multiple simultaneous fetches
    setGames([])
    setLoading(true)
    await fetchPublicGames()
    setLoading(false)
  }

  // Fetch public games
  const fetchPublicGames = async () => {
    if (isFetching) return // Prevent multiple simultaneous fetches
    
    setIsFetching(true)
    try {
      const timestamp = Date.now()
      const url = `/api/games/public?t=${timestamp}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setGames(data.games || [])
      } else {
        console.error('Failed to fetch games:', data.error)
      }
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchPublicGames()
    const interval = setInterval(fetchPublicGames, 5000)
    return () => clearInterval(interval)
  }, [])

  // Create new game
  const createGame = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to create a game",
        variant: "destructive",
      })
      return
    }

    if (creating) return // Prevent multiple simultaneous creates

    setCreating(true)
    try {
      const response = await fetch('/api/games/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordLength,
          timeLimit,
          isPublic,
          createdBy: user.id,
          username: getProperUsername(user)
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Game created!",
          description: `Game ID: ${data.gameId}`,
        })
        router.push(`/play/multiplayer/${data.gameId}/lobby`)
      } else {
        toast({
          title: "Failed to create game",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating game:', error)
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  // Join game by code
  const joinGameByCode = async () => {
    if (!user || !gameCode.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a game code",
        variant: "destructive",
      })
      return
    }

    if (joining === gameCode) return // Prevent multiple simultaneous joins

    setJoining(gameCode)
    try {
      const response = await fetch('/api/games/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameCode.trim(),
          userId: user.id,
          username: getProperUsername(user)
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Joined game!",
          description: "Redirecting to lobby...",
        })
        router.push(`/play/multiplayer/${gameCode.trim()}/lobby`)
      } else {
        toast({
          title: "Failed to join game",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error joining game:', error)
      toast({
        title: "Error",
        description: "Failed to join game",
        variant: "destructive",
      })
    } finally {
      setJoining(null)
    }
  }

  // Join public game
  const joinPublicGame = async (gameId: string) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to join a game",
        variant: "destructive",
      })
      return
    }

    if (joining === gameId) return // Prevent multiple simultaneous joins

    setJoining(gameId)
    try {
      const response = await fetch('/api/games/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          userId: user.id,
          username: getProperUsername(user)
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Joined game!",
          description: "Redirecting to lobby...",
        })
        router.push(`/play/multiplayer/${gameId}/lobby`)
      } else {
        toast({
          title: "Failed to join game",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error joining game:', error)
      toast({
        title: "Error",
        description: "Failed to join game",
        variant: "destructive",
      })
    } finally {
      setJoining(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-amber-100 mb-2">Multiplayer Lobby</h1>
        <p className="text-amber-200">Create or join a game to play with friends!</p>
      </div>

      {/* Create Game Section */}
      <Card className="score-card">
        <CardHeader>
          <CardTitle className="text-amber-100">Create New Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="public-game"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public-game" className="text-amber-100">
              Public Game (visible to everyone)
            </Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="word-length" className="text-amber-100">
                Word Length
              </Label>
              <select
                id="word-length"
                value={wordLength}
                onChange={(e) => setWordLength(Number(e.target.value))}
                className="w-full p-2 rounded bg-green-800 border border-green-600 text-amber-100"
              >
                <option value={5}>5 letters</option>
                <option value={6}>6 letters</option>
                <option value={7}>7 letters</option>
                <option value={8}>8 letters</option>
                <option value={9}>9 letters</option>
                <option value={10}>10 letters</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time-limit" className="text-amber-100">
                Time Limit (seconds)
              </Label>
              <select
                id="time-limit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full p-2 rounded bg-green-800 border border-green-600 text-amber-100"
              >
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
                <option value={120}>2 minutes</option>
                <option value={180}>3 minutes</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>
          </div>
          
          <Button 
            onClick={createGame} 
            disabled={creating}
            className="w-full wood-button"
          >
            {creating ? 'Creating...' : 'Create Game'}
          </Button>
        </CardContent>
      </Card>

      {/* Join by Code Section */}
      <Card className="score-card">
        <CardHeader>
          <CardTitle className="text-amber-100">Join by Game Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter game code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={joinGameByCode}
              disabled={!gameCode.trim() || joining === gameCode}
              className="wood-button"
            >
              {joining === gameCode ? 'Joining...' : 'Join'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Public Games Section */}
      <Card className="score-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-amber-100">Public Games</CardTitle>
            <Button
              onClick={forceRefreshGames}
              disabled={loading || isFetching}
              size="sm"
              variant="outline"
              className="text-amber-100 border-amber-600 hover:bg-amber-600 hover:text-white"
            >
              {loading || isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-amber-200">Loading games...</div>
          ) : games.length === 0 ? (
            <div className="text-center text-amber-200">No public games available</div>
          ) : (
            <div className="space-y-3">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 felt-pattern rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-amber-100">
                        {game.base_word.length} letters
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {game.player_count}/{game.max_players} players
                      </Badge>
                      {game.available_slots > 0 && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          {game.available_slots} slot{game.available_slots !== 1 ? 's' : ''} available
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {game.time_limit}s
                      </Badge>
                    </div>
                    <p className="text-sm text-amber-200">
                      Created by {game.creator_username && !game.creator_username.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
                        ? game.creator_username 
                        : 'Anonymous'}
                    </p>
                    {game.players && game.players.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-amber-300 mb-1">Players:</p>
                        <div className="flex flex-wrap gap-1">
                          {game.players.map((player, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-amber-400 text-amber-400">
                              {player.username}: {player.score} pts
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-amber-300 mt-1">
                      Created {new Date(game.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => joinPublicGame(game.id)}
                    disabled={joining === game.id || game.available_slots === 0}
                    size="sm"
                    className="wood-button"
                  >
                    {joining === game.id ? 'Joining...' : game.available_slots === 0 ? 'Full' : 'Join'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 