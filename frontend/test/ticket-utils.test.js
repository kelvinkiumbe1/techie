import test from 'node:test'
import assert from 'node:assert/strict'
import { formatTicketStatus, getTicketPriorityLabel } from '../src/utils/ticketUtils.js'

test('formats ticket statuses for display', () => {
  assert.equal(formatTicketStatus('IN_PROGRESS'), 'In Progress')
  assert.equal(formatTicketStatus('RESOLVED'), 'Resolved')
})

test('keeps all supported priority labels readable', () => {
  assert.equal(getTicketPriorityLabel('URGENT'), 'Urgent')
  assert.equal(getTicketPriorityLabel('HIGH'), 'High')
  assert.equal(getTicketPriorityLabel('LOW'), 'Low')
})
