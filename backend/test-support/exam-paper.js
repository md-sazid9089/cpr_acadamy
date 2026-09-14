export function mixedPaperQuestions() {
  return Array.from({ length: 50 }, (_, index) => {
    const type = index < 30 ? 'mtf' : 'sba';
    return {
      id: index === 0 ? 'question-two' : index === 30 ? 'question-one' : `question-${index + 100}`,
      type, stem: 'Evaluate the options.',
      options: ['first', 'second', 'third', 'fourth', 'fifth'].map(id => ({ id, text: id })),
      correctAnswer: type === 'mtf' ? { first: true, second: false, third: true, fourth: false, fifth: true } : 'second',
      explanation: 'Test explanation.', marks: type === 'mtf' ? 0.4 : 2,
    };
  });
}