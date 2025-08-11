import HomeView from "@/features/home/ui/views/home-view";
import { auth } from "@clerk/nextjs/server";


export default async function HomePage() {
  const { userId } = await auth();
  console.log("userId", userId);
  return <HomeView />;
}
