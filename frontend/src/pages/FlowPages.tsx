import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Brand } from '../components/Navigation'

type QuestQuestion = { id: string; prompt: string; hint: string; options: { label: string; value: string; description: string }[] }
type DNAProfile = { accuracy: number; speed: number; cost: number; privacy: number; easeOfUse: number }
type AIModel = { id: string; name: string; provider: string; description?: string; taskTypes?: string[]; accuracy: number; speed: number; cost: number; privacy: number; easeOfUse: number; hardware?: string; license?: string; benchmarkSource?: string }
type TrustBreakdown = { accuracy: number; speed: number; cost: number; privacy: number; easeOfUse: number; evidence: number }
type TrustScoreResponse = { modelId: string; overallTrustScore: number; breakdown: TrustBreakdown }
type WhyNotReason = { modelId: string; reason: string }
type ResultState = { profile?: unknown; winner?: unknown; runnerUps?: unknown; matchScore?: unknown }
type SavedResult = { id: string; userId: string; winner: AIModel; runnerUps: AIModel[]; trustScore: TrustScoreResponse; profile: DNAProfile; explanation: string; whyNotReasons?: WhyNotReason[]; createdAt: string }
type HistoryEntry = { id: string; questId: string; winner: string; provider: string; trustScore: number; matchScore: number; profile: DNAProfile; createdAt: string; status: 'Saved' | 'Completed' }
type PassportPageState = { matchScore?: number; ranking?: number; bestUseCases?: string[] }

const mockPassportResult: SavedResult = {
  id: 'demo-aether-one',
  userId: 'demo-user',
  winner: { id: 'aether-one', name: 'Aether One', provider: 'AI Arena Labs', description: 'Reasoning model for complex tasks', accuracy: 94, speed: 82, cost: 74, privacy: 91, easeOfUse: 88, license: 'Demo evaluation license' },
  runnerUps: [
    { id: 'velocity', name: 'Velocity', provider: 'AI Arena Labs', accuracy: 86, speed: 97, cost: 81, privacy: 76, easeOfUse: 84 },
    { id: 'sentinel', name: 'Sentinel', provider: 'AI Arena Labs', accuracy: 88, speed: 76, cost: 78, privacy: 98, easeOfUse: 79 },
  ],
  trustScore: { modelId: 'aether-one', overallTrustScore: 94, breakdown: { accuracy: 96, speed: 84, cost: 79, privacy: 93, easeOfUse: 89, evidence: 95 } },
  profile: { accuracy: 0.35, speed: 0.16, cost: 0.12, privacy: 0.22, easeOfUse: 0.15 },
  explanation: 'Aether One is the strongest fit for this profile because it pairs high reasoning accuracy with strong privacy support, matching the priorities expressed in the AI DNA.',
  whyNotReasons: [
    { modelId: 'velocity', reason: 'Velocity delivered faster responses, but its lower accuracy and privacy alignment made it a weaker fit for this mission.' },
    { modelId: 'sentinel', reason: 'Sentinel led on privacy, but Aether One achieved a more balanced match across the full set of priorities.' },
  ],
  createdAt: '2026-08-22T10:30:00.000Z',
}

// Mirrors the eventual GET /api/quest/history and GET /api/results data shown together.
const mockHistoryEntries: HistoryEntry[] = [
  { id: 'demo-aether-one', questId: 'quest-018', winner: 'Aether One', provider: 'AI Arena Labs', trustScore: 94, matchScore: 96, profile: { accuracy: 0.35, speed: 0.16, cost: 0.12, privacy: 0.22, easeOfUse: 0.15 }, createdAt: '2026-08-22T10:30:00.000Z', status: 'Saved' },
  { id: 'demo-sentinel', questId: 'quest-017', winner: 'Sentinel', provider: 'AI Arena Labs', trustScore: 91, matchScore: 93, profile: { accuracy: 0.23, speed: 0.13, cost: 0.14, privacy: 0.36, easeOfUse: 0.14 }, createdAt: '2026-08-21T16:10:00.000Z', status: 'Completed' },
  { id: 'demo-velocity', questId: 'quest-016', winner: 'Velocity', provider: 'AI Arena Labs', trustScore: 88, matchScore: 92, profile: { accuracy: 0.18, speed: 0.37, cost: 0.19, privacy: 0.12, easeOfUse: 0.14 }, createdAt: '2026-08-20T09:45:00.000Z', status: 'Saved' },
  { id: 'demo-mosaic', questId: 'quest-015', winner: 'Mosaic', provider: 'AI Arena Labs', trustScore: 86, matchScore: 89, profile: { accuracy: 0.2, speed: 0.16, cost: 0.18, privacy: 0.15, easeOfUse: 0.31 }, createdAt: '2026-08-19T13:20:00.000Z', status: 'Completed' },
]

type ArenaContender = AIModel & { rank: number; matchScore: number; response: string; latency: string }

