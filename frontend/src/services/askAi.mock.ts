export type AskAiMessage = { id: string; role: 'assistant' | 'user'; content: string }

export const askAiSuggestions = ['Why is Aether One recommended?', 'Explain my AI DNA', 'What does Match Score mean?', 'Why did Sentinel lose?']

/** Replace this function with the future AI API client without changing the chat UI. */
export async function getMockAskAiResponse(question: string): Promise<string> {
  const normalized = question.toLowerCase()
  if (normalized.includes('dna') || normalized.includes('accuracy') || normalized.includes('privacy')) return 'Your current AI DNA prioritizes Accuracy (35%) and Privacy (22%), followed by Speed, Ease of Use, and Cost. That makes dependable, privacy-aware reasoning especially valuable for this mission.'
  if (normalized.includes('match') || normalized.includes('score')) return 'Match Score reflects how closely a contender fits the priorities in your AI DNA. Aether One leads this mock Arena run with a 96 Match Score because its strengths align well across all five dimensions.'
  if (normalized.includes('sentinel') || normalized.includes('alternative') || normalized.includes('lose')) return 'Sentinel is excellent on Privacy, but Aether One provides a stronger overall balance of Accuracy, Privacy, Speed, Cost, and Ease of Use for this profile.'
  if (normalized.includes('arena') || normalized.includes('battle')) return 'In the Arena, contenders are compared against your five AI DNA dimensions. The leaderboard highlights fit, while Live Battle lets you compare two responses to the same prompt.'
  return 'Aether One is recommended for you in this mock run because it balances high Accuracy and Privacy with practical Speed, Cost, and Ease of Use. Ask me about your AI DNA, scores, the Arena, or runner-ups.'
}
