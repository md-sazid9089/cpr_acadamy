// One-off seed script: creates a full demo course (chapters, lessons, schedule,
// two published exams) plus a set of dummy students with graded exam attempts,
// so the leaderboard and admin course views have realistic-looking data to show.
// Run with the dev server STOPPED (pglite can't tolerate two processes touching
// the same data directory at once): node --env-file-if-exists=.env scripts/seed-demo-course.js
import { loadConfig } from '../src/config.js';
import { openDatabase, migrate, one } from '../src/db.js';
import { hashPassword } from '../src/security.js';
import { gradePaper } from '../src/modules/exams.js';

const DEMO_PASSWORD = 'DemoStudent123!';
const YOUTUBE_PLACEHOLDER = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
const OPTION_IDS = ['a', 'b', 'c', 'd', 'e'];

function question(stem, options, correctIndex, explanation) {
  return {
    id: crypto.randomUUID(),
    type: 'sba',
    stem,
    imageUrl: '',
    options: options.map((text, index) => ({ id: OPTION_IDS[index], text })),
    correctAnswer: OPTION_IDS[correctIndex],
    explanation,
    marks: 1,
  };
}

const FOUNDATION_QUESTIONS = [
  question('Which chamber of the heart pumps deoxygenated blood to the lungs?',
    ['Left atrium', 'Left ventricle', 'Right atrium', 'Right ventricle', 'Aorta'], 3,
    'The right ventricle pumps deoxygenated blood into the pulmonary artery towards the lungs.'),
  question("The SA node, the heart's natural pacemaker, is located in which chamber?",
    ['Left atrium', 'Right atrium', 'Left ventricle', 'Right ventricle', 'Interventricular septum'], 1,
    'The sinoatrial (SA) node sits in the wall of the right atrium near the entrance of the superior vena cava.'),
  question('Which of the following is the most common cause of secondary hypertension?',
    ['Pheochromocytoma', 'Renal artery stenosis / renal parenchymal disease', 'Primary hyperaldosteronism', 'Coarctation of aorta', 'Cushing syndrome'], 1,
    'Renal disease (parenchymal disease and renovascular disease) is the most common identifiable cause of secondary hypertension.'),
  question("A widened baseline with a 'sawtooth' flutter-wave pattern on ECG is characteristic of which arrhythmia?",
    ['Atrial fibrillation', 'Atrial flutter', 'Ventricular tachycardia', 'Supraventricular tachycardia', 'Third-degree heart block'], 1,
    'Atrial flutter classically shows regular sawtooth flutter waves, often at ~300/min atrial rate.'),
  question('Which medication class is first-line for reducing mortality in heart failure with reduced ejection fraction?',
    ['Calcium channel blockers', 'ACE inhibitors', 'Loop diuretics', 'Nitrates', 'Alpha-blockers'], 1,
    'ACE inhibitors (or ARBs) are foundational, mortality-reducing therapy in HFrEF.'),
  question('The most common cause of mitral stenosis worldwide is:',
    ['Infective endocarditis', 'Rheumatic heart disease', 'Congenital defect', 'Marfan syndrome', 'Myocardial infarction'], 1,
    'Rheumatic fever remains the leading cause of mitral stenosis globally.'),
  question('Which cardiac biomarker is most specific for diagnosing acute myocardial infarction?',
    ['CK-MB', 'Myoglobin', 'Troponin I', 'LDH', 'AST'], 2,
    'Cardiac troponins (I and T) are the most sensitive and specific biomarkers for myocardial injury.'),
  question('The murmur of aortic stenosis is best heard at which auscultation site?',
    ['Apex', 'Left lower sternal border', 'Right second intercostal space', 'Left second intercostal space', 'Tricuspid area'], 2,
    "Aortic stenosis produces a crescendo-decrescendo murmur best heard at the right upper sternal border (aortic area), radiating to the carotids."),
];

