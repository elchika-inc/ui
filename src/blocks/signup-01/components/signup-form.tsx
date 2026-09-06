import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>アカウントを作成</CardTitle>
        <CardDescription>必要な情報を入力してアカウントを作成します。</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={nameId}>氏名</FieldLabel>
              <Input id={nameId} type="text" placeholder="佐藤 美咲" required />
            </Field>
            <Field>
              <FieldLabel htmlFor={emailId}>メールアドレス</FieldLabel>
              <Input id={emailId} type="email" placeholder="misaki.sato@example.com" required />
              <FieldDescription>
                メールアドレスは連絡に使用します。第三者には共有しません。
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={passwordId}>パスワード</FieldLabel>
              <Input id={passwordId} type="password" required />
              <FieldDescription>8文字以上で入力します。</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={confirmPasswordId}>パスワード（確認）</FieldLabel>
              <Input id={confirmPasswordId} type="password" required />
              <FieldDescription>確認のため同じパスワードを入力します。</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit">アカウントを作成</Button>
                <Button variant="outline" type="button">
                  Google で登録
                </Button>
                <FieldDescription className="px-6 text-center">
                  アカウントをお持ちの場合は <a href="/">ログイン</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
