import { SidebarMenu, SidebarMenuItem, SidebarMenuSkeleton } from "ui-scaffold";

export function Overview() {
  return (
    <div className="max-w-xs p-6">
      <SidebarMenu>
        {[1, 2, 3, 4].map((row) => (
          <SidebarMenuItem key={row}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}

export function WithoutIcon() {
  return (
    <div className="max-w-xs p-6">
      <SidebarMenu>
        {[1, 2, 3].map((row) => (
          <SidebarMenuItem key={row}>
            <SidebarMenuSkeleton />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
