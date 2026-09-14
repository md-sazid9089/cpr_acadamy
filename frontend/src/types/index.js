/**
 * Shared object shapes, expressed as JSDoc typedefs. There is no TypeScript in
 * this project — these exist purely so editors can autocomplete and so the
 * backend contract is documented in one readable place.
 *
 * @module types
 */

/**
 * @typedef {'student' | 'admin' | 'instructor'} Role
 * @typedef {'FCPS' | 'BCS' | 'MBBS'} CourseCategory
 * @typedef {'otp_pending' | 'awaiting_approval' | 'active' | 'rejected' | 'suspended'} AccountStatus
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} fullName
 * @property {string} mobile          Bangladeshi mobile in 01XXXXXXXXX form.
 * @property {string} [email]         Optional; signup is mobile-first.
 * @property {Role} role
 * @property {AccountStatus} status
 * @property {string} [bmdcNumber]    BMDC registration number, if supplied.
 * @property {string} [institution]
 * @property {string} [avatarUrl]
 * @property {string} createdAt       ISO 8601.
 */

/**
 * @typedef {Object} AuthSession
 * @property {string} accessToken
 * @property {string} [refreshToken]
 * @property {string} deviceId        Identifies this browser for single-device login.
 * @property {number} [expiresAt]     Epoch ms.
 */

/**
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} slug
 * @property {string} title
 * @property {CourseCategory} category
 * @property {string} [batchGroup]   BATCH_GROUPS id, e.g. 'fcps-p1-medicine'.
 * @property {string} [batchType]    BATCH_TYPES id, e.g. 'crash'.
 * @property {string} [session]      BATCH_SESSIONS id, e.g. 'jan-26-p1'.
 * @property {'online' | 'offline'} [branch]
 * @property {string} subtitle
 * @property {string} thumbnailUrl
 * @property {string} [description]  Long-form prose for the public page; blank lines separate paragraphs.
 * @property {string[]} highlights    Course outline bullets. (The admin UI calls this "Outline".)
 * @property {number} price           BDT.
 * @property {number} [discountPrice] BDT; when present the card shows both.
 * @property {{ label: string, endsAt?: string }} [offer]  Label printed beside the discount, e.g. 'Early-bird offer'.
 * @property {string} duration        Human readable, e.g. '6 months'.
 * @property {{ start: string, end: string }} [classTime]  24h 'HH:mm' pair.
 * @property {string[]} [classDays]   CLASS_DAYS ids, e.g. ['sat','tue','thu'].
 * @property {'draft' | 'published'} [status]
 * @property {number} lessonCount
 * @property {number} enrolledCount
 * @property {number} [rating]        0–5.
 * @property {string} [startsOn]      ISO 8601.
 * @property {boolean} [isFeatured]
 */

/**
 * @typedef {Object} Lesson
 * @property {string} id
 * @property {string} courseId
 * @property {string} title
 * @property {'video' | 'note' | 'pdf' | 'live'} kind
 * @property {number} durationMinutes
 * @property {string} [videoUrl]
 * @property {string} [pdfUrl]
 * @property {boolean} isCompleted
 * @property {boolean} isLocked
 */

/**
 * @typedef {Object} Exam
 * @property {string} id
 * @property {string} title
 * @property {string} courseId
 * @property {'live' | 'mock' | 'practice'} type
 * @property {'sba' | 'mtf' | 'mixed'} questionType
 * @property {'upcoming' | 'running' | 'submitted' | 'missed' | 'published'} status
 * @property {string} scheduledAt     ISO 8601.
 * @property {number} durationMinutes
 * @property {number} questionCount   Target paper length; the builder shows progress against it.
 * @property {number} totalMarks      Derived from the actual questions and their marks.
 * @property {number} [marksPerQuestion]  Editor default for new questions or MTF statements.
 * @property {number} [deductionPercent]  Editor alias for negativeMarking.
 * @property {number} [negativeMarking] Percentage points, e.g. 25 deducts 25% of that question's marks. Defaults to zero.
 * @property {number} passMark        Pass threshold in percent; defaults to 70.
 * @property {Question[]} [questions]
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {'sba' | 'mtf'} type
 * @property {string} stem
 * @property {string} [imageUrl]
 * @property {QuestionOption[]} options  Exactly five for published MTF; SBA accepts 2-10.
 * @property {number} marks          Per SBA question or per MTF statement.
 * @property {string} [correctOptionId]  SBA answer key. Stripped before the paper reaches a student.
 * @property {string | Record<string, boolean> | null} [correctAnswer]  API SBA option ID or MTF boolean map. Hidden during an attempt.
 * @property {string} [explanation]   Revealed only after submission.
 */

/**
 * @typedef {Object} QuestionOption
 * @property {string} id
 * @property {string} text
 */

/**
 * SBA answers map questionId -> optionId.
 * MTF answers map questionId -> { [optionId]: true | false }.
 * @typedef {Record<string, string | Record<string, boolean> | null>} AnswerSheet
 */

/**
 * @typedef {Object} ExamResult
 * @property {string} examId
 * @property {number} score
 * @property {number} totalMarks
 * @property {number} correctCount
 * @property {number} wrongCount
 * @property {number} skippedCount
 * @property {number} passMark
 * @property {boolean} passed
 * @property {number} [rank]
 * @property {number} [participants]
 * @property {string} submittedAt
 */

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} invoiceNo
 * @property {string} courseTitle
 * @property {number} amount          BDT.
 * @property {'paid' | 'pending' | 'failed' | 'refunded'} status
 * @property {string} method          One of PAYMENT_METHODS ids.
 * @property {string} [transactionId]
 * @property {string} paidAt          ISO 8601.
 */

export {};
