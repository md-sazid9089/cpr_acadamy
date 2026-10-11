import assert from 'node:assert/strict';
import test from 'node:test';
import { applyServerErrors, describeApiError, fieldLabel } from '../src/lib/form-errors.js';

test('field names read as people would say them', () => {
  assert.equal(fieldLabel('payerMobile'), 'Mobile number you paid from');
  assert.equal(fieldLabel('closesAt'), 'Closing time');
  assert.equal(fieldLabel('institutionOther'), 'Institution other');
  assert.equal(fieldLabel('questions.2.stem'), 'Question 3: stem');
  assert.equal(fieldLabel('classTime.start'), 'Class time');
});

test('a validation refusal says which field and why, instead of "check the submitted fields"', () => {
  const generic = 'Please check the submitted fields.';
  assert.equal(describeApiError('VALIDATION_ERROR', generic, { payerMobile: 'Enter a valid Bangladeshi mobile number' }), 'Mobile number you paid from: Enter a valid Bangladeshi mobile number');
  assert.equal(describeApiError('VALIDATION_ERROR', generic, { title: 'Required', price: 'Too small' }), 'Title: Required (and 1 more problem)');
  assert.equal(describeApiError('VALIDATION_ERROR', generic, { '': 'Required' }), generic, 'a whole-body error names no field');
  assert.equal(describeApiError('VALIDATION_ERROR', generic, {}), generic);
  assert.equal(describeApiError('INVALID_PASSWORD', 'The current password is incorrect.', {}), 'The current password is incorrect.');
});

test('server errors land on their own form fields; only the rest goes above the form', () => {
  const set = [];
  const setError = (name, error, options) => set.push([name, error.message, options.shouldFocus]);
  const error = { code: 'VALIDATION_ERROR', summary: 'Please check the submitted fields.', message: '…', fieldErrors: { body: 'Too short', relatedTo: 'Pick a topic', batchTitle: 'Unknown batch' } };
  assert.equal(applyServerErrors(error, setError, ['relatedTo', 'batchTitle', 'body']), null, 'nothing left over');
  assert.deepEqual(set, [['body', 'Too short', true], ['relatedTo', 'Pick a topic', false], ['batchTitle', 'Unknown batch', false]], 'only the first field is focused');

  set.length = 0;
  const partly = { ...error, fieldErrors: { body: 'Too short', section: 'Unknown section' } };
  assert.equal(applyServerErrors(partly, setError, ['body']), 'Section: Unknown section');
  assert.deepEqual(set.map(([name]) => name), ['body']);

  assert.equal(applyServerErrors({ code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.', fieldErrors: {} }, setError, ['body']), 'Too many attempts. Please try again later.');
  assert.equal(applyServerErrors({ code: 'NETWORK_ERROR' }, setError, ['body']), 'Something went wrong. Please try again.');
});
