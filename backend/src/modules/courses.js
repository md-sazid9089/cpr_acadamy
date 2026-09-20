import { z } from 'zod';
import { one } from '../db.js';
import { ensure, uuid, text, pageQuery, audit, ApiError } from '../http.js';
import { signContentToken, verifyContentToken } from '../security.js';

export const money = z.number().min(0).max(1000000).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001, 'Use at most two decimal places');
const timestamp = z.string().datetime({ offset: true });
export const webUrl = z.string().url().max(2048).refine(value => value.startsWith('https://'), 'An HTTPS URL is required');
// Posters may be self-hosted under the frontend's /assets folder as well as on an HTTPS CDN.
const imagePath = z.union([webUrl, z.string().regex(/^\/[A-Za-z0-9_\-./%]{1,500}$/), z.literal('')]);
const clock = z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), z.literal('')]);
const metadata = z.object({
  subtitle: z.string().max(500).default(''), description: z.string().max(20000).default(''),
  thumbnailUrl: imagePath.default(''), highlights: z.array(text).max(20).default([]),
  duration: z.string().max(100).default(''), batchGroup: z.string().max(80).default(''), batchType: z.string().max(80).default(''),
  session: z.string().max(80).default(''), branch: z.enum(['online', 'offline']).default('online'),
  startsOn: timestamp.nullable().default(null), isFeatured: z.boolean().default(false),
  classTime: z.object({ start: clock.default(''), end: clock.default('') }).strict().default({ start: '', end: '' }),
  classDays: z.array(z.enum(['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'])).max(7).default([]),
  offer: z.object({ label: z.string().trim().min(1).max(120), endsAt: timestamp.nullable().default(null) }).strict().nullable().default(null),
}).strict();
const courseFields = z.object({
  slug: z.string().min(3).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: text,
  category: z.enum(['FCPS', 'BCS', 'MBBS']), price: money, discountPrice: money.nullable().optional(),
  accessDays: z.number().int().min(1).max(3650).default(180), isPublished: z.boolean().default(false),
  ...metadata.shape,
}).strict();
const instructorReviewFields = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().trim().min(1).max(2000),
}).strict();
const videoFields = z.object({
  courseId: uuid, title: text, src: z.union([webUrl, z.literal('')]).default(''), notesUrl: z.union([webUrl, z.literal('')]).default(''),
  durationMinutes: z.number().int().min(0).max(1440).default(0), scheduledAt: timestamp,
  status: z.enum(['draft', 'published']).default('draft'), position: z.number().int().min(0).max(100000).default(0),
  chapterId: uuid.nullable().default(null),
}).strict();
const chapterFields = z.object({
  courseId: uuid, title: text, position: z.number().int().min(0).max(100000).default(0),
}).strict();
const scheduleFields = z.object({
  courseId: uuid, scheduledAt: timestamp, exam: text.default('NO EXAM'), solveClass: text.default('NO CLASS'), lecture: text.default('NO CLASS'),
  examId: uuid.nullable().default(null), solveClassVideoId: uuid.nullable().default(null), lectureVideoId: uuid.nullable().default(null),
}).strict();
// Facet filters arrive as one comma-separated query value (`?batchTypes=a,b`).
const facetList = z.preprocess(value => typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(Boolean) : value, z.array(z.string().max(80)).max(20)).optional();
const catalogQuery = pageQuery.extend({
  category: z.enum(['FCPS', 'BCS', 'MBBS', 'ALL']).optional(), group: z.string().max(80).optional(),
  search: z.string().max(200).optional(), featured: z.enum(['true', 'false']).optional(),
  batchTypes: facetList, sessions: facetList, branches: facetList,
});

export function courseDto(row) {
  return { ...metadata.parse(row.metadata ?? {}), id: row.id, slug: row.slug, title: row.title, category: row.category,
    price: row.price_minor / 100, discountPrice: row.discount_minor === null ? null : row.discount_minor / 100,
    accessDays: row.access_days, isPublished: row.is_published, status: row.is_published ? 'published' : 'draft',
    lessonCount: Number(row.lesson_count || 0), enrolledCount: Number(row.enrolled_count || 0), enrolled: Number(row.enrolled_count || 0), createdAt: row.created_at };
}

