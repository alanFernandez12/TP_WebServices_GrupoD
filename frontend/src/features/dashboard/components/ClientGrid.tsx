import type { Cliente } from '../../../types/domain'

interface Props {
  clients: Cliente[]
  loading: boolean
}

export function ClientGrid({ clients, loading }: Props) {
  if (loading) return <div className="empty-state">Cargando clientes...</div>
  if (!clients.length) return <div className="empty-state"><span className="empty-icon">○</span><strong>No hay clientes registrados</strong><span>Los nuevos clientes aparecerán en esta grilla.</span></div>

  return <div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Documento</th><th>Email</th><th>Teléfono</th><th>Estado</th></tr></thead><tbody>{clients.map((client) => <tr key={client.id}><td><strong className="strong">{client.nombre} {client.apellido}</strong><small className="table-detail">ID #{client.id}</small></td><td>{client.documento}</td><td>{client.email}</td><td>{client.telefono || '—'}</td><td><span className={`status ${client.activo ? 'status-confirmada' : 'status-cancelada'}`}>{client.activo ? 'ACTIVO' : 'INACTIVO'}</span></td></tr>)}</tbody></table></div>
}
