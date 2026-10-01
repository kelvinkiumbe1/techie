export function formatTicketStatus(status) {
  return String(status || '').toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

export function getTicketPriorityLabel(priority) {
  if (priority === 'URGENT') return 'Urgent'
  if (priority === 'NORMAL') return 'Normal'
  if (priority === 'HIGH') return 'High'
  if (priority === 'MEDIUM') return 'Medium'
  return 'Low'
}
