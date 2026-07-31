// lib/index.d.ts が公開する props 契約を型で検査する。
// design-sync はこの .d.ts を読んで API 契約を組み立てるため、
// ここが潰れると設計エージェントが全コンポーネントで API を誤用する。
import type { ButtonProps } from "../lib/index.js"

// variant / size が ButtonProps から到達でき、実際の union を持つ
const variant: ButtonProps["variant"] = "secondary"
const size: ButtonProps["size"] = "sm"

// @ts-expect-error 未知の値は弾かれること。
// ButtonProps が { [key: string]: unknown } へ潰れていると
// ButtonProps["variant"] は unknown になり、この行はエラーにならない。
// その場合 tsc は「未使用の @ts-expect-error」として失敗するので、
// 潰れを検出できる。
const invalid: ButtonProps["variant"] = "存在しない variant"

export { variant, size, invalid }
