import { getSupabaseClient } from "@/lib/supabase"

export interface Word {
  id: string
  word: string
  length: number
  is_common: boolean
  definition: string | null
  created_at: string
  canonical_form?: string
}

// Comprehensive fallback word list for offline mode
const FALLBACK_WORDS = [
  // 3-letter words
  "cat",
  "dog",
  "run",
  "sun",
  "fun",
  "hat",
  "bat",
  "rat",
  "mat",
  "sat",
  "red",
  "bed",
  "fed",
  "led",
  "big",
  "dig",
  "fig",
  "pig",
  "wig",
  "box",
  "fox",
  "car",
  "bar",
  "far",
  "jar",
  "war",
  "ace",
  "ice",
  "die",
  "lie",
  "pie",
  "tie",
  "arm",
  "aim",
  "dim",
  "him",
  "rim",
  "and",
  "end",
  "bid",
  "kid",
  "lid",
  "mid",
  "foe",
  "hoe",
  "toe",
  "woe",
  "bog",
  "cog",
  "fog",
  "hog",
  "jog",
  "log",
  "bay",
  "day",
  "hay",
  "jay",
  "lay",
  "may",
  "pay",
  "ray",
  "say",
  "way",
  "eat",
  "bee",
  "fee",
  "see",
  "tee",
  "beg",
  "keg",
  "leg",
  "peg",
  "bet",
  "get",
  "jet",
  "let",
  "met",
  "net",
  "pet",
  "set",
  "vet",
  "wet",
  "yet",
  "few",
  "dew",
  "new",
  "sew",
  "bye",
  "dye",
  "eye",
  "rye",
  "age",
  "ago",
  "are",
  "art",
  "ask",
  "bad",
  "bag",
  "ban",
  "bit",
  "boy",
  "bus",
  "buy",
  "can",
  "cap",
  "cut",
  "dad",
  "ear",
  "egg",
  "eye",
  "fan",
  "fat",
  "fly",
  "for",
  "gas",
  "got",
  "gun",
  "had",
  "has",
  "her",
  "his",
  "hit",
  "hot",
  "how",
  "job",
  "key",
  "law",
  "lot",
  "low",
  "man",
  "map",
  "mom",
  "not",
  "now",
  "old",
  "one",
  "our",
  "out",
  "own",
  "put",
  "sad",
  "sea",
  "she",
  "sit",
  "six",
  "sky",
  "son",
  "ten",
  "the",
  "top",
  "try",
  "two",
  "use",
  "was",
  "who",
  "why",
  "win",
  "yes",
  "you",
  "zoo",

  // 4-letter words
  "game",
  "play",
  "word",
  "time",
  "find",
  "look",
  "make",
  "take",
  "give",
  "live",
  "love",
  "hope",
  "help",
  "talk",
  "walk",
  "work",
  "rest",
  "best",
  "test",
  "fast",
  "last",
  "past",
  "jump",
  "pump",
  "bump",
  "dump",
  "lump",
  "hand",
  "land",
  "sand",
  "band",
  "card",
  "hard",
  "yard",
  "dark",
  "mark",
  "park",
  "bark",
  "star",
  "cart",
  "dart",
  "mart",
  "part",
  "tart",
  "bear",
  "dear",
  "fear",
  "gear",
  "hear",
  "near",
  "pear",
  "tear",
  "wear",
  "year",
  "back",
  "pack",
  "rack",
  "sack",
  "tack",
  "duck",
  "luck",
  "muck",
  "puck",
  "suck",
  "tuck",
  "book",
  "cook",
  "hook",
  "look",
  "took",
  "door",
  "poor",
  "roof",
  "room",
  "soon",
  "moon",
  "noon",
  "food",
  "good",
  "hood",
  "mood",
  "wood",
  "cool",
  "fool",
  "pool",
  "tool",
  "wool",
  "boot",
  "foot",
  "root",
  "shot",
  "spot",
  "stop",
  "shop",
  "chop",
  "drop",
  "crop",
  "prop",
  "hope",
  "rope",
  "cope",
  "dope",
  "mope",
  "pope",
  "note",
  "vote",
  "boat",
  "coat",
  "goat",
  "moat",
  "team",
  "beam",
  "seam",
  "cream",
  "dream",
  "steam",
  "clean",

  // 5-letter words
  "apple",
  "happy",
  "smile",
  "laugh",
  "dance",
  "music",
  "sound",
  "light",
  "night",
  "right",
  "sight",
  "fight",
  "might",
  "tight",
  "water",
  "earth",
  "space",
  "place",
  "grace",
  "trace",
  "brace",
  "dream",
  "cream",
  "steam",
  "clean",
  "clear",
  "close",
  "cloud",
  "crown",
  "brown",
  "frown",
  "grown",
  "throw",
  "three",
  "threw",
  "where",
  "there",
  "these",
  "those",
  "while",
  "white",
  "whole",
  "whose",
  "world",
  "would",
  "write",
  "wrong",
  "young",
  "about",
  "above",
  "after",
  "again",
  "alone",
  "along",
  "among",
  "angry",
  "apart",
  "argue",
  "arise",
  "array",
  "aside",
  "avoid",
  "awake",
  "aware",
  "badly",
  "basic",
  "beach",
  "began",
  "begin",
  "being",
  "below",
  "bench",
  "birth",
  "black",
  "blame",
  "blank",
  "blind",
  "block",
  "blood",
  "board",
  "boost",
  "booth",
  "bound",
  "brain",
  "brand",
  "brave",
  "bread",
  "break",
  "breed",
  "brick",
  "bride",
  "brief",
  "bring",
  "broad",
  "broke",
  "brown",
  "brush",
  "build",
  "built",
  "burst",
  "buyer",
  "cable",
  "carry",
  "catch",
  "cause",
  "chain",
  "chair",
  "chaos",
  "charm",
  "chart",
  "chase",
  "cheap",
  "check",
  "chest",
  "chief",
  "child",
  "china",
  "chose",
  "civil",
  "claim",
  "class",
  "click",
  "climb",
  "clock",
  "could",
  "count",
  "court",
  "cover",
  "craft",
  "crash",
  "crazy",
  "crime",
  "cross",
  "crowd",
  "crude",
  "curve",
  "cycle",
  "daily",
  "dated",
  "dealt",
  "death",
  "debut",
  "delay",
  "depth",
  "doing",
  "doubt",
  "dozen",
  "draft",
  "drama",
  "drank",
  "dress",
  "drill",
  "drink",
  "drive",
  "drove",
  "dying",
  "eager",
  "early",
  "eight",
  "elite",
  "empty",
  "enemy",
  "enjoy",
  "enter",
  "entry",
  "equal",
  "error",
  "event",
  "every",
  "exact",
  "exist",
  "extra",
  "faith",
  "false",
  "fault",
  "fiber",
  "field",
  "fifth",
  "fifty",
  "final",
  "first",
  "fixed",
  "flash",
  "fleet",
  "floor",
  "fluid",
  "focus",
  "force",
  "forth",
  "forty",
  "forum",
  "found",
  "frame",
  "frank",
  "fraud",
  "fresh",
  "front",
  "fruit",
  "fully",
  "funny",
  "giant",
  "given",
  "glass",
  "globe",
  "going",
  "grade",
  "grain",
  "grand",
  "grant",
  "grass",
  "grave",
  "great",
  "green",
  "gross",
  "group",
  "guard",
  "guess",
  "guest",
  "guide",
  "heart",
  "heavy",
  "hence",
  "horse",
  "hotel",
  "house",
  "human",
  "hurry",
  "image",
  "index",
  "inner",
  "input",
  "issue",

  // 6-letter words
  "anagram",
  "puzzle",
  "gaming",
  "letter",
  "player",
  "points",
  "winner",
  "master",
  "genius",
  "wordle",
  "scribe",
  "typing",
  "coding",
  "syntax",
  "script",
  "design",
  "create",
  "invent",
  "system",
  "action",
  "active",
  "actual",
  "advice",
  "advise",
  "affect",
  "afford",
  "afraid",
  "agency",
  "agenda",
  "agreed",
  "almost",
  "amount",
  "animal",
  "annual",
  "answer",
  "anyone",
  "anyway",
  "appear",
  "around",
  "arrive",
  "artist",
  "aspect",
  "assess",
  "assist",
  "assume",
  "attack",
  "attend",
  "august",
  "author",
  "autumn",
  "avenue",
  "backed",
  "backup",
  "barely",
  "barrel",
  "battle",
  "beauty",
  "became",
  "become",
  "before",
  "behalf",
  "behave",
  "behind",
  "belief",
  "belong",
  "beside",
  "better",
  "beyond",
  "bishop",
  "border",
  "bottle",
  "bottom",
  "bought",
  "branch",
  "breath",
  "bridge",
  "bright",
  "broken",
  "budget",
  "burden",
  "bureau",
  "button",
  "camera",
  "cancer",
  "cannot",
  "canvas",
  "career",
  "castle",
  "casual",
  "caught",
  "center",
  "centre",
  "chance",
  "change",
  "charge",
  "choice",
  "choose",
  "chosen",
  "church",
  "circle",
  "client",
  "closed",
  "closer",
  "coffee",
  "column",
  "combat",
  "common",
  "comply",
  "copper",
  "corner",
  "costly",
  "county",
  "couple",
  "course",
  "covers",
  "credit",
  "crisis",
  "custom",
  "damage",
  "danger",
  "dealer",
  "debate",
  "decade",
  "decide",
  "defeat",
  "defend",
  "degree",
  "demand",
  "depend",
  "deputy",
  "derive",
  "desert",
  "desire",
  "detail",
  "detect",
  "device",
  "differ",
  "dinner",
  "direct",
  "doctor",
  "dollar",
  "domain",
  "double",
  "driven",
  "driver",
  "during",
  "easily",
  "eating",
  "editor",
  "effect",
  "effort",
  "eighth",
  "either",
  "eleven",
  "emerge",
  "empire",
  "employ",
  "enable",
  "ending",
  "energy",
  "engage",
  "engine",
  "enough",
  "ensure",
  "entire",
  "entity",
  "equity",
  "escape",
  "estate",
  "ethnic",
  "europe",
  "except",
  "excess",
  "expand",
  "expect",
  "expert",
  "export",
  "extend",
  "extent",
  "fabric",
  "facial",
  "factor",
  "failed",
  "fairly",
  "fallen",
  "family",
  "famous",
  "father",
  "fellow",
  "female",
  "figure",
  "filing",
  "finger",
  "finish",
  "fiscal",
  "flight",
  "flying",
  "follow",
  "footer",
  "forest",
  "forget",
  "formal",
  "format",
  "former",
  "foster",
  "fought",
  "fourth",
  "france",
  "friend",
  "future",
  "garden",
  "gather",
  "gender",
  "gentle",
  "german",
  "global",
  "golden",
  "ground",
  "growth",
  "guilty",
  "handed",
  "handle",
  "happen",
  "hardly",
  "header",
  "health",
  "height",
  "hidden",
  "holder",
  "honest",
  "impact",
  "import",
  "income",
  "indeed",
  "injury",
  "inside",
  "intent",
  "invest",
  "island",
  "itself",
  "jersey",
  "joseph",
  "junior",
  "killed",
  "labour",
  "latest",
  "latter",
  "launch",
  "lawyer",
  "leader",
  "league",
  "length",
  "lesson",
  "lights",
  "likely",
  "linked",
  "liquid",
  "listen",
  "little",
  "living",
  "losing",
  "making",
  "manage",
  "manner",
  "marble",
  "margin",
  "marine",
  "marked",
  "market",
  "martin",
  "matter",
  "mature",
  "medium",
  "member",
  "memory",
  "mental",
  "merely",
  "merger",
  "method",
  "middle",
  "miller",
  "mining",
  "minute",
  "mirror",
  "mobile",
  "modern",
  "modest",
  "modify",
  "moment",
  "monday",
  "mother",
  "motion",
  "moving",
  "murder",
  "muscle",
  "museum",
  "mutual",
  "myself",
  "narrow",
  "nation",
  "native",
  "nature",
  "nearby",
  "nearly",
  "nights",
  "nobody",
  "normal",
  "notice",
  "notion",
  "number",
  "object",
  "obtain",
  "office",
  "offset",
  "online",
  "option",
  "orange",
  "origin",
  "output",
  "oxford",
  "packed",
  "palace",
  "parent",
  "partly",
  "patent",
  "patrol",
  "paying",
  "people",
  "period",
  "permit",
  "person",
  "phrase",
  "picked",
  "planet",
  "please",
  "plenty",
  "pocket",
  "police",
  "policy",
  "portal",
  "poster",
  "potato",
  "potter",
  "powder",
  "praise",
  "prayer",
  "prefer",
  "pretty",
  "priest",
  "prince",
  "prison",
  "profit",
  "proper",
  "public",
  "purple",
  "pushed",
  "racial",
  "raised",
  "random",
  "rarely",
  "rather",
  "rating",
  "reader",
  "really",
  "reason",
  "recall",
  "recent",
  "record",
  "reduce",
  "reform",
  "refuse",
  "regard",
  "region",
  "relate",
  "relief",
  "remain",
  "remote",
  "remove",
  "repair",
  "repeat",
  "reply",
  "report",
  "rescue",
  "result",
  "retail",
  "return",
  "reveal",
  "review",
  "reward",
  "riding",
  "rising",
  "robust",
  "rolled",
  "rubber",
  "ruling",
  "safety",
  "salary",
  "sample",
  "saving",
  "saying",
  "scheme",
  "school",
  "screen",
  "search",
  "season",
  "second",
  "secret",
  "sector",
  "secure",
  "seeing",
  "select",
  "senior",
  "series",
  "server",
  "settle",
  "severe",
  "sexual",
  "shadow",
  "shared",
  "shield",
  "should",
  "shower",
  "signal",
  "signed",
  "silent",
  "silver",
  "simple",
  "simply",
  "single",
  "sister",
  "sketch",
  "slight",
  "smooth",
  "social",
  "socket",
  "sodium",
  "source",
  "spirit",
  "spread",
  "spring",
  "square",
  "stable",
  "static",
  "status",
  "steady",
  "stolen",
  "strain",
  "strand",
  "stream",
  "street",
  "stress",
  "strict",
  "strike",
  "string",
  "stroke",
  "strong",
  "struck",
  "studio",
  "stupid",
  "submit",
  "sudden",
  "suffer",
  "summer",
  "sunday",
  "supply",
  "surely",
  "survey",
  "switch",
  "symbol",
  "tackle",
  "talent",
  "target",
  "taught",
  "temple",
  "tenant",
  "tender",
  "tennis",
  "thanks",
  "theory",
  "thirty",
  "though",
  "thread",
  "threat",
  "throne",
  "thrown",
  "ticket",
  "timber",
  "tissue",
  "toward",
  "travel",
  "treaty",
  "trying",
  "tunnel",
  "turned",
  "twelve",
  "twenty",
  "unique",
  "united",
  "unless",
  "update",
  "useful",
  "valley",
  "varied",
  "vector",
  "vendor",
  "versus",
  "victim",
  "viewer",
  "volume",
  "walker",
  "wealth",
  "weapon",
  "weekly",
  "weight",
  "window",
  "winner",
  "winter",
  "wisdom",
  "within",
  "wonder",
  "wooden",
  "worker",
  "worthy",
  "writer",
  "yellow",
]

