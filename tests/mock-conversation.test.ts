import assert from 'node:assert/strict';
import test from 'node:test';
import { getDataset } from '../lib/metis/datasets';
import { mockConversationReply } from '../lib/metis/mock-conversation';

test('mock supports greeting and both suggested Bebop questions without a connection', () => {
  const data = getDataset('bebop-5pct');
  for (const question of ['hi', 'Why do both cancel slices regress?', 'What should we validate next?', 'Tell me more']) {
    const reply = mockConversationReply(question, data);
    assert.equal(reply.origin, 'demo');
    assert.equal(reply.status, 'complete');
    assert.ok(reply.text.length > 30);
    assert.ok(reply.evidenceIds.every(id => data.evidenceById[id]));
    assert.doesNotMatch(reply.text, /API key|not connected/);
  }
  assert.match(mockConversationReply('Why do both cancel slices regress?', data).text, /4.87%→8.06%/);
  assert.match(mockConversationReply('What should we validate next?', data).text, /Separate user\/service cancel/);
});

test('mock replies use the selected experiment and attached evidence', () => {
  const data = getDataset('onboarding-refresh');
  const reply = mockConversationReply('Explain this', data, ['metric:latency']);
  assert.ok(reply.evidenceIds.includes('metric:latency'));
  assert.doesNotMatch(reply.text, /ZQ|Bebop/);
});
