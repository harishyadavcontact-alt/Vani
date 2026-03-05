const URL_PATTERN = /https?:\/\/\S+|www\.\S+/gi
const MENTION_PATTERN = /(^|\s)@([a-z0-9_]+)/gi
const HASHTAG_PATTERN = /(^|\s)#([\p{L}\p{N}_]+)/giu
const EMOJI_PATTERN = /[\p{Extended_Pictographic}\uFE0F]/gu

const MAX_CHUNK_LENGTH = 220

function replaceUrls(text: string) {
  return text.replace(URL_PATTERN, 'link available')
}

function formatMentionsAndHashtags(text: string) {
  const mentionsReadable = text.replace(MENTION_PATTERN, (_, prefix: string, handle: string) => `${prefix}at ${handle}`)
  return mentionsReadable.replace(HASHTAG_PATTERN, (_, prefix: string, tag: string) => `${prefix}hashtag ${tag.replace(/_/g, ' ')}`)
}

function simplifyDisruptiveEmoji(text: string) {
  const matches = text.match(EMOJI_PATTERN)
  if (!matches || matches.length < 4) return text

  const emojiDensity = matches.length / Math.max(text.length, 1)
  if (emojiDensity < 0.18) return text

  return text.replace(EMOJI_PATTERN, '').replace(/\s{2,}/g, ' ').trim() + ' [emoji]'
}

function sentenceSplit(text: string) {
  const cleanText = text.replace(/\s+/g, ' ').trim()
  if (!cleanText) return []

  return cleanText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9@#])/)
    .flatMap((sentence) => {
      if (sentence.length <= MAX_CHUNK_LENGTH) return [sentence]

      const words = sentence.split(' ')
      const chunks: string[] = []
      let current = ''
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word
        if (candidate.length > MAX_CHUNK_LENGTH && current) {
          chunks.push(current)
          current = word
        } else {
          current = candidate
        }
      }
      if (current) chunks.push(current)
      return chunks
    })
}

export function narrationChunks(text: string) {
  const withReadableLinks = replaceUrls(text)
  const withReadableTags = formatMentionsAndHashtags(withReadableLinks)
  const withEmojiHandled = simplifyDisruptiveEmoji(withReadableTags)
  return sentenceSplit(withEmojiHandled)
}
