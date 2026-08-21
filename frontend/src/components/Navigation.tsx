import { Link, NavLink } from 'react-router-dom'
export function Brand() { return <Link className="brand" to="/"><span className="brand__mark">A</span><span>AI <b>ARENA</b></span></Link> }
export function Navigation() { return <header className="navigation"><Brand /><nav><NavLink to="/quest">AI Quest</NavLink><NavLink to="/arena">Arena</NavLink><NavLink to="/passport">Passports</NavLink></nav><div className="navigation__actions"><Link className="text-link" to="/login">Log in</Link><Link className="button button--small" to="/signup">Enter Arena <span>↗</span></Link></div></header> }
