import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">アカウントを作成</CardTitle>
          <CardDescription>メールアドレスを入力してアカウントを作成します。</CardDescription>
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
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor={passwordId}>パスワード</FieldLabel>
                    <Input id={passwordId} type="password" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={confirmPasswordId}>パスワード（確認）</FieldLabel>
                    <Input id={confirmPasswordId} type="password" required />
                  </Field>
                </Field>
                <FieldDescription>8文字以上で入力します。</FieldDescription>
              </Field>
              <Field>
                <Button type="submit">アカウントを作成</Button>
                <FieldDescription className="text-center">
                  アカウントをお持ちの場合は <a href="/">ログイン</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        続行すると、<a href="/">利用規約</a>と<a href="/">プライバシーポリシー</a>
        に同意したことになります。
      </FieldDescription>
    </div>
  );
}