export async function validateWord(word: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      // Fallback to basic word validation when Supabase is not available
      return FALLBACK_WORDS.includes(word.toLowerCase())
    }

    const { data, error } = await supabase.from("words").select("id").eq("word", word.toLowerCase()).limit(1).single()

    if (error) {
      // If there's an error, fall back to offline validation
      console.warn("Supabase word validation failed, using offline fallback:", error.message)
      return FALLBACK_WORDS.includes(word.toLowerCase())
    }

    return !!data
  } catch (error: any) {
    console.warn("Error validating word, using offline fallback:", error)
    // Fallback to offline validation
    return FALLBACK_WORDS.includes(word.toLowerCase())
  }
}

export async function getWordDefinition(word: string): Promise<string | null> {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return null
    }

    const { data, error } = await supabase.from("words").select("definition").eq("word", word.toLowerCase()).single()

    if (error) {
      console.warn("Error fetching definition:", error.message)
      return null
    }

    return data?.definition || null
  } catch (error: any) {
    console.warn("Error fetching definition:", error)
    return null
  }
}

export async function findValidSubwords(letters: string, minLength = 3): Promise<Word[]> {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return generateFallbackSubwords(letters, minLength)
    }

    // Count the occurrences of each letter
    const letterCounts: Record<string, number> = {}
    for (const char of letters.toLowerCase()) {
      letterCounts[char] = (letterCounts[char] || 0) + 1
    }

    // Query the database for potential subwords
    const { data, error } = await supabase
      .from("words")
      .select("*")
      .gte("length", minLength)
      .lte("length", letters.length)
      .order("length", { ascending: false })
      .order("is_common", { ascending: false })
      .limit(1000)

    if (error) {
      console.warn("Error finding subwords, using fallback:", error.message)
      return generateFallbackSubwords(letters, minLength)
    }

    // Filter to only include valid subwords
    const validSubwords = (data || []).filter((row: Word) => {
      // Check if all letters in the subword are available in the original letters
      const subwordCounts: Record<string, number> = {}
      for (const char of row.word.toLowerCase()) {
        subwordCounts[char] = (subwordCounts[char] || 0) + 1
        if (!letterCounts[char] || subwordCounts[char] > letterCounts[char]) {
          return false
        }
      }
      return true
    })

    return validSubwords
  } catch (error: any) {
    console.warn("Error finding subwords:", error)
    return generateFallbackSubwords(letters, minLength)
  }
}

