import { useEffect, useState } from "react";
import type { PreviewProps } from "@/catalog/preview-types";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const slides = [
  { title: "基盤", description: "共通トークンと公開APIを確認します。" },
  { title: "検証", description: "操作・focus・境界状態を実測します。" },
  { title: "配布", description: "registryとライブラリの両経路へ届けます。" },
];

export function CarouselPreview(_props: PreviewProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    if (!api) return;

    const updateCurrent = () => setCurrent(api.selectedScrollSnap() + 1);
    updateCurrent();
    api.on("select", updateCurrent);
    api.on("reInit", updateCurrent);

    return () => {
      api.off("select", updateCurrent);
      api.off("reInit", updateCurrent);
    };
  }, [api]);

  return (
    <div data-slot="carousel-preview" className="flex min-h-72 items-center justify-center p-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Carousel
          aria-label="導入手順"
          tabIndex={0}
          setApi={setApi}
          className="focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={slide.title} aria-label={`${index + 1} / ${slides.length}`}>
                <div className="flex min-h-40 flex-col justify-center gap-2 rounded-lg border border-border bg-card p-6 text-card-foreground">
                  <p className="text-sm text-muted-foreground">ステップ {index + 1}</p>
                  <h2 className="text-xl font-semibold">{slide.title}</h2>
                  <p className="text-sm">{slide.description}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <p role="status" className="text-center text-sm text-muted-foreground">
          スライド {current} / {slides.length}
        </p>
      </div>
    </div>
  );
}
