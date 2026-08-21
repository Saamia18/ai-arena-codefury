import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Navigation'

type QuestQuestion = { id: string; prompt: string; hint: string; options: { label: string; value: string; description: string }[] }
type DNAProfile = { accuracy: number; speed: number; cost: number; privacy: number; easeOfUse: number }

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
      const response = await fetch('/api/quest/submit', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: questQuestions.map(({ id }) => ({ questionId: id, answer: answers[id] })) }) })
      const payload = await response.json().catch(() => ({})) as { profile?: DNAProfile; error?: string }
      if (!response.ok || !payload.profile) throw new Error(payload.error || 'We could not shape your AI DNA. Please try again.')
      navigate('/dna', { state: { profile: payload.profile } })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'We could not shape your AI DNA. Please try again.')
    } finally { setIsSubmitting(false) }
  }

  return <section className="quest-page page-container"><div className="quest-topline"><Link to="/" className="quest-exit">← Exit quest</Link><span>AI ARENA / PERSONALIZATION PROTOCOL</span></div><div className="quest-panel"><div className="quest-progress"><div><span>QUEST {String(currentIndex + 1).padStart(2, '0')} / {String(questQuestions.length).padStart(2, '0')}</span><span>{Math.round(((currentIndex + 1) / questQuestions.length) * 100)}% complete</span></div><div className="quest-progress__track" role="progressbar" aria-label="Quest progress" aria-valuemin={0} aria-valuemax={questQuestions.length} aria-valuenow={currentIndex + 1}><span style={{ width: `${((currentIndex + 1) / questQuestions.length) * 100}%` }} /></div></div><p className="eyebrow"><i /> Your mission, decoded</p><h1>{question.prompt}</h1><p className="quest-hint">{question.hint}</p><div className="quest-options" role="radiogroup" aria-label={question.prompt}>{question.options.map((option) => <button type="button" role="radio" aria-checked={selectedAnswer === option.value} onClick={() => { setAnswers((current) => ({ ...current, [question.id]: option.value })); setError('') }} className={selectedAnswer === option.value ? 'is-selected' : ''} key={option.value}><span className="quest-option__indicator" /><span><b>{option.label}</b><small>{option.description}</small></span><span className="quest-option__arrow">→</span></button>)}</div>{error && <p className="quest-error" role="alert">{error}</p>}<div className="quest-actions"><button className="quest-back" type="button" disabled={currentIndex === 0 || isSubmitting} onClick={() => { setCurrentIndex((index) => index - 1); setError('') }}>Back</button><button className="button" type="button" disabled={!selectedAnswer || isSubmitting} onClick={continueQuest}>{isSubmitting ? 'Shaping your AI DNA…' : isFinalQuestion ? 'Shape my AI DNA' : 'Continue'} <span>→</span></button></div></div></section>
}

function Placeholder({ eyebrow, title, description, next }: { eyebrow: string; title: string; description: string; next?: [string, string] }) { return <section className="placeholder page-container"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p>{next && <Link className="button" to={next[1]}>{next[0]} <span>→</span></Link>}</section> }
export const DnaProfilePage = () => <Placeholder eyebrow="Step 02 / AI DNA" title="Give your priorities a signal." description="Balance accuracy, speed, cost, privacy, and ease of use to form your AI DNA." next={['Open the arena', '/arena']} />
export const ArenaPage = () => <Placeholder eyebrow="Step 03 / Arena" title="Let the contenders compete." description="Your shortlisted models will battle against your personal AI DNA." next={['View result', '/result']} />
export const ResultPage = () => <Placeholder eyebrow="Step 04 / Trust Score" title="A winner, with receipts." description="Explore a transparent score that shows why this model is the right match." next={['Get model passport', '/passport']} />
export const PassportPage = () => <Placeholder eyebrow="Step 05 / Model Passport" title="Your model's proof of fit." description="A portable, shareable record of its strengths, score, and winning rationale." next={['Configure deployment', '/deployment']} />
export const DeploymentPage = () => <Placeholder eyebrow="Step 06 / Deployment" title="Ready for the real world." description="Generate the configuration that takes your winning model from arena to application." />
function AuthPage({ signup }: { signup?: boolean }) { return <section className="auth-page"><Brand /><div className="auth-card"><p className="eyebrow">{signup ? 'Create your profile' : 'Welcome back'}</p><h1>{signup ? 'Claim your place.' : 'Return to the arena.'}</h1>{signup && <input placeholder="Your name" />}<input placeholder="Email address" type="email" /><input placeholder="Password" type="password" /><button className="button">{signup ? 'Enter the arena' : 'Log in'} <span>→</span></button><p>{signup ? 'Already a challenger?' : 'New challenger?'} <Link to={signup ? '/login' : '/signup'}>{signup ? 'Log in' : 'Create an account'}</Link></p></div></section> }
export const LoginPage = () => <AuthPage />
export const SignUpPage = () => <AuthPage signup />
