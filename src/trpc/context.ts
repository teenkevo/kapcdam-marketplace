import { auth } from "@clerk/nextjs/server";
import { createTRPCContext } from "./init";

export const createContext = async () => {
  return {
    auth: await auth(),
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
