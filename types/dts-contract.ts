// lib/index.d.ts が公開する props 契約を型で検査する。
// design-sync はこの .d.ts を読んで API 契約を組み立てるため、
// ここが潰れると設計エージェントが全コンポーネントで API を誤用する。
import type {
  AspectRatioProps,
  AvatarBadgeProps,
  AvatarFallbackProps,
  AvatarGroupCountProps,
  AvatarGroupProps,
  AvatarImageProps,
  AvatarProps,
  BreadcrumbEllipsisProps,
  BreadcrumbItemProps,
  BreadcrumbLinkProps,
  BreadcrumbListProps,
  BreadcrumbPageProps,
  BreadcrumbProps,
  BreadcrumbSeparatorProps,
  BubbleContentProps,
  BubbleGroupProps,
  BubbleProps,
  BubbleReactionsProps,
  ButtonProps,
  CheckboxProps,
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogOverlayProps,
  DialogPortalProps,
  DialogProps,
  DialogTitleProps,
  DialogTriggerProps,
  EmptyContentProps,
  EmptyDescriptionProps,
  EmptyHeaderProps,
  EmptyMediaProps,
  EmptyProps,
  EmptyTitleProps,
  InputOTPGroupProps,
  InputOTPProps,
  InputOTPSeparatorProps,
  InputOTPSlotProps,
  KbdGroupProps,
  KbdProps,
  MarkerContentProps,
  MarkerIconProps,
  MarkerProps,
  MessageAvatarProps,
  MessageContentProps,
  MessageFooterProps,
  MessageGroupProps,
  MessageHeaderProps,
  MessageProps,
  NativeSelectOptGroupProps,
  NativeSelectOptionProps,
  NativeSelectProps,
  ProgressIndicatorProps,
  ProgressLabelProps,
  ProgressProps,
  ProgressTrackProps,
  ProgressValueProps,
  RadioGroupItemProps,
  RadioGroupProps,
  SliderProps,
  SpinnerProps,
  SwitchProps,
  TableBodyProps,
  TableCaptionProps,
  TableCellProps,
  TableFooterProps,
  TableHeadProps,
  TableHeaderProps,
  TableProps,
  TableRowProps,
  TabsContentProps,
  TabsListProps,
  TabsProps,
  TabsTriggerProps,
  TextareaProps,
  ToasterProps,
  ToggleProps,
} from "../lib/index.js"

type NewPropsContracts = [
  BreadcrumbProps,
  BreadcrumbListProps,
  BreadcrumbItemProps,
  BreadcrumbLinkProps,
  BreadcrumbPageProps,
  BreadcrumbSeparatorProps,
  BreadcrumbEllipsisProps,
  BubbleProps,
  BubbleGroupProps,
  BubbleContentProps,
  BubbleReactionsProps,
  EmptyProps,
  EmptyHeaderProps,
  EmptyMediaProps,
  EmptyTitleProps,
  EmptyDescriptionProps,
  EmptyContentProps,
  InputOTPProps,
  InputOTPGroupProps,
  InputOTPSlotProps,
  InputOTPSeparatorProps,
  KbdProps,
  KbdGroupProps,
  RadioGroupProps,
  RadioGroupItemProps,
  SliderProps,
  SwitchProps,
  TextareaProps,
  ToggleProps,
]
const newPropsContractsReachable: NewPropsContracts extends unknown[] ? true : never = true
const inputOtpMaxLength: InputOTPProps["maxLength"] = 6
// @ts-expect-error InputOTP の maxLength は文字列を受けない。
const invalidInputOtpMaxLength: InputOTPProps["maxLength"] = "6"
const radioGroupValue: RadioGroupProps["value"] = "team"
// @ts-expect-error RadioGroup の value は数値を受けない。
const invalidRadioGroupValue: RadioGroupProps["value"] = 1
const sliderValue: SliderProps["value"] = 40
// @ts-expect-error Slider値は文字列を受けない。
const invalidSliderValue: SliderProps["value"] = "40"
const switchChecked: SwitchProps["checked"] = true
// @ts-expect-error Switch の checked は文字列を受けない。
const invalidSwitchChecked: SwitchProps["checked"] = "true"
const textareaRows: TextareaProps["rows"] = 4
// @ts-expect-error Textarea の rows は文字列を受けない。
const invalidTextareaRows: TextareaProps["rows"] = "4"
const toggleVariant: ToggleProps["variant"] = "outline"
// @ts-expect-error Toggle の未知 variant は弾かれること。
const invalidToggleVariant: ToggleProps["variant"] = "ghost"

const aspectRatio: AspectRatioProps["ratio"] = 16 / 9

