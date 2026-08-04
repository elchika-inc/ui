import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "ui-scaffold";

import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, MinusIcon, PlusIcon } from "lucide-react";

export function Overview() {
  return (
    <div data-slot="button-group-preview" className="flex flex-col gap-6 p-6">
      <ButtonGroup orientation="horizontal" aria-label="配置">
        <Button variant="outline" size="icon" aria-label="左揃え">
          <AlignLeftIcon />
        </Button>
        <Button variant="outline" size="icon" aria-label="中央揃え">
          <AlignCenterIcon />
        </Button>
        <Button variant="outline" size="icon" aria-label="右揃え">
          <AlignRightIcon />
        </Button>
      </ButtonGroup>

      <ButtonGroup orientation="horizontal" aria-label="数量">
        <ButtonGroupText>数量</ButtonGroupText>
        <ButtonGroupSeparator />
        <Button variant="outline" size="icon" aria-label="減らす">
          <MinusIcon />
        </Button>
        <Button variant="outline" size="icon" aria-label="増やす">
          <PlusIcon />
        </Button>
      </ButtonGroup>

      <ButtonGroup orientation="vertical" aria-label="表示密度">
        <Button variant="outline">コンパクト</Button>
        <ButtonGroupSeparator orientation="horizontal" />
        <Button variant="outline">標準</Button>
        <ButtonGroupSeparator orientation="horizontal" />
        <Button variant="outline">ゆったり</Button>
      </ButtonGroup>
    </div>
  );
}
