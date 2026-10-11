/**
 * Turning the API's validation errors into messages people can act on.
 *
 * A refused request carries `fieldErrors`: `{ 'payerMobile': 'Enter a valid Bangladeshi mobile number', ... }`
 * (keys are field paths, '' for the body as a whole). Following the usual form-error pattern, a form shows
 * each message next to its own field where it has one, and a summary of the rest above the form; nothing
 * is reduced to "Please check the submitted fields." when the server said exactly what was wrong.
 */

/** What people call the fields the API names (where a plain "Title case" of the key would read oddly). */
const FIELD_LABELS = {
  payerMobile: 'Mobile number you paid from',
  transactionId: 'Transaction ID',
  screenshotUrl: 'Payment screenshot',
  mobile: 'Mobile number',
  fullName: 'Full name',
  bmdcNumber: 'BMDC number',
  currentPassword: 'Current password',
  newPassword: 'New password',
  confirmPassword: 'Confirm password',
  price: 'Regular fee',
  discountPrice: 'Discounted fee',
  thumbnailUrl: 'Poster image',
  highlights: 'Outline',
  startsOn: 'Start date',
  lessonCount: 'Total lectures',
  classTime: 'Class time',
  classDays: 'Class days',
  batchGroup: 'Batch group',
  batchType: 'Batch type',
  scheduledAt: 'Opening time',
  closesAt: 'Closing time',
  resultsAt: 'Results release time',
  durationMinutes: 'Duration',
  targetQuestionCount: 'Number of questions',
  negativeMarking: 'Wrong-answer penalty',
  passMark: 'Pass mark',
  sbaMarks: 'SBA marks',
  mtfMarks: 'MCQ marks per statement',
  src: 'Video URL',
  notesUrl: 'Lecture notes link',
  imageUrl: 'Image',
  relatedTo: 'Topic',
  batchTitle: 'Batch',
  body: 'Message',
  amount: 'Price',
  durationDays: 'Duration (days)',
};

/** 'payerMobile' -> 'Mobile number you paid from'; 'questions.2.stem' -> 'Question 3: stem'. */
export function fieldLabel(path) {
  const parts = String(path).split('.');
  const humanize = (key) => FIELD_LABELS[key] ?? key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()).replace(/ ([A-Z])/g, (_, c) => ` ${c.toLowerCase()}`);
  if (parts.length >= 3 && /^\d+$/.test(parts[1])) {
    const item = parts[0].replace(/s$/, '');
    return `${humanize(item)} ${Number(parts[1]) + 1}: ${humanize(parts.slice(2).join('.')).toLowerCase()}`;
  }
  return humanize(parts[0]);
}

/** Field errors as `[path, message]`, leaving out the whole-body entry ('') that names no field. */
function fieldEntries(fieldErrors) {
  return Object.entries(fieldErrors ?? {}).filter(([path, message]) => path && message);
}

/**
 * One sentence for a refused request: the server's own message, or, when it only said the fields were
 * invalid, which field and why ("Mobile number you paid from: Enter a valid Bangladeshi mobile number").
 */
export function describeApiError(code, message, fieldErrors) {
  const entries = fieldEntries(fieldErrors);
  if (code !== 'VALIDATION_ERROR' || entries.length === 0) return message;
  const [[path, first], ...rest] = entries;
  const more = rest.length ? ` (and ${rest.length} more ${rest.length === 1 ? 'problem' : 'problems'})` : '';
  return `${fieldLabel(path)}: ${first}${more}`;
}

/**
 * For react-hook-form: put each server message on its own field (`setError`), and return the message for
 * whatever is left, to show above the form. `fields` lists the form's field names; a path is matched on its
 * first segment, so 'classTime.start' lands on a 'classTime' field.
 *
 * @param {{ code?: string, message?: string, fieldErrors?: Record<string, string> }} error
 * @param {(name: string, error: { type: string, message: string }, options?: object) => void} setError
 * @param {string[]} fields
 * @returns {string | null} the form-level message, or null when every problem was shown on a field
 */
export function applyServerErrors(error, setError, fields) {
  const known = new Set(fields);
  const leftover = {};
  let focused = false;
  for (const [path, message] of fieldEntries(error?.fieldErrors)) {
    const name = path.split('.')[0];
    if (known.has(name)) {
      // Focus the first field with a problem, as the user would expect after pressing submit.
      setError(name, { type: 'server', message }, { shouldFocus: !focused });
      focused = true;
    } else {
      leftover[path] = message;
    }
  }
  if (focused && fieldEntries(leftover).length === 0) return null;
  return describeApiError(error?.code, error?.summary ?? error?.message, leftover) ?? 'Something went wrong. Please try again.';
}