function generateFallbackSubwords(letters: string, minLength = 3): Word[] {
  const letterCounts: Record<string, number> = {}
  for (const char of letters.toLowerCase()) {
    letterCounts[char] = (letterCounts[char] || 0) + 1
  }

  const validWords = FALLBACK_WORDS.filter((word) => {
    if (word.length < minLength || word.length > letters.length) return false

    const wordCounts: Record<string, number> = {}
    for (const char of word) {
      wordCounts[char] = (wordCounts[char] || 0) + 1
      if (!letterCounts[char] || wordCounts[char] > letterCounts[char]) {
        return false
      }
    }
    return true
  })

  return validWords.map((word) => ({
    id: word,
    word,
    length: word.length,
    is_common: true,
    definition: null,
    created_at: new Date().toISOString(),
  }))
}

export async function findAnagrams(word: string): Promise<Word[]> {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return []
    }

    // Sort the letters to create a canonical form
    const canonicalForm = word.toLowerCase().split("").sort().join("")

    // Query the database for anagrams
    const { data, error } = await supabase
      .from("words")
      .select("*")
      .eq("canonical_form", canonicalForm)
      .neq("word", word.toLowerCase())
      .limit(100)

    if (error) {
      console.warn("Error finding anagrams:", error.message)
      return []
    }

    return data || []
  } catch (error: any) {
    console.warn("Error finding anagrams:", error)
    return []
  }
}

