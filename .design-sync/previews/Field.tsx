import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "ui-scaffold";

export function Overview() {
  return (
    <div data-slot="field-preview" className="mx-auto max-w-xl p-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-name">表示名</FieldLabel>
          <Input
            id="field-name"
            defaultValue="えるちか"
            aria-describedby="field-name-description"
          />
          <FieldDescription id="field-name-description">
            公開プロフィールに表示される名前です。
          </FieldDescription>
        </Field>

        <Field data-invalid="true">
          <FieldLabel htmlFor="field-email">メールアドレス</FieldLabel>
          <Input
            id="field-email"
            defaultValue="invalid-address"
            aria-invalid="true"
            aria-describedby="field-email-description field-email-error"
          />
          <FieldDescription id="field-email-description">
            連絡を受け取れるアドレスを入力してください。
          </FieldDescription>
          <FieldError id="field-email-error">有効なメールアドレスを入力してください。</FieldError>
        </Field>

        <Field data-disabled="true">
          <FieldLabel htmlFor="field-account-id">アカウント ID</FieldLabel>
          <Input
            id="field-account-id"
            defaultValue="elchika-001"
            aria-describedby="field-account-id-description"
            disabled
          />
          <FieldDescription id="field-account-id-description">
            アカウント ID は変更できません。
          </FieldDescription>
        </Field>
      </FieldGroup>
    </div>
  );
}
