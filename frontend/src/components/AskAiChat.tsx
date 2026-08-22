import { useEffect, useRef, useState } from 'react'
import { askAiSuggestions, getMockAskAiResponse, type AskAiMessage } from '../services/askAi.mock'

const welcomeMessage: AskAiMessage = { id: 'welcome', role: 'assistant', content: 'I can unpack your AI DNA, the recommended model, scores, Arena results, and why alternatives lost.' }

export function AskAiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<AskAiMessage[]>([welcomeMessage])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const sendMessage = async (content: string) => {
    const question = content.trim()
    if (!question || isTyping) return
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', content: question }])
    setInput('')
    setIsTyping(true)
    const response = await getMockAskAiResponse(question)
    setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', content: response }])
    setIsTyping(false)
  }

  return <aside className={`ask-ai ${isOpen ? 'is-open' : ''}`} aria-label="Ask AI assistant"><button className="ask-ai__trigger" type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="ask-ai-panel"><span>✦</span><b>Ask AI</b><i>{isOpen ? '×' : '↗'}</i></button><section className="ask-ai__panel" id="ask-ai-panel" aria-hidden={!isOpen}><header><div><span>✦</span><div><strong>AI Arena Guide</strong><small>Mock assistant · demo mode</small></div></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Close Ask AI">×</button></header><div className="ask-ai__messages">{messages.map((message) => <div className={`ask-ai__message ask-ai__message--${message.role}`} key={message.id}>{message.content}</div>)}{isTyping && <div className="ask-ai__typing" aria-label="AI is typing"><i /><i /><i /></div>}<div ref={messagesEndRef} /></div><div className="ask-ai__suggestions">{askAiSuggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} disabled={isTyping}>{suggestion}</button>)}</div><form className="ask-ai__form" onSubmit={(event) => { event.preventDefault(); void sendMessage(input) }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your AI decision…" aria-label="Ask AI a question" /><button type="submit" disabled={!input.trim() || isTyping} aria-label="Send question">↑</button></form></section></aside>
}
