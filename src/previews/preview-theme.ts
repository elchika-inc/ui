export type PreviewTheme = "light" | "dark";

type ThemeRoot = HTMLElement;
type ThemeObserver = Pick<MutationObserver, "observe" | "disconnect">;
type ThemeObserverConstructor = new (callback: MutationCallback) => ThemeObserver;

export function watchPreviewTheme(
  root: ThemeRoot,
  onTheme: (theme: PreviewTheme) => void,
  Observer: ThemeObserverConstructor = MutationObserver,
) {
  const sync = () => {
    const dataTheme = root.getAttribute("data-theme");
    const classTheme = root.classList.contains("dark") ? "dark" : "light";
    if (dataTheme === null) {
      throw new Error(`class と data-theme が不一致: ${classTheme} / 未設定`);
    }
    if (dataTheme !== "light" && dataTheme !== "dark") {
      throw new Error(`未知の data-theme: ${dataTheme}`);
    }
    if (classTheme !== dataTheme) {
      throw new Error(`class と data-theme が不一致: ${classTheme} / ${dataTheme}`);
    }
    onTheme(dataTheme);
  };

  sync();
  const observer = new Observer(sync);
  observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });

  return () => observer.disconnect();
}
