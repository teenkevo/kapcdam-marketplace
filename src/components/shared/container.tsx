import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const Container = ({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) => {
  return <div className={cn("@container", className)}></div>;
};

export default Container;
