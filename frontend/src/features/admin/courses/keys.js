/** TanStack Query keys for one course in the admin panel. Tabs and the shell share these so a save in one place refreshes the others. */
export const adminCourseKey = (id) => ['admin', 'course', id];
export const adminVideosKey = (courseId) => ['admin', 'videos', courseId];
export const adminExamsKey = (courseId) => ['admin', 'exams', courseId];
export const adminExamKey = (examId) => ['admin', 'exam', examId];
export const adminScheduleKey = (courseId) => ['admin', 'schedule', courseId];
