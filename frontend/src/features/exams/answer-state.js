export function answerState(question, answer) {
  if (question.type === 'sba') return question.options.some(option => option.id === answer) ? 'answered' : 'unanswered';
  const count = question.options.filter(option => typeof answer?.[option.id] === 'boolean').length;
  return count === 0 ? 'unanswered' : count === question.options.length ? 'answered' : 'partial';
}