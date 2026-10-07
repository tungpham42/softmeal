export const RECIPE_EXPLORER_RESET_EVENT = "recipe-explorer-reset";

export function requestRecipeExplorerReset() {
  window.dispatchEvent(new Event(RECIPE_EXPLORER_RESET_EVENT));
}
