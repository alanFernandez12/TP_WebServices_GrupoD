interface Props { icon: string; title: string; description: string; onClick: () => void }
export function ActionCard({ icon, title, description, onClick }: Props) {
  return <button className="action-card" onClick={onClick}><span className="action-icon">{icon}</span><span><strong>{title}</strong><small>{description}</small></span><span className="arrow">→</span></button>
}
