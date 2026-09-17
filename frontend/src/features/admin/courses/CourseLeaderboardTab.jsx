import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminExams, fetchAdminCourseLeaderboard, fetchAdminExamPositions, updateAdminExamScore } from '../api/admin.api.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import { FaPenToSquare } from 'react-icons/fa6';
import { adminExamsKey } from './keys.js';

export default function CourseLeaderboardTab() {
  const { course } = useOutletContext();
  const queryClient = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState('');
  const [editingMark, setEditingMark] = useState(null);
  const [newScore, setNewScore] = useState('');

  const { data: exams = [] } = useQuery({
    queryKey: adminExamsKey(course.id),
    queryFn: () => fetchAdminExams({ courseId: course.id }),
  });

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['admin', 'leaderboard', course.id, selectedExamId],
    queryFn: () => selectedExamId ? fetchAdminExamPositions(selectedExamId) : fetchAdminCourseLeaderboard(course.id),
  });

  const updateScoreMutation = useMutation({
    mutationFn: ({ userId, score }) => updateAdminExamScore(selectedExamId, userId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leaderboard', course.id, selectedExamId] });
      setEditingMark(null);
      setNewScore('');
    }
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editingMark) {
      updateScoreMutation.mutate({ userId: editingMark.userId, score: Number(newScore) });
    }
  };

  const rows = leaderboard?.items ?? [];

  const columns = [
    { key: 'rank', header: 'Rank', render: (row) => <span className="font-semibold">{row.rank}</span> },
    { key: 'name', header: 'Student', render: (row) => <span className="text-stone-900 dark:text-white">{row.name}</span> },
    { key: 'score', header: 'Score', align: 'right', render: (row) => <span className="font-medium text-brand-700 dark:text-brand-400">{row.score}</span> },
  ];

  if (selectedExamId) {
    columns.push({
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Button size="sm" variant="ghost" onClick={() => {
          setEditingMark(row);
          setNewScore(String(row.score));
        }}>
          <FaPenToSquare aria-hidden="true" className="h-3.5 w-3.5" />
          Edit
        </Button>
      )
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h3 className="text-lg font-bold text-stone-900 dark:text-white">Leaderboard</h3>
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

      <Card>
        <CardHeader
          title={selectedExamId ? "Exam Leaderboard" : "Overall Leaderboard"}
          description={selectedExamId ? "Rankings for this specific exam" : "Aggregate ranking across all published exams"}
        />
        {isLoading ? (
          <ContentSkeleton variant="table" />
        ) : (
          <Table
            columns={columns}
            data={rows}
            rowKey={(row) => row.userId}
            emptyMessage="No submissions found."
          />
        )}
      </Card>

      <Modal
        open={Boolean(editingMark)}
        onClose={() => setEditingMark(null)}
        title="Edit Score"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <p className="text-sm text-stone-500">
            Editing score for <strong className="text-stone-900 dark:text-white">{editingMark?.name}</strong>.
          </p>
          <Input
            label="New Score"
            type="number"
            step="0.01"
            min="0"
            required
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setEditingMark(null)}>Cancel</Button>
            <Button type="submit" disabled={updateScoreMutation.isPending}>
              {updateScoreMutation.isPending ? 'Saving...' : 'Save Score'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
