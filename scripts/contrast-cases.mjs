const source = (name, classes) => ({ source: `src/components/ui/${name}.tsx`, classes });

const foregroundOn = ({
  label,
  foreground,
  background,
  gate = "text-aa",
  reason,
  sourceClasses = [],
  themes,
  risk,
}) => ({
  label,
  foreground: typeof foreground === "string" ? { token: foreground } : foreground,
  background: typeof background === "string" ? { token: background } : background,
  gate,
  reason,
  sourceClasses,
  ...(themes ? { themes } : {}),
  ...(risk ? { risk } : {}),
});

const stateHoverSources = [
  source("attachment", ["has-[>a,>button]:hover:bg-state-hover"]),
  source("badge", ["hover:bg-state-hover"]),
  source("bubble", ["[&>[data-slot=bubble-content]:is(button,a):hover]:bg-state-hover"]),
  source("button", ["hover:bg-state-hover"]),
  source("navigation-menu", [
    "data-active:bg-state-hover",
    "data-open:bg-state-hover",
    "data-popup-open:bg-state-hover",
  ]),
  source("table", ["has-aria-expanded:bg-state-hover", "hover:bg-state-hover"]),
];

const opaqueMutedSources = [
  source("alert-dialog", ["bg-muted"]),
  source("card", ["bg-muted"]),
  source("dialog", ["bg-muted"]),
  source("item", ["bg-muted"]),
  source("table", ["bg-muted"]),
];

const ringForegroundSources = [
  source("alert-dialog", ["ring-foreground/10"]),
  source("card", ["ring-foreground/10"]),
  source("combobox", ["ring-foreground/10"]),
  source("dialog", ["ring-foreground/10"]),
  source("menubar", ["ring-foreground/10"]),
];

const invalidBorderSources = [
  source("checkbox", ["aria-invalid:border-destructive", "aria-invalid:ring-destructive"]),
  source("combobox", ["has-aria-invalid:border-destructive", "has-aria-invalid:ring-destructive"]),
  source("input", ["aria-invalid:border-destructive", "aria-invalid:ring-destructive"]),
  source("input-group", [
    "has-[[data-slot][aria-invalid=true]]:border-destructive",
    "has-[[data-slot][aria-invalid=true]]:ring-destructive",
  ]),
  source("native-select", ["aria-invalid:border-destructive", "aria-invalid:ring-destructive"]),
  source("radio-group", ["aria-invalid:border-destructive", "aria-invalid:ring-destructive"]),
  source("select", ["aria-invalid:border-destructive", "aria-invalid:ring-destructive"]),
  source("switch", ["aria-invalid:border-destructive", "aria-invalid:ring-destructive"]),
  source("textarea", ["aria-invalid:border-destructive", "aria-invalid:ring-destructive"]),
];

const controlSurfaceSources = [
  source("checkbox", ["bg-card"]),
  source("combobox", ["*:data-[slot=input-group]:bg-card", "bg-card"]),
  source("command", ["bg-card"]),
  source("input", ["bg-card"]),
  source("input-group", ["bg-card"]),
  source("input-otp", ["bg-card"]),
  source("native-select", ["bg-card"]),
  source("radio-group", ["bg-card"]),
  source("select", ["bg-card"]),
  source("tabs", ["data-active:bg-card"]),
  source("textarea", ["bg-card"]),
];

const disabledInputSources = [
  source("input", ["disabled:bg-muted", "disabled:opacity-disabled"]),
  source("input-group", ["has-disabled:bg-muted", "has-disabled:opacity-disabled"]),
  source("native-select", ["disabled:bg-muted", "disabled:opacity-disabled"]),
  source("select", ["disabled:bg-muted", "disabled:opacity-disabled"]),
  source("textarea", ["disabled:bg-muted", "disabled:opacity-disabled"]),
];

const destructiveSubtleSources = [
  source("attachment", [
    "group-data-[state=error]/attachment:bg-destructive-subtle",
    "group-data-[state=error]/attachment:text-destructive-subtle-foreground",
  ]),
  source("badge", ["bg-destructive-subtle", "text-destructive-subtle-foreground"]),
  source("bubble", [
    "*:data-[slot=bubble-content]:bg-destructive-subtle",
    "*:data-[slot=bubble-content]:text-destructive-subtle-foreground",
  ]),
  source("button", ["bg-destructive-subtle", "text-destructive-subtle-foreground"]),
  source("menubar", [
    "data-[variant=destructive]:focus:bg-destructive-subtle",
    "data-[variant=destructive]:focus:text-destructive-subtle-foreground",
  ]),
];

const destructiveHoverSources = [
  source("badge", ["[a]:hover:state-hover-overlay"]),
  source("bubble", ["[&>[data-slot=bubble-content]:is(button,a):hover]:state-hover-overlay"]),
  source("button", ["hover:state-hover-overlay"]),
];

