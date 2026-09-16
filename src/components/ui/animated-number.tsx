import * as React from "react";

import { cn } from "@/lib/utils";

export type AnimatedNumberProps = React.ComponentProps<"span"> & {
  value: number;
  locale?: string;
  format?: Intl.NumberFormatOptions;
};

function entranceCurve(token: string) {
  const match = token.trim().match(/^cubic-bezier\(([^)]+)\)$/);
  const points = match?.[1]?.split(",").map(Number);
  if (
    points?.length !== 4 ||
    !points.every(Number.isFinite) ||
    points[0] === undefined ||
    points[1] === undefined ||
    points[2] === undefined ||
    points[3] === undefined
  ) {
    return (progress: number) => progress;
  }
  const [a, b, c, d] = points;
  if (a < 0 || a > 1 || c < 0 || c > 1) return (progress: number) => progress;
  const coordinate = (t: number, first: number, second: number) =>
    3 * (1 - t) ** 2 * t * first + 3 * (1 - t) * t ** 2 * second + t ** 3;
  return (progress: number) => {
    let low = 0;
    let high = 1;
    // 時間軸 x の逆関数を二分法で求め、同じ t の y を補間率にする。
    for (let index = 0; index < 24; index += 1) {
      const middle = (low + high) / 2;
      if (coordinate(middle, a, c) < progress) low = middle;
      else high = middle;
    }
    return coordinate((low + high) / 2, b, d);
  };
}

function AnimatedNumber({
  value,
  locale = "ja-JP",
  format,
  className,
  ref,
  ...props
}: AnimatedNumberProps) {
  const rootRef = React.useRef<HTMLSpanElement | null>(null);
  const displayedRef = React.useRef(value);
  const [displayed, setDisplayed] = React.useState(value);
  const formatter = React.useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);
  const fractionDigits = format?.maximumFractionDigits ?? 0;
  const attachRef = React.useCallback(
    (node: HTMLSpanElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || Object.is(displayedRef.current, value)) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const style = getComputedStyle(root);
    const token = style.getPropertyValue("--duration-slower").trim();
    const time = token.match(/^(\d*\.?\d+)(ms|s)$/);
    const duration = time ? Number(time[1]) * (time[2] === "s" ? 1000 : 1) : 400;
    const ease = entranceCurve(style.getPropertyValue("--curve-entrance"));
    const from = displayedRef.current;
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      displayedRef.current = value;
      setDisplayed(value);
    };
    if (media.matches || duration === 0 || !Number.isFinite(from) || !Number.isFinite(value)) {
      finish();
      return;
    }

    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const next =
        progress === 1
          ? value
          : Number((from + (value - from) * ease(progress)).toFixed(fractionDigits));
      displayedRef.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    const onMotionChange = () => {
      if (media.matches) finish();
    };
    media.addEventListener("change", onMotionChange);
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", onMotionChange);
    };
  }, [value, fractionDigits]);

  return (
    <span
      {...props}
      ref={attachRef}
      data-slot="animated-number"
      role="img"
      className={cn("tabular-nums", className)}
      aria-label={formatter.format(value)}
    >
      <span aria-hidden>{formatter.format(displayed)}</span>
    </span>
  );
}

export { AnimatedNumber };
