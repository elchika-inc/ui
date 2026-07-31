import type { ComponentType } from "react";

import { createPreviewManifest } from "@/catalog/preview-manifest.mjs";
import type { PreviewProps } from "@/catalog/preview-types";

type PreviewModule = Record<string, ComponentType<PreviewProps>>;

export type PreviewItem = {
  name: string;
  title: string;
  Preview: ComponentType<PreviewProps>;
};

const modules = import.meta.glob<PreviewModule>("../previews/*.tsx", { eager: true });

export const previewItems = createPreviewManifest(modules) as PreviewItem[];
