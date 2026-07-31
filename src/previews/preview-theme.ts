export type PreviewTheme = "light" | "dark";

type ThemeRoot = HTMLElement;
type ThemeObserver = Pick<MutationObserver, "observe" | "disconnect">;
type ThemeObserverConstructor = new (callback: MutationCallback) => ThemeObserver;

export function watchPreviewTheme(
  root: ThemeRoot,
  onTheme: (theme: PreviewTheme) => void,
  Observer: ThemeObserverConstructor = MutationObserver,
) {
  const sync = () => onTheme(root.classList.contains("dark") ? "dark" : "light");

  sync();
  const observer = new Observer(sync);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });

  return () => observer.disconnect();
}
