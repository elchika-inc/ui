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

const mutedHalfSources = [
  source("alert-dialog", ["bg-muted/50"]),
  source("attachment", ["has-[>a,>button]:hover:bg-muted/50"]),
  source("badge", ["dark:hover:bg-muted/50"]),
  source("bubble", ["dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted/50"]),
  source("button", ["dark:hover:bg-muted/50"]),
  source("card", ["bg-muted/50"]),
  source("dialog", ["bg-muted/50"]),
  source("item", ["bg-muted/50"]),
  source("navigation-menu", [
    "data-active:bg-muted/50",
    "data-open:bg-muted/50",
    "data-popup-open:bg-muted/50",
  ]),
  source("table", ["bg-muted/50", "has-aria-expanded:bg-muted/50", "hover:bg-muted/50"]),
];

const ringForegroundSources = [
  source("alert-dialog", ["ring-foreground/10"]),
  source("card", ["ring-foreground/10"]),
  source("combobox", ["ring-foreground/10"]),
  source("dialog", ["ring-foreground/10"]),
  source("menubar", ["ring-foreground/10"]),
];

const invalidBorderSources = [
  source("checkbox", ["dark:aria-invalid:border-destructive/50"]),
  source("combobox", ["dark:has-aria-invalid:border-destructive/50"]),
  source("input", ["dark:aria-invalid:border-destructive/50"]),
  source("native-select", ["dark:aria-invalid:border-destructive/50"]),
  source("radio-group", ["dark:aria-invalid:border-destructive/50"]),
  source("switch", ["dark:aria-invalid:border-destructive/50"]),
  source("textarea", ["dark:aria-invalid:border-destructive/50"]),
];

const activeInputSources = [
  source("button", ["dark:bg-input/30"]),
  source("checkbox", ["dark:bg-input/30"]),
  source("combobox", ["*:data-[slot=input-group]:bg-input/30", "dark:bg-input/30"]),
  source("command", ["bg-input/30"]),
  source("input", ["dark:bg-input/30"]),
  source("input-group", ["dark:bg-input/30"]),
  source("input-otp", ["dark:bg-input/30"]),
  source("native-select", ["dark:bg-input/30"]),
  source("radio-group", ["dark:bg-input/30"]),
  source("tabs", ["dark:data-active:bg-input/30"]),
  source("textarea", ["dark:bg-input/30"]),
];

const disabledInputSources = [
  source("input", ["disabled:bg-input/50", "dark:disabled:bg-input/80"]),
  source("input-group", ["has-disabled:bg-input/50", "dark:has-disabled:bg-input/80"]),
  source("native-select", ["disabled:bg-input/50", "dark:disabled:bg-input/80"]),
  source("textarea", ["disabled:bg-input/50", "dark:disabled:bg-input/80"]),
];

const destructiveTenSources = [
  source("attachment", ["group-data-[state=error]/attachment:bg-destructive/10"]),
  source("badge", ["bg-destructive/10"]),
  source("bubble", ["*:data-[slot=bubble-content]:bg-destructive/10"]),
  source("button", ["bg-destructive/10"]),
  source("menubar", ["data-[variant=destructive]:focus:bg-destructive/10"]),
];

const destructiveTwentySources = [
  source("badge", ["[a]:hover:bg-destructive/20", "dark:bg-destructive/20"]),
  source("bubble", [
    "[&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/20",
    "dark:*:data-[slot=bubble-content]:bg-destructive/20",
  ]),
  source("button", ["hover:bg-destructive/20", "dark:bg-destructive/20"]),
  source("menubar", ["dark:data-[variant=destructive]:focus:bg-destructive/20"]),
];

