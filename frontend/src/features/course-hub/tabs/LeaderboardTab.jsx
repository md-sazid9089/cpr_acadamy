import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCourseExams, fetchCourseLeaderboard, fetchExamPositions } from '@/features/student-dashboard/api/dashboard.api.js';
import Table from '@/components/ui/Table.jsx';
import { Select } from '@/components/ui/Input.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';

export default function LeaderboardTab({ courseSlug }) {
  const [selectedExamId, setSelectedExamId] = useState('');

  const { data: examsData } = useQuery({
    queryKey: ['student', 'courseExams', courseSlug],
    queryFn: () => fetchCourseExams(courseSlug),
  });

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['student', 'leaderboard', courseSlug, selectedExamId],
    queryFn: () => selectedExamId ? fetchExamPositions(selectedExamId) : fetchCourseLeaderboard(courseSlug),
  });

  const exams = examsData ? [...examsData.sba, ...examsData.mcq] : [];

  const rows = leaderboard?.items ?? [];
  const myRank = leaderboard?.me;

  const columns = [
    { key: 'rank', header: 'Rank', render: (row) => <span className="font-semibold">{row.rank}</span> },
    { key: 'name', header: 'Student', render: (row) => <span className={row.isMe ? "font-bold text-brand-600" : "text-stone-900 dark:text-white"}>{row.name} {row.isMe && '(You)'}</span> },
    { key: 'score', header: 'Score', align: 'right', render: (row) => <span className="font-medium text-brand-700 dark:text-brand-400">{row.score}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-white dark:bg-surface-dark border border-stone-200 dark:border-stone-200 rounded-xl">
        <h3 className="text-lg font-bold text-stone-900 dark:text-white">Course Leaderboard</h3>
        <Select
          className="w-full sm:w-64"
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
        >
          <option value="">Overall Course Leaderboard</option>
          {exams.filter(exam => exam.isPublished).map(exam => (
            <option key={exam.id} value={exam.id}>{exam.title}</option>
          ))}
        </Select>
      </div>

      {myRank && (
        <div className="p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-brand-800 dark:text-brand-300">Your Current Rank</p>
            <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">#{myRank.rank}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-brand-800 dark:text-brand-300">Total Score</p>
            <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">{myRank.score}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-surface-dark border border-stone-200 dark:border-stone-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4"><ContentSkeleton variant="table" /></div>
        ) : (
          <Table
            columns={columns}
            data={rows}
            rowKey={(row) => row.userId}
            emptyMessage="No submissions found."
          />
        )}
      </div>
    </div>
  );
}
