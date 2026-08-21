import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Brand } from '../components/Navigation'

type QuestQuestion = { id: string; prompt: string; hint: string; options: { label: string; value: string; description: string }[] }
type DNAProfile = { accuracy: number; speed: number; cost: number; privacy: number; easeOfUse: number }
type AIModel = { id: string; name: string; provider: string; description?: string; taskTypes?: string[]; accuracy: number; speed: number; cost: number; privacy: number; easeOfUse: number; hardware?: string; license?: string; benchmarkSource?: string }
type TrustBreakdown = { accuracy: number; speed: number; cost: number; privacy: number; easeOfUse: number; evidence: number }
type TrustScoreResponse = { modelId: string; overallTrustScore: number; breakdown: TrustBreakdown }
type WhyNotReason = { modelId: string; reason: string }
type ResultState = { profile?: unknown; winner?: unknown; runnerUps?: unknown }
type SavedResult = { id: string; userId: string; winner: AIModel; runnerUps: AIModel[]; trustScore: TrustScoreResponse; profile: DNAProfile; explanation: string; whyNotReasons?: WhyNotReason[]; createdAt: string }

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

function Placeholder({ eyebrow, title, description, next }: { eyebrow: string; title: string; description: string; next?: [string, string] }) { return <section className="placeholder page-container"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p>{next && <Link className="button" to={next[1]}>{next[0]} <span>→</span></Link>}</section> }
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
export const ArenaPage = () => <Placeholder eyebrow="Step 03 / Arena" title="Let the contenders compete." description="Your shortlisted models will battle against your personal AI DNA." next={['View result', '/result']} />
export function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as ResultState
  const profile = isDNAProfile(state.profile) ? state.profile : null
  const winner = isAIModel(state.winner) ? state.winner : null
  const runnerUps = Array.isArray(state.runnerUps) && state.runnerUps.every(isAIModel) ? state.runnerUps : null
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [trustScore, setTrustScore] = useState<TrustScoreResponse | null>(null)
  const [explanation, setExplanation] = useState('')
  const [whyNotReasons, setWhyNotReasons] = useState<WhyNotReason[]>([])
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!profile || !winner || !runnerUps) return
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
  }, [profile, runnerUps, winner])

  const saveResult = async () => {
    if (!profile || !winner || !runnerUps || !trustScore) return
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
  if (status === 'loading') return <section className="result-page page-container"><p className="eyebrow"><i /> Step 04 / Trust Score</p><div className="result-loading"><span /><strong>Reviewing the evidence…</strong><small>Building your explainable result</small></div></section>
  if (status === 'error') return <section className="result-page page-container"><p className="eyebrow"><i /> Step 04 / Trust Score</p><div className="result-message"><h1>The verdict is on hold.</h1><p>{error}</p><button className="button" type="button" onClick={() => window.location.reload()}>Try again <span>→</span></button></div></section>

  return <section className="result-page page-container"><div className="result-topline"><span>ARENA VERDICT</span><span>BACKEND-VERIFIED RESULT</span></div><div className="result-heading"><div><p className="eyebrow"><i /> Step 04 / Trust Score</p><h1>A winner, with<br /><em>receipts.</em></h1></div><p>Match Score and Trust Score measure different things. This verdict keeps both visible.</p></div><div className="result-grid"><article className="winner-card"><span className="winner-card__label">YOUR WINNING MODEL</span><div className="winner-card__model"><span>{winner.name.charAt(0)}</span><div><h2>{winner.name}</h2><p>{winner.provider}</p></div></div><div className="winner-card__score"><span>TRUST SCORE</span><strong>{trustScore?.overallTrustScore}</strong></div></article><article className="explanation-card"><span className="winner-card__label">WHY IT WON</span><p>{explanation}</p></article></div><section className="trust-section"><div><p className="eyebrow">Trust breakdown</p><h2>Confidence, made <em>visible.</em></h2></div><div className="trust-bars">{Object.entries(trustScore?.breakdown ?? {}).map(([label, value]) => <div className="trust-bar" key={label}><div><strong>{label === 'easeOfUse' ? 'Ease of use' : label}</strong><span>{value}</span></div><div><span style={{ width: `${value}%` }} /></div></div>)}</div></section><section className="runner-ups"><div><p className="eyebrow">Why not the others?</p><h2>Every contender gets an explanation.</h2></div><div>{whyNotReasons.map((reason) => <details key={reason.modelId}><summary>{runnerUps.find((model) => model.id === reason.modelId)?.name ?? reason.modelId}<span>+</span></summary><p>{reason.reason}</p></details>)}</div></section><div className="result-actions"><div>{saveError && <p className="result-error" role="alert">{saveError}</p>}</div><button className="button" type="button" onClick={saveResult} disabled={isSaving}>{isSaving ? 'Saving result…' : 'Save Model Passport'} <span>→</span></button></div></section>
}
export function PassportPage() {
  const { id } = useParams()
  const usesMockPassport = !id || !questApiBaseUrl
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [result, setResult] = useState<SavedResult | null>(null)
  const [error, setError] = useState('')

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
  return <section className="passport-page page-container"><div className="passport-topline"><span>MODEL PASSPORT</span><span>RESULT ID / {passportResult.id}</span></div><div className="passport-heading"><div><p className="eyebrow"><i /> Step 05 / Model Passport</p><h1>Your model&apos;s<br /><em>proof of fit.</em></h1></div><p>A portable record of the Arena verdict, with the evidence that brought it home.</p></div><article className="passport-card"><div className="passport-card__top"><span>AI ARENA / VERIFIED MATCH</span><span>{Number.isNaN(createdAt.getTime()) ? passportResult.createdAt : createdAt.toLocaleDateString()}</span></div><div className="passport-card__hero"><div className="passport-mark">{passportResult.winner.name.charAt(0)}</div><div><h2>{passportResult.winner.name}</h2><p>{passportResult.winner.provider}</p></div><div className="passport-trust"><span>TRUST SCORE</span><strong>{passportResult.trustScore.overallTrustScore}</strong></div></div><div className="passport-card__body"><div><span>WHY IT FITS</span><p>{passportResult.explanation}</p></div><div className="passport-dna"><span>AI DNA SIGNAL</span>{dnaDimensions.map((dimension) => <div key={dimension.key}><small>{dimension.label}</small><b>{Math.round(passportResult.profile[dimension.key] * 100)}%</b></div>)}</div></div><div className="passport-card__footer"><span>BACKEND-VERIFIED PROFILE</span><span>{passportResult.winner.license ?? 'License information unavailable'}</span></div></article><section className="passport-details"><div className="passport-breakdown"><p className="eyebrow">Trust evidence</p><h2>Why you can trust it.</h2>{Object.entries(passportResult.trustScore.breakdown).map(([label, value]) => <div className="passport-bar" key={label}><div><span>{label === 'easeOfUse' ? 'Ease of use' : label}</span><b>{value}</b></div><i><em style={{ width: `${value}%` }} /></i></div>)}</div><div className="passport-runner-ups"><p className="eyebrow">Other contenders</p><h2>Close, but not your best fit.</h2>{passportResult.runnerUps.map((model) => <details key={model.id}><summary>{model.name}<span>{model.provider}</span></summary><p>{passportResult.whyNotReasons?.find((reason) => reason.modelId === model.id)?.reason ?? 'No saved explanation is available for this contender.'}</p></details>)}</div></section><div className="passport-actions"><span>Saved result · {passportResult.id}</span><Link className="button" to="/deployment" state={{ winner: passportResult.winner }}>Configure deployment <span>→</span></Link></div></section>
}
export const DeploymentPage = () => <Placeholder eyebrow="Step 06 / Deployment" title="Ready for the real world." description="Generate the configuration that takes your winning model from arena to application." />
function AuthPage({ signup }: { signup?: boolean }) { return <section className="auth-page"><Brand /><div className="auth-card"><p className="eyebrow">{signup ? 'Create your profile' : 'Welcome back'}</p><h1>{signup ? 'Claim your place.' : 'Return to the arena.'}</h1>{signup && <input placeholder="Your name" />}<input placeholder="Email address" type="email" /><input placeholder="Password" type="password" /><button className="button">{signup ? 'Enter the arena' : 'Log in'} <span>→</span></button><p>{signup ? 'Already a challenger?' : 'New challenger?'} <Link to={signup ? '/login' : '/signup'}>{signup ? 'Log in' : 'Create an account'}</Link></p></div></section> }
export const LoginPage = () => <AuthPage />
export const SignUpPage = () => <AuthPage signup />
