import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_SLUGS } from '@/constants';
import { useAuthStore } from '@/lib/auth';

/**
 * Shared "Enrol" behaviour for cards and the detail page: signed-out visitors
 * are sent to login (returning here afterwards), signed-in students go to
 * checkout.
 */
export function useEnrollAction() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken && s.user));

  return useCallback(
    (course) => {
      const detailPath = `/courses/${CATEGORY_SLUGS[course.category]}/${course.slug}`;

      if (!isAuthenticated) {
        navigate('/login', { state: { from: detailPath, intent: 'enroll' } });
        return;
      }

      // TODO: POST /courses/:id/enroll before checkout once the API exists.
      navigate(`/dashboard/checkout/${course.slug}`);
    },
    [isAuthenticated, navigate],
  );
}
