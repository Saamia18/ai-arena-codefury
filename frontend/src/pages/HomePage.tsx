import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { arenaModels, journeySteps, questStats } from '../data/home'

export function HomePage() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [activeModel, setActiveModel] = useState(arenaModels[0].name)
  const activeScore = arenaModels.find((model) => model.name === activeModel)?.score ?? 96
  const arenaStyle = { '--tilt-x': `${tilt.x}px`, '--tilt-y': `${tilt.y}px` } as CSSProperties

  return <>
    <section className="hero page-container">
      <div className="hero__copy">
        <p className="eyebrow"><i /> AI model intelligence, made personal</p>
        <div className="hero__label">DNA-Powered Model Matching</div>
        <h1>Find the AI that<br /><em>backs your ambition.</em></h1>
        <p className="hero__lede">Define your mission. Shape your priorities. Then let the world&apos;s best AI contenders prove who deserves your next build.</p>
        <div className="hero__actions"><Link className="button" to="/quest">Begin your AI Quest <span>→</span></Link><a className="play-link" href="#how-it-works"><b>▶</b> Explore the arena</a></div>
        <div className="stats">{questStats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
      </div>
      <div className="hero__visual" onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setTilt({ x: (event.clientX - rect.left - rect.width / 2) / 28, y: (event.clientY - rect.top - rect.height / 2) / 28 }) }} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
        <div className="arena-system" style={arenaStyle}>
          <div className="orbit orbit--outer" /><div className="orbit orbit--middle" /><div className="orbit orbit--inner" /><div className="scan-line" />
          <div className="core"><small>BEST MATCH</small><span>{activeScore}</span><b>TRUST SCORE</b></div>
          {arenaModels.map((model, index) => <button type="button" key={model.name} onMouseEnter={() => setActiveModel(model.name)} onFocus={() => setActiveModel(model.name)} className={`model-chip model-chip--${index + 1} ${model.color} ${activeModel === model.name ? 'is-active' : ''}`}><span className="model-chip__mark">{model.mark}</span><span className="model-chip__body"><b>{model.name}</b><small>{model.trait} · {model.detail}</small></span><strong>{model.score}</strong></button>)}
        </div>
        <div className="visual-label label--top"><i /> LIVE EVALUATION</div><div className="visual-label label--bottom">MOVE TO EXPLORE</div>
      </div>
    </section>
    <section className="how-section page-container" id="how-it-works">
      <div className="section-heading"><div><p className="eyebrow">One path. A better decision.</p><h2>Your AI journey, <em>made visible.</em></h2></div><p>AI Arena turns a vague search into a clear, explainable recommendation you can act on.</p></div>
      <ol className="journey-ladder">{journeySteps.map((step, index) => <li key={step.title}><span className="journey-number">{step.number}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div>{index < journeySteps.length - 1 && <span className="journey-arrow">→</span>}</li>)}</ol>
    </section>
  </>
}
