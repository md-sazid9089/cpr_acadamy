import { gradePaper } from '../src/modules/exams.js';

export async function up(transaction) {
  let after = '00000000-0000-0000-0000-000000000000';
  for (;;) {
    const { rows } = await transaction.query('SELECT id,paper,answers FROM exam_attempts WHERE submitted_at IS NOT NULL AND id>$1 ORDER BY id LIMIT 100', [after]);
    if (!rows.length) break;
    for (const attempt of rows) {
      await transaction.query('UPDATE exam_attempts SET result=$2 WHERE id=$1', [attempt.id, JSON.stringify(gradePaper(attempt.paper, attempt.answers))]);
    }
    after = rows.at(-1).id;
  }
}