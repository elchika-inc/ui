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

type TabsContracts = [TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps]
const tabsContractsReachable: TabsContracts extends unknown[] ? true : never = true
const toasterPosition: ToasterProps["position"] = "top-center"

export {
  aspectRatio,
  avatarContractsReachable,
  variant,
  size,
  invalid,
  dialogContentCloseButton,
  dialogFooterCloseButton,
  dialogContractsReachable,
  tabsContractsReachable,
  toasterPosition,
}