const destructiveThirtySources = [
  source("bubble", ["dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/30"]),
  source("button", ["dark:hover:bg-destructive/30"]),
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
    label: "primary /80 hover",
    foreground: "primary-foreground",
    background: { token: "primary", alpha: 0.8, underlay: "background" },
    reason: "primary hover でも action label の AA を維持する必要がある",
    sourceClasses: [
      source("badge", ["[a]:hover:bg-primary/80"]),
      source("bubble", ["[&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/80"]),
      source("button", ["hover:bg-primary/80"]),
    ],
  }),
  foregroundOn({
    label: "secondary /80 hover",
    foreground: "secondary-foreground",
    background: { token: "secondary", alpha: 0.8, underlay: "background" },
    reason: "secondary hover でも label の AA を維持する必要がある",
    sourceClasses: [
      source("badge", ["[a]:hover:bg-secondary/80"]),
      source("button", ["hover:bg-secondary/80"]),
    ],
  }),
  foregroundOn({
    label: "primary selected /10",
    foreground: "foreground",
    background: { token: "primary", alpha: 0.1, underlay: "background" },
    reason: "brand tint の selected surface 上でも本文を読める必要がある",
    sourceClasses: [
      source("bubble", ["*:data-[slot=bubble-content]:bg-primary/10"]),
      source("field", ["dark:has-data-checked:bg-primary/10"]),
    ],
  }),
  foregroundOn({
    label: "primary selected /20",
    foreground: "foreground",
    background: { token: "primary", alpha: 0.2, underlay: "background" },
    reason: "brand tint hover surface 上でも本文を読める必要がある",
    sourceClasses: [
      source("bubble", [
        "[&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/20",
        "dark:*:data-[slot=bubble-content]:bg-primary/20",
      ]),
    ],
  }),
  foregroundOn({
    label: "primary selected /30",
    foreground: "foreground",
    background: { token: "primary", alpha: 0.3, underlay: "background" },
    reason: "dark brand tint hover surface 上でも本文を読める必要がある",
    themes: ["dark"],
    sourceClasses: [
      source("bubble", ["dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/30"]),
    ],
  }),
  foregroundOn({
    label: "Field selected /5",
    foreground: "muted-foreground",
    background: { token: "primary", alpha: 0.05, underlay: "background" },
    reason: "checked field の補助文は淡い selected surface 上でも読める必要がある",
    themes: ["light"],
    sourceClasses: [source("field", ["has-data-checked:bg-primary/5"])],
  }),
  foregroundOn({
    label: "muted /50 state surface",
    foreground: "muted-foreground",
    background: { token: "muted", alpha: 0.5, underlay: "background" },
    reason: "hover / expanded の muted surface 上でも補助文を読める必要がある",
    sourceClasses: mutedHalfSources,
  }),
  foregroundOn({
    label: "active input /30 placeholder",
    foreground: "muted-foreground",
    background: { token: "input", alpha: 0.3, underlay: "background" },
    reason: "active control surface 上でも placeholder を読める必要がある",
    sourceClasses: activeInputSources,
  }),
  foregroundOn({
    label: "active input /50 hover",
    foreground: "foreground",
    background: { token: "input", alpha: 0.5, underlay: "background" },
    reason: "control hover surface 上でも入力値を読める必要がある",
    sourceClasses: [
      source("button", ["dark:hover:bg-input/50"]),
      source("native-select", ["dark:hover:bg-input/50"]),
    ],
  }),
  foregroundOn({
    label: "disabled input surface",
    foreground: { token: "foreground", alpha: 0.5 },
    background: { token: "input", alpha: 0.5, underlay: "background" },
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
    sourceClasses: [
      source("switch", ["dark:data-unchecked:bg-input/80"]),
      source("bubble", ["dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-input/30"]),
    ],
  }),
  foregroundOn({
    label: "Tabs inactive on muted",
    foreground: { token: "foreground", alpha: 0.6 },
    background: "muted",
    reason: "inactive tab label も通常テキストとして AA を満たす必要がある",
    themes: ["light"],
    sourceClasses: [source("tabs", ["text-foreground/60"])],
  }),
  foregroundOn({
    label: "Tabs inactive on background",
    foreground: { token: "foreground", alpha: 0.6 },
    background: "background",
    reason: "inactive tab label が bare background に出る場合も AA を満たす必要がある",
    themes: ["light"],
  }),
  foregroundOn({
    label: "Sidebar foreground /70",
    foreground: { token: "sidebar-foreground", alpha: 0.7 },
    background: "sidebar",
    reason: "sidebar の補助テキストも通常テキストとして AA を満たす必要がある",
    sourceClasses: [source("sidebar", ["text-sidebar-foreground/70"])],
  }),
  foregroundOn({
    label: "Attachment destructive text /80",
    foreground: { token: "destructive", alpha: 0.8 },
    background: "card",
    reason: "添付エラー説明は alpha 適用後も AA を満たす必要がある",
    sourceClasses: [
      source("attachment", ["group-data-[state=error]/attachment:text-destructive/80"]),
    ],
  }),
  foregroundOn({
    label: "Alert destructive text /90",
    foreground: { token: "destructive", alpha: 0.9 },
    background: "card",
    reason: "Alert エラー説明は alpha 適用後も AA を満たす必要がある",
    sourceClasses: [source("alert", ["*:data-[slot=alert-description]:text-destructive/90"])],
  }),
  foregroundOn({
    label: "destructive subtle /10",
    foreground: "destructive",
    background: { token: "destructive", alpha: 0.1, underlay: "background" },
    reason: "destructive subtle surface 上の destructive text は AA を満たす必要がある",
    sourceClasses: destructiveTenSources,
  }),
  foregroundOn({
    label: "destructive subtle /20",
    foreground: "destructive",
    background: { token: "destructive", alpha: 0.2, underlay: "background" },
    reason: "destructive hover surface 上の destructive text は AA を満たす必要がある",
    sourceClasses: destructiveTwentySources,
  }),
  foregroundOn({
    label: "destructive subtle /30",
    foreground: "destructive",
    background: { token: "destructive", alpha: 0.3, underlay: "background" },
    reason: "dark destructive hover surface 上の destructive text は AA を満たす必要がある",
    themes: ["dark"],
    sourceClasses: destructiveThirtySources,
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
    label: "destructive alpha decorative border",
    foreground: { token: "destructive", alpha: 0.5 },
    background: "background",
    gate: "decorative",
    reason: "invalid border は ring と状態文も併用する補助 cue として比率を観測する",
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
    label: "Field selected alpha border",
    foreground: { token: "primary", alpha: 0.3 },
    background: "background",
    gate: "decorative",
    reason: "checked field border は check state も併用する補助 cue",
    sourceClasses: [
      source("field", [
        "has-data-checked:border-primary/30",
        "dark:has-data-checked:border-primary/20",
      ]),
    ],
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
    label: "legacy overlay black /10",
    foreground: "overlay",
    background: "background",
    gate: "decorative",
    reason: "overlay は blur と併用する visual contract で AA gate 対象外",
    sourceClasses: [source("dialog", ["bg-black/10"]), source("drawer", ["bg-black/10"])],
  }),
  foregroundOn({
    label: "warning pair",
    foreground: "warning-foreground",
    background: "warning",
    reason: "warning の本文 pair は通常テキストとして AA を満たす必要がある",
    risk: "RISK-006",
  }),
];
