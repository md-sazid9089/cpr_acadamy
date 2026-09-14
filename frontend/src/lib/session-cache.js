export function watchSessionCache(queryClient, authStore) {
  return authStore.subscribe((current, previous) => {
    if (
      Boolean(current.accessToken) !== Boolean(previous.accessToken) ||
      current.user?.id !== previous.user?.id ||
      current.user?.role !== previous.user?.role ||
      current.user?.status !== previous.user?.status
    ) {
      queryClient.clear();
    }
  });
}