export const CONSUMER_CASES = [
  foregroundOn({
    label: "Kbd tooltip light alpha surface",
    foreground: "background",
    background: { token: "background", alpha: 0.2, underlay: "foreground" },
    reason: "tooltip 内 Kbd は反転 surface 上でも通常テキストを読める必要がある",
    themes: ["light"],
    sourceClasses: [source("kbd", ["in-data-[slot=tooltip-content]:bg-background/20"])],
  }),
  foregroundOn({
    label: "Kbd tooltip dark alpha surface",
    foreground: "background",
    background: { token: "background", alpha: 0.1, underlay: "foreground" },
    reason: "dark tooltip 内 Kbd の反転 surface でも通常テキストを読める必要がある",
    themes: ["dark"],
    sourceClasses: [source("kbd", ["dark:in-data-[slot=tooltip-content]:bg-background/10"])],
  }),
  foregroundOn({
    label: "primary solid",
    foreground: "primary-foreground",
    background: "primary",
    reason: "primary action の文字は通常状態で AA を満たす必要がある",
    sourceClasses: [
      source("badge", ["bg-primary", "text-primary-foreground"]),
      source("bubble", ["*:data-[slot=bubble-content]:bg-primary"]),
      source("button", ["bg-primary", "text-primary-foreground"]),
    ],
  }),
  foregroundOn({
    label: "primary hover",
    foreground: "primary-foreground",
    background: "primary-hover",
    reason: "primary hover でも action label の AA を維持する必要がある",
    sourceClasses: [
      source("badge", ["[a]:hover:bg-primary-hover"]),
      source("bubble", ["[&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary-hover"]),
      source("button", ["hover:bg-primary-hover"]),
    ],
  }),
  foregroundOn({
    label: "secondary state hover",
    foreground: "secondary-foreground",
    background: { token: "state-hover-bg", underlay: "secondary" },
    reason: "secondary hover でも label の AA を維持する必要がある",
    sourceClasses: [
      source("badge", ["[a]:hover:state-hover-overlay"]),
      source("button", ["hover:state-hover-overlay"]),
    ],
  }),
  foregroundOn({
    label: "selected surface",
    foreground: "foreground",
    background: { token: "state-selected-bg", underlay: "background" },
    reason: "brand tint の selected surface 上でも本文を読める必要がある",
    sourceClasses: [
      source("bubble", ["*:data-[slot=bubble-content]:bg-state-selected"]),
      source("field", ["has-data-checked:bg-state-selected"]),
    ],
  }),
  foregroundOn({
    label: "selected surface hover",
    foreground: "foreground",
    background: {
      token: "state-hover-bg",
      underlay: { token: "state-selected-bg", underlay: "background" },
    },
    reason: "brand tint hover surface 上でも本文を読める必要がある",
    sourceClasses: [
      source("bubble", ["[&>[data-slot=bubble-content]:is(button,a):hover]:state-hover-overlay"]),
    ],
  }),
  foregroundOn({
    label: "state hover surface",
    foreground: "muted-foreground",
    background: { token: "state-hover-bg", underlay: "background" },
    reason: "hover / expanded の state tint 上でも補助文を読める必要がある",
    sourceClasses: stateHoverSources,
  }),
  foregroundOn({
    label: "opaque muted surface",
    foreground: "muted-foreground",
    background: "muted",
    reason: "muted base surface 上でも補助文を読める必要がある",
    sourceClasses: opaqueMutedSources,
  }),
  foregroundOn({
    label: "opaque control placeholder",
    foreground: "muted-foreground",
    background: "card",
    reason: "opaque control surface 上でも placeholder を読める必要がある",
    sourceClasses: controlSurfaceSources,
  }),
  foregroundOn({
    label: "control state hover",
    foreground: "foreground",
    background: { token: "state-hover-bg", underlay: "card" },
    reason: "control hover surface 上でも入力値を読める必要がある",
    sourceClasses: [
      source("native-select", ["hover:state-hover-overlay"]),
      source("select", ["hover:state-hover-overlay"]),
    ],
  }),
  foregroundOn({
    label: "disabled input surface",
    foreground: { token: "foreground", alpha: 0.4 },
    background: "muted",
    gate: "disabled-exempt",
    reason: "disabled は AA exempt だが比率を観測し文字消失を防ぐ",
    sourceClasses: disabledInputSources,
  }),
  foregroundOn({
    label: "Switch unchecked surface",
    foreground: "background",
    background: { token: "input", alpha: 0.8, underlay: "background" },
    gate: "decorative",
    reason: "Switch は位置でも状態を伝えるため unchecked surface は装飾として観測する",
    sourceClasses: [source("switch", ["dark:data-unchecked:bg-input/80"])],
  }),
  foregroundOn({
    label: "Tabs inactive on muted",
    foreground: "muted-foreground",
    background: "muted",
    reason: "inactive tab label も通常テキストとして AA を満たす必要がある",
    sourceClasses: [source("tabs", ["text-muted-foreground"])],
  }),
  foregroundOn({
    label: "Tabs inactive on background",
    foreground: "muted-foreground",
    background: "background",
    reason: "inactive tab label が bare background に出る場合も AA を満たす必要がある",
  }),
  foregroundOn({
    label: "Sidebar foreground",
    foreground: "sidebar-foreground",
    background: "sidebar",
    reason: "sidebar の補助テキストも通常テキストとして AA を満たす必要がある",
    sourceClasses: [source("sidebar", ["text-sidebar-foreground"])],
  }),
  foregroundOn({
    label: "Attachment destructive text",
    foreground: "destructive-subtle-foreground",
    background: "card",
    reason: "添付エラー説明は alpha なしで AA を満たす必要がある",
    sourceClasses: [
      source("attachment", [
        "group-data-[state=error]/attachment:text-destructive-subtle-foreground",
      ]),
    ],
  }),
  foregroundOn({
    label: "Alert destructive text",
    foreground: "destructive-subtle-foreground",
    background: "card",
    reason: "Alert エラー説明は alpha なしで AA を満たす必要がある",
    sourceClasses: [
      source("alert", ["*:data-[slot=alert-description]:text-destructive-subtle-foreground"]),
    ],
  }),
  foregroundOn({
    label: "destructive subtle",
    foreground: "destructive-subtle-foreground",
    background: "destructive-subtle",
    reason: "destructive subtle surface 上の destructive text は AA を満たす必要がある",
    sourceClasses: destructiveSubtleSources,
  }),
  foregroundOn({
    label: "destructive subtle hover",
    foreground: "destructive-subtle-foreground",
    background: { token: "state-hover-bg", underlay: "destructive-subtle" },
    reason: "destructive hover surface 上の destructive text は AA を満たす必要がある",
    sourceClasses: destructiveHoverSources,
  }),
  foregroundOn({
    label: "solid destructive menu focus",
    foreground: "destructive-foreground",
    background: "destructive",
    reason: "menu の destructive focus は solid pair として AA を満たす必要がある",
    sourceClasses: [
      source("context-menu", [
        "data-[variant=destructive]:focus-visible:bg-destructive",
        "data-[variant=destructive]:focus-visible:text-destructive-foreground",
      ]),
      source("dropdown-menu", [
        "data-[variant=destructive]:focus-visible:bg-destructive",
        "data-[variant=destructive]:focus-visible:text-destructive-foreground",
      ]),
    ],
  }),
  foregroundOn({
    label: "focus ring on background",
    foreground: "ring",
    background: "background",
    gate: "nontext-ui",
    reason: "focus ring は操作対象を識別するため背景に対して 3:1 が必要",
    sourceClasses: [
      source("button", ["focus-visible:ring-ring"]),
      source("input", ["focus-visible:ring-ring"]),
    ],
  }),
  foregroundOn({
    label: "foreground /10 container ring",
    foreground: { token: "foreground", alpha: 0.1 },
    background: "card",
    gate: "decorative",
    reason: "container ring は focus 情報でない装飾境界として比率だけを観測する",
    sourceClasses: ringForegroundSources,
  }),
  foregroundOn({
    label: "input /30 decorative border",
    foreground: { token: "input", alpha: 0.3 },
    background: "background",
    gate: "decorative",
    reason: "group 内の補助 seam は装飾境界として比率だけを観測する",
    sourceClasses: [
      source("combobox", ["*:data-[slot=input-group]:border-input/30"]),
      source("command", ["border-input/30"]),
    ],
  }),
  foregroundOn({
    label: "invalid control boundary",
    foreground: "destructive",
    background: "card",
    gate: "nontext-ui",
    reason: "invalid control の border / ring は操作境界として 3:1 が必要",
    sourceClasses: invalidBorderSources,
  }),
  foregroundOn({
    label: "Attachment destructive /30 border",
    foreground: { token: "destructive", alpha: 0.3 },
    background: "background",
    gate: "decorative",
    reason: "Attachment error border は text と state も併用する補助 cue",
    sourceClasses: [source("attachment", ["data-[state=error]:border-destructive/30"])],
  }),
  foregroundOn({
    label: "Field selected boundary",
    foreground: "primary",
    background: "background",
    gate: "nontext-ui",
    reason: "checked field の opaque border は選択境界として 3:1 が必要",
    sourceClasses: [source("field", ["has-data-checked:border-primary"])],
  }),
  foregroundOn({
    label: "Chart /50 grid stroke",
    foreground: { token: "border", alpha: 0.5 },
    background: "background",
    gate: "decorative",
    reason: "chart grid は値を単独で伝えない装飾補助線",
    sourceClasses: [
      source("chart", [
        "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
        "border-border/50",
      ]),
    ],
  }),
  foregroundOn({
    label: "overlay token",
    foreground: "overlay",
    background: "background",
    gate: "decorative",
    reason: "overlay は blur と併用する visual contract で AA gate 対象外",
    sourceClasses: [source("dialog", ["bg-overlay"]), source("drawer", ["bg-overlay"])],
  }),
  foregroundOn({
    label: "warning pair",
    foreground: "warning-foreground",
    background: "warning",
    reason: "warning の本文 pair は通常テキストとして AA を満たす必要がある",
    risk: "RISK-006",
  }),
];
