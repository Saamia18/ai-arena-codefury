import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const THEME_STORAGE_KEY = 'ai-arena-theme'

export function Brand() {
  return <Link className="brand" to="/"><span className="brand__mark">A</span><span>AI <b>ARENA</b></span></Link>
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) === 'dark')

  useEffect(() => {
    if (isDark) document.documentElement.dataset.theme = 'dark'
    else document.documentElement.removeAttribute('data-theme')

    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  return <button className="theme-toggle" type="button" onClick={() => setIsDark((current) => !current)} aria-pressed={isDark} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}><span aria-hidden="true">{isDark ? '☀' : '☾'}</span></button>
}

export function Navigation() {
  return <header className="navigation"><Brand /><nav><NavLink to="/quest">AI Quest</NavLink><NavLink to="/arena">Arena</NavLink><NavLink to="/passport">Passports</NavLink></nav><div className="navigation__actions"><ThemeToggle /><Link className="text-link" to="/login">Log in</Link><Link className="button button--small" to="/signup">Enter Arena <span>↗</span></Link></div></header>
}
