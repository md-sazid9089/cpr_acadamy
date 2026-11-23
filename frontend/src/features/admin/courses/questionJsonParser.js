import { QUESTION_TYPES } from '../../../constants/index.js';

const BENGALI_OPTION_KEYS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ'];
const ENGLISH_OPTION_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function generateUniqueId(index) {
  return `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${index + 1}`;
}

/**
 * Normalizes an option key or answer reference (Bengali, English, numeric) to a canonical option index (0-based).
 * @param {string | number} raw
 * @returns {number | null}
 */
export function normalizeOptionIndex(raw) {
  if (raw == null) return null;
  const str = String(raw).trim();
  if (!str) return null;

  // Bengali letter?
  const bIndex = BENGALI_OPTION_KEYS.indexOf(str);
  if (bIndex !== -1) return bIndex;

  // English letter (A-H, a-h)?
  const lower = str.toLowerCase();
  const eIndex = ENGLISH_OPTION_KEYS.indexOf(lower);
  if (eIndex !== -1) return eIndex;

  // 1-based number (1, 2, 3...)?
  const num = parseInt(str, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= 10) {
    return num - 1;
  }

  return null;
}

/**
 * Safely parses a JSON string, automatically healing minor syntax defects
 * like unquoted leading values ("key": value") or trailing commas.
 */
