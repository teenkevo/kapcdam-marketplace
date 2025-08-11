import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const Page = async () => {
  const user = await auth();
  if (!user) return redirect("/sign-in?redirect_url=/account");

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <UserProfile />
    </div>
  );
};

export default Page;
