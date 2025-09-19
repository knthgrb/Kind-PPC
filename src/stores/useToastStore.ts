import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { Toast } from "@/types/notification";

interface ToastState {
  toasts: Toast[];
  notificationQueue: Toast[];
  maxToasts: number;
  defaultDuration: number;
  timers: Map<string, NodeJS.Timeout>; // Track timers for each toast

  // Actions
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;

  // Convenience methods (with default priorities)
  showSuccess: (
    // Default: normal priority
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => string;
  showError: (
    // Default: high priority
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => string;
  showInfo: (
    // Default: normal priority
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => string;
  showWarning: (
    // Default: high priority
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => string;

  // Queue management
  getToastsByPriority: () => Toast[];
  hasToast: (id: string) => boolean;
  processQueue: () => void;
  getQueueLength: () => number;

  // Timer management
  setTimer: (toastId: string, timer: NodeJS.Timeout) => void;
  clearTimer: (toastId: string) => void;
  clearAllTimers: () => void;
}

const generateId = () =>
  `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useToastStore = create<ToastState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        toasts: [],
        notificationQueue: [],
        maxToasts: 5,
        defaultDuration: 15000, // Increased from 10 to 15 seconds
        timers: new Map<string, NodeJS.Timeout>(), // Initialize timers map

        addToast: (toast: Omit<Toast, "id">): string => {
          const id = generateId();
          const newToast: Toast = {
            ...toast,
            id,
            priority: toast.priority || "normal",
            duration: toast.duration ?? get().defaultDuration,
          };

          set((state) => {
            const currentToasts = state.toasts;
            const queue = state.notificationQueue;

            // If we have space, add directly
            if (currentToasts.length < state.maxToasts) {
              let updatedToasts = [...currentToasts, newToast];

              // Sort by priority
              updatedToasts = updatedToasts.sort((a, b) => {
                const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
                return (
                  priorityOrder[b.priority || "normal"] -
                  priorityOrder[a.priority || "normal"]
                );
              });

              return { toasts: updatedToasts };
            } else {
              // No space, add to queue
              // For high priority toasts (urgent, high), replace lowest priority toast
              // High priority toasts (urgent, high) can replace lower priority ones
              // Priority order: urgent > high > normal > low
              // Chat messages are "normal", warnings are "high"
              const isHighPriority =
                newToast.priority === "urgent" || newToast.priority === "high";

              if (isHighPriority) {
                // Find the lowest priority toast to replace (the last one to maintain order)
                // Sort by priority, then by creation time (last added = last in array)
                const sortedToasts = [...currentToasts].sort((a, b) => {
                  const priorityOrder = {
                    urgent: 4,
                    high: 3,
                    normal: 2,
                    low: 1,
                  };
                  const aPriority = priorityOrder[a.priority || "normal"];
                  const bPriority = priorityOrder[b.priority || "normal"];

                  // First sort by priority (ascending - lowest first)
                  if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                  }

                  // Then by creation time (ascending - oldest first, so last added is last)
                  return a.id.localeCompare(b.id);
                });

                // Find the lowest priority group and get the last toast from it
                const lowestPriority = sortedToasts[0]?.priority || "normal";
                const lowestPriorityToasts = sortedToasts.filter(
                  (toast) => (toast.priority || "normal") === lowestPriority
                );
                const toastToReplace =
                  lowestPriorityToasts[lowestPriorityToasts.length - 1];

                if (toastToReplace && toastToReplace.priority !== "urgent") {
                  // Replace the last toast of the lowest priority
                  const updatedToasts = currentToasts.filter(
                    (t) => t.id !== toastToReplace.id
                  );
                  updatedToasts.push(newToast);

                  // Sort by priority (high priority goes to front)
                  const sortedUpdatedToasts = updatedToasts.sort((a, b) => {
                    const priorityOrder = {
                      urgent: 4,
                      high: 3,
                      normal: 2,
                      low: 1,
                    };
                    return (
                      priorityOrder[b.priority || "normal"] -
                      priorityOrder[a.priority || "normal"]
                    );
                  });

                  // Clear timer for the replaced toast and add it to queue
                  get().clearTimer(toastToReplace.id);
                  const updatedQueue = [...queue, toastToReplace];

                  // Reset timer for the newly displayed toast
                  if (
                    !newToast.persistent &&
                    (newToast.duration ?? get().defaultDuration) > 0
                  ) {
                    const timer = setTimeout(() => {
                      get().removeToast(newToast.id);
                    }, newToast.duration ?? get().defaultDuration);
                    get().setTimer(newToast.id, timer);
                  }

                  return {
                    toasts: sortedUpdatedToasts,
                    notificationQueue: updatedQueue,
                  };
                } else {
                  // No low priority toast to replace, add to queue
                  return {
                    notificationQueue: [...queue, newToast],
                  };
                }
              } else {
                // Normal/low priority, just add to queue
                return {
                  notificationQueue: [...queue, newToast],
                };
              }
            }
          });

          // Auto remove after duration (unless persistent)
          if (
            !toast.persistent &&
            (toast.duration ?? get().defaultDuration) > 0
          ) {
            const timer = setTimeout(() => {
              get().removeToast(id);
            }, toast.duration ?? get().defaultDuration);
            get().setTimer(id, timer);
          }

          return id;
        },

        removeToast: (id: string) => {
          // Clear timer for this toast
          get().clearTimer(id);

          // Find the toast being removed to check if it has a notification ID
          const currentToasts = get().toasts;
          const toastToRemove = currentToasts.find((toast) => toast.id === id);

          // Mark notification as read if this is a notification toast
          if (toastToRemove?.data?.notificationId) {
            // Import and call NotificationService to mark as read
            import("@/services/notifications/NotificationService")
              .then(({ NotificationService }) => {
                NotificationService.markAsRead(
                  toastToRemove.data!.notificationId as string
                );
              })
              .catch((error) => {
                console.error("Error marking notification as read:", error);
              });
          }

          set((state) => {
            const updatedToasts = state.toasts.filter(
              (toast) => toast.id !== id
            );
            const queue = state.notificationQueue;

            // If we have space and items in queue, process queue
            if (updatedToasts.length < state.maxToasts && queue.length > 0) {
              // Sort queue by priority and take the highest priority item
              const sortedQueue = [...queue].sort((a, b) => {
                const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
                return (
                  priorityOrder[b.priority || "normal"] -
                  priorityOrder[a.priority || "normal"]
                );
              });
              const nextToast = sortedQueue[0];
              const updatedQueue = queue.filter(
                (toast) => toast.id !== nextToast.id
              );

              // Add to toasts and sort by priority
              let newToasts = [...updatedToasts, nextToast];
              newToasts = newToasts.sort((a, b) => {
                const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
                return (
                  priorityOrder[b.priority || "normal"] -
                  priorityOrder[a.priority || "normal"]
                );
              });

              // Reset timer for the newly displayed toast (fresh timer from queue)
              if (
                !nextToast.persistent &&
                (nextToast.duration ?? get().defaultDuration) > 0
              ) {
                const timer = setTimeout(() => {
                  get().removeToast(nextToast.id);
                }, nextToast.duration ?? get().defaultDuration);
                get().setTimer(nextToast.id, timer);
              }

              return {
                toasts: newToasts,
                notificationQueue: updatedQueue,
              };
            }

            return { toasts: updatedToasts };
          });
        },

        clearAllToasts: () => {
          get().clearAllTimers();
          set({ toasts: [], notificationQueue: [] });
        },

        updateToast: (id: string, updates: Partial<Toast>) => {
          set((state) => ({
            toasts: state.toasts.map((toast) =>
              toast.id === id ? { ...toast, ...updates } : toast
            ),
          }));
        },

        showSuccess: (
          title: string,
          message?: string,
          options?: Partial<Toast>
        ) => {
          return get().addToast({
            type: "success",
            title,
            message,
            priority: "normal", // Success toasts have normal priority
            ...options,
          });
        },

        showError: (
          title: string,
          message?: string,
          options?: Partial<Toast>
        ) => {
          return get().addToast({
            type: "error",
            title,
            message,
            priority: "high", // Errors should have high priority
            ...options,
          });
        },

        showInfo: (
          title: string,
          message?: string,
          options?: Partial<Toast>
        ) => {
          return get().addToast({
            type: "info",
            title,
            message,
            priority: "normal", // Info toasts have normal priority
            ...options,
          });
        },

        showWarning: (
          title: string,
          message?: string,
          options?: Partial<Toast>
        ) => {
          return get().addToast({
            type: "warning",
            title,
            message,
            priority: "high", // Warnings should have high priority
            ...options,
          });
        },

        getToastsByPriority: () => {
          return get().toasts.sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
            return (
              priorityOrder[b.priority || "normal"] -
              priorityOrder[a.priority || "normal"]
            );
          });
        },

        hasToast: (id: string) => {
          return get().toasts.some((toast) => toast.id === id);
        },

        processQueue: () => {
          const state = get();
          if (
            state.toasts.length < state.maxToasts &&
            state.notificationQueue.length > 0
          ) {
            const nextToast = state.notificationQueue[0];
            const updatedQueue = state.notificationQueue.slice(1);

            let newToasts = [...state.toasts, nextToast];
            newToasts = newToasts.sort((a, b) => {
              const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
              return (
                priorityOrder[b.priority || "normal"] -
                priorityOrder[a.priority || "normal"]
              );
            });

            // Reset timer for the newly displayed toast (fresh timer from queue)
            if (
              !nextToast.persistent &&
              (nextToast.duration ?? get().defaultDuration) > 0
            ) {
              const timer = setTimeout(() => {
                get().removeToast(nextToast.id);
              }, nextToast.duration ?? get().defaultDuration);
              get().setTimer(nextToast.id, timer);
            }

            set({
              toasts: newToasts,
              notificationQueue: updatedQueue,
            });
          }
        },

        getQueueLength: () => {
          return get().notificationQueue.length;
        },

        // Timer management methods
        setTimer: (toastId: string, timer: NodeJS.Timeout) => {
          set((state) => {
            // Clear existing timer if any
            const existingTimer = state.timers.get(toastId);
            if (existingTimer) {
              clearTimeout(existingTimer);
            }

            // Set new timer
            const newTimers = new Map(state.timers);
            newTimers.set(toastId, timer);
            return { timers: newTimers };
          });
        },

        clearTimer: (toastId: string) => {
          set((state) => {
            const timer = state.timers.get(toastId);
            if (timer) {
              clearTimeout(timer);
              const newTimers = new Map(state.timers);
              newTimers.delete(toastId);
              return { timers: newTimers };
            }
            return state;
          });
        },

        clearAllTimers: () => {
          set((state) => {
            // Clear all existing timers
            state.timers.forEach((timer) => clearTimeout(timer));
            return { timers: new Map<string, NodeJS.Timeout>() };
          });
        },
      }),
      {
        name: "toast-storage",
        partialize: (state) => ({
          // Only persist non-persistent toasts and settings
          maxToasts: state.maxToasts,
          defaultDuration: state.defaultDuration,
          // Don't persist timers, toasts, or queue as they are runtime state
        }),
      }
    )
  )
);

// Selector hooks for better performance
export const useToasts = () => useToastStore((state) => state.toasts);

// Individual action selectors to avoid creating new objects
export const useAddToast = () => useToastStore((state) => state.addToast);
export const useRemoveToast = () => useToastStore((state) => state.removeToast);
export const useClearAllToasts = () =>
  useToastStore((state) => state.clearAllToasts);
export const useShowSuccess = () => useToastStore((state) => state.showSuccess);
export const useShowError = () => useToastStore((state) => state.showError);
export const useShowInfo = () => useToastStore((state) => state.showInfo);
export const useShowWarning = () => useToastStore((state) => state.showWarning);
export const useProcessQueue = () =>
  useToastStore((state) => state.processQueue);
export const useGetQueueLength = () =>
  useToastStore((state) => state.getQueueLength);

// Combined actions hook - using individual selectors to avoid object recreation
export const useToastActions = () => {
  return {
    addToast: useAddToast(),
    removeToast: useRemoveToast(),
    clearAllToasts: useClearAllToasts(),
    showSuccess: useShowSuccess(),
    showError: useShowError(),
    showInfo: useShowInfo(),
    showWarning: useShowWarning(),
  };
};
