"use client"

import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shuffle, Volume2, VolumeX, Clock, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useGame } from "@/lib/game-context"
import { useAuth } from "@/lib/auth-context"
import { FoundWordsList } from "@/components/found-words-list"
import { ScoreDisplay } from "@/components/score-display"
import { GameOverModal } from "@/components/game-over-modal"
import { DefinitionModal } from "@/components/definition-modal"
import { SettingsModal } from "@/components/settings-modal"
import { useMultiplayer } from "@/lib/use-multiplayer"
import { Navbar } from "@/components/navbar"
import { AudioGenerator } from "@/lib/audio-generator"
import { useRouter } from "next/navigation"

export function GameBoard({
  gameId,
  multiplayer = false,
}: {
  gameId?: string
  multiplayer?: boolean
}) {
  console.log('[GameBoard] Component rendered');
  const { toast } = useToast()
  const { user } = useAuth()
  const {
    gameSettings,
    startNewGame,
    endGame,
    validateWord,
    calculateScore,
    gameState,
    setGameState,
    addToScore,
    addFoundWord,
  } = useGame()

  const [currentWord, setCurrentWord] = useState<string[]>([])
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [showDefinition, setShowDefinition] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "incorrect" | "bonus">("idle")
  const [showSparkles, setShowSparkles] = useState(false)
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(false)
  const [restoringGameOver, setRestoringGameOver] = useState(false)
  const [pendingWords, setPendingWords] = useState<string[]>([]) // Collect words during game
  const [shuffleCounter, setShuffleCounter] = useState(0) // Add shuffle counter for useMemo dependency
  const [showFullWordList, setShowFullWordList] = useState(false) // Toggle for showing full word list in multiplayer
  const hasRestoredRef = useRef(false)
  const hasAutoSubmitted = useRef(false)
  const hasStartedNewGameRef = useRef(false)
  const lastScoreUpdateRef = useRef(0) // Rate limiting for score updates
  const [tileSize, setTileSize] = useState(56); // px, default desktop size
  const [tileGap, setTileGap] = useState(5); // px, default gap
  const tileContainerRef = useRef<HTMLDivElement>(null);
  const ongoingRequestRef = useRef<Promise<any> | null>(null); // Track ongoing API requests

  const audioGeneratorRef = useRef<AudioGenerator | null>(null)

  // Track if we've already scrambled for the current base word
  const scrambledForBaseWord = useRef<string | null>(null)

  // Track previous baseWord for logging
  const prevBaseWordRef = useRef<string | null>(null)

  const { opponents, opponentScores, gameStatus } = useMultiplayer(gameId, multiplayer)

  const router = useRouter()

  // Function to get proper username for display
  const getProperUsername = () => {
    if (!user) return 'Guest'
    
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
    
    return 'You'
  }

  // Add this after currentWord state:
  const currentWordRef = useRef<string[]>([]);
  useEffect(() => { currentWordRef.current = currentWord; }, [currentWord]);

  // Add this near the top, after state declarations:
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Automatic exit: call leave API on unload or navigation with 10-second grace period
  useEffect(() => {
    if (!multiplayer || !user || !gameId) return;
    const hasLeftRef = { current: false };
    let gracePeriodTimeout: NodeJS.Timeout | null = null;

    const leaveWithBeacon = () => {
      if (hasLeftRef.current) return;
      hasLeftRef.current = true;
      
      console.log('[GameBoard] Attempting to leave game via beacon:', gameId);
      
      try {
        const url = `/api/games/${gameId}/leave`;
        const data = JSON.stringify({ userId: user.id });
        const success = navigator.sendBeacon(url, data);
        
        if (!success) {
          console.log('[GameBoard] sendBeacon failed, trying fetch');
          // Fallback to fetch if sendBeacon fails
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
            keepalive: true
          }).catch(e => console.log('[GameBoard] Fallback fetch also failed:', e));
        } else {
          console.log('[GameBoard] sendBeacon successful');
        }
      } catch (e) {
        console.log('[GameBoard] sendBeacon error:', e);
        // Fallback to fetch
        fetch(`/api/games/${gameId}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
          keepalive: true
        }).catch(e => console.log('[GameBoard] Fallback fetch also failed:', e));
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('[GameBoard] beforeunload event triggered');
      // Start grace period
      gracePeriodTimeout = setTimeout(() => {
        leaveWithBeacon();
      }, 10000); // 10 second grace period
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('[GameBoard] visibilitychange to hidden');
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
      console.log('[GameBoard] Cleanup: removing event listeners');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (gracePeriodTimeout) {
        clearTimeout(gracePeriodTimeout);
      }
      // Do NOT call leaveWithBeacon here; only call on actual unload/navigation
    };
  }, [multiplayer, user, gameId]);

  // Initialize audio generator
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioGeneratorRef.current = new AudioGenerator()
    }
  }, [])

  // Deterministic shuffle using a seed (base word)
  function seededScramble(word: string, seed: number): string[] {
    const arr = word.split("")
    let m = arr.length, t, i
    while (m) {
      i = Math.floor(random(seed + m) * m--)
      t = arr[m]
      arr[m] = arr[i]
      arr[i] = t
    }
    return arr
  }
  // Simple hash function for seed
  function hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash)
  }
  // Deterministic random number generator
  function random(seed: number): number {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  // On mount, check for saved game over state or return-to-game flag
  useEffect(() => {
    console.log('[GameBoard] Mount effect running');
    
    const saved = localStorage.getItem('anagramsGameOverState');
    const returnToGame = localStorage.getItem('anagramsReturnToGame');
    if (!hasRestoredRef.current && saved && returnToGame) {
      console.log('[GameBoard] Restoring game over state from localStorage');
      setRestoringGameOver(true);
      try {
        const parsed = JSON.parse(saved);
        if (parsed.baseWord) {
          setGameState({
            isActive: false,
            letters: parsed.baseWord.split(''),
            foundWords: parsed.foundWords,
            score: parsed.score,
            timeLeft: 0,
            baseWord: parsed.baseWord,
            currentRound: 1,
            gameId: null,
            currentLetterCount: parsed.baseWord.length,
          });
          // Restore scrambled letters
          const key = `anagramsScrambledLetters_${parsed.baseWord}`;
          const stored = localStorage.getItem(key);
          if (stored) {
            const savedOrder = JSON.parse(stored);
            if (Array.isArray(savedOrder) && savedOrder.length === parsed.baseWord.length) {
              // Scrambled letters will be restored by useMemo when baseWord changes
            }
          }
        }
      } catch {}
      setShowGameOver(true);
      localStorage.removeItem('anagramsReturnToGame');
      setLoading(false);
      hasRestoredRef.current = true;
      console.log('[GameBoard] Restoration complete, returning from effect');
      return; // Prevent starting a new game after restoration
    }

    // Only start a new game if not restoring in this session and not multiplayer
    if (!hasRestoredRef.current && !multiplayer) {
      console.log('[GameBoard] Starting new single-player game');
      localStorage.removeItem('anagramsGameOverState');
      localStorage.removeItem('anagramsReturnToGame');
      setLoading(true);
      Promise.resolve(startNewGame()).then(() => {
        setCurrentWord([]);
        setSelectedIndices([]);
        setShowGameOver(false);
        setLoading(false);
        console.log('[GameBoard] New single-player game started');
      });
    } else {
      console.log('[GameBoard] Restoration already performed in this session, skipping new game');
      setLoading(false);
    }
  }, [multiplayer, gameId]);

  // Cleanup effect to reset flags when component unmounts
  useEffect(() => {
    return () => {
      // Reset the flag when component unmounts
      hasRestoredRef.current = false;
    };
  }, []);

  // Unified game state management for multiplayer games
  useEffect(() => {
    if (!multiplayer || !gameId) return;

    console.log('[GameBoard] Setting up game state management for multiplayer game:', gameId);

    // Check if we're already managing this game to prevent duplicate setups
    const setupKey = `game-setup-${gameId}`;
    if ((window as any)[setupKey]) {
      console.log('[GameBoard] Already managing this game, skipping duplicate setup:', gameId);
      return;
    }
    (window as any)[setupKey] = true;

    let pollCount = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    let isInitialLoad = true; // Track if this is the initial load
    let intervalId: NodeJS.Timeout | null = null;
    let isCleanedUp = false; // Track if the effect has been cleaned up

    const loadGameState = async () => {
      // Prevent duplicate requests and check if cleaned up
      if (ongoingRequestRef.current || isCleanedUp) {
        console.log('[GameBoard] Request already in progress or cleaned up, skipping call');
        return ongoingRequestRef.current;
      }

      try {
        console.log('[GameBoard] Loading game state:', { isInitialLoad, gameId, pollCount });
        
        // Create the request promise and store it
        const requestPromise = fetch(`/api/games/${gameId}/lobby`);
        ongoingRequestRef.current = requestPromise;
        
        const response = await requestPromise;
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        consecutiveErrors = 0; // Reset error count on success
        
        if (data.game) {
          const game = data.game;
          
          // Don't update if we're showing game over modal or restoring game over state
          if (showGameOver || restoringGameOver) {
            console.log('[GameBoard] Game over modal is showing or restoring, skipping state update');
            return;
          }
          
          const isGameActive = game.status === 'active' && game.started_at !== null;
          
          console.log('[GameBoard] Game state loaded:', { 
            isInitialLoad,
            pollCount,
            gameStatus: game.status, 
            isGameActive, 
            currentGameStatus: gameState.gameStatus,
            currentIsActive: gameState.isActive,
            timeLeft: gameState.timeLeft
          });

          // Calculate time left based on started_at timestamp
          let timeLeft = game.time_limit || 120;
          if (game.started_at && isGameActive) {
            const startTime = new Date(game.started_at).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            timeLeft = Math.max(0, game.time_limit - elapsed);
          }
          
          // Find the current user's player data
          const currentPlayer = game.game_players?.find((player: any) => player.user_id === user?.id);
          const userScore = currentPlayer?.score || 0;
          const userFoundWords = currentPlayer?.found_words || [];
          
          console.log('[GameBoard] Player data:', { currentPlayer, userScore, userFoundWords });
          
          // Only update if the game state has actually changed or this is the initial load
          const currentIsActive = gameState.isActive;
          const wordChanged = game.base_word !== gameState.baseWord;
          const statusChanged = isGameActive !== currentIsActive;
          const gameStatusChanged = game.status !== gameState.gameStatus;
          
          if (isInitialLoad || wordChanged || statusChanged || gameStatusChanged) {
            console.log('[GameBoard] Updating game state:', { isInitialLoad, wordChanged, statusChanged, gameStatusChanged });
            
            // Update game state
            setGameState({
              isActive: isGameActive,
              letters: game.base_word.split(''),
              foundWords: userFoundWords,
              score: userScore,
              timeLeft: timeLeft,
              baseWord: game.base_word,
              currentRound: game.current_round || 1,
              gameId: game.id,
              currentLetterCount: game.base_word.length,
              validWords: game.valid_words || [], // Add valid words for client-side validation
              gameStatus: game.status, // Track the game status
            });
            
            // Only reset game over state if transitioning to active
            if (isGameActive && !currentIsActive) {
              setShowGameOver(false);
              setRestoringGameOver(false);
            }
          } else if (isGameActive) {
            // Just sync time if nothing else changed but game is active
            if (timeLeft !== gameState.timeLeft) {
              setGameState({ timeLeft: timeLeft });
            }
          }
          
          // Mark initial load as complete
          if (isInitialLoad) {
            isInitialLoad = false;
            setLoading(false);
          }
          
          pollCount++;
        }
      } catch (error) {
        consecutiveErrors++;
        console.error('[GameBoard] Error loading game state:', error);
        
        // If we have too many consecutive errors, stop polling
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('[GameBoard] Too many consecutive errors, stopping polling');
          return;
        }
        
        // Mark initial load as complete even on error
        if (isInitialLoad) {
          isInitialLoad = false;
          setLoading(false);
        }
      } finally {
        // Clear the ongoing request reference
        ongoingRequestRef.current = null;
      }
    };

    // Initial load
    console.log('[GameBoard] Starting initial load for game:', gameId);
    loadGameState();

    // Set up polling only if game is active or finished, and not showing game over modal or restoring
    if ((gameState.isActive || gameState.gameStatus === 'finished') && !showGameOver && !restoringGameOver) {
      console.log('[GameBoard] Setting up polling for game:', gameId);
      // Poll every 5 seconds (reduced from 3 seconds for better performance)
      intervalId = setInterval(() => {
        if (!isCleanedUp) {
          console.log('[GameBoard] Polling game state for game:', gameId);
          loadGameState();
        }
      }, 5000);
    } else {
      console.log('[GameBoard] Not setting up polling - game not active or showing game over');
    }

    // Cleanup function
    return () => {
      console.log('[GameBoard] Cleaning up game state management for game:', gameId);
      isCleanedUp = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Clear any ongoing request
      ongoingRequestRef.current = null;
      // Clear the setup flag
      delete (window as any)[setupKey];
    };
  }, [multiplayer, gameId, gameState.baseWord, gameState.isActive, showGameOver, restoringGameOver]);

  // Optimize scrambled letters calculation with useMemo
  const scrambledLetters = useMemo(() => {
    if (!gameState.baseWord) return [];
    
    let savedOrder = null;
    try {
      const key = `anagramsScrambledLetters_${gameState.baseWord}`;
      const stored = localStorage.getItem(key);
      console.log('[Anagrams] Reading scrambledLetters from localStorage:', key, stored);
      if (stored) {
        savedOrder = JSON.parse(stored);
      }
    } catch (e) {
      console.log('[Anagrams] Error reading scrambledLetters from localStorage:', e);
    }
    
    if (savedOrder && Array.isArray(savedOrder) && savedOrder.length === gameState.baseWord.length) {
      console.log('[Anagrams] Restoring scrambledLetters from localStorage:', savedOrder);
      return savedOrder;
    } else {
      const shuffled = scrambleLetters(gameState.baseWord);
      localStorage.setItem(`anagramsScrambledLetters_${gameState.baseWord}`, JSON.stringify(shuffled));
      console.log('[Anagrams] No saved order, shuffling and saving to localStorage:', shuffled);
      return shuffled;
    }
  }, [gameState.baseWord, shuffleCounter]); // Added shuffleCounter to dependency array

  const playSound = async (soundType: "correct" | "incorrect" | "bonus") => {
    if (isMuted || !gameSettings.soundEnabled || !audioGeneratorRef.current) return

    try {
      switch (soundType) {
        case "correct":
          await audioGeneratorRef.current.playCorrectSound()
          break
        case "incorrect":
          await audioGeneratorRef.current.playIncorrectSound()
          break
        case "bonus":
          await audioGeneratorRef.current.playBonusSound()
          break
      }
    } catch (error) {
      // Silently fail for audio errors
    }
  }

  const addLetterToWord = (index: number) => {
    if (selectedIndices.includes(index) || currentWord.length >= gameState.currentLetterCount) return

    setCurrentWord((prev) => [...prev, scrambledLetters[index]])
    setSelectedIndices((prev) => [...prev, index])
  }

  const removeLastLetter = () => {
    if (currentWord.length === 0) return

    setCurrentWord((prev) => prev.slice(0, -1))
    setSelectedIndices((prev) => prev.slice(0, -1))
  }

  const clearCurrentWord = () => {
    setCurrentWord([])
    setSelectedIndices([])
  }

  const handleSlotClick = (slotIndex: number) => {
    if (slotIndex >= currentWord.length || gameState.timeLeft <= 0) return
    
    // Remove the letter from the current word
    const letterToRemove = currentWord[slotIndex]
    setCurrentWord((prev) => prev.filter((_, i) => i !== slotIndex))
    
    // Find the index of this letter in the scrambled letters and remove it from selectedIndices
    const letterIndex = selectedIndices[slotIndex]
    setSelectedIndices((prev) => prev.filter((_, i) => i !== slotIndex))
  }

  // True random shuffle for the shuffle button
  function scrambleLetters(word: string): string[] {
    const letters = word.split("")
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }
    return letters
  }

  // Memoize the current word string to avoid recalculating
  const currentWordString = useMemo(() => {
    return currentWord.join("").toLowerCase()
  }, [currentWord])

  // Memoize the submit button disabled state
  const isSubmitDisabled = useMemo(() => {
    return gameState.timeLeft <= 0 || (multiplayer && !gameState.isActive) || currentWord.length === 0
  }, [gameState.timeLeft, multiplayer, gameState.isActive, currentWord.length])

  // Submit all pending words in a batch
  const submitPendingWords = async () => {
    console.log('[GameBoard] submitPendingWords called:', { 
      multiplayer, 
      gameId, 
      user: user?.id, 
      pendingWordsLength: pendingWords.length 
    });
    
    if (!multiplayer || !gameId || !user || pendingWords.length === 0) {
      console.log('[GameBoard] submitPendingWords early return:', { 
        multiplayer, 
        gameId: !!gameId, 
        user: !!user, 
        pendingWordsLength: pendingWords.length 
      });
      return;
    }
    
    try {
      console.log('[GameBoard] Submitting final score to scores table');
      
      const requestBody = { 
        words: pendingWords,
        userId: user.id,
        username: getProperUsername(),
        totalScore: gameState.score
      };
      console.log('[GameBoard] Final score submission request:', requestBody);
      
      // Non-blocking final score submission to scores table
      fetch(`/api/games/${gameId}/submit-words-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }).then(response => response.json())
        .then(data => {
          console.log('[GameBoard] Final score submission response:', data);
          if (data.success) {
            console.log('[GameBoard] Successfully submitted final score');
            setPendingWords([]); // Clear pending words
          } else {
            console.error('[GameBoard] Failed to submit final score:', data.error);
          }
        })
        .catch(error => {
          console.error('[GameBoard] Error submitting final score:', error);
        });
    } catch (error) {
      console.error('[GameBoard] Error preparing final score submission:', error);
    }
  };

  // Auto-submit words when game ends
  useEffect(() => {
    console.log('[GameBoard] Auto-submit effect triggered:', { 
      gameStatus: gameState.gameStatus, 
      pendingWordsLength: pendingWords.length, 
      hasAutoSubmitted: hasAutoSubmitted.current 
    });
    
    if (gameState.gameStatus === 'finished' && pendingWords.length > 0 && !hasAutoSubmitted.current) {
      console.log('[GameBoard] Auto-submitting words, game finished');
      hasAutoSubmitted.current = true;
      submitPendingWords();
    }
  }, [gameState.gameStatus, pendingWords.length]);

  // Also trigger submission when time runs out
  useEffect(() => {
    if (gameState.timeLeft <= 0 && pendingWords.length > 0 && !hasAutoSubmitted.current && multiplayer) {
      console.log('[GameBoard] Auto-submitting words, time ran out');
      hasAutoSubmitted.current = true;
      submitPendingWords();
    }
  }, [gameState.timeLeft, pendingWords.length, multiplayer]);

  // Handle game over modal for multiplayer games when status changes to 'finished'
  useEffect(() => {
    if (multiplayer && gameState.gameStatus === 'finished' && !showGameOver && !restoringGameOver) {
      console.log('[GameBoard] Game status changed to finished, showing game over modal');
      setShowGameOver(true);
    }
  }, [multiplayer, gameState.gameStatus, showGameOver, restoringGameOver]);

  const submitWord = async (wordOverride?: string) => {
    console.log('[submitWord] BEFORE: baseWord =', gameState.baseWord);
    const word = (wordOverride ?? currentWordString).toLowerCase();
    console.log('[submitWord] called with:', word, 'isActive:', gameState.isActive, 'timeLeft:', gameState.timeLeft);
    
    // Only block if not called from auto-submit
    if (gameState.timeLeft <= 0 && !wordOverride) return;

    // Multiplayer: prevent word submission during lobby phase
    if (multiplayer && !gameState.isActive) {
      console.log('[submitWord] Word submission blocked: game not active (lobby phase)');
      toast({
        title: "Game not started",
        description: "Wait for the host to start the game",
        variant: "destructive",
      })
      setFeedbackState("incorrect")
      playSound("incorrect")
      setTimeout(() => setFeedbackState("idle"), 500)
      clearCurrentWord()
      return
    }

    if (word.length < 3) {
      console.log('[submitWord] Word too short, showing toast');
      toast({
        title: "Word too short",
        description: "Words must be at least 3 letters long",
        variant: "destructive",
      })
      setFeedbackState("incorrect")
      playSound("incorrect")
      setTimeout(() => setFeedbackState("idle"), 500)
      return
    }

    if (gameState.foundWords.includes(word)) {
      console.log('[submitWord] Word already found, showing toast:', word);
      toast({
        title: "Already found",
        description: `${word} was already found`,
        variant: "destructive",
      })
      setFeedbackState("incorrect")
      playSound("incorrect")
      setTimeout(() => setFeedbackState("idle"), 500)
      clearCurrentWord()
      return
    }

    // For multiplayer games, use client-side validation with pre-computed valid words
    let isValid = false;
    if (multiplayer && gameId && user) {
      // Client-side validation using the valid words array from game state
      isValid = gameState.validWords.includes(word.toLowerCase());
      
      if (isValid) {
        // Word is valid, collect it for batch submission at the end
        addFoundWord(word);
        const wordScore = calculateScore(word.length);
        addToScore(wordScore);
        
        // Add to pending words for final submission at game end
        setPendingWords(prev => [...prev, word]);
        
        // Rate-limited score update for multiplayer (non-blocking)
        if (multiplayer && gameId && user) {
          const now = Date.now();
          if (now - lastScoreUpdateRef.current >= 100) { // Rate limit to 100ms
            lastScoreUpdateRef.current = now;
            
            // Non-blocking real-time score update
            fetch(`/api/games/${gameId}/update-score`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                word: word,
                userId: user.id,
                username: getProperUsername()
              }),
            }).then(response => response.json())
              .then(data => {
                if (data.success) {
                  console.log('[GameBoard] Real-time score update successful:', data);
                } else {
                  console.error('[GameBoard] Real-time score update failed:', data.error);
                }
              })
              .catch(error => {
                console.log('[GameBoard] Real-time score update failed:', error);
              });
          }
        }
        
        // Play sound and show feedback
        if (word.length >= 6) {
          setFeedbackState("bonus")
          setShowSparkles(true)
          playSound("bonus")
          setTimeout(() => setShowSparkles(false), 1000)
        } else {
          setFeedbackState("correct")
          playSound("correct")
        }

        console.log('[submitWord] Word found, showing toast:', word, 'score:', wordScore);
        toast({
          title: "Word found!",
          description: `+${wordScore} points`,
          variant: "default",
        })
      } else {
        setFeedbackState("incorrect")
        playSound("incorrect")

        console.log('[submitWord] Invalid word, showing toast:', word);
        toast({
          title: "Invalid word",
          description: "Not in our dictionary",
          variant: "destructive",
        })
      }
    } else {
      // Single player: use local validation
      isValid = await validateWord(word)

      if (isValid) {
        const wordScore = calculateScore(word.length)
        addFoundWord(word)
        addToScore(wordScore)

        // Play sound and show feedback
        if (word.length >= 6) {
          setFeedbackState("bonus")
          setShowSparkles(true)
          playSound("bonus")
          setTimeout(() => setShowSparkles(false), 1000)
        } else {
          setFeedbackState("correct")
          playSound("correct")
        }

        console.log('[submitWord] Word found, showing toast:', word, 'score:', wordScore);
        toast({
          title: "Word found!",
          description: `+${wordScore} points`,
          variant: "default",
        })
      } else {
        setFeedbackState("incorrect")
        playSound("incorrect")

        console.log('[submitWord] Invalid word, showing toast:', word);
        toast({
          title: "Invalid word",
          description: "Not in our dictionary",
          variant: "destructive",
        })
      }
    }

    setTimeout(() => setFeedbackState("idle"), word.length >= 6 ? 1000 : 500)
    clearCurrentWord()
    console.log('[submitWord] AFTER: baseWord =', gameState.baseWord);
  }

  const handleWordClick = (word: string) => {
    setSelectedWord(word)
    setShowDefinition(true)
  }

  const formatTime = useMemo(() => {
    return (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, "0")}`
    }
  }, [])

  // Save game over state to localStorage when game ends
  useEffect(() => {
    if (showGameOver && gameState.baseWord) {
      const gameOverState = {
        score: gameState.score,
        foundWords: gameState.foundWords,
        baseWord: gameState.baseWord,
      }
      localStorage.setItem('anagramsGameOverState', JSON.stringify(gameOverState))
    }
  }, [showGameOver, gameState.score, gameState.foundWords, gameState.baseWord])

  // For GameOverModal, use saved state if present (single player only)
  let gameOverScore = gameState.score
  let gameOverFoundWords = gameState.foundWords
  let gameOverBaseWord = gameState.baseWord
  
  // Only use localStorage for single player games
  if (!multiplayer && showGameOver) {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('anagramsGameOverState') : null
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        gameOverScore = parsed.score
        gameOverFoundWords = parsed.foundWords
        gameOverBaseWord = parsed.baseWord
      } catch {}
    }
  }

  // Shuffle button handler (true random)
  const shuffleLetters = () => {
    if (!gameState.baseWord) return
    const shuffled = scrambleLetters(gameState.baseWord)
    localStorage.setItem(`anagramsScrambledLetters_${gameState.baseWord}`, JSON.stringify(shuffled))
    console.log('[Anagrams] User shuffled, saving new order to localStorage:', shuffled)
    clearCurrentWord()
    // Force re-render by incrementing shuffle counter
    setShuffleCounter(prev => prev + 1)
    // Shift focus to submit button after DOM updates, only if enabled
    setTimeout(() => {
      if (submitButtonRef.current && !submitButtonRef.current.disabled) {
        submitButtonRef.current.focus()
      }
    }, 0)
  }

  // After every entry, restore the order from localStorage
  // useEffect(() => {
  //   if (gameState.baseWord) {
  //     try {
  //       const key = `anagramsScrambledLetters_${gameState.baseWord}`
  //       const stored = localStorage.getItem(key)
  //       if (stored) {
  //         const savedOrder = JSON.parse(stored)
  //         if (Array.isArray(savedOrder) && savedOrder.length === gameState.baseWord.length) {
  //           // Scrambled letters will be restored by useMemo when baseWord changes
  //         }
  //       }
  //     } catch {}
  //   }
  //   // Only runs when baseWord changes
  // }, [gameState.baseWord])

  // When closing the modal or starting a new game, clear the saved state
  const handleCloseGameOver = () => {
    console.log('[GameBoard] handleCloseGameOver called, clearing restoringGameOver and hasRestoredRef');
    localStorage.removeItem('anagramsGameOverState');
    setShowGameOver(false);
    setRestoringGameOver(false);
    hasRestoredRef.current = false;
    // Navigate to landing page
    window.location.href = '/';
  };

  const handlePlayAgain = async () => {
    setShowGameOver(false);

    if (multiplayer && gameId) {
      // For multiplayer, simply navigate back to the lobby.
      // The lobby component will show the correct state (e.g., waiting for host to start new round).
      router.push(`/play/multiplayer/${gameId}/lobby`);
    } else {
      // Single player logic remains the same
      setLoading(true);
      await startNewGame();
      setCurrentWord([]);
      setSelectedIndices([]);
      setLoading(false);
    }
  };

  // Restore keyboard input effect at the top level:
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isActive || gameState.timeLeft <= 0 || showSettings) return;
      // Letter keys
      if (/^[a-zA-Z]$/.test(e.key)) {
        const letterIndex = scrambledLetters.findIndex(
          (l, i) => l.toLowerCase() === e.key.toLowerCase() && !selectedIndices.includes(i),
        );
        if (letterIndex !== -1) {
          addLetterToWord(letterIndex);
        }
      }
      // Backspace
      else if (e.key === "Backspace") {
        removeLastLetter();
      }
      // Delete/Escape
      else if (e.key === "Delete" || e.key === "Escape") {
        clearCurrentWord();
      }
      // Enter
      else if (e.key === "Enter") {
        // Prevent double submit if submit button is focused
        if (document.activeElement === submitButtonRef.current) return;
        submitWord();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.isActive, gameState.timeLeft, scrambledLetters, selectedIndices, currentWord, showSettings, submitWord]);

  useEffect(() => {
    if (!gameState.isActive || gameState.timeLeft <= 0 || showGameOver || restoringGameOver) return undefined;
    hasAutoSubmitted.current = false; // Reset for new round
    const timer = setInterval(() => {
      setGameState({ timeLeft: gameState.timeLeft - 1 });
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [gameState.isActive, gameState.timeLeft, setGameState, showGameOver, restoringGameOver]);

  useEffect(() => {
    // Auto-submit when timer reaches zero, only once per round
    if (gameState.isActive && gameState.timeLeft === 0 && !hasAutoSubmitted.current && !showGameOver && !restoringGameOver) {
      hasAutoSubmitted.current = true;
      const wordToSubmit = currentWordRef.current.join("");
      if (wordToSubmit.length > 0) {
        console.log('[Auto-Submit] Timer expired, auto-submitting current word:', wordToSubmit);
        submitWord(wordToSubmit).then(() => {
          endGame();
          setShowGameOver(true);
        });
      } else {
        endGame();
        setShowGameOver(true);
      }
    }
  }, [gameState.isActive, gameState.timeLeft, endGame, submitWord, showGameOver, restoringGameOver]);

  const [leaving, setLeaving] = useState(false);

  // Leave game handler (multiplayer only)
  const leaveGame = async () => {
    if (!user || !gameId) return;
    setLeaving(true);
    try {
      const response = await fetch(`/api/games/${gameId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: 'Left game',
          description: data.gameDeleted ? 'Game was deleted (no players left)' : 'Successfully left the game',
        });
        router.push('/play/multiplayer');
      } else {
        toast({
          title: 'Failed to leave game',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to leave game',
        variant: 'destructive',
      });
    } finally {
      setLeaving(false);
    }
  };

  // Leave Game Button for multiplayer
  let leaveButton: React.ReactNode = null;
  if (multiplayer && gameId) {
    leaveButton = (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={leaveGame}
          disabled={leaving}
          variant="outline"
          size="sm"
          className="text-red-300 border-red-600 hover:bg-red-600/20 px-4 py-2"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {leaving ? 'Leaving...' : 'Leave Game'}
        </Button>
      </div>
    );
  }

  // Calculate tile size based on container width and number of letters
  useLayoutEffect(() => {
    function updateTileSize() {
      if (!tileContainerRef.current || !gameState.baseWord) return;
      const containerWidth = tileContainerRef.current.offsetWidth;
      const letterCount = gameState.baseWord.length;
      
      // Determine the maximum letters in any row
      let maxPerRow;
      if (letterCount <= 7) {
        maxPerRow = letterCount; // Single row
      } else {
        maxPerRow = Math.ceil(letterCount / 2); // Two rows, use the larger row size
      }
      
      // 5px gap between tiles
      const gap = 5;
      // Calculate total gaps needed (one less than the number of tiles in the row)
      const totalGaps = maxPerRow - 1;
      
      // Calculate available width for tiles (container width minus total gap width)
      const availableWidth = containerWidth - (totalGaps * gap);
      
      // Calculate tile size (available width divided by number of tiles in the row)
      let size = Math.floor(availableWidth / maxPerRow);
      
      // Ensure minimum size for usability (at least 40px)
      size = Math.max(size, 40);
      
      // Apply different maximums based on screen size
      const isDesktop = window.innerWidth >= 768;
      if (isDesktop) {
        // Desktop: clamp to 56px if there's enough space
        if (availableWidth >= maxPerRow * 56 + totalGaps * gap) {
          size = 56;
        }
      } else {
        // Mobile: clamp to 80px maximum for good touch interaction
        size = Math.min(size, 80);
      }
      
      setTileSize(size);
    }
    updateTileSize();
    window.addEventListener('resize', updateTileSize);
    return () => window.removeEventListener('resize', updateTileSize);
  }, [gameState.baseWord]);

  // Helper to split letters into rows for 8+ letters, but only if needed
  function getRows(letters: string[]) {
    if (letters.length <= 7) return [letters];
    if (!tileContainerRef.current) return [letters];
    const containerWidth = tileContainerRef.current.offsetWidth;
    const isDesktop = window.innerWidth >= 768;
    const maxTileSize = isDesktop ? 56 : 80;
    const gap = 5;
    const totalGaps = letters.length - 1;
    const requiredWidth = letters.length * maxTileSize + totalGaps * gap;
    if (containerWidth >= requiredWidth) {
      // All tiles fit in one row at max size
      return [letters];
    }
    // Otherwise, split into two balanced rows
    const firstRow = letters.slice(0, Math.ceil(letters.length / 2));
    const secondRow = letters.slice(Math.ceil(letters.length / 2));
    return [firstRow, secondRow];
  }

  if (loading) {
    return (
      <>
        <Navbar onSettingsClick={() => setShowSettings(true)} />
        <div className="min-h-screen flex items-center justify-center bg-green-900">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-amber-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-amber-200 text-lg font-semibold">Loading game...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar onSettingsClick={() => setShowSettings(true)} />
      {leaveButton}
      <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 pt-16 sm:pt-20 casino-table relative">
        <div className="w-full max-w-4xl mx-auto game-card rounded-none sm:rounded-2xl border-0 sm:border-4 border-amber-600 shadow-none sm:shadow-2xl p-0 sm:p-4 md:p-6 relative">
          {showSparkles && (
            <>
              <div className="sparkle" />
              <div className="sparkle" />
              <div className="sparkle" />
              <div className="sparkle" />
            </>
          )}

          <div className="flex justify-between items-center mb-2 sm:mb-4 md:mb-6 p-2 sm:p-0">
            <div className="flex items-center">
              <Clock className="mr-1 sm:mr-2 text-amber-300 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-amber-100 font-mono">
                {formatTime(gameState.timeLeft)}
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-center text-amber-100">
              Round {gameState.currentRound}
            </h1>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="text-amber-300 hover:text-amber-100 hover:bg-green-800 h-8 w-8 sm:h-10 sm:w-10"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-amber-300 hover:text-amber-100 hover:bg-green-800 h-8 w-8 sm:h-10 sm:w-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowSettings(true)
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tiles (above) - Responsive, two rows if needed */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col items-center mb-2 sm:mb-4" ref={tileContainerRef}>
              {getRows(scrambledLetters).map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex justify-center items-center w-full"
                  style={{ marginBottom: rowIdx === 0 && getRows(scrambledLetters).length > 1 ? 2 : 0 }}
                >
                  {row.map((letter, i) => {
                    // Calculate the global index for selectedIndices
                    const globalIdx = rowIdx === 0 ? i : getRows(scrambledLetters)[0].length + i;
                    return (
                      <div
                        key={globalIdx}
                        className={`letter-tile ${selectedIndices.includes(globalIdx) ? "opacity-50" : ""}`}
                        style={{
                          width: tileSize,
                          height: tileSize,
                          marginLeft: i === 0 ? 0 : 5,
                          fontSize: tileSize * 0.8,
                          minWidth: tileSize,
                          minHeight: tileSize,
                        }}
                        onClick={() => !selectedIndices.includes(globalIdx) && gameState.timeLeft > 0 && (!multiplayer || gameState.isActive) && addLetterToWord(globalIdx)}
                      >
                        <span
                          className="font-bold text-amber-900 z-10 relative"
                          style={{ fontSize: tileSize * 0.8 }}
                        >
                          {letter.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Slots below tiles - Responsive, two rows if needed */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col items-center mb-2 sm:mb-4 p-0 sm:p-4 relative">
              {getRows(Array.from({ length: gameState.currentLetterCount })).map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex justify-center items-center w-full"
                  style={{ marginBottom: rowIdx === 0 && getRows(Array.from({ length: gameState.currentLetterCount })).length > 1 ? 2 : 0 }}
                >
                  {row.map((_, i) => {
                    const globalIdx = rowIdx === 0 ? i : getRows(Array.from({ length: gameState.currentLetterCount }))[0].length + i;
                    const filled = globalIdx < currentWord.length;
                    return (
                      <div
                        key={globalIdx}
                        className={`letter-tile ${filled ? '' : 'empty-slot'} ${filled ? 'cursor-pointer' : ''}`}
                        style={{
                          width: tileSize,
                          height: tileSize,
                          marginLeft: i === 0 ? 0 : 5,
                          fontSize: tileSize * 0.8,
                          minWidth: tileSize,
                          minHeight: tileSize,
                          background: filled ? undefined : 'linear-gradient(145deg, #0f5d2a 0%, #1a7a3e 100%)',
                          border: filled ? undefined : '2px solid #8b4513',
                          boxShadow: filled ? undefined : 'inset 0 2px 4px rgba(0,0,0,0.3)',
                        }}
                        onClick={() => filled && handleSlotClick(globalIdx)}
                      >
                        {filled && (
                          <span
                            className="font-bold text-amber-900"
                            style={{ fontSize: tileSize * 0.8 }}
                          >
                            {currentWord[globalIdx].toUpperCase()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Apply feedback animations to the entire slot row */}
              {feedbackState !== "idle" && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-md"
                  style={{
                    ...(feedbackState === "correct" ? {
                      backgroundColor: "rgba(34, 197, 94, 0.2)",
                      boxShadow: "0 0 20px 4px rgba(34, 197, 94, 0.3)",
                      animation: "correct-flash 0.5s ease-in-out"
                    } : {}),
                    ...(feedbackState === "incorrect" ? {
                      backgroundColor: "rgba(239, 68, 68, 0.2)",
                      boxShadow: "0 0 20px 4px rgba(239, 68, 68, 0.3)",
                      animation: "incorrect-flash 0.5s ease-in-out"
                    } : {}),
                    ...(feedbackState === "bonus" ? {
                      background: "radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)",
                      boxShadow: "0 0 30px 8px rgba(251, 191, 36, 0.4)",
                      animation: "bonus-flash 1s ease-in-out"
                    } : {})
                  }}
                />
              )}
            </div>

            {/* Buttons - always reasonable size for tap */}
            <div className="flex justify-center items-center space-x-2 mb-4 sm:mb-6 p-2 sm:p-0">
              <button
                className="wood-button rounded-lg font-semibold text-amber-900 text-base"
                style={{ minWidth: 64, minHeight: 44, fontSize: 18, padding: '8px 16px' }}
                onClick={clearCurrentWord}
                disabled={gameState.timeLeft <= 0 || currentWord.length === 0}
              >
                Clear
              </button>
              <button
                ref={submitButtonRef}
                className="wood-button rounded-lg font-semibold text-amber-900 text-base"
                style={{ minWidth: 64, minHeight: 44, fontSize: 18, padding: '8px 16px' }}
                onClick={() => submitWord()}
                disabled={isSubmitDisabled}
              >
                Submit
              </button>
              <button
                className="wood-button rounded-lg font-semibold text-amber-900"
                style={{ minWidth: 44, minHeight: 44, fontSize: 18, padding: '8px 12px' }}
                onClick={shuffleLetters}
                disabled={gameState.timeLeft <= 0}
              >
                <Shuffle style={{ width: 24, height: 24 }} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 md:gap-6 p-2 sm:p-0">
            <div className="flex flex-col items-center">
              <ScoreDisplay score={gameState.score} username={getProperUsername()} />

              {multiplayer && (
                <div className="mt-2 sm:mt-4 w-full score-card rounded-lg p-2 sm:p-4 shadow-md">
                  <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-amber-100">Opponents</h3>
                  <div className="space-y-1 sm:space-y-2">
                    {opponents.map((opponent) => (
                      <div key={opponent.id} className="flex justify-between items-center p-1 sm:p-2 felt-pattern rounded">
                        <span className="text-sm sm:text-base text-amber-100">{opponent.username}</span>
                        <span className="font-bold text-amber-300 text-sm sm:text-base">{opponentScores[opponent.id] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Show found words count or full list based on toggle */}
            <div className="score-card rounded-lg p-2 sm:p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h2 className="text-lg sm:text-xl font-bold text-amber-100">
                  {showFullWordList ? 'Found Words' : 'Progress'}
                </h2>
                {multiplayer && (
                  <button
                    onClick={() => setShowFullWordList(!showFullWordList)}
                    className="text-xs text-amber-300 hover:text-amber-100 underline"
                  >
                    {showFullWordList ? 'Show Count' : 'Show List'}
                  </button>
                )}
              </div>
              
              {showFullWordList ? (
                <div className="max-h-48 overflow-y-auto">
                  {gameState.foundWords.length === 0 ? (
                    <p className="text-amber-300 italic text-center text-sm">No words found yet...</p>
                  ) : (
                    <div className="space-y-1">
                      {gameState.foundWords.map((word, index) => (
                        <div key={word} className="flex justify-between items-center p-1 felt-pattern rounded text-sm">
                          <span className="text-amber-100 font-medium">{word.toUpperCase()}</span>
                          <span className="font-bold text-amber-300 bg-amber-900/30 px-1 py-0.5 rounded text-xs">
                            +{calculateScore(word.length)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1 sm:mb-2">{gameState.foundWords.length}</p>
                  <p className="text-sm sm:text-base text-amber-200">Words Found</p>
                </div>
              )}
            </div>
          </div>

          {gameState.timeLeft <= 0 && (
            <motion.div
              className="text-center mt-4 p-2 sm:p-0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <p className="text-2xl font-bold text-red-400 mb-2">Time's Up!</p>
              <p className="text-amber-200">Final Score: {gameState.score}</p>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {showDefinition && selectedWord && (
            <DefinitionModal word={selectedWord} onClose={() => setShowDefinition(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>{showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}</AnimatePresence>
        {showGameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <GameOverModal
              score={gameOverScore}
              foundWords={gameOverFoundWords}
              baseWord={gameOverBaseWord}
              onClose={handleCloseGameOver}
              onPlayAgain={handlePlayAgain}
            />
            <div className="fixed inset-0 bg-black/60 z-40" />
          </div>
        )}
      </div>
    </>
  )
}