type AvatarContracts = [
  AvatarProps,
  AvatarImageProps,
  AvatarFallbackProps,
  AvatarBadgeProps,
  AvatarGroupProps,
  AvatarGroupCountProps,
]
const avatarContractsReachable: AvatarContracts extends unknown[] ? true : never = true

// variant / size が ButtonProps から到達でき、実際の union を持つ
const variant: ButtonProps["variant"] = "secondary"
const size: ButtonProps["size"] = "sm"

// @ts-expect-error 未知の値は弾かれること。
// ButtonProps が { [key: string]: unknown } へ潰れていると
// ButtonProps["variant"] は unknown になり、この行はエラーにならない。
// その場合 tsc は「未使用の @ts-expect-error」として失敗するので、
// 潰れを検出できる。
const invalid: ButtonProps["variant"] = "存在しない variant"

type CheckboxContracts = [CheckboxProps]
const checkboxContractsReachable: CheckboxContracts extends unknown[] ? true : never = true
const checkboxDefaultChecked: CheckboxProps["defaultChecked"] = true

type DialogContracts = [
  DialogProps,
  DialogTriggerProps,
  DialogPortalProps,
  DialogCloseProps,
  DialogOverlayProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogFooterProps,
  DialogTitleProps,
  DialogDescriptionProps,
]

const dialogContentCloseButton: DialogContentProps["showCloseButton"] = true
const dialogFooterCloseButton: DialogFooterProps["showCloseButton"] = false
const dialogContractsReachable: DialogContracts extends unknown[] ? true : never = true

type MarkerContracts = [MarkerProps, MarkerIconProps, MarkerContentProps]
const markerContractsReachable: MarkerContracts extends unknown[] ? true : never = true
const markerVariant: MarkerProps["variant"] = "separator"

// @ts-expect-error 未知の variant は弾かれること。
const invalidMarkerVariant: MarkerProps["variant"] = "unknown"

type MessageContracts = [
  MessageProps,
  MessageGroupProps,
  MessageAvatarProps,
  MessageContentProps,
  MessageHeaderProps,
  MessageFooterProps,
]
const messageContractsReachable: MessageContracts extends unknown[] ? true : never = true
const messageAlignment: MessageProps["align"] = "end"

// @ts-expect-error 未知の alignment は弾かれること。
const invalidMessageAlignment: MessageProps["align"] = "center"

type NativeSelectContracts = [
  NativeSelectProps,
  NativeSelectOptionProps,
  NativeSelectOptGroupProps,
]
const nativeSelectContractsReachable: NativeSelectContracts extends unknown[] ? true : never = true
const nativeSelectSize: NativeSelectProps["size"] = "sm"

// @ts-expect-error 未知の size は弾かれること。
const invalidNativeSelectSize: NativeSelectProps["size"] = "lg"

type ProgressContracts = [
  ProgressProps,
  ProgressTrackProps,
  ProgressIndicatorProps,
  ProgressLabelProps,
  ProgressValueProps,
]
const progressContractsReachable: ProgressContracts extends unknown[] ? true : never = true
const progressValue: ProgressProps["value"] = 50

type SpinnerContracts = [SpinnerProps]
const spinnerContractsReachable: SpinnerContracts extends unknown[] ? true : never = true

type TableContracts = [
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableCaptionProps,
]
const tableContractsReachable: TableContracts extends unknown[] ? true : never = true

type TabsContracts = [TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps]
const tabsContractsReachable: TabsContracts extends unknown[] ? true : never = true
const toasterPosition: ToasterProps["position"] = "top-center"

export {
  newPropsContractsReachable,
  inputOtpMaxLength,
  invalidInputOtpMaxLength,
  radioGroupValue,
  invalidRadioGroupValue,
  sliderValue,
  invalidSliderValue,
  switchChecked,
  invalidSwitchChecked,
  textareaRows,
  invalidTextareaRows,
  toggleVariant,
  invalidToggleVariant,
  aspectRatio,
  avatarContractsReachable,
  variant,
  size,
  invalid,
  checkboxContractsReachable,
  checkboxDefaultChecked,
  dialogContentCloseButton,
  dialogFooterCloseButton,
  dialogContractsReachable,
  markerContractsReachable,
  markerVariant,
  invalidMarkerVariant,
  messageContractsReachable,
  messageAlignment,
  invalidMessageAlignment,
  nativeSelectContractsReachable,
  nativeSelectSize,
  invalidNativeSelectSize,
  progressContractsReachable,
  progressValue,
  spinnerContractsReachable,
  tableContractsReachable,
  tabsContractsReachable,
  toasterPosition,
}