const dhaka = { timeZone: 'Asia/Dhaka' };
const isoDate = new Intl.DateTimeFormat('en-CA', { ...dhaka, year: 'numeric', month: '2-digit', day: '2-digit' });
const clock12 = new Intl.DateTimeFormat('en-US', { ...dhaka, hour: '2-digit', minute: '2-digit', hour12: true });
const clock24 = new Intl.DateTimeFormat('en-GB', { ...dhaka, hour: '2-digit', minute: '2-digit', hour12: false });
// en-US for the month: en-GB abbreviates September as "Sept".
const dayPart = new Intl.DateTimeFormat('en-GB', { ...dhaka, day: '2-digit' });
const monthPart = new Intl.DateTimeFormat('en-US', { ...dhaka, month: 'short' });
const yearPart = new Intl.DateTimeFormat('en-GB', { ...dhaka, year: 'numeric' });
const weekday = new Intl.DateTimeFormat('en-GB', { ...dhaka, weekday: 'long' });
const longDate = { format: date => `${dayPart.format(date)} ${monthPart.format(date)} ${yearPart.format(date)}` };

export function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return `${hours}h ${String(rest).padStart(2, '0')}m`;
}

export async function requireCourseAccess(database, auth, courseId) {
  if (auth.role === 'admin') return;
  const enrollment = await one(database, `SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2 AND status='active' AND starts_at<=now() AND expires_at>now()`, [auth.user_id, courseId]);
  ensure(enrollment, 403, 'ENROLLMENT_REQUIRED', 'An active enrollment is required.');
}

export function videoDto(row) {
  const date = new Date(row.scheduled_at);
  return { id: row.id, courseId: row.course_id, courseName: row.course_name, title: row.title, src: row.src, videoUrl: row.src, notesUrl: row.notes_url ?? '',
    chapterId: row.chapter_id ?? null, chapterTitle: row.chapter_title ?? null,
    scheduledAt: row.scheduled_at, scheduledDate: isoDate.format(date), scheduledTime: clock12.format(date), duration: formatMinutes(row.duration_minutes),
    durationMinutes: row.duration_minutes, status: row.status, position: row.position };
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'youtu.be', 'youtube-nocookie.com']);
export function isYouTubeUrl(url) {
  if (!url) return false;
  try { return YOUTUBE_HOSTS.has(new URL(url).hostname.replace(/^(www|m)\./, '')); }
  catch { return false; }
}

// The student-facing shape of a lesson. A YouTube link is inherently public (the
// iframe embed needs the real URL and the video ID is the actual access boundary
// already), but a directly-hosted file's permanent URL must never reach the
// client — it would keep working forever, bypassing enrollment expiry and
// letting anyone who copies it stream or download the paid file. Those are
// fetched just-in-time through a short-lived signed link (see /content/:token).
export function publicVideoDto(row) {
  const dto = videoDto(row);
  const youTube = isYouTubeUrl(row.src);
  return { ...dto, src: youTube ? dto.src : '', videoUrl: youTube ? dto.videoUrl : '', notesUrl: '',
    hasVideo: Boolean(row.src), hasNotes: Boolean(row.notes_url), videoIsFile: Boolean(row.src) && !youTube };
}

export function chapterDto(row) {
  return { id: row.id, courseId: row.course_id, title: row.title, position: row.position, videoCount: Number(row.video_count || 0) };
}

export function scheduleDto(row) {
  const date = new Date(row.scheduled_at);
  return { id: row.id, courseId: row.course_id, courseName: row.course_name, scheduledAt: row.scheduled_at,
    date: isoDate.format(date), time: clock24.format(date), dateTime: `${longDate.format(date)}, ${weekday.format(date)}\n${clock12.format(date)}`,
    exam: row.exam, solveClass: row.solve_class, lecture: row.lecture,
    examId: row.exam_id ?? null, solveClassVideoId: row.solve_lesson_id ?? null, lectureVideoId: row.lecture_lesson_id ?? null };
}

