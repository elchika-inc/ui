import {
  Calendar,
} from "ui-scaffold";

import { ja } from "date-fns/locale";
import { useState } from "react";

const initialDate = new Date(2026, 7, 15);

export function Overview() {
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
