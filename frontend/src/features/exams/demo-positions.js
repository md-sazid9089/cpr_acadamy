export const demoExams = [
  { id: 'demo-medicine', courseId: 'demo-fcps', courseTitle: 'FCPS Part 1 / September 2026', title: 'Medicine / Comprehensive Assessment', totalMarks: 100, durationMinutes: 60, status: 'submitted', resultsAt: null },
  { id: 'demo-anatomy', courseId: 'demo-fcps', courseTitle: 'FCPS Part 1 / September 2026', title: 'Anatomy / Weekly Assessment', totalMarks: 50, durationMinutes: 30, status: 'submitted', resultsAt: null },
  { id: 'demo-surgery', courseId: 'demo-residency', courseTitle: 'Residency / Surgery 2026', title: 'Surgery / Mock Examination', totalMarks: 100, durationMinutes: 90, status: 'submitted', resultsAt: null },
];

const firstNames = ['Nadia', 'Arif', 'Samira', 'Farhan', 'Tasnim', 'Imran', 'Nusrat', 'Rafiul', 'Sumaiya', 'Mehedi', 'Maliha', 'Shahriar'];
const surnames = ['Rahman', 'Hasan', 'Chowdhury'];
const students = surnames.flatMap(surname => firstNames.map(firstName => `${firstName} ${surname}`));

export function demoPositions(examId, { limit = 10, offset = 0 } = {}) {
  const exam = demoExams.find(item => item.id === examId);
  if (!exam) throw new Error('Sample exam not found.');
  const examIndex = demoExams.indexOf(exam);
  const scores = students.map((name, index) => {
    const order = (index + examIndex * 7) % students.length;
    const percentage = order < 3 ? [96.5, 94, 94][order] : 94 - Math.floor(order / 2) * 2.75;
    return { name, score: Math.round(percentage * exam.totalMarks * 10) / 1000, isMe: index === 13 };
  }).sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
  const entries = scores.map(entry => ({
    ...entry,
    rank: scores.findIndex(other => other.score === entry.score) + 1,
    tied: scores.filter(other => other.score === entry.score).length > 1,
    totalMarks: exam.totalMarks,
    passed: entry.score * 100 >= exam.totalMarks * 70,
  }));
  return {
    exam, participants: entries.length, pending: examIndex === 1 ? 4 : 0,
    provisional: examIndex === 1,
    highestScore: entries[0].score,
    averageScore: Math.round(entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length * 1000) / 1000,
    me: entries.find(entry => entry.isMe), items: entries.slice(offset, offset + limit), limit, offset,
  };
}