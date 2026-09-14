import { z } from 'zod';
import { one } from '../db.js';
import { audit, ensure, text, password, pageQuery } from '../http.js';
import { hashPassword, verifyPassword, publicUser } from '../security.js';
import { enqueueSms } from '../sms.js';
import { paymentDto } from './billing.js';

const profileValue = z.string().trim().max(300);
const profileSchemas = {
  basic: z.object({ name: text.min(2).max(100).optional(), fatherName: profileValue.optional(), bmdcNo: profileValue.max(30).optional(), medicalSession: profileValue.optional(), dateOfBirth: z.union([z.string().date(), z.literal('')]).optional(), gender: profileValue.optional(), bloodGroup: profileValue.optional() }).strict(),
  contact: z.object({ mobile: profileValue.optional(), email: z.union([z.string().email().max(254), z.literal('')]).optional(), medicalCollege: profileValue.max(120).optional(), facebookId: profileValue.optional() }).strict(),
  address: z.object({ division: profileValue.optional(), district: profileValue.optional(), upazila: profileValue.optional(), presentAddress: profileValue.optional() }).strict(),
};

function profileDto(user) {
  return { photoUrl: null, isVerified: Boolean(user.mobile_verified_at),
    basic: { fatherName: '', medicalSession: '', dateOfBirth: '', gender: '', bloodGroup: '', ...user.profile.basic, name: user.full_name, bmdcNo: user.bmdc_number },
    contact: { facebookId: '', ...user.profile.contact, mobile: user.mobile, email: user.email || '', medicalCollege: user.institution },
    address: { division: '', district: '', upazila: '', presentAddress: '', ...user.profile.address } };
}

