import { useState, useRef, useMemo } from 'react';
import { FaFileCode, FaUpload, FaCheck, FaTriangleExclamation, FaXmark } from 'react-icons/fa6';
import Modal from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { Select } from '@/components/ui/Input.jsx';
import { parseQuestionsJson } from './questionJsonParser.js';
import { QUESTION_TYPES } from '@/constants';
import { cn } from '@/lib/utils';

export default function UploadQuestionsModal({
  open,
  onClose,
  onImport,
  existingCount = 0,
  defaultSbaMarks = 2,
  defaultMtfMarks = 0.4,
}) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [typeMode, setTypeMode] = useState('auto');
  const [importMode, setImportMode] = useState(existingCount > 0 ? 'append' : 'replace');
  const [adjustTarget, setAdjustTarget] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState(null);

  const reset = () => {
    setFile(null);
    setRawText('');
    setParseError(null);
    setTypeMode('auto');
    setImportMode(existingCount > 0 ? 'append' : 'replace');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.json') && selectedFile.type !== 'application/json') {
      setParseError('Please upload a valid .json file.');
      return;
    }
    setFile(selectedFile);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setRawText(content);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read the uploaded file.');
    };
    reader.readAsText(selectedFile, 'utf-8');
  };

  const parsedData = useMemo(() => {
    if (!rawText) return null;
    try {
      setParseError(null);
      return parseQuestionsJson(rawText, {
        typeMode,
        defaultSbaMarks,
        defaultMtfMarks,
      });
    } catch (err) {
      setParseError(err.message);
      return null;
    }
  }, [rawText, typeMode, defaultSbaMarks, defaultMtfMarks]);

  const handleConfirmImport = () => {
    if (!parsedData || parsedData.questions.length === 0) return;
    onImport?.({
      questions: parsedData.questions,
      mode: importMode,
      adjustTarget,
    });
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload Questions from JSON"
      description="Upload a JSON file containing all exam questions at once. Supports Bengali and English options."
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!parsedData || parsedData.questions.length === 0}
            onClick={handleConfirmImport}
          >
            {parsedData && parsedData.questions.length > 0
              ? `Import ${parsedData.questions.length} Question${parsedData.questions.length === 1 ? '' : 's'}`
              : 'Import Questions'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* File Dropzone */}
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) handleFile(dropped);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
              isDragging
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                : 'border-stone-300 hover:border-brand-400 bg-stone-50/60 dark:border-stone-700 dark:bg-surface-dark'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300 mb-3">
              <FaUpload className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              Click to browse or drag and drop your JSON file
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Accepted format: <code className="rounded bg-stone-200 px-1 py-0.5 dark:bg-stone-800">.json</code> (SBA, MTF, or Mixed questions)
            </p>
          </div>
        ) : (
          /* File info bar */
          <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-brand-50/60 px-4 py-3 dark:border-stone-700 dark:bg-brand-950/30">
            <div className="flex items-center gap-3 min-w-0">
              <FaFileCode className="h-6 w-6 shrink-0 text-brand-600 dark:text-brand-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-900 dark:text-white">
                  {file.name}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={reset}>
              <FaXmark className="h-4 w-4 mr-1" /> Change file
            </Button>
          </div>
        )}

        {/* Parsing Error */}
        {parseError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            <FaTriangleExclamation className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="font-semibold">Unable to parse JSON file</p>
              <p className="mt-0.5">{parseError}</p>
            </div>
          </div>
        )}

        {/* Options & Preview */}
        {parsedData && (
          <div className="space-y-4 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3 dark:border-stone-700">
              <div className="flex items-center gap-2">
                <Badge tone="success" className="flex items-center gap-1.5 font-bold">
                  <FaCheck className="h-3 w-3" />
                  {parsedData.total} Questions Detected
                </Badge>
                {existingCount > 0 && (
                  <Badge tone="neutral">
                    {existingCount} currently in exam
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Question type handling"
                value={typeMode}
                onChange={(e) => setTypeMode(e.target.value)}
              >
                <option value="auto">Auto-detect (SBA / MTF by answer shape)</option>
                <option value="sba">Force all as SBA (Single Best Answer)</option>
                <option value="mtf">Force all as MCQ (True/False Statements)</option>
              </Select>

              {existingCount > 0 && (
                <Select
                  label="Import action"
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value)}
                >
                  <option value="append">Append to existing questions ({existingCount} existing)</option>
                  <option value="replace">Replace all existing questions</option>
                </Select>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300">
              <input
                type="checkbox"
                checked={adjustTarget}
                onChange={(e) => setAdjustTarget(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
              />
              <span>Automatically update Target Question Count to fit all imported questions</span>
            </label>

            {/* Questions preview */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Preview (First {Math.min(2, parsedData.questions.length)} of {parsedData.total} questions):
              </p>
              <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                {parsedData.questions.slice(0, 2).map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs dark:border-stone-700 dark:bg-surface-dark"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-brand-800 dark:text-brand-300">Q{idx + 1}.</span>
                      <Badge tone={q.type === QUESTION_TYPES.MTF ? 'info' : 'brand'}>
                        {q.type === QUESTION_TYPES.MTF ? 'MCQ (T/F)' : 'SBA'}
                      </Badge>
                      <span className="font-medium text-stone-900 dark:text-white line-clamp-1">
                        {q.stem}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pl-5 text-stone-600 dark:text-stone-300">
                      {q.options.slice(0, 4).map((opt) => (
                        <div
                          key={opt.id}
                          className={cn(
                            'truncate rounded px-1.5 py-0.5',
                            q.type === QUESTION_TYPES.SBA && q.correctOptionId === opt.id
                              ? 'bg-brand-100 font-semibold text-brand-800 dark:bg-brand-950/60 dark:text-brand-300'
                              : 'bg-white/80 dark:bg-stone-800/80'
                          )}
                        >
                          <span className="uppercase font-bold mr-1">{opt.id}:</span>
                          {opt.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
