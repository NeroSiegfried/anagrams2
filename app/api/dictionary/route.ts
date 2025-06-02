import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const word = searchParams.get("word")?.toLowerCase()

  if (!word) {
    return NextResponse.json({ error: "Word parameter is required" }, { status: 400 })
  }

  try {
    // In a real implementation, this would use a dictionary API
    // For demo purposes, we'll generate mock definitions

    const mockDefinitions = {
      apple: {
        word: "apple",
        phonetic: "/ˈæp.əl/",
        meanings: [
          {
            partOfSpeech: "noun",
            definitions: [
              {
                definition:
                  "The round fruit of a tree of the rose family, which typically has thin red or green skin and crisp flesh.",
                example: "She bit into the juicy apple.",
              },
            ],
          },
        ],
      },
      banana: {
        word: "banana",
        phonetic: "/bəˈnɑː.nə/",
        meanings: [
          {
            partOfSpeech: "noun",
            definitions: [
              {
                definition: "A long curved fruit with a yellow skin and soft sweet flesh.",
                example: "He peeled the banana before eating it.",
              },
            ],
          },
        ],
      },
      game: {
        word: "game",
        phonetic: "/ɡeɪm/",
        meanings: [
          {
            partOfSpeech: "noun",
            definitions: [
              {
                definition: "An activity that one engages in for amusement or fun.",
                example: "The children were playing a game in the garden.",
              },
              {
                definition:
                  "A competitive activity involving skill, chance, or endurance on the part of two or more persons who play according to a set of rules.",
                example: "We played a game of chess.",
              },
            ],
          },
          {
            partOfSpeech: "adjective",
            definitions: [
              {
                definition: "Eager or willing to do something new or challenging.",
                example: "I'm game for whatever you want to do tonight.",
              },
            ],
          },
        ],
      },
      anagram: {
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
      },
    }

    // Check if we have a mock definition for this word
    if (mockDefinitions[word as keyof typeof mockDefinitions]) {
      return NextResponse.json(mockDefinitions[word as keyof typeof mockDefinitions])
    }

    // Generate a generic definition for words not in our mock list
    const genericDefinition = {
      word: word,
      phonetic: `/${word}/`,
      meanings: [
        {
          partOfSpeech: Math.random() > 0.5 ? "noun" : "verb",
          definitions: [
            {
              definition: `A ${word} is a common English word.`,
              example: `The ${word} was used in a sentence.`,
            },
          ],
        },
      ],
    }

    return NextResponse.json(genericDefinition)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch definition" }, { status: 500 })
  }
}
