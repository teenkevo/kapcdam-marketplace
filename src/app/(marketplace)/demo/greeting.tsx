"use client";
import { trpc } from "@/trpc/client";
export function ClientGreeting() {
  const [data] = trpc.hello.useSuspenseQuery({text:"Shafic"});
  return <div>{data.greeting}</div>;
}
