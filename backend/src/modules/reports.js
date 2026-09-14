import { z } from 'zod';
import { one } from '../db.js';
import { audit, ensure, pageQuery, text } from '../http.js';
import { paymentDto } from './billing.js';

const announcementFields = z.object({
  title: text.max(200), body: z.string().trim().min(1).max(5000),
  category: z.enum(['General', 'Exam', 'Class', 'Payment']).default('General'),
  pinned: z.boolean().default(false), isPublished: z.boolean().default(true),
  publishedAt: z.string().datetime({ offset: true }).optional(),
}).strict();

function announcementDto(row) {
  return { id: row.id, title: row.title, body: row.body, category: row.category, pinned: row.pinned, isPublished: row.is_published, publishedAt: row.published_at, createdAt: row.created_at };
}

export function reportRoutes(route, database) {
  route('GET', '/admin/revenue', { auth: 'admin' }, async () => {
    const summary = await one(database, `SELECT
      COALESCE(sum(amount_minor) FILTER(WHERE status='paid' AND paid_at>=date_trunc('month',now())),0)::bigint AS this_month,
      COALESCE(sum(amount_minor) FILTER(WHERE status='paid' AND paid_at>=date_trunc('month',now())-interval '1 month' AND paid_at<date_trunc('month',now())),0)::bigint AS last_month,
      COALESCE(sum(amount_minor) FILTER(WHERE status='paid' AND paid_at>=date_trunc('year',now())),0)::bigint AS year_to_date,
      COALESCE(sum(amount_minor) FILTER(WHERE status='pending'),0)::bigint AS pending_amount,
      COALESCE(sum(amount_minor) FILTER(WHERE status='refunded'),0)::bigint AS refunded_amount,
      count(*) FILTER(WHERE status='paid')::int AS paid_count FROM payments`);
    const byMonth = (await database.query(`SELECT to_char(date_trunc('month',paid_at AT TIME ZONE 'Asia/Dhaka'),'YYYY-MM') AS month,sum(amount_minor)::bigint AS amount
      FROM payments WHERE status='paid' AND paid_at>=date_trunc('month',now())-interval '5 months' GROUP BY month ORDER BY month`)).rows;
    const byMethod = (await database.query("SELECT method,sum(amount_minor)::bigint AS amount FROM payments WHERE status='paid' GROUP BY method ORDER BY amount DESC")).rows;
    const paidTotal = byMethod.reduce((total, row) => total + Number(row.amount), 0);
    const byCourse = (await database.query(`SELECT p.course_id,c.title,sum(p.amount_minor)::bigint AS amount,count(*)::int AS count FROM payments p JOIN courses c ON c.id=p.course_id
      WHERE p.status='paid' GROUP BY p.course_id,c.title ORDER BY amount DESC LIMIT 10`)).rows;
    const transactions = (await database.query(`SELECT p.*,u.full_name FROM payments p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC,p.id LIMIT 200`)).rows;
    return {
      summary: { thisMonth: Number(summary.this_month) / 100, lastMonth: Number(summary.last_month) / 100, yearToDate: Number(summary.year_to_date) / 100,
        pendingAmount: Number(summary.pending_amount) / 100, refundedAmount: Number(summary.refunded_amount) / 100, paidCount: summary.paid_count },
      byMonth: byMonth.map(row => ({ month: row.month, amount: Number(row.amount) / 100 })),
      byMethod: byMethod.map(row => ({ method: row.method, amount: Number(row.amount) / 100, share: paidTotal ? Math.round(Number(row.amount) / paidTotal * 100) : 0 })),
      byCourse: byCourse.map(row => ({ courseId: row.course_id, courseTitle: row.title, amount: Number(row.amount) / 100, count: row.count })),
      transactions: transactions.map(row => ({ ...paymentDto(row), userId: row.user_id, studentId: row.user_id, studentName: row.full_name })),
    };
  });
  route('GET', '/announcements', { query: pageQuery }, async request => (await database.query('SELECT * FROM announcements WHERE is_published AND published_at<=now() ORDER BY pinned DESC,published_at DESC,id LIMIT $1 OFFSET $2', [request.query.limit, request.query.offset])).rows.map(announcementDto));
  route('GET', '/admin/announcements', { auth: 'admin', query: pageQuery }, async request => (await database.query('SELECT * FROM announcements ORDER BY pinned DESC,published_at DESC,id LIMIT $1 OFFSET $2', [request.query.limit, request.query.offset])).rows.map(announcementDto));
  async function saveAnnouncement(request, creating) {
    return database.transaction(async transaction => {
      const existing = creating ? null : await one(transaction, 'SELECT * FROM announcements WHERE id=$1 FOR UPDATE', [request.params.id]);
      if (!creating) ensure(existing, 404, 'NOT_FOUND', 'Announcement not found.');
      const previous = existing ? { title: existing.title, body: existing.body, category: existing.category, pinned: existing.pinned, isPublished: existing.is_published, publishedAt: new Date(existing.published_at).toISOString() } : {};
      const input = announcementFields.parse({ ...previous, ...request.body });
      const values = [input.title, input.body, input.category, input.pinned, input.isPublished, input.publishedAt ?? new Date().toISOString()];
      const saved = creating
        ? await one(transaction, 'INSERT INTO announcements(title,body,category,pinned,is_published,published_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', values)
        : await one(transaction, 'UPDATE announcements SET title=$1,body=$2,category=$3,pinned=$4,is_published=$5,published_at=$6 WHERE id=$7 RETURNING *', [...values, existing.id]);
      await audit(transaction, request.auth.user_id, creating ? 'announcement.created' : 'announcement.updated', saved.id);
      return announcementDto(saved);
    });
  }
  route('POST', '/admin/announcements', { auth: 'admin', body: announcementFields }, request => saveAnnouncement(request, true));
  route('PATCH', '/admin/announcements/:id', { auth: 'admin', body: announcementFields.partial() }, request => saveAnnouncement(request, false));
  route('DELETE', '/admin/announcements/:id', { auth: 'admin' }, async request => database.transaction(async transaction => {
    const removed = await one(transaction, 'DELETE FROM announcements WHERE id=$1 RETURNING id', [request.params.id]);
    ensure(removed, 404, 'NOT_FOUND', 'Announcement not found.');
    await audit(transaction, request.auth.user_id, 'announcement.deleted', removed.id);
    return { ok: true };
  }));

  route('GET', '/admin/stats', { auth: 'admin' }, async () => {
    const users = await one(database, `SELECT count(*) FILTER(WHERE role='student')::int AS "totalStudents",
      count(*) FILTER(WHERE role='student' AND status='awaiting_approval')::int AS "pendingApprovals",
      count(*) FILTER(WHERE role='student' AND created_at>=now()-interval '7 days')::int AS "newRegistrations7d" FROM users`);
    const courses = await one(database, 'SELECT count(*) FILTER(WHERE is_published)::int AS "activeCourses" FROM courses');
    const revenue = await one(database, `SELECT COALESCE(sum(amount_minor),0)::bigint AS total FROM payments WHERE status='paid' AND paid_at>=date_trunc('month',now() AT TIME ZONE 'Asia/Dhaka') AT TIME ZONE 'Asia/Dhaka'`);
    const exams = await one(database, `SELECT count(*)::int AS "totalExams",count(*) FILTER(WHERE is_published AND scheduled_at>=date_trunc('week',now()) AND scheduled_at<date_trunc('week',now())+interval '7 days')::int AS "examsThisWeek" FROM exams`);
    const videos = await one(database, 'SELECT count(*)::int AS "totalVideos" FROM lessons');
    const schedules = await one(database, 'SELECT count(*)::int AS "scheduleEntries" FROM schedules');
    return { ...users, ...courses, ...exams, ...videos, ...schedules, revenueThisMonth: Number(revenue.total) / 100 };
  });
  route('GET', '/admin/reports', { auth: 'admin' }, async () => {
    const months = (await database.query(`SELECT to_char(date_trunc('month',paid_at AT TIME ZONE 'Asia/Dhaka'),'YYYY-MM') AS month,sum(amount_minor)::bigint AS amount
      FROM payments WHERE status='paid' AND paid_at>=now()-interval '12 months' GROUP BY month ORDER BY month`)).rows;
    const categories = (await database.query(`SELECT c.category,count(*)::int AS count FROM enrollments e JOIN courses c ON c.id=e.course_id
      WHERE e.status='active' AND e.expires_at>now() GROUP BY c.category ORDER BY c.category`)).rows;
    const exams = await one(database, 'SELECT count(DISTINCT exam_id)::int AS held,COALESCE(avg((result->>\'score\')::numeric/NULLIF((result->>\'totalMarks\')::numeric,0)*100),0) AS score FROM exam_attempts WHERE submitted_at IS NOT NULL');
    const participation = await one(database, 'SELECT count(*)::int AS started,count(*) FILTER(WHERE submitted_at IS NOT NULL)::int AS submitted FROM exam_attempts');
    return { revenueByMonth: months.map(row => ({ month: row.month, amount: Number(row.amount) / 100 })), enrolmentByCategory: categories,
      examParticipation: { averageAttendance: participation.started ? Math.round(participation.submitted / participation.started * 100) : 0, examsHeld: exams.held, averageScore: Number(exams.score) } };
  });
}