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
  MarkerContentProps,
  MarkerIconProps,
  MarkerProps,
  MessageAvatarProps,
  MessageContentProps,
  MessageFooterProps,
  MessageGroupProps,
  MessageHeaderProps,
  MessageProps,
  ProgressIndicatorProps,
  ProgressLabelProps,
  ProgressProps,
  ProgressTrackProps,
  ProgressValueProps,
  SpinnerProps,
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
  ToasterProps,
} from "../lib/index.js"

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
  progressContractsReachable,
  progressValue,
  spinnerContractsReachable,
  tableContractsReachable,
  tabsContractsReachable,
  toasterPosition,
}
