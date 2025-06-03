import { addWord } from "@/lib/word-service"

// Common words for the game
const commonWords = [
  "apple",
  "banana",
  "cherry",
  "date",
  "elder",
  "fig",
  "grape",
  "honey",
  "ice",
  "jam",
  "kiwi",
  "lemon",
  "mango",
  "nut",
  "orange",
  "pear",
  "quince",
  "raspberry",
  "strawberry",
  "tangerine",
  "vanilla",
  "watermelon",
  "cat",
  "dog",
  "rat",
  "bat",
  "hat",
  "mat",
  "sat",
  "fat",
  "pat",
  "run",
  "sun",
  "fun",
  "gun",
  "bun",
  "pun",
  "nun",
  "dun",
  "red",
  "bed",
  "fed",
  "led",
  "wed",
  "ned",
  "ted",
  "med",
  "big",
  "dig",
  "fig",
  "jig",
  "pig",
  "rig",
  "wig",
  "zig",
  "box",
  "fox",
  "lox",
  "pox",
  "cox",
  "dox",
  "rox",
  "sox",
  "cup",
  "pup",
  "sup",
  "tup",
  "yup",
  "zup",
  "car",
  "bar",
  "far",
  "jar",
  "mar",
  "par",
  "tar",
  "war",
  "ace",
  "ice",
  "die",
  "lie",
  "pie",
  "tie",
  "vie",
  "ago",
  "ego",
  "duo",
  "arm",
  "aim",
  "dim",
  "him",
  "rim",
  "sim",
  "tim",
  "vim",
  "and",
  "end",
  "bid",
  "did",
  "hid",
  "kid",
  "lid",
  "mid",
  "rid",
  "doe",
  "foe",
  "hoe",
  "joe",
  "roe",
  "toe",
  "woe",
  "bog",
  "cog",
  "dog",
  "fog",
  "hog",
  "jog",
  "log",
  "nog",
  "ash",
  "bay",
  "cay",
  "day",
  "hay",
  "jay",
  "lay",
  "may",
  "nay",
  "pay",
  "ray",
  "say",
  "way",
  "eat",
  "bat",
  "cat",
  "fat",
  "hat",
  "mat",
  "nat",
  "pat",
  "rat",
  "sat",
  "tat",
  "vat",
  "bee",
  "fee",
  "gee",
  "lee",
  "see",
  "tee",
  "wee",
  "zee",
  "beg",
  "keg",
  "leg",
  "meg",
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
  "hew",
  "jew",
  "mew",
  "new",
  "pew",
  "sew",
  "bye",
  "dye",
  "eye",
  "lye",
  "rye",
]

// Game-specific words with definitions
const gameWords = [
  {
    word: "anagram",
    definition: JSON.stringify({
      word: "anagram",
      phonetic: "/ˈæn.ə.ɡræm/",
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            {
              definition:
                "A word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
              example: "The word 'listen' is an anagram of 'silent'.",
            },
          ],
        },
      ],
    }),
  },
  {
    word: "puzzle",
    definition: JSON.stringify({
      word: "puzzle",
      phonetic: "/ˈpʌz.əl/",
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            {
              definition: "A game, toy, or problem designed to test ingenuity or knowledge.",
              example: "She enjoys solving crossword puzzles.",
            },
          ],
        },
        {
          partOfSpeech: "verb",
          definitions: [
            {
              definition: "To cause someone to feel confused because they cannot understand something.",
              example: "The strange behavior puzzled everyone.",
            },
          ],
        },
      ],
    }),
  },
  {
    word: "gaming",
    definition: JSON.stringify({
      word: "gaming",
      phonetic: "/ˈɡeɪ.mɪŋ/",
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            {
              definition: "The action or practice of playing video games.",
              example: "Online gaming has become increasingly popular.",
            },
          ],
        },
      ],
    }),
  },
  {
    word: "letter",
    definition: JSON.stringify({
      word: "letter",
      phonetic: "/ˈlet.ər/",
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            {
              definition:
                "A character representing one or more of the sounds used in speech; any of the symbols of an alphabet.",
              example: "The English alphabet has 26 letters.",
            },
            {
              definition: "A written, typed, or printed communication, sent in an envelope by post or messenger.",
              example: "She received a letter from her friend abroad.",
            },
          ],
        },
      ],
    }),
  },
  {
    word: "player",
    definition: JSON.stringify({
      word: "player",
      phonetic: "/ˈpleɪ.ər/",
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            {
              definition: "A person who plays a game or sport.",
              example: "He's a professional basketball player.",
            },
            {
              definition: "A person who plays a musical instrument.",
              example: "She's a talented piano player.",
            },
          ],
        },
      ],
    }),
  },
  {
    word: "points",
    definition: JSON.stringify({
      word: "points",
      phonetic: "/pɔɪnts/",
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            {
              definition: "The plural of point; units of scoring in a game or competition.",
              example: "The team scored 10 points in the final quarter.",
            },
          ],
        },
      ],
    }),
  },
  {
    word: "winner",
    definition: JSON.stringify({
      word: "winner",
      phonetic: "/ˈwɪn.ər/",
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            {
              definition: "A person or thing that wins something.",
              example: "She was the winner of the competition.",
            },
          ],
        },
      ],
    }),
  },
  {
    word: "master",
    definition: JSON.stringify({
      word: "master",
      phonetic: "/ˈmæs.tər/",
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            {
              definition: "A skilled practitioner of a particular art or activity.",
              example: "He is a master of disguise.",
            },
          ],
        },
        {
          partOfSpeech: "verb",
          definitions: [
            {
              definition: "To acquire complete knowledge or skill in an accomplishment, technique, or art.",
              example: "She mastered the art of cooking.",
            },
          ],
        },
      ],
    }),
  },
  {
    word: "genius",
    definition: JSON.stringify({
      word: "genius",
      phonetic: "/ˈdʒiː.ni.əs/",
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            {
              definition: "Exceptional intellectual or creative power or other natural ability.",
              example: "She has a genius for organization.",
            },
            {
              definition:
                "A person who is exceptionally intelligent or creative, either generally or in some particular respect.",
              example: "Einstein was a mathematical genius.",
            },
          ],
        },
      ],
    }),
  },
  {
    word: "wordle",
    definition: JSON.stringify({
      word: "wordle",
      phonetic: "/ˈwɜːr.dəl/",
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [
            {
              definition: "A web-based word game where players have six attempts to guess a five-letter word.",
              example: "I play Wordle every morning with my coffee.",
            },
          ],
        },
      ],
    }),
  },
]

export async function seedWords() {
  console.log("Seeding common words...")

  // Add common words
  for (const word of commonWords) {
    await addWord(word, true)
  }

  console.log("Seeding game-specific words with definitions...")

  // Add game-specific words with definitions
  for (const { word, definition } of gameWords) {
    await addWord(word, true, definition)
  }

  console.log("Word seeding complete!")
}