const mockArenaProfile: DNAProfile = { accuracy: 0.35, speed: 0.16, cost: 0.12, privacy: 0.22, easeOfUse: 0.15 }
const mockArenaContenders: ArenaContender[] = [
  { id: 'aether-one', name: 'Aether One', provider: 'AI Arena Labs', description: 'High-confidence reasoning', accuracy: 94, speed: 82, cost: 74, privacy: 91, easeOfUse: 88, rank: 1, matchScore: 96, latency: '1.24s', response: 'I would start by mapping the problem into verifiable milestones, then use the evidence from each step to produce a clear, confidence-ranked recommendation.' },
  { id: 'sentinel', name: 'Sentinel', provider: 'AI Arena Labs', description: 'Privacy-first analysis', accuracy: 88, speed: 76, cost: 78, privacy: 98, easeOfUse: 79, rank: 2, matchScore: 93, latency: '1.48s', response: 'I would keep the analysis scoped to the supplied context, identify the important signals, and present a privacy-conscious path forward.' },
  { id: 'velocity', name: 'Velocity', provider: 'AI Arena Labs', description: 'Low-latency generation', accuracy: 86, speed: 97, cost: 81, privacy: 76, easeOfUse: 84, rank: 3, matchScore: 90, latency: '0.82s', response: 'I would give you a concise first-pass plan immediately, then iterate with deeper detail where it has the most impact.' },
]

const dnaDimensions = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'speed', label: 'Speed' },
  { key: 'cost', label: 'Cost' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'easeOfUse', label: 'Ease of use' },
] as const

const questApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function isDNAProfile(value: unknown): value is DNAProfile {
  if (!value || typeof value !== 'object') return false
  return dnaDimensions.every(({ key }) => typeof (value as Record<string, unknown>)[key] === 'number')
}

function isAIModel(value: unknown): value is AIModel {
  if (!value || typeof value !== 'object') return false
  const model = value as Record<string, unknown>
  return typeof model.id === 'string' && typeof model.name === 'string' && typeof model.provider === 'string' && dnaDimensions.every(({ key }) => typeof model[key] === 'number')
}

function isTrustScore(value: unknown): value is TrustScoreResponse {
  if (!value || typeof value !== 'object') return false
  const trustScore = value as Record<string, unknown>
  const breakdown = trustScore.breakdown as Record<string, unknown> | undefined
  return typeof trustScore.modelId === 'string' && typeof trustScore.overallTrustScore === 'number' && Boolean(breakdown) && [...dnaDimensions.map(({ key }) => key), 'evidence'].every((key) => typeof breakdown?.[key] === 'number')
}

function isSavedResult(value: unknown): value is SavedResult {
  if (!value || typeof value !== 'object') return false
  const result = value as Record<string, unknown>
  return typeof result.id === 'string' && typeof result.userId === 'string' && isAIModel(result.winner) && Array.isArray(result.runnerUps) && result.runnerUps.every(isAIModel) && isTrustScore(result.trustScore) && isDNAProfile(result.profile) && typeof result.explanation === 'string' && typeof result.createdAt === 'string'
}

// Confirm these IDs and answer values with the backend scoring contract before production use.
const questQuestions: QuestQuestion[] = [
  { id: 'q1', prompt: 'What should your AI optimize for first?', hint: 'Choose the signal that matters most to this mission.', options: [{ label: 'Accuracy', value: 'accuracy', description: 'Dependable answers for high-stakes work.' }, { label: 'Speed', value: 'speed', description: 'Fast responses for real-time experiences.' }, { label: 'Cost', value: 'cost', description: 'More capability for every budget.' }] },
  { id: 'q2', prompt: 'How quickly does the answer need to arrive?', hint: 'Set the pace your product needs to maintain.', options: [{ label: 'Instant', value: 'realtime', description: 'Every millisecond makes a difference.' }, { label: 'Balanced', value: 'balanced', description: 'A measured blend of depth and pace.' }, { label: 'Deep work', value: 'deliberate', description: 'Quality matters more than urgency.' }] },
  { id: 'q3', prompt: 'How should the model treat your budget?', hint: 'This helps balance power with operational cost.', options: [{ label: 'Lean by default', value: 'lean', description: 'Optimize for efficient everyday use.' }, { label: 'Best balance', value: 'balanced', description: 'Spend where the impact is clear.' }, { label: 'Performance first', value: 'premium', description: 'Prioritize capability over cost.' }] },
  { id: 'q4', prompt: 'What level of privacy does your mission demand?', hint: 'Choose the protection boundary that fits your data.', options: [{ label: 'Standard', value: 'standard', description: 'Suitable for general product workloads.' }, { label: 'Sensitive', value: 'sensitive', description: 'Extra care around user and business data.' }, { label: 'Private by design', value: 'private', description: 'Privacy is a non-negotiable requirement.' }] },
  { id: 'q5', prompt: 'Who needs to use this AI every day?', hint: 'The right model should fit the people behind the work.', options: [{ label: 'Developers', value: 'developers', description: 'Control, flexibility, and technical depth.' }, { label: 'A product team', value: 'teams', description: 'A clear fit for cross-functional builders.' }, { label: 'Everyone', value: 'everyone', description: 'Simple enough for broad adoption.' }] },
]