const FINAL_MOCK_QUESTIONS = [
  question('Which of the following ECG changes is classically seen in acute pericarditis?',
    ['ST depression in all leads', 'Diffuse ST elevation with PR depression', 'Peaked T waves', 'Delta wave', 'Prolonged QT interval'], 1,
    'Acute pericarditis classically shows widespread concave ST elevation with PR segment depression.'),
  question('The Frank-Starling mechanism describes the relationship between:',
    ['Heart rate and blood pressure', 'Ventricular preload and stroke volume', 'Afterload and contractility', 'Coronary flow and oxygen demand', 'Vagal tone and heart rate'], 1,
    'Frank-Starling: increased ventricular filling (preload) increases stroke volume, up to a physiological limit.'),
  question('Which valve disease is most associated with a wide pulse pressure?',
    ['Mitral stenosis', 'Aortic stenosis', 'Aortic regurgitation', 'Tricuspid stenosis', 'Pulmonary stenosis'], 2,
    'Chronic aortic regurgitation causes a widened pulse pressure from a high stroke volume and low diastolic pressure.'),
  question('First-line pharmacological treatment for acute relief of stable angina symptoms is:',
    ['Beta-blocker', 'Sublingual nitroglycerin', 'ACE inhibitor', 'Statin', 'Aspirin'], 1,
    'Sublingual nitroglycerin rapidly relieves angina by venodilation and reducing myocardial oxygen demand.'),
  question('Which of the following is a major (Duke) criterion for infective endocarditis?',
    ['Fever > 38°C', 'Positive blood culture with a typical organism', 'Vascular phenomena', 'Immunologic phenomena', 'IV drug use'], 1,
    'Persistently positive blood cultures with a typical endocarditis organism form a major Duke criterion.'),
  question('Digoxin toxicity is most likely to be precipitated by which electrolyte abnormality?',
    ['Hyperkalemia', 'Hypokalemia', 'Hypercalcemia', 'Hyponatremia', 'Hypermagnesemia'], 1,
    'Hypokalemia increases digoxin binding to the Na-K-ATPase pump, precipitating toxicity.'),
  question('The most common cause of sudden cardiac death in young athletes is:',
    ['Coronary artery disease', 'Hypertrophic cardiomyopathy', 'Myocarditis', 'Long QT syndrome', 'Aortic dissection'], 1,
    'Hypertrophic cardiomyopathy is the leading cause of sudden cardiac death in young athletes.'),
  question("Which finding pattern is most consistent with cardiac tamponade (Beck's triad)?",
    ['Hypertension, bradycardia, loud heart sounds', 'Hypotension, raised JVP, muffled heart sounds', 'Tachypnea, fever, chest pain', 'Hypertension, tachycardia, wide pulse pressure', 'Hypotension, bradycardia, clear lung sounds'], 1,
    "Beck's triad: hypotension, raised jugular venous pressure, and muffled heart sounds."),
  question('A patient with a bicuspid aortic valve is at increased risk of developing:',
    ['Mitral valve prolapse', 'Aortic stenosis and aortic dissection', 'Pulmonary hypertension', 'Tricuspid regurgitation', 'Atrial septal defect'], 1,
    'Bicuspid aortic valves predispose to premature aortic stenosis/regurgitation and aortic root dilation/dissection.'),
  question('Which drug is relatively contraindicated in decompensated heart failure due to its negative inotropic effect?',
    ['Furosemide', 'Verapamil', 'Losartan', 'Carvedilol (at a stable, titrated dose)', 'Spironolactone'], 1,
    'Non-dihydropyridine calcium channel blockers like verapamil have significant negative inotropy and are avoided in decompensated HFrEF.'),
];

const DUMMY_STUDENTS = [
  { mobile: '01911100001', fullName: 'Tanvir Ahmed', institution: 'Dhaka Medical College', ability: 0.95 },
  { mobile: '01911100002', fullName: 'Nusrat Jahan', institution: 'Chittagong Medical College', ability: 0.88 },
  { mobile: '01911100003', fullName: 'Rafiul Islam', institution: 'Sir Salimullah Medical College, Dhaka', ability: 0.81 },
  { mobile: '01911100004', fullName: 'Farzana Akter', institution: 'Rajshahi Medical College', ability: 0.74 },
  { mobile: '01911100005', fullName: 'Shakib Hasan', institution: 'Sylhet MAG Osmani Medical College', ability: 0.67 },
  { mobile: '01911100006', fullName: 'Mehjabin Rahman', institution: 'Rangpur Medical College', ability: 0.60 },
  { mobile: '01911100007', fullName: 'Imran Kabir', institution: 'Mymensingh Medical College', ability: 0.53 },
  { mobile: '01911100008', fullName: 'Sabrina Chowdhury', institution: 'Khulna Medical College', ability: 0.46 },
  { mobile: '01911100009', fullName: 'Arif Hossain', institution: 'Comilla Medical College', ability: 0.39 },
  { mobile: '01911100010', fullName: 'Lamia Sultana', institution: 'Barisal Medical College', ability: 0.32 },
];

