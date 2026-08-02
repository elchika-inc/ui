import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const avatarImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%231d4ed8'/%3E%3Ccircle cx='32' cy='25' r='12' fill='%23bfdbfe'/%3E%3Cpath d='M10 60c3-14 12-21 22-21s19 7 22 21' fill='%23bfdbfe'/%3E%3C/svg%3E";

export function AvatarPreview() {
  return (
    <div data-slot="avatar-preview" className="flex items-center gap-4 p-6">
      <Avatar aria-label="プロフィール画像">
        <AvatarImage src={avatarImage} alt="青いプロフィール画像" />
        <AvatarFallback delay={0}>NK</AvatarFallback>
      </Avatar>
      <Avatar aria-label="プロフィール画像のフォールバック" size="lg">
        {/* 上流が定義する「画像未提供」の fallback 経路を検証する。読み込み失敗の経路ではない。 */}
        <AvatarImage alt="" />
        <AvatarFallback delay={0}>UI</AvatarFallback>
      </Avatar>
    </div>
  );
}
