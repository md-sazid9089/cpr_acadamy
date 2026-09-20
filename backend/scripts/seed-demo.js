import { loadConfig } from '../src/config.js';
import { openDatabase, migrate, one } from '../src/db.js';
import { hashPassword } from '../src/security.js';

const config = loadConfig();
const database = await openDatabase(config);

try {
  await migrate(database);

  console.log('Seeding demo accounts...');

  const adminHash = await hashPassword('AdminPassword123!');
  const admin = await one(database, `INSERT INTO users(mobile, full_name, password_hash, role, status, institution, email, mobile_verified_at)
    VALUES ($1, $2, $3, 'admin', 'active', 'CPR Medical Academy', 'admin@cprmedicalacademy.com', now())
    ON CONFLICT(mobile) DO UPDATE SET password_hash=EXCLUDED.password_hash, status='active', role='admin', mobile_verified_at=now()
    RETURNING id`, ['01711111111', 'CPR Administrator', adminHash]);
  console.log('Admin ready: 01711111111 / AdminPassword123!');

  const studentHash = await hashPassword('StudentPassword123!');
  const student = await one(database, `INSERT INTO users(mobile, full_name, password_hash, role, status, institution, interest, bmdc_number, email, mobile_verified_at)
    VALUES ($1, $2, $3, 'student', 'active', 'Dhaka Medical College', 'FCPS', 'A-12345', 'student@cprmedicalacademy.com', now())
    ON CONFLICT(mobile) DO UPDATE SET password_hash=EXCLUDED.password_hash, status='active', role='student', mobile_verified_at=now()
    RETURNING id`, ['01722222222', 'Dr. Demo Student', studentHash]);
  console.log('Student ready: 01722222222 / StudentPassword123!');

  const courseMetadata = {
    subtitle: 'Comprehensive preparation for FCPS Part 1 Medicine',
    description: 'Complete high-yield course covering internal medicine, clinical diagnostics, past papers, and mock exams.',
    thumbnailUrl: '',
    highlights: ['120+ Live & Recorded Lectures', 'Weekly SBA & MTF Mock Tests', 'Interactive Solve Classes', 'High-Yield Notes & PDF Materials'],
    duration: '6 Months',
    batchGroup: 'fcps-p1-medicine',
    batchType: 'Regular Batch',
    session: 'July 2026',
    branch: 'online',
    startsOn: new Date().toISOString(),
    isFeatured: true,
    classTime: { start: '20:00', end: '22:00' },
    classDays: ['sat', 'mon', 'wed'],
    offer: { label: 'Special Batch Discount', endsAt: new Date(Date.now() + 30 * 86400000).toISOString() }
  };

  const course = await one(database, `INSERT INTO courses(slug, title, category, price_minor, discount_minor, access_days, is_published, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT(slug) DO UPDATE SET is_published=true, metadata=EXCLUDED.metadata
    RETURNING id`, [
      'fcps-part-1-medicine-foundation',
      'FCPS Part-1 Medicine Foundation Batch',
      'FCPS',
      1200000,
      950000,
      180,
      true,
      JSON.stringify(courseMetadata)
    ]);

  await one(database, `INSERT INTO lessons(course_id, title, src, duration_minutes, scheduled_at, status, position)
    VALUES ($1, $2, $3, $4, now() - interval '2 days', 'published', 1)
    RETURNING id`, [course.id, 'Cardiology: Ischemic Heart Disease & ECG Interpretation', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 90]);

  await one(database, `INSERT INTO lessons(course_id, title, src, duration_minutes, scheduled_at, status, position)
    VALUES ($1, $2, $3, $4, now() - interval '1 day', 'published', 2)
    RETURNING id`, [course.id, 'Pulmonology: COPD, Asthma & Arterial Blood Gas Analysis', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 85]);

  const questions = [
    {
      id: 'q1',
      type: 'sba',
      stem: 'A 55-year-old male presents with retrosternal chest pain radiating to the left jaw. ECG shows ST elevation in leads II, III, and aVF. Which coronary artery is most likely occluded?',
      imageUrl: '',
      options: [
        { id: 'opt_a', text: 'Left anterior descending artery (LAD)' },
        { id: 'opt_b', text: 'Right coronary artery (RCA)' },
        { id: 'opt_c', text: 'Left circumflex artery (LCx)' },
        { id: 'opt_d', text: 'Left main coronary artery' }
      ],
      correctAnswer: 'opt_b',
      explanation: 'Leads II, III, and aVF look at the inferior wall of the left ventricle, which is supplied by the Right Coronary Artery (RCA) in approximately 85-90% of individuals.',
      marks: 2
    },
    {
      id: 'q2',
      type: 'mtf',
      stem: 'Regarding the clinical features and management of Acute Severe Asthma:',
      imageUrl: '',
      options: [
        { id: 'stmt_1', text: 'Pulsus paradoxus > 10 mmHg indicates severe airflow obstruction.' },
        { id: 'stmt_2', text: 'Normal or elevated PaCO2 is a sign of impending respiratory arrest.' },
        { id: 'stmt_3', text: 'Intravenous salbutamol is the first-line bronchodilator of choice.' },
        { id: 'stmt_4', text: 'Systemic corticosteroids should be initiated promptly.' },
        { id: 'stmt_5', text: 'Peak Expiratory Flow (PEF) < 33% best indicates life-threatening asthma.' }
      ],
      correctAnswer: {
        stmt_1: true,
        stmt_2: true,
        stmt_3: false,
        stmt_4: true,
        stmt_5: true
      },
      explanation: 'Inhaled/nebulized beta-2 agonists are first-line, not intravenous. Normalizing PaCO2 in a tachypneic asthmatic patient signifies respiratory muscle exhaustion.',
      marks: 0.4
    }
  ];

  await one(database, `INSERT INTO exams(course_id, title, type, question_type, duration_minutes, negative_marking, pass_mark, target_question_count, marks_per_question, scheduled_at, closes_at, results_at, is_published, questions)
    VALUES ($1, $2, 'practice', 'mixed', 30, 0, 70, 2, 2, now() - interval '1 day', now() + interval '30 days', now() - interval '1 day', true, $3)
    RETURNING id`, [course.id, 'Cardiology & Pulmonology Mock Exam 01', JSON.stringify(questions)]);

  await database.query(`INSERT INTO enrollments(user_id, course_id, status, starts_at, expires_at)
    VALUES ($1, $2, 'active', now(), now() + interval '180 days')
    ON CONFLICT(user_id, course_id) DO UPDATE SET status='active', starts_at=now(), expires_at=now() + interval '180 days'`,
    [student.id, course.id]);

  await database.query(`INSERT INTO announcements(title, body, category, pinned, is_published, published_at)
    VALUES ($1, $2, 'General', true, true, now())`,
    ['Welcome to CPR Medical Academy', 'Welcome to the academy portal! Check your Course Hub for recorded classes and weekly mock exams.']);

  console.log('Demo seed completed successfully!');
} finally {
  await database.close();
}
