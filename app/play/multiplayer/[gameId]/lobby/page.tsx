'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/hooks/use-toast'
import { Navbar } from '@/components/navbar'
import { Copy, Play, Users, Crown, LogOut, Settings, X } from 'lucide-react'
import { GameSettingsForm } from '@/components/game-settings-form'
import { Switch } from '@/components/ui/switch'

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
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [settings, setSettings] = useState({
    timeLimit: 120,
    maxPlayers: 4,
    wordLength: 6
  })
  const [updatingSettings, setUpdatingSettings] = useState(false)
  const [kickingPlayer, setKickingPlayer] = useState<string | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [joinAttempted, setJoinAttempted] = useState(false)
  const [updatingPublic, setUpdatingPublic] = useState(false)

  // Helper function to get a proper username
  const getProperUsername = (player: Player) => {
    // Use username if it's not a UUID
    if (player.username && !player.username.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return player.username;
    }
    
    // Fallback to user ID (shouldn't happen)
    return player.user_id;
  };

  // Join the game automatically when accessing via URL
  const joinGame = async () => {
    console.log('[Lobby] Join game called:', { user: !!user, gameId, joinAttempted });
    if (!user || !gameId || joinAttempted) return

    setJoinAttempted(true)
    try {
      console.log('[Lobby] Attempting to join game...');
      const response = await fetch('/api/games/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameId,
          userId: user.id,
          username: user.username || user.displayName || user.id
        })
      })

      const data = await response.json()
      console.log('[Lobby] Join response:', data);
      
      if (response.ok) {
        setHasJoined(true)
        console.log('[Lobby] Successfully joined game, hasJoined set to true');
        if (data.rejoined) {
          console.log('[Lobby] Rejoined existing game')
        } else {
          console.log('[Lobby] Successfully joined game')
          toast({
            title: "Joined game!",
            description: "You've successfully joined the lobby",
          })
        }
      } else {
        console.error('[Lobby] Failed to join game:', data.error)
        toast({
          title: "Failed to join game",
          description: data.error,
          variant: "destructive",
        })
        router.push('/play/multiplayer')
      }
    } catch (error) {
      console.error('[Lobby] Error joining game:', error)
      toast({
        title: "Error",
        description: "Failed to join game",
        variant: "destructive",
      })
      router.push('/play/multiplayer')
    }
  }

  // Fetch game lobby info
  const fetchLobbyInfo = async () => {
    try {
      console.log('[Lobby] Fetching lobby info for game:', gameId);
      const response = await fetch(`/api/games/${gameId}/lobby`)
      const data = await response.json()
      
      if (response.ok) {
        console.log('[Lobby] Fetched game data:', {
          timeLimit: data.game.time_limit,
          maxPlayers: data.game.max_players,
          playerCount: data.game.player_count,
          players: data.game.game_players?.map((p: any) => ({ username: p.username, ready: p.ready, is_host: p.is_host }))
        })
        setGame(data.game)
        
        // Check if current user is in the game
        const currentPlayer = data.game.game_players?.find((p: Player) => p.user_id === user?.id)
        console.log('[Lobby] Current player found:', currentPlayer);
        if (currentPlayer) {
          setHasJoined(true)
          setReady(currentPlayer.ready)
        }
        
        // Check if game has started
        if (data.game.status === 'active' && data.game.started_at) {
          setGameStarted(true)
          // Redirect to game after a short delay
          setTimeout(() => {
            router.push(`/play/multiplayer/${gameId}`)
          }, 1000)
        }
      } else {
        console.error('[Lobby] Failed to fetch lobby info:', data.error);
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

  // Initial setup: join game and fetch lobby info
  useEffect(() => {
    console.log('[Lobby] Initial setup effect triggered:', { gameId, user: !!user });
    if (gameId && user) {
      // First try to join the game
      joinGame().then(() => {
        // Then fetch lobby info
        fetchLobbyInfo()
      })
    }
  }, [gameId, user])

  // Polling for lobby updates (only after joining)
  useEffect(() => {
    console.log('[Lobby] Polling effect triggered:', { gameId, hasJoined });
    if (gameId && hasJoined) {
      console.log('[Lobby] Starting polling interval');
      const interval = setInterval(() => {
        console.log('[Lobby] Polling for updates...');
        fetchLobbyInfo();
      }, 2000) // Refresh every 2 seconds
      return () => {
        console.log('[Lobby] Clearing polling interval');
        clearInterval(interval);
      }
    }
  }, [gameId, hasJoined])

  // Force polling to start after a delay (for debugging)
  useEffect(() => {
    console.log('[Lobby] Force polling setup');
    if (gameId) {
      const forceInterval = setInterval(() => {
        console.log('[Lobby] FORCE POLLING - fetching lobby info');
        fetchLobbyInfo();
      }, 3000) // Force refresh every 3 seconds
      
      return () => {
        console.log('[Lobby] Clearing force polling interval');
        clearInterval(forceInterval);
      }
    }
  }, [gameId])

  useEffect(() => {
    console.log('[Lobby] Game data updated:', game);
    if (game && game.game_players) {
      // Consider host as always ready, check only non-host players
      const nonHostPlayers = game.game_players.filter(p => !p.is_host)
      const allReady = game.game_players.length > 1 && // Require at least 2 players total
        nonHostPlayers.length > 0 && // Require at least one non-host player
        nonHostPlayers.every(p => p.ready) // All non-host players must be ready
      console.log('[Lobby] All players ready check:', { 
        totalPlayers: game.game_players.length, 
        nonHostPlayers: nonHostPlayers.length,
        allReady,
        nonHostPlayersReady: nonHostPlayers.map(p => ({ username: p.username, ready: p.ready }))
      });
      setAllPlayersReady(allReady)
    }
  }, [game])

  // Update settings state when game data changes
  useEffect(() => {
    if (game) {
      console.log('[Lobby] Updating settings from game data:', {
        timeLimit: game.time_limit,
        maxPlayers: game.max_players
      })
      setSettings({
        timeLimit: game.time_limit,
        maxPlayers: game.max_players,
        wordLength: game.base_word.length
      })
    }
  }, [game?.time_limit, game?.max_players, game?.base_word])

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ready: false })
      })

      const data = await response.json()
      
      if (response.ok) {
        setReady(false)
        toast({
          title: "Not ready",
          description: "You're no longer ready",
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

  // Update game settings
  const updateSettings = async () => {
    if (!user || !game) return

    setUpdatingSettings(true)
    try {
      const response = await fetch(`/api/games/${gameId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          timeLimit: settings.timeLimit,
          maxPlayers: settings.maxPlayers,
          wordLength: settings.wordLength
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Settings updated",
          description: "Game settings have been updated",
        })
        setSettingsModalOpen(false)
        // Refresh lobby info to get updated data
        fetchLobbyInfo()
      } else {
        toast({
          title: "Failed to update settings",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setUpdatingSettings(false)
    }
  }

  // Start the game
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
        setGameStarted(true)
        toast({
          title: "Game starting!",
          description: "Redirecting to game...",
        })
        setTimeout(() => {
          router.push(`/play/multiplayer/${gameId}`)
        }, 1000)
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

  // Handle starting a new round after game is finished
  const handleStartNewRound = async () => {
    if (!user || !game) return

    try {
      const response = await fetch(`/api/games/${gameId}/new-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "New round starting!",
          description: "Redirecting to game...",
        })
        setTimeout(() => {
          router.push(`/play/multiplayer/${gameId}`)
        }, 1000)
      } else {
        toast({
          title: "Failed to start new round",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error starting new round:', error)
      toast({
        title: "Error",
        description: "Failed to start new round",
        variant: "destructive",
      })
    }
  }

  // Copy game code to clipboard
  const copyGameCode = () => {
    navigator.clipboard.writeText(gameId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Game code copied!",
      description: "Share this code with friends to join",
    })
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

  // Check if current user is the host
  const currentPlayer = game?.game_players?.find((p: Player) => p.user_id === user?.id)
  const isHost = currentPlayer?.is_host || false

  // Automatic exit: call leave API on unload or navigation with 10-second grace period
  useEffect(() => {
    if (!user || !gameId || !hasJoined) return;
    
    const hasLeftRef = { current: false };
    let gracePeriodTimeout: NodeJS.Timeout | null = null;

    const leaveWithBeacon = () => {
      if (hasLeftRef.current) return;
      hasLeftRef.current = true;
      
      console.log('[Lobby] Attempting to leave game via beacon:', gameId);
      
      try {
        const url = `/api/games/${gameId}/leave`;
        const data = JSON.stringify({ userId: user.id });
        const success = navigator.sendBeacon(url, data);
        
        if (!success) {
          console.log('[Lobby] sendBeacon failed, trying fetch');
          // Fallback to fetch if sendBeacon fails
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
            keepalive: true
          }).catch(e => console.log('[Lobby] Fallback fetch also failed:', e));
        } else {
          console.log('[Lobby] sendBeacon successful');
        }
      } catch (e) {
        console.log('[Lobby] sendBeacon error:', e);
        // Fallback to fetch
        fetch(`/api/games/${gameId}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
          keepalive: true
        }).catch(e => console.log('[Lobby] Fallback fetch also failed:', e));
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('[Lobby] beforeunload event triggered');
      // Start grace period
      gracePeriodTimeout = setTimeout(() => {
        leaveWithBeacon();
      }, 10000); // 10 second grace period
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('[Lobby] visibilitychange to hidden');
        // Start grace period
        gracePeriodTimeout = setTimeout(() => {
          leaveWithBeacon();
        }, 10000); // 10 second grace period
      } else {
        // Page became visible again, cancel the grace period
        if (gracePeriodTimeout) {
          clearTimeout(gracePeriodTimeout);
          gracePeriodTimeout = null;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('[Lobby] Cleanup: removing event listeners');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (gracePeriodTimeout) {
        clearTimeout(gracePeriodTimeout);
      }
      // Do NOT call leaveWithBeacon here; only call on actual unload/navigation
    };
  }, [user, gameId, hasJoined]);

  // Kick a player from the game
  const kickPlayer = async (targetUserId: string) => {
    if (!user || !game) return

    setKickingPlayer(targetUserId)
    try {
      const response = await fetch(`/api/games/${gameId}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          targetUserId: targetUserId
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Player kicked",
          description: data.gameDeleted ? "Game was deleted (no players left)" : "Player has been removed from the game",
        })
        
        if (data.gameDeleted) {
          router.push('/play/multiplayer')
        } else {
          // Refresh lobby info to update player list
          fetchLobbyInfo()
        }
      } else {
        toast({
          title: "Failed to kick player",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error kicking player:', error)
      toast({
        title: "Error",
        description: "Failed to kick player",
        variant: "destructive",
      })
    } finally {
      setKickingPlayer(null)
    }
  }

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

  // If user hasn't joined yet, show joining message
  if (!hasJoined) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-green-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4"></div>
            <p className="text-amber-200">Joining game...</p>
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
                  <p className="text-amber-200 text-sm">Game Code</p>
                  <p className="text-amber-100 font-mono text-lg">{gameId}</p>
                </div>
                <Button
                  onClick={copyGameCode}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-green-900"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-amber-200">Time Limit</p>
                  <p className="text-amber-100">{game.time_limit}s</p>
                </div>
                <div>
                  <p className="text-amber-200">Max Players</p>
                  <p className="text-amber-100">{game.max_players}</p>
                </div>
                <div>
                  <p className="text-amber-200">Word Length</p>
                  <p className="text-amber-100">{game.base_word.length} letters</p>
                </div>
                <div>
                  <p className="text-amber-200">Players</p>
                  <p className="text-amber-100">{game.player_count}/{game.max_players}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="score-card">
            <CardHeader>
              <CardTitle className="text-amber-100 flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Players ({game.player_count}/{game.max_players})
                </span>
                {isHost && (
                  <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-green-900"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-green-800 border-amber-300">
                      <DialogHeader>
                        <DialogTitle className="text-amber-100">Game Settings</DialogTitle>
                      </DialogHeader>
                      <GameSettingsForm
                        settings={settings}
                        onChange={setSettings}
                        onSubmit={updateSettings}
                        disabled={updatingSettings}
                        showSubmit={true}
                        updating={updatingSettings}
                      />
                      {isHost && (
                        <div className="flex items-center space-x-2 mt-4">
                          <Switch
                            id="public-toggle"
                            checked={game.is_public}
                            onCheckedChange={async (checked) => {
                              setUpdatingPublic(true)
                              await fetch(`/api/games/${gameId}/settings`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ is_public: checked }),
                              })
                              setGame((g) => g && { ...g, is_public: checked })
                              setUpdatingPublic(false)
                            }}
                            disabled={updatingPublic}
                          />
                          <Label htmlFor="public-toggle" className="text-amber-100">
                            {game.is_public ? 'Public (visible to everyone)' : 'Private (invite only)'}
                          </Label>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {game.game_players?.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-green-800 rounded-lg border border-amber-300/20"
                  >
                    <div className="flex items-center space-x-3">
                      {player.is_host && <Crown className="h-4 w-4 text-amber-300" />}
                      <span className="text-amber-100 font-medium">
                        {getProperUsername(player)}
                      </span>
                      {player.is_host && (
                        <Badge variant="secondary" className="text-xs">
                          Host
                        </Badge>
                      )}
                      {player.ready && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          Ready
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isHost && !player.is_host && (
                        <Button
                          onClick={() => kickPlayer(player.user_id)}
                          variant="outline"
                          size="sm"
                          disabled={kickingPlayer === player.user_id}
                          className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                        >
                          {kickingPlayer === player.user_id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-current" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Game Status */}
          {game.status === 'finished' && (
            <Card className="score-card">
              <CardHeader>
                <CardTitle className="text-amber-100">Game Finished</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-200 mb-4">The game has ended. Start a new round or leave the lobby.</p>
                <div className="flex space-x-3">
                  {isHost && (
                    <Button
                      onClick={handleStartNewRound}
                      className="bg-amber-500 hover:bg-amber-600 text-green-900"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start New Round
                    </Button>
                  )}
                  <Button
                    onClick={leaveGame}
                    variant="outline"
                    disabled={leaving}
                    className="border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-green-900"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {leaving ? 'Leaving...' : 'Leave Game'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ready/Start Controls */}
          {game.status === 'waiting' && (
            <Card className="score-card">
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-3">
                  {/* Host controls */}
                  {isHost ? (
                    <>
                      <Button
                        onClick={startGame}
                        disabled={!allPlayersReady || starting}
                        className="bg-amber-500 hover:bg-amber-600 text-green-900 disabled:opacity-50"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {starting ? 'Starting...' : 'Start Game'}
                      </Button>
                      {!allPlayersReady && (
                        <p className="text-amber-200 text-sm text-center">
                          Waiting for all players to be ready...
                        </p>
                      )}
                    </>
                  ) : (
                    /* Non-host controls */
                    <>
                      {ready ? (
                        <Button
                          onClick={markUnready}
                          variant="outline"
                          className="border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-green-900"
                        >
                          Not Ready
                        </Button>
                      ) : (
                        <Button
                          onClick={markReady}
                          className="bg-amber-500 hover:bg-amber-600 text-green-900"
                        >
                          Ready
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button
                    onClick={leaveGame}
                    variant="outline"
                    disabled={leaving}
                    className="border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-green-900"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {leaving ? 'Leaving...' : 'Leave Game'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
} 