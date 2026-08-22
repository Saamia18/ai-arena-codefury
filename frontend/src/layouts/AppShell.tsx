import { Outlet } from 'react-router-dom'
import { AskAiChat } from '../components/AskAiChat'
import { Navigation } from '../components/Navigation'
export function AppShell() { return <div className="app-shell"><div className="ambient ambient--one" /><div className="ambient ambient--two" /><Navigation /><main><Outlet /></main><AskAiChat /></div> }