/** Short, stable registration number shown to students; derived from the enrolment id. */
export function registrationNumber(enrollmentId, createdAt) {
  return `${new Date(createdAt).getUTCFullYear().toString().slice(-2)}${enrollmentId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

export async function myCourses(database, userId) {
  const rows = (await database.query(`SELECT e.*,c.slug,c.title,c.category,
    (SELECT count(*)::int FROM lessons l WHERE l.course_id=c.id AND l.status='published' AND l.scheduled_at<=now()) AS lesson_count,
    (SELECT count(*)::int FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=e.user_id AND l.course_id=c.id AND l.status='published' AND l.scheduled_at<=now()) AS completed_lessons,
    (SELECT jsonb_build_object('id',l.id,'title',l.title) FROM lessons l WHERE l.course_id=c.id AND l.status='published' AND l.scheduled_at<=now()
      AND NOT EXISTS(SELECT 1 FROM lesson_progress p WHERE p.user_id=e.user_id AND p.lesson_id=l.id) ORDER BY l.position,l.id LIMIT 1) AS next_lesson
    FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=$1 ORDER BY e.created_at DESC,e.id`, [userId])).rows;
  return rows.map(row => ({ id: row.id, regNo: registrationNumber(row.id, row.created_at), courseId: row.course_id, slug: row.slug, title: row.title, courseTitle: row.title, category: row.category,
    status: row.status === 'active' && new Date(row.expires_at).getTime() <= Date.now() ? 'expired' : row.status,
    lessonCount: row.lesson_count, completedLessons: row.completed_lessons,
    progress: row.lesson_count ? Math.round(row.completed_lessons / row.lesson_count * 100) : 0,
    nextLesson: row.next_lesson, enrolledAt: row.created_at, expiresOn: row.expires_at }));
}

const complaintSelect = `SELECT c.*,COALESCE((SELECT jsonb_agg(jsonb_build_object('id',m.id,'from',m.sender,'body',m.body,'sentAt',m.sent_at) ORDER BY m.sent_at,m.id)
  FROM complaint_messages m WHERE m.complaint_id=c.id),'[]'::jsonb) AS messages FROM complaints c`;
function complaintDto(row) {
  return { id: row.id, relatedTo: row.related_to, batchTitle: row.batch_title, status: row.status, createdAt: row.created_at, messages: row.messages };
}

export function studentRoutes(route, database, config) {
  route('GET', '/me/enrollments', { auth: 'active' }, request => myCourses(database, request.auth.user_id));
  route('GET', '/me/progress', { auth: 'active' }, async request => {
    const courses = await myCourses(database, request.auth.user_id);
    const lessonsTotal = courses.reduce((total, course) => total + course.lessonCount, 0);
    const lessonsCompleted = courses.reduce((total, course) => total + course.completedLessons, 0);
    const summary = await one(database, `SELECT count(*)::int AS exams_taken,COALESCE(avg((a.result->>'score')::numeric/NULLIF((a.result->>'totalMarks')::numeric,0)*100),0) AS average_score
      FROM exam_attempts a JOIN exams x ON x.id=a.exam_id WHERE a.user_id=$1 AND a.submitted_at IS NOT NULL AND (x.results_at IS NULL OR x.results_at<=now())`, [request.auth.user_id]);
    const study = await one(database, 'SELECT COALESCE(sum(l.duration_minutes),0)::int AS minutes FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=$1', [request.auth.user_id]);
    const activity = (await database.query(`SELECT to_char(p.completed_at AT TIME ZONE 'Asia/Dhaka','Dy') AS day,sum(l.duration_minutes)::int AS minutes
      FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=$1 AND p.completed_at>=now()-interval '7 days'
      GROUP BY (p.completed_at AT TIME ZONE 'Asia/Dhaka')::date,day ORDER BY (p.completed_at AT TIME ZONE 'Asia/Dhaka')::date`, [request.auth.user_id])).rows;
    return { overallProgress: lessonsTotal ? Math.round(lessonsCompleted / lessonsTotal * 100) : 0, lessonsCompleted, lessonsTotal,
      studyHours: Math.round(study.minutes / 60), examsTaken: summary.exams_taken, averageScore: Number(summary.average_score),
      bestRank: null, weakTopics: [], strongTopics: [], weeklyActivity: activity };
  });
  route('GET', '/me/profile', { auth: 'active' }, async request => profileDto(await one(database, 'SELECT * FROM users WHERE id=$1', [request.auth.user_id])));
  route('PATCH', '/me/profile', { auth: 'active', body: z.object({ section: z.enum(['basic', 'contact', 'address']), values: z.record(z.unknown()) }).strict() }, async request => database.transaction(async transaction => {
    const user = await one(transaction, 'SELECT * FROM users WHERE id=$1 FOR UPDATE', [request.auth.user_id]);
    const { section } = request.body;
    const values = profileSchemas[section].parse(request.body.values);
    if (section === 'contact' && values.mobile !== undefined) ensure(values.mobile === user.mobile, 400, 'MOBILE_CHANGE_REQUIRES_VERIFICATION', 'Mobile number changes require separate verification.');
    const profile = { ...user.profile, [section]: { ...user.profile[section], ...values } };
    const updated = await one(transaction, `UPDATE users SET profile=$2,full_name=$3,bmdc_number=$4,email=$5,institution=$6 WHERE id=$1 RETURNING *`,
      [user.id, JSON.stringify(profile), section === 'basic' ? values.name ?? user.full_name : user.full_name,
        section === 'basic' ? values.bmdcNo ?? user.bmdc_number : user.bmdc_number,
        section === 'contact' ? values.email ?? user.email : user.email,
        section === 'contact' ? values.medicalCollege ?? user.institution : user.institution]);
    return profileDto(updated);
  }));
  route('POST', '/me/password', { auth: 'active', body: z.object({ currentPassword: z.string().min(1).max(128), newPassword: password }).strict(), rateLimit: { max: 10, timeWindow: '15 minutes' } }, async request => {
    const hash = await hashPassword(request.body.newPassword);
    return database.transaction(async transaction => {
      const user = await one(transaction, 'SELECT * FROM users WHERE id=$1 FOR UPDATE', [request.auth.user_id]);
      ensure(await verifyPassword(request.body.currentPassword, user.password_hash), 400, 'INVALID_PASSWORD', 'The current password is incorrect.');
      await transaction.query('UPDATE users SET password_hash=$2 WHERE id=$1', [user.id, hash]);
      await transaction.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [user.id]);
      await audit(transaction, user.id, 'auth.password_changed', user.id);
      return { ok: true, requiresReauthentication: true };
    });
  });
  route('GET', '/me/devices', { auth: 'active' }, async request => {
    const current = { id: request.auth.device_id, label: 'Current browser', platform: 'Web', browser: 'Browser', type: 'desktop', isVerified: true };
    return { verified: [current], current };
  });
  route('POST', '/me/devices/verify-request', { auth: 'active', body: z.object({ reason: z.string().trim().min(10).max(2000) }).strict() }, async request => {
    const row = await one(database, "INSERT INTO device_requests(user_id,device_id,reason) VALUES ($1,$2,$3) ON CONFLICT(user_id) WHERE status='pending_review' DO UPDATE SET reason=EXCLUDED.reason RETURNING id,status", [request.auth.user_id, request.auth.device_id, request.body.reason]);
    return { ok: true, ...row };
  });

  route('GET', '/me/complaints', { auth: 'active', query: pageQuery }, async request => (await database.query(`${complaintSelect} WHERE c.user_id=$1 ORDER BY c.created_at DESC,c.id LIMIT $2 OFFSET $3`, [request.auth.user_id, request.query.limit, request.query.offset])).rows.map(complaintDto));
  route('GET', '/me/complaints/:id', { auth: 'active' }, async request => {
    const complaint = await one(database, `${complaintSelect} WHERE c.id=$1 AND c.user_id=$2`, [request.params.id, request.auth.user_id]);
    ensure(complaint, 404, 'COMPLAINT_NOT_FOUND', 'Complaint not found.');
    return complaintDto(complaint);
  });
  route('POST', '/me/complaints', { auth: 'active', body: z.object({ relatedTo: z.enum(['Lecture Sheet / Books', 'Class & Schedule', 'Exam & Result', 'Payment & Invoice', 'Device / Login Problem', 'Other']), batchTitle: z.string().max(200).default(''), body: z.string().trim().min(1).max(5000) }).strict(), rateLimit: { max: 10, timeWindow: '1 hour' } }, async request => database.transaction(async transaction => {
    const input = request.body;
    const complaint = await one(transaction, 'INSERT INTO complaints(user_id,related_to,batch_title) VALUES ($1,$2,$3) RETURNING id', [request.auth.user_id, input.relatedTo, input.batchTitle]);
    await transaction.query("INSERT INTO complaint_messages(complaint_id,author_id,sender,body) VALUES ($1,$2,'student',$3)", [complaint.id, request.auth.user_id, input.body]);
    return complaintDto(await one(transaction, `${complaintSelect} WHERE c.id=$1`, [complaint.id]));
  }));
  for (const admin of [false, true]) {
    route('POST', `/${admin ? 'admin' : 'me'}/complaints/:id/replies`, { auth: admin ? 'admin' : 'active', body: z.object({ body: z.string().trim().min(1).max(5000) }).strict() }, async request => database.transaction(async transaction => {
      const complaint = await one(transaction, `SELECT * FROM complaints WHERE id=$1 ${admin ? '' : 'AND user_id=$2'} FOR UPDATE`, admin ? [request.params.id] : [request.params.id, request.auth.user_id]);
      ensure(complaint, 404, 'COMPLAINT_NOT_FOUND', 'Complaint not found.');
      ensure(complaint.status !== 'solved', 409, 'COMPLAINT_CLOSED', 'This complaint is closed.');
      await transaction.query('INSERT INTO complaint_messages(complaint_id,author_id,sender,body) VALUES ($1,$2,$3,$4)', [complaint.id, request.auth.user_id, admin ? 'academy' : 'student', request.body.body]);
      await transaction.query('UPDATE complaints SET status=$2 WHERE id=$1', [complaint.id, admin ? 'answered' : 'open']);
      if (admin) await audit(transaction, request.auth.user_id, 'complaint.replied', complaint.id);
      return complaintDto(await one(transaction, `${complaintSelect} WHERE c.id=$1`, [complaint.id]));
    }));
  }
  route('GET', '/admin/complaints', { auth: 'admin', query: pageQuery }, async request => (await database.query(`${complaintSelect} ORDER BY c.created_at DESC,c.id LIMIT $1 OFFSET $2`, [request.query.limit, request.query.offset])).rows.map(row => ({ ...complaintDto(row), userId: row.user_id })));
  route('PATCH', '/admin/complaints/:id/status', { auth: 'admin', body: z.object({ status: z.enum(['open', 'solved']) }).strict() }, async request => database.transaction(async transaction => {
    const complaint = await one(transaction, 'UPDATE complaints SET status=$2 WHERE id=$1 RETURNING id', [request.params.id, request.body.status]);
    ensure(complaint, 404, 'NOT_FOUND', 'Complaint not found.');
    await audit(transaction, request.auth.user_id, 'complaint.status_changed', complaint.id, request.body);
    return { ok: true };
  }));

  route('GET', '/admin/students', { auth: 'admin', query: pageQuery.extend({ status: z.enum(['ALL', 'otp_pending', 'awaiting_approval', 'active', 'rejected', 'suspended']).optional(), search: z.string().max(100).optional() }) }, async request => {
    const search = request.query.search ? `%${request.query.search.replace(/[\\%_]/g, character => `\\${character}`)}%` : null;
    return (await database.query(`SELECT u.*,(SELECT count(*)::int FROM enrollments e WHERE e.user_id=u.id AND e.status='active' AND e.expires_at>now()) AS enrolment_count
    FROM users u WHERE role='student' AND ($1::text IS NULL OR $1='ALL' OR status=$1)
    AND ($2::text IS NULL OR full_name ILIKE $2 OR mobile=$3) ORDER BY created_at DESC,id LIMIT $4 OFFSET $5`, [request.query.status || null, search, request.query.search || null, request.query.limit, request.query.offset])).rows.map(row => ({ ...publicUser(row), interest: row.interest, enrolmentCount: row.enrolment_count }));
  });
  route('GET', '/admin/students/:id', { auth: 'admin' }, async request => {
    const user = await one(database, "SELECT * FROM users WHERE id=$1 AND role='student'", [request.params.id]);
    ensure(user, 404, 'STUDENT_NOT_FOUND', 'Student not found.');
    return { ...publicUser(user), interest: user.interest, profile: profileDto(user), enrollments: await myCourses(database, user.id) };
  });
  route('GET', '/admin/students/:id/payments', { auth: 'admin', query: pageQuery }, async request => {
    const user = await one(database, "SELECT id FROM users WHERE id=$1 AND role='student'", [request.params.id]);
    ensure(user, 404, 'STUDENT_NOT_FOUND', 'Student not found.');
    return (await database.query('SELECT * FROM payments WHERE user_id=$1 ORDER BY created_at DESC,id LIMIT $2 OFFSET $3', [user.id, request.query.limit, request.query.offset])).rows.map(row => ({ ...paymentDto(row), userId: row.user_id }));
  });
  route('PATCH', '/admin/students/:id/status', { auth: 'admin', body: z.object({ status: z.enum(['active', 'rejected', 'suspended']) }).strict() }, async request => database.transaction(async transaction => {
    const user = await one(transaction, "SELECT * FROM users WHERE id=$1 AND role='student' FOR UPDATE", [request.params.id]);
    ensure(user, 404, 'STUDENT_NOT_FOUND', 'Student not found.');
    const next = request.body.status;
    if (user.status === next) return { ok: true, studentId: user.id, status: next };
    const transitions = { awaiting_approval: ['active', 'rejected'], active: ['suspended'], suspended: ['active'] };
    ensure(transitions[user.status]?.includes(next) && user.mobile_verified_at, 409, 'INVALID_STATUS_TRANSITION', 'This account cannot transition to that status.');
    await transaction.query('UPDATE users SET status=$2 WHERE id=$1', [user.id, next]);
    if (next !== 'active') await transaction.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [user.id]);
    await audit(transaction, request.auth.user_id, 'student.status_changed', user.id, { previous: user.status, status: next });
    if (config.smsMode !== 'disabled') await enqueueSms(transaction, config, user, `Your CPR Academy account status is now ${next}.`, 86400);
    return { ok: true, studentId: user.id, status: next, smsQueued: config.smsMode !== 'disabled' };
  }));
  route('GET', '/admin/device-requests', { auth: 'admin', query: pageQuery }, async request => (await database.query('SELECT id,user_id AS "userId",device_id AS "deviceId",reason,status,created_at AS "createdAt" FROM device_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2', [request.query.limit, request.query.offset])).rows);
  route('PATCH', '/admin/device-requests/:id', { auth: 'admin', body: z.object({ status: z.literal('resolved') }).strict() }, async request => database.transaction(async transaction => {
    const item = await one(transaction, "UPDATE device_requests SET status='resolved' WHERE id=$1 RETURNING id", [request.params.id]);
    ensure(item, 404, 'NOT_FOUND', 'Device request not found.');
    await audit(transaction, request.auth.user_id, 'device_request.resolved', item.id);
    return { ok: true };
  }));
  route('GET', '/admin/audit-log', { auth: 'admin', query: pageQuery }, async request => (await database.query('SELECT id,actor_id AS "actorId",action,entity_id AS "entityId",details,created_at AS "createdAt" FROM audit_log ORDER BY created_at DESC,id LIMIT $1 OFFSET $2', [request.query.limit, request.query.offset])).rows);
}