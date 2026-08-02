import { ja } from "date-fns/locale";
import { useState } from "react";
import type { PreviewProps } from "@/catalog/preview-types";
import { Calendar } from "@/components/ui/calendar";

const initialDate = new Date(2026, 7, 15);

export function CalendarPreview(_props: PreviewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);

  return (
    <div data-slot="calendar-preview" className="flex flex-col items-start gap-4 p-6">
      <Calendar
        mode="single"
        locale={ja}
        defaultMonth={new Date(2026, 7, 1)}
        selected={selectedDate}
        onSelect={setSelectedDate}
      />
      <p role="status" className="text-sm text-muted-foreground">
        {selectedDate
          ? `選択日: ${selectedDate.toLocaleDateString("ja-JP", { dateStyle: "long" })}`
          : "日付は選択されていません。"}
      </p>
    </div>
  );
}
