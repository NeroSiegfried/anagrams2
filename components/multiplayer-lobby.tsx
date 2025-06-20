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
  game_players: Array<{
    id: string
    user_id: string
    username: string
    score: number
    is_host: boolean
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

  // Helper function to get a proper username
  const getProperUsername = (user: any) => {
    console.log('[MultiplayerLobby] Getting username for user:', user);
    
    // Use display name if available
    if (user.displayName) {
      console.log('[MultiplayerLobby] Using displayName:', user.displayName);
      return user.displayName;
    }
    
    // Use username if it's not a UUID
    if (user.username && !user.username.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('[MultiplayerLobby] Using username:', user.username);
      return user.username;
    }
    
    // Generate username from email
    if (user.email) {
      const emailPart = user.email.split('@')[0];
      const generatedUsername = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
      console.log('[MultiplayerLobby] Generated username from email:', generatedUsername);
      return generatedUsername;
    }
    
    // Fallback to user ID (shouldn't happen)
    console.log('[MultiplayerLobby] Using fallback user ID:', user.id);
    return user.id;
  };

  // Fetch public games
  const fetchPublicGames = async () => {
    try {
      const response = await fetch('/api/games/public')
      const data = await response.json()
      
      if (response.ok) {
        setGames(data.games || [])
      } else {
        console.error('Failed to fetch games:', data.error)
      }
    } catch (error) {
      console.error('Error fetching games:', error)
    }
  }

  useEffect(() => {
    fetchPublicGames()
    const interval = setInterval(fetchPublicGames, 5000) // Refresh every 5 seconds
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
        router.push(`/play/multiplayer/${gameCode}/lobby`)
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
                <option value={3}>3 letters</option>
                <option value={4}>4 letters</option>
                <option value={5}>5 letters</option>
                <option value={6}>6 letters</option>
                <option value={7}>7 letters</option>
                <option value={8}>8 letters</option>
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
          <CardTitle className="text-amber-100">Public Games</CardTitle>
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
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-amber-100">
                        {game.base_word.length} letters
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {game.player_count}/{game.max_players} players
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {game.time_limit}s
                      </Badge>
                    </div>
                    <p className="text-sm text-amber-200">
                      Created by {game.creator_username && !game.creator_username.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
                        ? game.creator_username 
                        : 'Anonymous'}
                    </p>
                  </div>
                  <Button
                    onClick={() => joinPublicGame(game.id)}
                    disabled={joining === game.id}
                    size="sm"
                    className="wood-button"
                  >
                    {joining === game.id ? 'Joining...' : 'Join'}
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
