import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import { useEnrollAction } from '../hooks/useEnrollAction.js';

export default function CourseAccessAction({ course, enrollment, badge = false, children = 'Enrol', ...props }) {
  const onEnroll = useEnrollAction();
  if (enrollment.activeIds.has(course.id)) {
    return badge
      ? <Badge tone="success" className="self-center justify-self-center">Enrolled ✓</Badge>
      : <Button {...props} to={`/dashboard/course/${course.slug}`}>Continue Learning</Button>;
  }
  if (enrollment.checking) return <Button {...props} disabled>Checking access…</Button>;
  if (enrollment.retry) return <Button {...props} onClick={() => enrollment.retry()}>Retry access check</Button>;
  return <Button {...props} onClick={() => onEnroll(course)}>{children}</Button>;
}
