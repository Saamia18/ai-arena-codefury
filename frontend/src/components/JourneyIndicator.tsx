import { Link, useLocation } from 'react-router-dom'

const journeySteps = [
  { number: '01', label: 'Quest', to: '/quest', match: '/quest' },
  { number: '02', label: 'DNA', to: '/dna', match: '/dna' },
  { number: '03', label: 'Arena', to: '/arena', match: '/arena' },
  { number: '04', label: 'Result', to: '/result', match: '/result' },
  { number: '05', label: 'Passport', to: '/passport', match: '/passport' },
  { number: '06', label: 'Deploy', to: '/deployment', match: '/deployment' },
]

export function JourneyIndicator() {
  const { pathname } = useLocation()
  const activeIndex = journeySteps.findIndex((step) => pathname === step.match || (step.match === '/passport' && pathname.startsWith('/passport/')))
  if (activeIndex === -1) return null

  return <nav className="journey-indicator" aria-label="AI Arena journey"><ol>{journeySteps.map((step, index) => <li className={index < activeIndex ? 'is-complete' : index === activeIndex ? 'is-current' : ''} key={step.number}><Link to={step.to} aria-current={index === activeIndex ? 'step' : undefined}><span>{index < activeIndex ? '✓' : step.number}</span><b>{step.label}</b></Link>{index < journeySteps.length - 1 && <i aria-hidden="true">→</i>}</li>)}</ol></nav>
}
