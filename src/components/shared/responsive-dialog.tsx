"use client";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Dialog, DialogTitle, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";

interface Props {
  title: string ;
  description?: string;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ResponsiveDialog = ({
  title,
  description,
  children,
  open,
  onOpenChange,
}: Props) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className={"sr-only"}>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-20">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className={"sr-only"}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default ResponsiveDialog;