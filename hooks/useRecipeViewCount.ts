"use client";

import { useEffect, useState } from "react";

/**
 * Counts at most one view per recipe per browser session and exposes the
 * latest total returned by the API. The component stays concerned with UI.
 */
export function useRecipeViewCount(
  recipeId: string | undefined,
  initialViews = 0,
): number {
  const [viewState, setViewState] = useState({
    recipeId,
    initialViews,
    views: initialViews,
  });

  useEffect(() => {
    if (!recipeId) return;

    const storageKey = `recipe-viewed:${recipeId}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
    } catch {
      // Storage blocked: fall through and count the view.
    }

    const controller = new AbortController();

    fetch(`/api/recipes/${encodeURIComponent(recipeId)}/view`, {
      method: "POST",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { views?: number } | null) => {
        if (typeof data?.views !== "number") return;
        setViewState({ recipeId, initialViews, views: data.views });
        try {
          window.sessionStorage.setItem(storageKey, "1");
        } catch {
          // Ignore: the view is already counted.
        }
      })
      .catch(() => {
        // Network errors and aborts must not break recipe rendering.
      });

    return () => controller.abort();
  }, [recipeId, initialViews]);

  return viewState.recipeId === recipeId &&
    viewState.initialViews === initialViews
    ? viewState.views
    : initialViews;
}