function daysAgo(days) {
  return new Date(Date.now() - days * 86400000);
}

/** Simulates one student's answer sheet against a question bank, weighted by `ability`. */
function simulateAnswers(questions, ability) {
  const answers = {};
  for (const q of questions) {
    const roll = Math.random();
    if (roll < ability) {
      answers[q.id] = q.correctAnswer;
    } else if (Math.random() < 0.65) {
      const wrongOptions = q.options.map(o => o.id).filter(id => id !== q.correctAnswer);
      answers[q.id] = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    } else {
      answers[q.id] = null;
    }
  }
  return answers;
}

async function main() {
  const config = loadConfig();
  const database = await openDatabase(config);
  await migrate(database);

  try {
    const summary = await database.transaction(async tx => {
      const course = await one(tx, `
        INSERT INTO courses(slug,title,category,price_minor,discount_minor,access_days,is_published,metadata)
        VALUES ($1,$2,$3,$4,$5,$6,true,$7) RETURNING *`,
      ['demo-fcps-cardiology-crash', 'FCPS Part-1 Cardiology Crash Course (Demo)', 'FCPS', 500000, 400000, 180,
        JSON.stringify({
          subtitle: 'A focused crash course covering high-yield cardiology for FCPS Part-1',
          description: 'Demo/sample course seeded for testing — covers cardiovascular physiology, arrhythmias, heart failure and valvular disease with mock exams and a live leaderboard.',
          thumbnailUrl: '', highlights: ['8 recorded lectures', '2 full mock exams', 'Live leaderboard ranking', 'Downloadable class routine'],
          duration: '8 weeks', batchGroup: 'fcps-p1-medicine', batchType: 'crash', session: 'jan-26-p1', branch: 'online',
          startsOn: daysAgo(30).toISOString(), isFeatured: true,
          classTime: { start: '19:00', end: '21:00' }, classDays: ['sat', 'mon', 'wed'], offer: null,
        })]);

      const chapterTitles = ['Cardiovascular Basics & Physiology', 'Arrhythmias & ECG Interpretation', 'Heart Failure & Valvular Disorders'];
      const chapters = [];
      for (let i = 0; i < chapterTitles.length; i += 1) {
        chapters.push(await one(tx, 'INSERT INTO chapters(course_id,title,position) VALUES ($1,$2,$3) RETURNING *', [course.id, chapterTitles[i], i]));
      }

      const lessonPlan = [
        [chapters[0], 'Cardiac Anatomy & Conduction System', 45],
        [chapters[0], 'Cardiac Cycle & Hemodynamics', 40],
        [chapters[1], 'ECG Basics: Rhythm Recognition', 50],
        [chapters[1], 'Common Arrhythmias & Management', 55],
        [chapters[2], 'Heart Failure: Pathophysiology & Management', 50],
        [chapters[2], 'Valvular Heart Disease Overview', 45],
      ];
      const lessons = [];
      for (let i = 0; i < lessonPlan.length; i += 1) {
        const [chapter, title, minutes] = lessonPlan[i];
        lessons.push(await one(tx, `
          INSERT INTO lessons(course_id,title,src,duration_minutes,scheduled_at,status,position,chapter_id)
          VALUES ($1,$2,$3,$4,$5,'published',$6,$7) RETURNING *`,
        [course.id, title, YOUTUBE_PLACEHOLDER, minutes, daysAgo(28 - i * 4).toISOString(), i, chapter.id]));
      }

      const examPlan = [
        { title: 'Cardiology Foundation MCQ (Mock)', questions: FOUNDATION_QUESTIONS, daysBack: 14, durationMinutes: 30 },
        { title: 'Cardiology Final Mock Test', questions: FINAL_MOCK_QUESTIONS, daysBack: 7, durationMinutes: 45 },
      ];
      const exams = [];
      for (const plan of examPlan) {
        const scheduledAt = daysAgo(plan.daysBack);
        const closesAt = new Date(scheduledAt.getTime() + 86400000);
        const resultsAt = new Date(closesAt.getTime() + 2 * 3600000);
        exams.push(await one(tx, `
          INSERT INTO exams(course_id,title,type,question_type,duration_minutes,negative_marking,pass_mark,scheduled_at,closes_at,results_at,is_published,questions,target_question_count,marks_per_question)
          VALUES ($1,$2,'mock','sba',$3,25,60,$4,$5,$6,true,$7,$8,1) RETURNING *`,
        [course.id, plan.title, plan.durationMinutes, scheduledAt.toISOString(), closesAt.toISOString(), resultsAt.toISOString(),
          JSON.stringify(plan.questions), plan.questions.length]));
      }

      // A couple of routine entries tying lessons and exams into the course schedule.
      await tx.query(`INSERT INTO schedules(course_id,scheduled_at,exam,solve_class,lecture,lecture_lesson_id) VALUES ($1,$2,'NO EXAM',$3,$4,$5)`,
        [course.id, lessons[0].scheduled_at, 'Q&A: Cardiac physiology', lessons[0].title, lessons[0].id]);
      await tx.query(`INSERT INTO schedules(course_id,scheduled_at,exam,solve_class,lecture,exam_id) VALUES ($1,$2,$3,'NO CLASS','NO CLASS',$4)`,
        [course.id, exams[0].scheduled_at, exams[0].title, exams[0].id]);
      await tx.query(`INSERT INTO schedules(course_id,scheduled_at,exam,solve_class,lecture,exam_id) VALUES ($1,$2,$3,'NO CLASS','NO CLASS',$4)`,
        [course.id, exams[1].scheduled_at, exams[1].title, exams[1].id]);

      const passwordHash = await hashPassword(DEMO_PASSWORD);
      const students = [];
      for (const student of DUMMY_STUDENTS) {
        students.push({
          ability: student.ability,
          row: await one(tx, `
            INSERT INTO users(mobile,full_name,password_hash,role,status,institution,interest,mobile_verified_at)
            VALUES ($1,$2,$3,'student','active',$4,'FCPS',now()) RETURNING *`,
          [student.mobile, student.fullName, passwordHash, student.institution]),
        });
      }

      for (const { row } of students) {
        await tx.query(`
          INSERT INTO enrollments(user_id,course_id,status,starts_at,expires_at) VALUES ($1,$2,'active',$3,$4)`,
        [row.id, course.id, daysAgo(20).toISOString(), new Date(Date.now() + 160 * 86400000).toISOString()]);
      }

      for (const exam of exams) {
        const paper = { questions: exam.questions, negativeMarking: Number(exam.negative_marking), passMark: Number(exam.pass_mark), durationMinutes: exam.duration_minutes };
        const startedAt = new Date(exam.scheduled_at);
        const endsAt = new Date(startedAt.getTime() + exam.duration_minutes * 60000);
        for (const { row, ability } of students) {
          const answers = simulateAnswers(exam.questions, ability);
          const result = gradePaper(paper, answers);
          const submittedAt = new Date(startedAt.getTime() + (0.5 + Math.random() * 0.45) * (endsAt.getTime() - startedAt.getTime()));
          await tx.query(`
            INSERT INTO exam_attempts(user_id,exam_id,paper,answers,started_at,ends_at,submitted_at,result)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [row.id, exam.id, JSON.stringify(paper), JSON.stringify(answers), startedAt.toISOString(), endsAt.toISOString(), submittedAt.toISOString(), JSON.stringify(result)]);
        }
      }

      return { course, exams, students };
    });

    console.log(`Demo course created: "${summary.course.title}" (slug: ${summary.course.slug})`);
    console.log(`Exams: ${summary.exams.map(e => e.title).join(', ')}`);
    console.log(`Dummy students (${summary.students.length}), all with password "${DEMO_PASSWORD}":`);
    for (const { row } of summary.students) console.log(`  ${row.mobile}  ${row.full_name}`);
    console.log('Leaderboard will populate from these graded attempts on the course hub / admin course pages.');
  } finally {
    await database.close();
  }
}

main().catch(error => {
  console.error('Seeding failed:', error);
  process.exitCode = 1;
});