export function QuestPage() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const question = questQuestions[currentIndex]
  const selectedAnswer = answers[question.id]
  const isFinalQuestion = currentIndex === questQuestions.length - 1

  const continueQuest = async () => {
    if (!selectedAnswer) return
    if (!isFinalQuestion) { setCurrentIndex((index) => index + 1); return }
    setIsSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${questApiBaseUrl}/api/quest/submit`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: questQuestions.map(({ id }) => ({ questionId: id, answer: answers[id] })) }) })
      const payload = await response.json().catch(() => ({})) as { profile?: DNAProfile; error?: string; message?: string }
      if (!response.ok || !payload.profile) throw new Error(payload.error || payload.message || 'We could not shape your AI DNA. Please try again.')
      navigate('/dna', { state: { profile: payload.profile } })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'We could not shape your AI DNA. Please try again.')
    } finally { setIsSubmitting(false) }
  }

  return <section className="quest-page page-container"><div className="quest-topline"><Link to="/" className="quest-exit">← Exit quest</Link><span>AI ARENA / PERSONALIZATION PROTOCOL</span></div><div className="quest-panel"><div className="quest-progress"><div><span>QUEST {String(currentIndex + 1).padStart(2, '0')} / {String(questQuestions.length).padStart(2, '0')}</span><span>{Math.round(((currentIndex + 1) / questQuestions.length) * 100)}% complete</span></div><div className="quest-progress__track" role="progressbar" aria-label="Quest progress" aria-valuemin={0} aria-valuemax={questQuestions.length} aria-valuenow={currentIndex + 1}><span style={{ width: `${((currentIndex + 1) / questQuestions.length) * 100}%` }} /></div></div><p className="eyebrow"><i /> Your mission, decoded</p><h1>{question.prompt}</h1><p className="quest-hint">{question.hint}</p><div className="quest-options" role="radiogroup" aria-label={question.prompt}>{question.options.map((option) => <button type="button" role="radio" aria-checked={selectedAnswer === option.value} onClick={() => { setAnswers((current) => ({ ...current, [question.id]: option.value })); setError('') }} className={selectedAnswer === option.value ? 'is-selected' : ''} key={option.value}><span className="quest-option__indicator" /><span><b>{option.label}</b><small>{option.description}</small></span><span className="quest-option__arrow">→</span></button>)}</div>{error && <p className="quest-error" role="alert">{error}</p>}<div className="quest-actions"><button className="quest-back" type="button" disabled={currentIndex === 0 || isSubmitting} onClick={() => { setCurrentIndex((index) => index - 1); setError('') }}>Back</button><button className="button" type="button" disabled={!selectedAnswer || isSubmitting} onClick={continueQuest}>{isSubmitting ? 'Shaping your AI DNA…' : isFinalQuestion ? 'Shape my AI DNA' : 'Continue'} <span>→</span></button></div></div></section>
}

export function DnaProfilePage() {
  const location = useLocation()
  const profile = isDNAProfile((location.state as { profile?: unknown } | null)?.profile) ? (location.state as { profile: DNAProfile }).profile : null

  if (!profile) return <section className="placeholder page-container"><p className="eyebrow">Step 02 / AI DNA</p><h1>Give your priorities a signal.</h1><p>Complete your AI Quest first to generate a profile from your answers.</p><Link className="button" to="/quest">Start AI Quest <span>→</span></Link></section>

  const rankedDimensions = dnaDimensions.map((dimension) => ({ ...dimension, value: profile[dimension.key] })).sort((a, b) => b.value - a.value)
  const [primary, secondary] = rankedDimensions
  const points = dnaDimensions.map((dimension, index) => {
    const angle = (Math.PI * 2 * index) / dnaDimensions.length - Math.PI / 2
    const radius = 84 * profile[dimension.key]
    return `${120 + Math.cos(angle) * radius},${120 + Math.sin(angle) * radius}`
  }).join(' ')
  const guidePoints = dnaDimensions.map((_, index) => {
    const angle = (Math.PI * 2 * index) / dnaDimensions.length - Math.PI / 2
    return `${120 + Math.cos(angle) * 84},${120 + Math.sin(angle) * 84}`
  }).join(' ')

  return <section className="dna-page page-container"><div className="dna-topline"><span>QUEST COMPLETE</span><span>YOUR PERSONAL AI DNA</span></div><div className="dna-grid"><div className="dna-copy"><p className="eyebrow"><i /> Step 02 / AI DNA</p><h1>Give your priorities<br />a <em>signal.</em></h1><p>Your profile is shaped by the choices you made in your Quest—not by a generic preset.</p><div className="dna-summary"><span>YOUR SIGNAL</span><strong>You&apos;re optimizing for {primary.label.toLowerCase()} and {secondary.label.toLowerCase()} first.</strong></div><Link className="button" to="/arena" state={{ profile }}>Open the arena <span>→</span></Link></div><div className="dna-visual"><div className="dna-radar"><svg viewBox="0 0 240 240" role="img" aria-label="AI DNA radar chart"><polygon className="dna-radar__guide" points={guidePoints} /><polygon className="dna-radar__shape" points={points} />{dnaDimensions.map((dimension, index) => { const angle = (Math.PI * 2 * index) / dnaDimensions.length - Math.PI / 2; return <g key={dimension.key}><line x1="120" y1="120" x2={120 + Math.cos(angle) * 84} y2={120 + Math.sin(angle) * 84} /><text x={120 + Math.cos(angle) * 109} y={120 + Math.sin(angle) * 109} textAnchor="middle" dominantBaseline="middle">{dimension.label}</text></g> })}</svg><div className="dna-radar__center"><strong>AI</strong><span>DNA</span></div></div><div className="dna-caption">BACKEND-GENERATED PROFILE</div></div></div><div className="dna-bars">{dnaDimensions.map((dimension) => { const percent = Math.round(profile[dimension.key] * 100); return <div className="dna-bar" key={dimension.key}><div><strong>{dimension.label}</strong><span>{percent}%</span></div><div className="dna-bar__track"><span style={{ width: `${percent}%` }} /></div></div> })}</div></section>
}
export function ArenaPage() {
  const location = useLocation()
  const profile = isDNAProfile((location.state as { profile?: unknown } | null)?.profile) ? (location.state as { profile: DNAProfile }).profile : mockArenaProfile
  const [selectedIds, setSelectedIds] = useState<string[]>(['aether-one', 'sentinel'])
  const [battlePrompt, setBattlePrompt] = useState('Design a reliable AI assistant for a privacy-sensitive product team.')
  const [hasRunBattle, setHasRunBattle] = useState(true)
  const selectedContenders = mockArenaContenders.filter((contender) => selectedIds.includes(contender.id))
  const winner = mockArenaContenders[0]

  const toggleContender = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((currentId) => currentId !== id) : current.length === 2 ? [current[1], id] : [...current, id])

  return <section className="arena-page page-container"><div className="arena-topline"><span>AI DNA LOCKED</span><span>03 / 05 · LIVE COMPETITION</span></div><div className="arena-heading"><div><p className="eyebrow"><i /> Step 03 / Arena</p><h1>Let the contenders<br /><em>compete.</em></h1></div><p>Your AI DNA sets the arena. These fixed demo results show how the contenders match the priorities you chose.</p></div><section className="arena-dna"><div><span>YOUR AI DNA</span><strong>Priorities in play</strong></div><div className="arena-dna__bars">{dnaDimensions.map((dimension) => <div key={dimension.key}><div><span>{dimension.label}</span><b>{Math.round(profile[dimension.key] * 100)}%</b></div><i><em style={{ width: `${Math.round(profile[dimension.key] * 100)}%` }} /></i></div>)}</div></section><section className="arena-leaderboard"><div className="arena-section-heading"><div><p className="eyebrow">Live leaderboard</p><h2>Ranked for your mission.</h2></div><span>{mockArenaContenders.length} CONTENDERS</span></div><div className="arena-contenders">{mockArenaContenders.map((contender) => <article className={`arena-contender ${contender.rank === 1 ? 'is-winner' : ''} ${selectedIds.includes(contender.id) ? 'is-selected' : ''}`} key={contender.id}><div className="arena-contender__rank"><span>RANK</span><strong>#{contender.rank}</strong></div><div className="arena-contender__model"><span>{contender.name.charAt(0)}</span><div><h3>{contender.name}</h3><p>{contender.provider} · {contender.description}</p></div></div><div className="arena-contender__score"><span>MATCH SCORE</span><strong>{contender.matchScore}</strong></div><div className="arena-contender__metrics">{dnaDimensions.map((dimension) => <div key={dimension.key}><span>{dimension.label}</span><b>{contender[dimension.key]}</b></div>)}</div><button type="button" className="arena-contender__select" aria-pressed={selectedIds.includes(contender.id)} onClick={() => toggleContender(contender.id)}>{selectedIds.includes(contender.id) ? 'In battle' : 'Select'}</button></article>)}</div></section><section className="winner-reveal"><div className="winner-reveal__badge">RECOMMENDED FOR YOU</div><div><span>{winner.name.charAt(0)}</span><h2>{winner.name}</h2><p>{winner.provider}</p></div><strong>{winner.matchScore}<small>MATCH SCORE</small></strong><p>Its fixed demo strengths—Accuracy {winner.accuracy}, Speed {winner.speed}, Cost {winner.cost}, Privacy {winner.privacy}, and Ease of Use {winner.easeOfUse}—make it the recommended fit for this AI DNA.</p></section><section className="live-battle"><div className="live-battle__intro"><p className="eyebrow"><i /> Live Battle</p><h2>One prompt.<br />Two perspectives.</h2><p>Choose two contenders and compare their mock responses side by side.</p></div><div className="live-battle__workbench"><label htmlFor="battle-prompt">Battle prompt</label><textarea id="battle-prompt" value={battlePrompt} onChange={(event) => { setBattlePrompt(event.target.value); setHasRunBattle(false) }} /><div><span>{selectedIds.length} / 2 contenders selected</span><button className="button" type="button" disabled={selectedIds.length !== 2 || !battlePrompt.trim()} onClick={() => setHasRunBattle(true)}>Run Live Battle <span>→</span></button></div></div>{hasRunBattle && selectedContenders.length === 2 && <div className="battle-response-grid">{selectedContenders.map((contender) => <article key={contender.id}><div><span>{contender.name.charAt(0)}</span><strong>{contender.name}</strong><small>● LIVE · {contender.latency}</small></div><p>{contender.response}</p></article>)}</div>}</section><div className="arena-actions"><span>Ready to inspect the winning evidence?</span><Link className="button" to="/result" state={{ profile, winner, runnerUps: mockArenaContenders.slice(1), matchScore: winner.matchScore }}>View Result <span>→</span></Link><Link className="arena-passport-link" to="/passport">View Model Passport</Link></div></section>
}
export function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as ResultState
  const usesMockResult = !questApiBaseUrl
  const profile = isDNAProfile(state.profile) ? state.profile : usesMockResult ? mockArenaProfile : null
  const winner = isAIModel(state.winner) ? state.winner : usesMockResult ? mockArenaContenders[0] : null
  const runnerUps = Array.isArray(state.runnerUps) && state.runnerUps.every(isAIModel) ? state.runnerUps : usesMockResult ? mockArenaContenders.slice(1) : null
  const matchScore = typeof state.matchScore === 'number' ? state.matchScore : usesMockResult ? mockArenaContenders[0].matchScore : null
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [trustScore, setTrustScore] = useState<TrustScoreResponse | null>(null)
  const [explanation, setExplanation] = useState('')
  const [whyNotReasons, setWhyNotReasons] = useState<WhyNotReason[]>([])
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (usesMockResult || !profile || !winner || !runnerUps) return
    const controller = new AbortController()
    const loadResult = async () => {
      setStatus('loading')
      setError('')
      try {
        const [trustResponse, explainResponse, whyNotResponse] = await Promise.all([
          fetch(`${questApiBaseUrl}/api/result/trust-score`, { method: 'POST', credentials: 'include', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelId: winner.id }) }),
          fetch(`${questApiBaseUrl}/api/result/explain`, { method: 'POST', credentials: 'include', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile, winner, runnerUp: runnerUps[0] }) }),
          fetch(`${questApiBaseUrl}/api/result/why-not`, { method: 'POST', credentials: 'include', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile, winner, others: runnerUps }) }),
        ])
        const trustPayload = await trustResponse.json().catch(() => ({})) as { modelId?: string; overallTrustScore?: number; breakdown?: TrustBreakdown; error?: string; message?: string }
        const explainPayload = await explainResponse.json().catch(() => ({})) as { explanation?: string; error?: string; message?: string }
        const whyNotPayload = await whyNotResponse.json().catch(() => ({})) as { reasons?: WhyNotReason[]; error?: string; message?: string }
        if (!trustResponse.ok) throw new Error(trustPayload.error || trustPayload.message || 'We could not calculate the Trust Score.')
        if (!explainResponse.ok) throw new Error(explainPayload.error || explainPayload.message || 'We could not explain this result.')
        if (!whyNotResponse.ok) throw new Error(whyNotPayload.error || whyNotPayload.message || 'We could not load runner-up reasons.')
        if (typeof trustPayload.modelId !== 'string' || typeof trustPayload.overallTrustScore !== 'number' || !trustPayload.breakdown || typeof explainPayload.explanation !== 'string' || !Array.isArray(whyNotPayload.reasons)) throw new Error('The result service returned an unexpected response.')
        setTrustScore({ modelId: trustPayload.modelId, overallTrustScore: trustPayload.overallTrustScore, breakdown: trustPayload.breakdown })
        setExplanation(explainPayload.explanation)
        setWhyNotReasons(whyNotPayload.reasons)
        setStatus('success')
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return
        setError(caughtError instanceof Error ? caughtError.message : 'We could not load this result.')
        setStatus('error')
      }
    }
    void loadResult()
    return () => controller.abort()
  }, [profile, runnerUps, usesMockResult, winner])

  const saveResult = async () => {
    if (!profile || !winner || !runnerUps) return
    if (usesMockResult) { navigate('/passport'); return }
    if (!trustScore) return
    setIsSaving(true)
    setSaveError('')
    try {
      const response = await fetch(`${questApiBaseUrl}/api/results`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ winner, runnerUps, trustScore, profile, explanation, whyNotReasons }) })
      const payload = await response.json().catch(() => ({})) as { id?: string; error?: string; message?: string }
      if (!response.ok || typeof payload.id !== 'string') throw new Error(payload.error || payload.message || 'We could not save your result.')
      navigate(`/passport/${payload.id}`)
    } catch (caughtError) {
      setSaveError(caughtError instanceof Error ? caughtError.message : 'We could not save your result.')
    } finally { setIsSaving(false) }
  }

  if (!profile || !winner || !runnerUps) return <section className="placeholder page-container"><p className="eyebrow">Step 04 / Trust Score</p><h1>A winner, with receipts.</h1><p>Complete the Arena flow first so we can show the backend-generated result.</p><Link className="button" to="/arena">Open Arena <span>→</span></Link></section>
  if (!usesMockResult && status === 'loading') return <section className="result-page page-container"><p className="eyebrow"><i /> Step 04 / Trust Score</p><div className="result-loading"><span /><strong>Reviewing the evidence…</strong><small>Building your explainable result</small></div></section>
  if (!usesMockResult && status === 'error') return <section className="result-page page-container"><p className="eyebrow"><i /> Step 04 / Trust Score</p><div className="result-message"><h1>The verdict is on hold.</h1><p>{error}</p><button className="button" type="button" onClick={() => window.location.reload()}>Try again <span>→</span></button></div></section>

  const displayedTrustScore = usesMockResult ? mockPassportResult.trustScore : trustScore
  const displayedExplanation = usesMockResult ? 'Aether One is recommended for you because its fixed demo strengths align with the full AI DNA profile: dependable Accuracy, practical Speed and Cost, strong Privacy, and accessible Ease of Use.' : explanation
  const displayedReasons = usesMockResult ? mockPassportResult.whyNotReasons ?? [] : whyNotReasons

  return <section className="result-page page-container"><div className="result-topline"><span>YOUR BEST MATCH</span><span>{usesMockResult ? 'DEMO RESULT' : 'BACKEND-VERIFIED RESULT'}</span></div><div className="result-heading"><div><p className="eyebrow"><i /> Step 04 / Trust Score</p><h1>Your best fit,<br /><em>made clear.</em></h1></div><p>Match Score shows fit with your AI DNA; Trust Score shows confidence in the recommendation.</p></div><section className="result-recommendation"><div className="result-recommendation__label">✦ Recommended for You</div><div className="result-recommendation__model"><span>{winner.name.charAt(0)}</span><div><h2>{winner.name}</h2><p>{winner.provider} · {winner.description ?? 'AI Arena contender'}</p></div></div><div className="result-recommendation__scores"><div><span>MATCH SCORE</span><strong>{matchScore ?? '—'}</strong><small>AI DNA fit</small></div><div><span>TRUST SCORE</span><strong>{displayedTrustScore?.overallTrustScore}</strong><small>Evidence confidence</small></div></div><p>{displayedExplanation}</p></section><section className="result-dna"><div><p className="eyebrow">Your AI DNA × model strengths</p><h2>The evidence behind the recommendation.</h2></div><div className="result-dna__signals">{dnaDimensions.map((dimension) => <article key={dimension.key}><div><strong>{dimension.label}</strong><span>DNA {Math.round(profile[dimension.key] * 100)}%</span></div><div className="result-dna__tracks"><i><em style={{ width: `${Math.round(profile[dimension.key] * 100)}%` }} /></i><i><em style={{ width: `${winner[dimension.key]}%` }} /></i></div><small>Priority <b>{Math.round(profile[dimension.key] * 100)}%</b> · {winner.name} <b>{winner[dimension.key]}</b></small></article>)}</div></section><section className="trust-section"><div><p className="eyebrow">Trust breakdown</p><h2>Confidence, made <em>visible.</em></h2></div><div className="trust-bars">{Object.entries(displayedTrustScore?.breakdown ?? {}).map(([label, value]) => <div className="trust-bar" key={label}><div><strong>{label === 'easeOfUse' ? 'Ease of use' : label}</strong><span>{value}</span></div><div><span style={{ width: `${value}%` }} /></div></div>)}</div></section><section className="runner-ups"><div><p className="eyebrow">Why didn&apos;t the others win?</p><h2>Every contender gets an explanation.</h2></div><div>{displayedReasons.map((reason) => <details key={reason.modelId}><summary>{runnerUps.find((model) => model.id === reason.modelId)?.name ?? reason.modelId}<span>+</span></summary><p>{reason.reason}</p></details>)}</div></section><div className="result-actions"><div>{saveError && <p className="result-error" role="alert">{saveError}</p>}</div><button className="button" type="button" onClick={saveResult} disabled={isSaving}>{isSaving ? 'Saving result…' : usesMockResult ? 'View Model Passport' : 'Save Model Passport'} <span>→</span></button></div></section>
}
export function PassportPage() {
  const { id } = useParams()
  const location = useLocation()
  const usesMockPassport = !id || !questApiBaseUrl
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [result, setResult] = useState<SavedResult | null>(null)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    if (usesMockPassport || !id) return
    const controller = new AbortController()
    const loadPassport = async () => {
      setStatus('loading'); setError('')
      try {
        const response = await fetch(`${questApiBaseUrl}/api/results/${encodeURIComponent(id)}`, { credentials: 'include', signal: controller.signal })
        const payload = await response.json().catch(() => ({})) as unknown
        if (!response.ok) { const message = payload as { error?: string; message?: string }; throw new Error(message.error || message.message || 'We could not load this Model Passport.') }
        if (!isSavedResult(payload)) throw new Error('The saved result returned an unexpected response.')
        setResult(payload); setStatus('success')
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return
        setError(caughtError instanceof Error ? caughtError.message : 'We could not load this Model Passport.'); setStatus('error')
      }
    }
    void loadPassport()
    return () => controller.abort()
  }, [id, usesMockPassport])

  const passportResult = usesMockPassport ? mockPassportResult : result
  if (!usesMockPassport && status === 'loading') return <section className="passport-page page-container"><p className="eyebrow"><i /> Step 05 / Model Passport</p><div className="passport-loading"><span /><strong>Retrieving your passport…</strong><small>Loading the saved Arena verdict</small></div></section>
  if (!usesMockPassport && (status === 'error' || !passportResult)) return <section className="passport-page page-container"><p className="eyebrow"><i /> Step 05 / Model Passport</p><div className="passport-message"><h1>This passport is unavailable.</h1><p>{error}</p><Link className="button" to="/arena">Return to Arena <span>→</span></Link></div></section>

  if (!passportResult) return null

  const createdAt = new Date(passportResult.createdAt)
  const state = (location.state ?? {}) as PassportPageState
  const matchScore = state.matchScore ?? (usesMockPassport ? 96 : undefined)
  const ranking = state.ranking ?? (usesMockPassport ? 1 : undefined)
  const bestUseCases = state.bestUseCases ?? ['Privacy-sensitive product teams', 'High-confidence research assistance', 'Complex workflow planning']
  const passportUrl = window.location.href
  const passportSummary = `${passportResult.winner.name} — Recommended for You\nMatch Score: ${matchScore ?? 'Unavailable'}\nTrust Score: ${passportResult.trustScore.overallTrustScore}\nPassport ID: ${passportResult.id}`
  const copyLink = async () => { await navigator.clipboard.writeText(passportUrl); setActionMessage('Passport link copied.') }
  const sharePassport = async () => { if (navigator.share) { await navigator.share({ title: `${passportResult.winner.name} Model Passport`, text: passportSummary, url: passportUrl }); setActionMessage('Passport shared.') } else await copyLink() }
  const downloadPassport = () => { const file = new Blob([passportSummary], { type: 'text/plain' }); const url = URL.createObjectURL(file); const link = document.createElement('a'); link.href = url; link.download = `${passportResult.winner.name.toLowerCase().replaceAll(' ', '-')}-model-passport.txt`; link.click(); URL.revokeObjectURL(url); setActionMessage('Passport summary downloaded.') }

  return <section className="passport-page page-container"><div className="passport-topline"><span>MODEL PASSPORT</span><span>UNIQUE ID / {passportResult.id}</span></div><div className="passport-heading"><div><p className="eyebrow"><i /> Step 05 / Model Passport</p><h1>Your model&apos;s<br /><em>proof of fit.</em></h1></div><p>A collectible record of the Arena verdict, ready to save, share, and put to work.</p></div><article className="passport-card"><div className="passport-card__top"><span>✦ RECOMMENDED FOR YOU</span><span>{Number.isNaN(createdAt.getTime()) ? passportResult.createdAt : createdAt.toLocaleDateString()}</span></div><div className="passport-card__hero"><div className="passport-mark">{passportResult.winner.name.charAt(0)}</div><div><h2>{passportResult.winner.name}</h2><p>{passportResult.winner.provider}</p></div><div className="passport-score-pair"><div><span>RANKING</span><strong>#{ranking ?? '—'}</strong></div><div><span>MATCH SCORE</span><strong>{matchScore ?? '—'}</strong></div><div><span>TRUST SCORE</span><strong>{passportResult.trustScore.overallTrustScore}</strong></div></div></div><div className="passport-card__body"><div><span>WHY IT WON</span><p>{passportResult.explanation}</p><div className="passport-use-cases"><span>BEST USE CASES</span><div>{bestUseCases.map((useCase) => <b key={useCase}>✦ {useCase}</b>)}</div></div></div><div className="passport-dna"><span>AI DNA SIGNAL</span>{dnaDimensions.map((dimension) => <div key={dimension.key}><small>{dimension.label}</small><b>{Math.round(passportResult.profile[dimension.key] * 100)}%</b></div>)}</div></div><div className="passport-card__footer"><span>BACKEND-READY PROFILE</span><span>{passportResult.winner.license ?? 'License information unavailable'}</span></div></article><section className="passport-details"><div className="passport-breakdown"><p className="eyebrow">Trust evidence</p><h2>Why you can trust it.</h2>{Object.entries(passportResult.trustScore.breakdown).map(([label, value]) => <div className="passport-bar" key={label}><div><span>{label === 'easeOfUse' ? 'Ease of use' : label}</span><b>{value}</b></div><i><em style={{ width: `${value}%` }} /></i></div>)}</div><div className="passport-runner-ups"><p className="eyebrow">Why alternatives lost</p><h2>Close, but not your best fit.</h2>{passportResult.runnerUps.map((model) => <details key={model.id}><summary>{model.name}<span>{model.provider}</span></summary><p>{passportResult.whyNotReasons?.find((reason) => reason.modelId === model.id)?.reason ?? 'No saved explanation is available for this contender.'}</p></details>)}</div></section><div className="passport-actions"><div><span>Passport ID · {passportResult.id}</span>{actionMessage && <small role="status">{actionMessage}</small>}</div><div className="passport-actions__controls"><button type="button" onClick={downloadPassport}>Download</button><button type="button" onClick={() => void sharePassport()}>Share</button><button type="button" onClick={() => void copyLink()}>Copy Link</button><Link className="button" to="/deployment" state={{ winner: passportResult.winner }}>Configure deployment <span>→</span></Link></div></div></section>
}
export function HistoryPage() {
  return <section className="history-page page-container"><div className="history-topline"><span>PERSONAL ARENA ARCHIVE</span><span>{mockHistoryEntries.length} RECORDED DECISIONS</span></div><div className="history-heading"><div><p className="eyebrow"><i /> Your decision trail</p><h1>My <em>Passports.</em></h1></div><p>Every saved Quest and Arena verdict—ready to revisit, compare, and put to work.</p></div><div className="history-summary"><div><strong>{mockHistoryEntries.length}</strong><span>Quest profiles</span></div><div><strong>{mockHistoryEntries[0].trustScore}</strong><span>Latest Trust Score</span></div><div><strong>{mockHistoryEntries.filter((item) => item.status === 'Saved').length}</strong><span>Saved passports</span></div></div><div className="history-list">{mockHistoryEntries.map((entry) => { const createdAt = new Date(entry.createdAt); const priority = [...dnaDimensions].sort((a, b) => entry.profile[b.key] - entry.profile[a.key])[0]; return <Link className="history-card" to={`/passport/${entry.id}`} key={entry.id}><div className="history-card__status"><span>{entry.status}</span><time dateTime={entry.createdAt}>{createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time></div><div className="history-card__model"><span>{entry.winner.charAt(0)}</span><div><h2>{entry.winner}</h2><p>{entry.provider}</p></div></div><div className="history-card__scores"><div><span>TRUST SCORE</span><strong>{entry.trustScore}</strong></div><div><span>MATCH SCORE</span><strong>{entry.matchScore}</strong></div></div><div className="history-card__profile"><span>TOP SIGNAL</span><b>{priority.label}</b><small>{Math.round(entry.profile[priority.key] * 100)}%</small></div><span className="history-card__arrow">→</span></Link> })}</div></section>
}
export function DeploymentPage() {
  const location = useLocation()
  const selectedWinner = isAIModel((location.state as { winner?: unknown } | null)?.winner) ? (location.state as { winner: AIModel }).winner : mockPassportResult.winner
  const [temperature, setTemperature] = useState('0.2')
  const [maxTokens, setMaxTokens] = useState('1024')
  const [framework, setFramework] = useState<'JavaScript' | 'Python' | 'cURL'>('JavaScript')
  const [isCopied, setIsCopied] = useState(false)
  const config = framework === 'Python' ? `from ai_arena import Client\n\nclient = Client()\nresponse = client.chat.completions.create(\n  model="${selectedWinner.id}",\n  temperature=${temperature},\n  max_tokens=${maxTokens},\n  messages=[{"role": "user", "content": "Your prompt here"}],\n)` : framework === 'cURL' ? `curl https://api.ai-arena.dev/v1/chat/completions \\\n  -H "Authorization: Bearer $AI_ARENA_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "${selectedWinner.id}",\n    "temperature": ${temperature},\n    "max_tokens": ${maxTokens},\n    "messages": [{"role": "user", "content": "Your prompt here"}]\n  }'` : `import { AiArena } from '@ai-arena/sdk'\n\nconst arena = new AiArena({ apiKey: process.env.AI_ARENA_API_KEY })\n\nconst response = await arena.chat.completions.create({\n  model: '${selectedWinner.id}',\n  temperature: ${temperature},\n  maxTokens: ${maxTokens},\n  messages: [{ role: 'user', content: 'Your prompt here' }],\n})`
  const copyConfig = async () => { await navigator.clipboard.writeText(config); setIsCopied(true); window.setTimeout(() => setIsCopied(false), 1800) }

  return <section className="deployment-page page-container"><div className="deployment-topline"><span>DEPLOYMENT CONFIGURATION</span><span>06 / 06 · READY</span></div><div className="deployment-heading"><div><p className="eyebrow"><i /> Step 06 / Deployment</p><h1>Ready for the<br /><em>real world.</em></h1></div><p>Your winning model is configured. Tune the deployment settings, then take the generated starter config into your product.</p></div><section className="deployment-success"><span>✓</span><div><strong>Deployment profile ready</strong><p>{selectedWinner.name} is selected as your recommended model.</p></div><small>CONFIG GENERATED</small></section><div className="deployment-grid"><section className="deployment-settings"><div className="deployment-model"><span>{selectedWinner.name.charAt(0)}</span><div><small>SELECTED MODEL</small><h2>{selectedWinner.name}</h2><p>{selectedWinner.provider}</p></div><b>Recommended for You</b></div><div className="deployment-fields"><label>Temperature <output>{temperature}</output><input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(event) => setTemperature(event.target.value)} /></label><label>Max tokens <select value={maxTokens} onChange={(event) => setMaxTokens(event.target.value)}><option value="512">512</option><option value="1024">1024</option><option value="2048">2048</option></select></label><label>Response format <select defaultValue="json"><option value="json">JSON object</option><option value="text">Plain text</option></select></label></div><div className="deployment-note"><span>✦</span><p>These are mock frontend settings. Connect your provider credentials when the backend deployment flow is ready.</p></div></section><section className="deployment-code"><div className="deployment-code__header"><div><span>GENERATED CONFIG</span><strong>{framework}</strong></div><div>{(['JavaScript', 'Python', 'cURL'] as const).map((option) => <button type="button" key={option} className={framework === option ? 'is-active' : ''} onClick={() => setFramework(option)}>{option}</button>)}</div></div><pre><code>{config}</code></pre><button className="deployment-copy" type="button" onClick={() => void copyConfig()}>{isCopied ? '✓ Copied to clipboard' : 'Copy Config'} <span>{isCopied ? '' : '↗'}</span></button></section></div><div className="deployment-footer"><span>AI ARENA · {selectedWinner.name.toUpperCase()} CONFIG</span><Link className="button" to="/history">View My Passports <span>→</span></Link></div></section>
}
function AuthPage({ signup }: { signup?: boolean }) { return <section className="auth-page"><Brand /><div className="auth-card"><p className="eyebrow">{signup ? 'Create your profile' : 'Welcome back'}</p><h1>{signup ? 'Claim your place.' : 'Return to the arena.'}</h1>{signup && <input placeholder="Your name" />}<input placeholder="Email address" type="email" /><input placeholder="Password" type="password" /><button className="button">{signup ? 'Enter the arena' : 'Log in'} <span>→</span></button><p>{signup ? 'Already a challenger?' : 'New challenger?'} <Link to={signup ? '/login' : '/signup'}>{signup ? 'Log in' : 'Create an account'}</Link></p></div></section> }
export const LoginPage = () => <AuthPage />
export const SignUpPage = () => <AuthPage signup />
