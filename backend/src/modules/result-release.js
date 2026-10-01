/**
 * When students may see an exam's results. An explicit `results_at` wins; without
 * one, results appear when the exam closes; an exam with neither shows them as soon
 * as the student submits.
 */
export function resultsReleaseAt(exam) {
  return exam.results_at ?? exam.closes_at ?? null;
}

export function resultsReleased(exam, now = Date.now()) {
  const releaseAt = resultsReleaseAt(exam);
  return !releaseAt || new Date(releaseAt).getTime() <= now;
}

/** SQL twin of `resultsReleased` for queries that join `exams` under `alias`. */
export function releasedSql(alias = 'x') {
  const releaseAt = `COALESCE(${alias}.results_at,${alias}.closes_at)`;
  return `(${releaseAt} IS NULL OR ${releaseAt}<=now())`;
}