const courseSelect = `SELECT c.*,
  (SELECT count(*) FROM lessons l WHERE l.course_id=c.id AND l.status='published') AS lesson_count,
  (SELECT count(*) FROM enrollments e WHERE e.course_id=c.id AND e.status='active' AND e.expires_at>now()) AS enrolled_count FROM courses c`;

export function courseRoutes(route, database, config) {
  route('GET', '/courses', { query: catalogQuery }, async request => {
    const query = request.query;
    const values = [];
    const conditions = ['c.is_published'];
    function filter(sql, value) { values.push(value); conditions.push(sql.replace('?', `$${values.length}`)); }
    if (query.category && query.category !== 'ALL') filter('c.category=?', query.category);
    if (query.group) filter("c.metadata->>'batchGroup'=?", query.group);
    if (query.featured === 'true') conditions.push("c.metadata->>'isFeatured'='true'");
    if (query.search) filter("(c.title || ' ' || COALESCE(c.metadata->>'subtitle','')) ILIKE ?", `%${query.search.replace(/[\\%_]/g, character => `\\${character}`)}%`);
    for (const [field, key] of [['batchTypes', 'batchType'], ['sessions', 'session'], ['branches', 'branch']]) {
      if (query[field]?.length) filter(`c.metadata->>'${key}'=ANY(?::text[])`, query[field]);
    }
    values.push(query.limit, query.offset);
    const rows = (await database.query(`${courseSelect} WHERE ${conditions.join(' AND ')} ORDER BY c.created_at DESC,c.id LIMIT $${values.length - 1} OFFSET $${values.length}`, values)).rows;
    return rows.map(courseDto);
  });
  route('GET', '/courses/:slug', {}, async request => {
    const course = await one(database, `${courseSelect} WHERE c.slug=$1 AND c.is_published`, [request.params.slug]);
    ensure(course, 404, 'COURSE_NOT_FOUND', 'This course could not be found.');
    const lessons = (await database.query("SELECT id,title,duration_minutes FROM lessons WHERE course_id=$1 AND status='published' ORDER BY position,id", [course.id])).rows;
    return { ...courseDto(course), curriculum: [{ id: course.id, title: 'Lectures', lessons: lessons.map(lesson => ({ id: lesson.id, title: lesson.title, durationMinutes: lesson.duration_minutes })) }] };
  });
  async function reviewCourse(slug) {
    const course = await one(database, 'SELECT id FROM courses WHERE slug=$1 AND is_published', [slug]);
    ensure(course, 404, 'COURSE_NOT_FOUND', 'This course could not be found.');
    return course;
  }
  async function canReview(auth, courseId) {
    if (auth.role !== 'student') return false;
    return Boolean(await one(database, "SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2 AND status='active' AND starts_at<=now() AND expires_at>now()", [auth.user_id, courseId]));
  }
  route('GET', '/courses/:slug/reviews', { query: pageQuery }, async request => {
    const course = await reviewCourse(request.params.slug);
    const summary = await one(database, 'SELECT count(*) AS total, COALESCE(avg(rating),0) AS average FROM instructor_reviews WHERE course_id=$1', [course.id]);
    const reviews = (await database.query(`SELECT review.id, review.rating, review.feedback, review.updated_at AS "updatedAt", student.full_name AS "studentName"
      FROM instructor_reviews review JOIN users student ON student.id=review.user_id
      WHERE review.course_id=$1 ORDER BY review.updated_at DESC,review.id LIMIT $2 OFFSET $3`, [course.id, request.query.limit, request.query.offset])).rows;
    return { total: Number(summary.total), average: Number(summary.average), reviews };
  });
  route('GET', '/courses/:slug/review', { auth: 'active' }, async request => {
    const course = await reviewCourse(request.params.slug);
    const review = await one(database, 'SELECT id,rating,feedback FROM instructor_reviews WHERE course_id=$1 AND user_id=$2', [course.id, request.auth.user_id]);
    return { canReview: await canReview(request.auth, course.id), review: review ?? null };
  });
  route('POST', '/courses/:slug/review', { auth: 'active', body: instructorReviewFields }, async request => {
    const course = await reviewCourse(request.params.slug);
    ensure(await canReview(request.auth, course.id), 403, 'ENROLLMENT_REQUIRED', 'An active student enrollment is required to review this instructor.');
    return one(database, `INSERT INTO instructor_reviews(course_id,user_id,rating,feedback) VALUES ($1,$2,$3,$4)
      ON CONFLICT(course_id,user_id) DO UPDATE SET rating=EXCLUDED.rating,feedback=EXCLUDED.feedback,updated_at=now()
      RETURNING id,rating,feedback`, [course.id, request.auth.user_id, request.body.rating, request.body.feedback]);
  });
  route('DELETE', '/courses/:slug/review', { auth: 'active' }, async request => {
    const course = await reviewCourse(request.params.slug);
    await database.query('DELETE FROM instructor_reviews WHERE course_id=$1 AND user_id=$2', [course.id, request.auth.user_id]);
    return { ok: true };
  });
  route('POST', '/courses/:id/enroll', { auth: 'active' }, async request => {
    const course = await one(database, 'SELECT * FROM courses WHERE id=$1 AND is_published', [request.params.id]);
    ensure(course, 404, 'COURSE_NOT_FOUND', 'This course could not be found.');
    const enrollment = await one(database, `INSERT INTO enrollments(user_id,course_id) VALUES ($1,$2)
      ON CONFLICT(user_id,course_id) DO UPDATE SET course_id=EXCLUDED.course_id RETURNING *`, [request.auth.user_id, course.id]);
    return { ok: true, courseId: course.id, enrollmentId: enrollment.id, redirectTo: `/dashboard/checkout/${course.slug}` };
  });
  route('GET', '/courses/:slug/videos', { auth: 'active' }, async request => {
    const course = await one(database, 'SELECT id FROM courses WHERE slug=$1', [request.params.slug]);
    ensure(course, 404, 'COURSE_NOT_FOUND', 'This course could not be found.');
    await requireCourseAccess(database, request.auth, course.id);
    const rows = (await database.query(`SELECT l.*, ch.title AS chapter_title FROM lessons l LEFT JOIN chapters ch ON ch.id=l.chapter_id
      WHERE l.course_id=$1 AND l.status='published' AND l.scheduled_at<=now()
      ORDER BY COALESCE(ch.position,999999), l.chapter_id IS NULL, l.position, l.scheduled_at, l.id`, [course.id])).rows;
    const groups = new Map();
    for (const row of rows) {
      const video = publicVideoDto(row);
      const key = video.chapterId ?? 'uncategorized';
      if (!groups.has(key)) groups.set(key, { chapterId: video.chapterId, chapterTitle: video.chapterTitle ?? 'Uncategorized', videos: [] });
      groups.get(key).videos.push(video);
    }
    return [...groups.values()];
  });

  async function lessonContent(auth, id, kind) {
    const lesson = await one(database, 'SELECT * FROM lessons WHERE id=$1', [id]);
    ensure(lesson, 404, 'NOT_FOUND', 'Lesson not found.');
    if (auth.role !== 'admin') ensure(lesson.status === 'published' && new Date(lesson.scheduled_at) <= new Date(), 404, 'NOT_FOUND', 'Lesson not found.');
    await requireCourseAccess(database, auth, lesson.course_id);
    const url = kind === 'notes' ? lesson.notes_url : lesson.src;
    ensure(url, 404, 'NOT_FOUND', kind === 'notes' ? 'No lecture notes for this lesson.' : 'No video for this lesson.');
    return { lesson, url };
  }

  // Issues a short-lived signed link rather than the permanent source URL. Enrollment
  // is re-checked on every call, so unenrolling or expiring access stops new links
  // from being minted even though a link already handed out keeps working until it expires.
  route('GET', '/lessons/:id/content-url', { auth: 'active', query: z.object({ kind: z.enum(['video', 'notes']) }) }, async request => {
    const { lesson, url } = await lessonContent(request.auth, request.params.id, request.query.kind);
    ensure(!isYouTubeUrl(url), 400, 'DIRECT_LINK_ONLY', 'This lesson plays directly; no signed link is issued for it.');
    // Notes are a single download, so a few minutes is plenty. A video's playback session can
    // run far longer than that, so its link outlives the lecture (with headroom for pausing).
    const ttlSeconds = request.query.kind === 'notes' ? 300 : Math.min(6 * 3600, Math.max(1800, (lesson.duration_minutes || 60) * 120));
    const token = signContentToken({ lessonId: lesson.id, kind: request.query.kind }, config.tokenSecret, ttlSeconds);
    return { url: `/api/content/${token}`, expiresIn: ttlSeconds };
  });

  // No `auth` here by design: this URL is embedded directly in a <video src> / <a href>,
  // which cannot carry an Authorization header. The signed, expiring token IS the credential.
  route('GET', '/content/:token', { rateLimit: { max: 600, timeWindow: '1 minute' } }, async (request, reply) => {
    const payload = verifyContentToken(request.params.token, config.tokenSecret);
    ensure(payload, 403, 'LINK_EXPIRED', 'This link has expired. Reload the page and try again.');
    const lesson = await one(database, 'SELECT src,notes_url FROM lessons WHERE id=$1', [payload.lessonId]);
    const url = payload.kind === 'notes' ? lesson?.notes_url : lesson?.src;
    ensure(url, 404, 'NOT_FOUND', 'This content is no longer available.');
    let upstream;
    try {
      upstream = await fetch(url, request.headers.range ? { headers: { range: request.headers.range } } : {});
    } catch {
      throw new ApiError(502, 'UPSTREAM_UNAVAILABLE', 'The content host could not be reached.');
    }
    reply.code(upstream.status);
    const headers = { 'cache-control': 'private, no-store' };
    for (const name of ['content-type', 'content-length', 'accept-ranges', 'content-range']) {
      const value = upstream.headers.get(name);
      if (value) headers[name] = value;
    }
    return new Response(upstream.body, { headers });
  });

  route('POST', '/lessons/:id/complete', { auth: 'active' }, async request => {
    const lesson = await one(database, "SELECT * FROM lessons WHERE id=$1 AND status='published' AND scheduled_at<=now()", [request.params.id]);
    ensure(lesson, 404, 'NOT_FOUND', 'Lesson not found.');
    await requireCourseAccess(database, request.auth, lesson.course_id);
    await database.query('INSERT INTO lesson_progress(user_id,lesson_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [request.auth.user_id, lesson.id]);
    return { ok: true };
  });
  route('GET', '/courses/:slug/schedule', {}, async request => {
    const course = await one(database, 'SELECT id FROM courses WHERE slug=$1 AND is_published', [request.params.slug]);
    ensure(course, 404, 'COURSE_NOT_FOUND', 'This course could not be found.');
    return (await database.query('SELECT * FROM schedules WHERE course_id=$1 ORDER BY scheduled_at,id', [course.id])).rows.map(scheduleDto);
  });
  async function courseLeaderboard(database, courseId, userId, limit = 50, offset = 0) {
    const standings = await one(database, `WITH course_exams AS (
      SELECT id FROM exams WHERE course_id=$1 AND is_published=true
    ), user_scores AS (
      SELECT a.user_id, u.full_name, sum((a.result->>'score')::numeric) as total_score
      FROM exam_attempts a
      JOIN users u ON u.id = a.user_id
      WHERE a.exam_id IN (SELECT id FROM course_exams) AND a.submitted_at IS NOT NULL AND u.role='student'
      GROUP BY a.user_id, u.full_name
    ), ranked AS (
      SELECT user_id, full_name, total_score,
        rank() OVER (ORDER BY total_score DESC)::int AS rank,
        count(*) OVER (PARTITION BY total_score)::int AS tied_count
      FROM user_scores
    ), entries AS (
      SELECT user_id,rank,jsonb_build_object(
        'userId', user_id, 'rank',rank,'name',full_name,'score',total_score,
        'tied',tied_count>1,'isMe',user_id=$2::uuid
      ) AS entry FROM ranked
    ), page AS (
      SELECT * FROM entries ORDER BY rank,user_id LIMIT $3 OFFSET $4
    )
    SELECT (SELECT count(*)::int FROM ranked) AS participants,
      (SELECT max(total_score) FROM ranked) AS highest_score,
      (SELECT round(avg(total_score),3) FROM ranked) AS average_score,
      (SELECT entry FROM entries WHERE user_id=$2::uuid) AS me,
      COALESCE((SELECT jsonb_agg(entry ORDER BY rank,user_id) FROM page),'[]'::jsonb) AS items`,
    [courseId, userId, limit, offset]);

    return { participants: standings.participants, highestScore: standings.highest_score === null ? null : Number(standings.highest_score), averageScore: standings.average_score === null ? null : Number(standings.average_score), me: standings.me, items: standings.items, limit, offset };
  }

  route('GET', '/courses/:slug/leaderboard', { auth: 'active', query: pageQuery }, async request => {
    const course = await one(database, 'SELECT id FROM courses WHERE slug=$1', [request.params.slug]);
    ensure(course, 404, 'COURSE_NOT_FOUND', 'Course not found.');
    await requireCourseAccess(database, request.auth, course.id);
    return courseLeaderboard(database, course.id, request.auth.user_id, request.query.limit, request.query.offset);
  });

  route('GET', '/admin/courses/:id/leaderboard', { auth: 'admin', query: pageQuery }, async request => {
    const course = await one(database, 'SELECT id FROM courses WHERE id=$1', [request.params.id]);
    ensure(course, 404, 'COURSE_NOT_FOUND', 'Course not found.');
    return courseLeaderboard(database, course.id, request.auth.user_id, request.query.limit, request.query.offset);
  });

  route('GET', '/admin/courses', { auth: 'admin', query: pageQuery }, async request => (await database.query(`${courseSelect} ORDER BY c.created_at DESC,c.id LIMIT $1 OFFSET $2`, [request.query.limit, request.query.offset])).rows.map(courseDto));
  route('GET', '/admin/courses/:id', { auth: 'admin' }, async request => {
    const course = await one(database, `${courseSelect} WHERE c.id=$1`, [request.params.id]);
    ensure(course, 404, 'NOT_FOUND', 'Course not found.');
    return courseDto(course);
  });

  async function saveCourse(request, creating) {
    return database.transaction(async transaction => {
      const existing = creating ? null : await one(transaction, 'SELECT * FROM courses WHERE id=$1 FOR UPDATE', [request.params.id]);
      if (!creating) ensure(existing, 404, 'NOT_FOUND', 'Course not found.');
      const previous = existing ? Object.fromEntries(Object.entries(courseDto(existing)).filter(([key]) => key in courseFields.shape)) : {};
      const input = courseFields.parse({ ...previous, ...request.body });
      ensure(input.discountPrice == null || input.discountPrice <= input.price, 400, 'INVALID_PRICE', 'Discount price cannot exceed the course price.');
      const presentation = metadata.parse(Object.fromEntries(Object.keys(metadata.shape).map(key => [key, input[key]])));
      const values = [input.slug, input.title, input.category, Math.round(input.price * 100), input.discountPrice == null ? null : Math.round(input.discountPrice * 100), input.accessDays, input.isPublished, JSON.stringify(presentation)];
      const saved = creating
        ? await one(transaction, 'INSERT INTO courses(slug,title,category,price_minor,discount_minor,access_days,is_published,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', values)
        : await one(transaction, 'UPDATE courses SET slug=$1,title=$2,category=$3,price_minor=$4,discount_minor=$5,access_days=$6,is_published=$7,metadata=$8 WHERE id=$9 RETURNING *', [...values, existing.id]);
      await audit(transaction, request.auth.user_id, creating ? 'course.created' : 'course.updated', saved.id);
      return courseDto(saved);
    });
  }
  route('POST', '/admin/courses', { auth: 'admin', body: courseFields }, request => saveCourse(request, true));
  route('PATCH', '/admin/courses/:id', { auth: 'admin', body: courseFields.partial() }, request => saveCourse(request, false));
  route('DELETE', '/admin/courses/:id', { auth: 'admin' }, async request => database.transaction(async transaction => {
    const course = await one(transaction, 'UPDATE courses SET is_published=false WHERE id=$1 RETURNING id', [request.params.id]);
    ensure(course, 404, 'NOT_FOUND', 'Course not found.');
    await audit(transaction, request.auth.user_id, 'course.unpublished', course.id);
    return { ok: true };
  }));

  for (const kind of ['videos', 'schedules']) {
    const video = kind === 'videos';
    const table = video ? 'lessons' : 'schedules';
    const schema = video ? videoFields : scheduleFields;
    const dto = video ? videoDto : scheduleDto;
    route('GET', `/admin/${kind}`, { auth: 'admin', query: pageQuery.extend({ courseId: uuid.optional(), status: z.enum(['draft', 'published', 'ALL']).optional() }) }, async request => {
      const rows = (await database.query(`SELECT entry.*,c.title AS course_name${video ? ',ch.title AS chapter_title' : ''} FROM ${table} entry JOIN courses c ON c.id=entry.course_id
        ${video ? 'LEFT JOIN chapters ch ON ch.id=entry.chapter_id' : ''}
        WHERE ($1::uuid IS NULL OR entry.course_id=$1) ${video ? "AND ($4::text IS NULL OR $4='ALL' OR entry.status=$4)" : ''}
        ORDER BY entry.scheduled_at,entry.id LIMIT $2 OFFSET $3`, [request.query.courseId || null, request.query.limit, request.query.offset, ...(video ? [request.query.status || null] : [])])).rows;
      return rows.map(dto);
    });
    async function save(request, creating) {
      return database.transaction(async transaction => {
        const existing = creating ? null : await one(transaction, `SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`, [request.params.id]);
        if (!creating) ensure(existing, 404, 'NOT_FOUND', 'Record not found.');
        const previous = existing ? video ? { courseId: existing.course_id, title: existing.title, src: existing.src, notesUrl: existing.notes_url, durationMinutes: existing.duration_minutes, scheduledAt: new Date(existing.scheduled_at).toISOString(), status: existing.status, position: existing.position, chapterId: existing.chapter_id }
          : { courseId: existing.course_id, scheduledAt: new Date(existing.scheduled_at).toISOString(), exam: existing.exam, solveClass: existing.solve_class, lecture: existing.lecture, examId: existing.exam_id, solveClassVideoId: existing.solve_lesson_id, lectureVideoId: existing.lecture_lesson_id } : {};
        const input = schema.parse({ ...previous, ...request.body });
        if (existing) ensure(input.courseId === existing.course_id, 409, 'COURSE_IMMUTABLE', 'Create a new record to move content to a different course.');
        if (video) ensure(input.status !== 'published' || input.src, 400, 'VIDEO_SOURCE_REQUIRED', 'Published lessons require a video URL.');
        if (video && input.chapterId) ensure(await one(transaction, 'SELECT id FROM chapters WHERE id=$1 AND course_id=$2', [input.chapterId, input.courseId]), 400, 'INVALID_REFERENCE', 'A lesson\'s chapter must belong to the same course.');
        if (!video) {
          // Routine pointers must stay inside the same course so the public routine never names foreign content.
          for (const [table, id] of [['exams', input.examId], ['lessons', input.solveClassVideoId], ['lessons', input.lectureVideoId]]) {
            if (id) ensure(await one(transaction, `SELECT id FROM ${table} WHERE id=$1 AND course_id=$2`, [id, input.courseId]), 400, 'INVALID_REFERENCE', 'Routine rows may only point at this course\'s own exams and videos.');
          }
        }
        const columns = video ? ['course_id', 'title', 'src', 'notes_url', 'duration_minutes', 'scheduled_at', 'status', 'position', 'chapter_id'] : ['course_id', 'scheduled_at', 'exam', 'solve_class', 'lecture', 'exam_id', 'solve_lesson_id', 'lecture_lesson_id'];
        const values = video ? [input.courseId, input.title, input.src, input.notesUrl, input.durationMinutes, input.scheduledAt, input.status, input.position, input.chapterId] : [input.courseId, input.scheduledAt, input.exam, input.solveClass, input.lecture, input.examId, input.solveClassVideoId, input.lectureVideoId];
        const saved = creating
          ? await one(transaction, `INSERT INTO ${table}(${columns.join(',')}) VALUES (${values.map((value, index) => `$${index + 1}`).join(',')}) RETURNING *`, values)
          : await one(transaction, `UPDATE ${table} SET ${columns.map((column, index) => `${column}=$${index + 1}`).join(',')} WHERE id=$${values.length + 1} RETURNING *`, [...values, existing.id]);
        await audit(transaction, request.auth.user_id, `${kind}.${creating ? 'created' : 'updated'}`, saved.id);
        return dto(saved);
      });
    }
    route('POST', `/admin/${kind}`, { auth: 'admin', body: schema }, request => save(request, true));
    route('PATCH', `/admin/${kind}/:id`, { auth: 'admin', body: schema.partial() }, request => save(request, false));
    route('DELETE', `/admin/${kind}/:id`, { auth: 'admin' }, async request => database.transaction(async transaction => {
      // A lesson somebody has already completed is kept (as a draft) so their progress survives.
      const removed = await one(transaction, video
        ? `WITH gone AS (DELETE FROM lessons WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM lesson_progress p WHERE p.lesson_id=lessons.id) RETURNING id),
           kept AS (UPDATE lessons SET status='draft' WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM gone) RETURNING id)
           SELECT id FROM gone UNION ALL SELECT id FROM kept`
        : 'DELETE FROM schedules WHERE id=$1 RETURNING id', [request.params.id]);
      ensure(removed, 404, 'NOT_FOUND', 'Record not found.');
      await audit(transaction, request.auth.user_id, `${kind}.removed`, removed.id);
      return { ok: true };
    }));
  }

  // Chapters group a course's lessons for browsing (e.g. "Airway Management").
  // They carry no video content themselves — a lesson optionally points at one.
  route('GET', '/admin/chapters', { auth: 'admin', query: pageQuery.extend({ courseId: uuid.optional() }) }, async request => {
    const rows = (await database.query(`SELECT ch.*, (SELECT count(*) FROM lessons l WHERE l.chapter_id=ch.id) AS video_count
      FROM chapters ch WHERE ($1::uuid IS NULL OR ch.course_id=$1) ORDER BY ch.position,ch.id LIMIT $2 OFFSET $3`,
      [request.query.courseId || null, request.query.limit, request.query.offset])).rows;
    return rows.map(chapterDto);
  });
  async function saveChapter(request, creating) {
    return database.transaction(async transaction => {
      const existing = creating ? null : await one(transaction, 'SELECT * FROM chapters WHERE id=$1 FOR UPDATE', [request.params.id]);
      if (!creating) ensure(existing, 404, 'NOT_FOUND', 'Chapter not found.');
      // New chapters default to the end of the course's list.
      const nextPosition = creating ? (await one(transaction, 'SELECT count(*)::int AS count FROM chapters WHERE course_id=$1', [request.body.courseId]))?.count ?? 0 : 0;
      const previous = existing ? { courseId: existing.course_id, title: existing.title, position: existing.position } : { position: nextPosition };
      const input = chapterFields.parse({ ...previous, ...request.body });
      if (existing) ensure(input.courseId === existing.course_id, 409, 'COURSE_IMMUTABLE', 'Create a new chapter to move content to a different course.');
      const saved = creating
        ? await one(transaction, 'INSERT INTO chapters(course_id,title,position) VALUES ($1,$2,$3) RETURNING *', [input.courseId, input.title, input.position])
        : await one(transaction, 'UPDATE chapters SET title=$1,position=$2 WHERE id=$3 RETURNING *', [input.title, input.position, existing.id]);
      await audit(transaction, request.auth.user_id, `chapters.${creating ? 'created' : 'updated'}`, saved.id);
      return chapterDto(saved);
    });
  }
  route('POST', '/admin/chapters', { auth: 'admin', body: chapterFields }, request => saveChapter(request, true));
  route('PATCH', '/admin/chapters/:id', { auth: 'admin', body: chapterFields.partial() }, request => saveChapter(request, false));
  route('DELETE', '/admin/chapters/:id', { auth: 'admin' }, async request => database.transaction(async transaction => {
    // Lessons in the chapter are kept; they just fall back to "Uncategorized" (chapter_id is ON DELETE SET NULL).
    const removed = await one(transaction, 'DELETE FROM chapters WHERE id=$1 RETURNING id', [request.params.id]);
    ensure(removed, 404, 'NOT_FOUND', 'Chapter not found.');
    await audit(transaction, request.auth.user_id, 'chapters.removed', removed.id);
    return { ok: true };
  }));
}