export async function findAllPossibleWords(letters: string, minLength = 3): Promise<Word[]> {
  const subwords = await findValidSubwords(letters, minLength)
  return subwords
}

export async function addWord(word: string, isCommon = false, definition: string | null = null): Promise<Word> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    throw new Error("Supabase client not available. Cannot add words in offline mode.")
  }

  try {
    // Create canonical form for anagram matching
    const canonicalForm = word.toLowerCase().split("").sort().join("")

    const { data, error } = await supabase
      .from("words")
      .upsert({
        word: word.toLowerCase(),
        length: word.length,
        is_common: isCommon,
        definition: definition,
        canonical_form: canonicalForm,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error: any) {
    console.error("Error adding word:", error)
    throw error
  }
}

export async function getWordsByLength(length: number, limit = 100): Promise<Word[]> {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return FALLBACK_WORDS.filter((word) => word.length === length)
        .slice(0, limit)
        .map((word) => ({
          id: word,
          word,
          length: word.length,
          is_common: true,
          definition: null,
          created_at: new Date().toISOString(),
        }))
    }

    const { data, error } = await supabase
      .from("words")
      .select("*")
      .eq("length", length)
      .order("is_common", { ascending: false })
      .limit(limit)

    if (error) {
      console.warn("Error fetching words by length:", error.message)
      return FALLBACK_WORDS.filter((word) => word.length === length)
        .slice(0, limit)
        .map((word) => ({
          id: word,
          word,
          length: word.length,
          is_common: true,
          definition: null,
          created_at: new Date().toISOString(),
        }))
    }

    return data || []
  } catch (error: any) {
    console.warn("Error fetching words by length:", error)
    return FALLBACK_WORDS.filter((word) => word.length === length)
      .slice(0, limit)
      .map((word) => ({
        id: word,
        word,
        length: word.length,
        is_common: true,
        definition: null,
        created_at: new Date().toISOString(),
      }))
  }
}

export async function getCommonWordsByLength(length: number, limit = 20): Promise<Word[]> {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return FALLBACK_WORDS.filter((word) => word.length === length)
        .slice(0, limit)
        .map((word) => ({
          id: word,
          word,
          length: word.length,
          is_common: true,
          definition: null,
          created_at: new Date().toISOString(),
        }))
    }

    const { data, error } = await supabase
      .from("words")
      .select("*")
      .eq("length", length)
      .eq("is_common", true)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.warn("Error fetching common words by length:", error.message)
      return FALLBACK_WORDS.filter((word) => word.length === length)
        .slice(0, limit)
        .map((word) => ({
          id: word,
          word,
          length: word.length,
          is_common: true,
          definition: null,
          created_at: new Date().toISOString(),
        }))
    }

    return data || []
  } catch (error: any) {
    console.warn("Error fetching common words by length:", error)
    return FALLBACK_WORDS.filter((word) => word.length === length)
      .slice(0, limit)
      .map((word) => ({
        id: word,
        word,
        length: word.length,
        is_common: true,
        definition: null,
        created_at: new Date().toISOString(),
      }))
  }
}
