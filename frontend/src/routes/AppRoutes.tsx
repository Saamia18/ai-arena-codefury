import { Route, Routes } from 'react-router-dom'
import { AppShell } from '../layouts/AppShell'
import { ArenaPage, DeploymentPage, DnaProfilePage, LoginPage, PassportPage, QuestPage, ResultPage, SignUpPage } from '../pages/FlowPages'
import { HomePage } from '../pages/HomePage'
export function AppRoutes() { return <Routes><Route element={<AppShell />}><Route path="/" element={<HomePage />} /><Route path="/quest" element={<QuestPage />} /><Route path="/dna" element={<DnaProfilePage />} /><Route path="/arena" element={<ArenaPage />} /><Route path="/result" element={<ResultPage />} /><Route path="/passport" element={<PassportPage />} /><Route path="/deployment" element={<DeploymentPage />} /></Route><Route path="/login" element={<LoginPage />} /><Route path="/signup" element={<SignUpPage />} /></Routes> }