export function safeJsonParse(raw) {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch (initialErr) {
    try {
      // 1. Missing opening quote on string property value: "key": value" -> "key": "value"
      let repaired = raw.replace(/^(\s*"[^"]+"\s*:\s*)([^\s"\[\{][^"\r\n]*)"\s*([,\r\n])/gm, (_m, prefix, val, suffix) => {
        return prefix + '"' + val + '"' + suffix;
      });
      // 2. Trailing commas before } or ]
      repaired = repaired.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(repaired);
    } catch {
      throw new Error(`Invalid JSON format: ${initialErr.message}`);
    }
  }
}

/**
 * Parses a raw JSON string or object into valid ExamBuilder question objects.
 *
 * @param {string | object} jsonContent
 * @param {Object} [options]
 * @param {'auto' | 'sba' | 'mtf'} [options.typeMode='auto']
 * @param {number} [options.defaultSbaMarks=2]
 * @param {number} [options.defaultMtfMarks=0.4]
 * @returns {{ questions: Array, total: number, errors: string[] }}
 */
export function parseQuestionsJson(jsonContent, options = {}) {
  const {
    typeMode = 'auto',
    defaultSbaMarks = 2,
    defaultMtfMarks = 0.4,
  } = options;

  let rawList = jsonContent;
  if (typeof jsonContent === 'string') {
    rawList = safeJsonParse(jsonContent);
  }

  // Support either direct array `[...]` or wrapper `{ questions: [...] }`
  if (!Array.isArray(rawList)) {
    if (rawList && Array.isArray(rawList.questions)) {
      rawList = rawList.questions;
    } else {
      throw new Error('The JSON file must contain an array of question objects.');
    }
  }

  const questions = [];
  const errors = [];

  rawList.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`Item ${index + 1}: Question item is not an object.`);
      return;
    }

    const stem = (item.question || item.stem || item.title || item.text || '').trim();
    if (!stem) {
      errors.push(`Item ${index + 1}: Missing question stem.`);
      return;
    }

    // Parse options
    const rawOptions = item.options;
    let parsedOptions = [];
    const keyToIdMap = new Map();

    if (rawOptions && typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
      // Object format: { "ক": "text", "খ": "text", ... } or { "A": "text", ... }
      const keys = Object.keys(rawOptions);
      parsedOptions = keys.map((key, optIdx) => {
        const canonicalId = ENGLISH_OPTION_KEYS[optIdx] || `opt_${optIdx + 1}`;
        keyToIdMap.set(key.trim(), canonicalId);
        keyToIdMap.set(canonicalId, canonicalId);
        const normIdx = normalizeOptionIndex(key);
        if (normIdx !== null) {
          keyToIdMap.set(normIdx, canonicalId);
        }
        return {
          id: canonicalId,
          text: String(rawOptions[key] ?? '').trim(),
        };
      });
    } else if (Array.isArray(rawOptions)) {
      // Array format: ["opt1", "opt2"] or [{ id: "...", text: "..." }]
      parsedOptions = rawOptions.map((opt, optIdx) => {
        const canonicalId = ENGLISH_OPTION_KEYS[optIdx] || `opt_${optIdx + 1}`;
        keyToIdMap.set(canonicalId, canonicalId);
        keyToIdMap.set(optIdx, canonicalId);
        if (typeof opt === 'string') {
          return { id: canonicalId, text: opt.trim() };
        }
        return {
          id: opt.id && typeof opt.id === 'string' && /^[a-zA-Z0-9_-]+$/.test(opt.id) ? opt.id : canonicalId,
          text: String(opt.text ?? '').trim(),
        };
      });
    } else {
      errors.push(`Item ${index + 1}: Options must be an object or array.`);
      return;
    }

    if (parsedOptions.length < 2) {
      errors.push(`Item ${index + 1}: Must have at least 2 options.`);
      return;
    }

    // Determine question type: SBA or MTF
    const rawAnswer = item.answer ?? item.correctAnswer ?? item.correct_answer ?? item.correctOptionId;
    let type = QUESTION_TYPES.SBA;

    if (typeMode === 'sba') {
      type = QUESTION_TYPES.SBA;
    } else if (typeMode === 'mtf') {
      type = QUESTION_TYPES.MTF;
    } else {
      // Auto-detect:
      if (item.type === 'mtf' || (typeof rawAnswer === 'object' && rawAnswer !== null && !Array.isArray(rawAnswer))) {
        type = QUESTION_TYPES.MTF;
      } else {
        type = QUESTION_TYPES.SBA;
      }
    }

    // Explanation & extra metadata
    let explanation = (item.explanation || item.explain || item.solution || item.rationale || '').trim();
    const extraParts = [];
    if (item.topic && typeof item.topic === 'string') extraParts.push(`Topic: ${item.topic}`);
    if (item.subject && typeof item.subject === 'string') extraParts.push(`Subject: ${item.subject}`);
    if (item.repeat_exam && Array.isArray(item.repeat_exam) && item.repeat_exam.length > 0) {
      extraParts.push(`Past Exams: ${item.repeat_exam.join(', ')}`);
    }
    if (extraParts.length > 0) {
      explanation = explanation ? `${explanation}\n\n[${extraParts.join(' | ')}]` : `[${extraParts.join(' | ')}]`;
    }

    let correctOptionId = '';
    let correctAnswer = null;

    if (type === QUESTION_TYPES.SBA) {
      // Map answer to option id
      if (rawAnswer != null) {
        const answerStr = String(rawAnswer).trim();
        // Check map
        if (keyToIdMap.has(answerStr)) {
          correctOptionId = keyToIdMap.get(answerStr);
        } else {
          // Check normalized index
          const normIdx = normalizeOptionIndex(answerStr);
          if (normIdx !== null && parsedOptions[normIdx]) {
            correctOptionId = parsedOptions[normIdx].id;
          }
        }
      }
      correctAnswer = correctOptionId || null;
    } else {
      // MTF
      const mtfMap = {};
      if (rawAnswer && typeof rawAnswer === 'object' && !Array.isArray(rawAnswer)) {
        Object.entries(rawAnswer).forEach(([k, v]) => {
          let optId = keyToIdMap.get(k.trim());
          if (!optId) {
            const norm = normalizeOptionIndex(k);
            if (norm !== null && parsedOptions[norm]) optId = parsedOptions[norm].id;
          }
          if (optId) {
            mtfMap[optId] = typeof v === 'boolean' ? v : String(v).trim().toLowerCase().startsWith('t');
          }
        });
      }
      correctAnswer = mtfMap;
    }

    const marks = Number(item.marks) > 0 ? Number(item.marks) : (type === QUESTION_TYPES.MTF ? defaultMtfMarks : defaultSbaMarks);

    questions.push({
      id: generateUniqueId(index),
      type,
      stem,
      imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
      options: parsedOptions,
      correctOptionId,
      correctAnswer,
      explanation,
      marks,
    });
  });

  return {
    questions,
    total: questions.length,
    errors,
  };
}
