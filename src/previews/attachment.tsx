import { FileTextIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { useState } from "react";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Spinner } from "@/components/ui/spinner";

export function AttachmentPreview(_props: PreviewProps) {
  const [message, setMessage] = useState("添付ファイルを選択してください。");

  return (
    <div data-slot="attachment-preview" className="flex flex-col gap-4 p-6">
      <AttachmentGroup aria-label="添付ファイル">
        <Attachment>
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>仕様書.pdf</AttachmentTitle>
            <AttachmentDescription>1.8 MB・アップロード済み</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              aria-label="仕様書.pdfを削除"
              onClick={() => setMessage("仕様書.pdfの削除操作を選びました。")}
            >
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
          <AttachmentTrigger
            aria-label="仕様書.pdfを開く"
            onClick={() => setMessage("仕様書.pdfを選びました。")}
          />
        </Attachment>

        <Attachment state="uploading">
          <AttachmentMedia>
            <Spinner />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>写真.jpg</AttachmentTitle>
            <AttachmentDescription>アップロード中</AttachmentDescription>
          </AttachmentContent>
        </Attachment>

        <Attachment state="error">
          <AttachmentMedia>
            <TriangleAlertIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>データ.csv</AttachmentTitle>
            <AttachmentDescription>アップロードに失敗しました</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      </AttachmentGroup>
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
