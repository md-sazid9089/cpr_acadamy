import apiClient from '@/lib/api-client';

/**
 * Exam delivery. The server owns the clock: `endsAt` in the paper is the
 * authoritative deadline, and answers saved after it are rejected.
 */

/**
 * Opens (or resumes) the student's attempt and returns the paper without answer
 * keys. Rejects with code ALREADY_SUBMITTED once the paper has been handed in.
 */
export async function fetchExamPaper(examId) {
  const { data } = await apiClient.post(`/exams/${examId}/start`);
  return data;
}

/** Autosave a single answer. Fire-and-forget from the UI. */
export async function saveAnswer({ examId, questionId, answer, version }) {
  const { data } = await apiClient.post(`/exams/${examId}/answers`, { questionId, answer, version });
  return data;
}

/** @param {{ examId: string, answers: import('@/types').AnswerSheet, version: number }} payload */
export async function submitExam({ examId, answers, version }) {
  const { data } = await apiClient.post(`/exams/${examId}/submit`, { answers, version });
  return data;
}

export async function fetchExamResult(examId) {
  const { data } = await apiClient.get(`/exams/${examId}/result`);
  return data;
}

export async function fetchExamList() {
  const { data } = await apiClient.get('/exams', { params: { limit: 100 } });
  return data;
}

export async function fetchPositionExams({ signal } = {}) {
  const exams = [];
  for (let offset = 0; ; offset += 100) {
    const { data } = await apiClient.get('/exams', { params: { limit: 100, offset }, signal });
    exams.push(...data);
    if (data.length < 100) return exams;
  }
}

export async function fetchExamPositions(examId, { limit = 10, offset = 0, signal } = {}) {
  const { data } = await apiClient.get(`/exams/${examId}/positions`, { params: { limit, offset }, signal });
  return data;
}
