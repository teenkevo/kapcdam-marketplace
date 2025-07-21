import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Image from "next/image";


export const MainNavigation = ({ scrolled }: { scrolled: boolean }) => {
  return (
    <nav
      className={`flex gap-8 items-center font-medium ${
        scrolled ? "text-white hover:text-white" : "text-dark hover:text-dark"
      }`}
    >
      <NavigationMenu 
      // viewport={false}
      >
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-none">
              Company
            </NavigationMenuTrigger>
            <NavigationMenuContent className="border-none rounded-md bg-background overflow-hidden">
              <ul className="grid gap-2 md:w-[400px] lg:w-[550px] lg:grid-cols-[.85fr_1fr]">
                <li className="row-span-4 overflow-hidden">
                  <NavigationMenuLink asChild>
                    <Link
                      className=" relative overflow-hidden flex h-full w-full flex-col justify-end rounded-md bg-primary hover:bg-primary/90 p-6 no-underline outline-hidden select-none focus:shadow-md"
                      href="/about-us"
                    >
                      <div className="mt-4 mb-2 text-lg font-medium text-white">
                        About Us
                      </div>
                      <p className="text-white/60 text-sm leading-tight">
                        Learn more about Amplified Access
                      </p>
                      <Image
                        src={"/images/countries/ug.svg"}
                        alt={""}
                        width={400}
                        height={400}
                        className="absolute opacity-10 translate-y-20 h-96 w-96 object-cover object-left left-0"
                      />
                    </Link>
                  </NavigationMenuLink>
                </li>
                <ListItem href="/strategy" title="Strategy 2025 - 2027">
                  Our plan for the next few years
                </ListItem>
                <ListItem href="/people" title="People">
                  The individuals who make this possible
                </ListItem>
                <ListItem href="/communities" title="Communities">
                  Empowering local voices and initiatives
                </ListItem>
                <ListItem href="/careers" title="Careers">
                  Build a more inclusive digital future
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Our Work</NavigationMenuTrigger>
            <NavigationMenuContent className="rounded-md">
              <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.85fr_1fr]">
                <li className="row-span-3 overflow-hidden">
                  <NavigationMenuLink asChild>
                    <Link
                      className=" relative overflow-hidden flex h-full w-full flex-col justify-end rounded-md bg-primary hover:bg-primary/90 p-6 no-underline outline-hidden select-none focus:shadow-md"
                      href="/adaption"
                    >
                      <div className="mt-4 mb-2 text-lg text-white font-medium">
                        Adaption
                      </div>
                      <p className="text-white/60 text-sm leading-tight">
                        Tailoring global tech to African context
                      </p>
                      <Image
                        src={"/images/countries/ke.svg"}
                        alt={""}
                        width={400}
                        height={400}
                        className="absolute opacity-10 translate-y-20 h-96 w-96 object-cover object-left left-10"
                      />
                    </Link>
                  </NavigationMenuLink>
                </li>
                <ListItem href="/build" title="Build">
                  Creating innovative digital tools where none exist
                </ListItem>
                <ListItem href="/support" title="Support">
                  Equipping communities with essential tech skills
                </ListItem>
                <ListItem href="/research" title="Research">
                  Exploring the forefront of digital rights and technology
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem className="">
            <Link href="/tools" className="text-sm px-4">
              Tools
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
            <NavigationMenuContent className="rounded-md">
              <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.85fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <Link
                      className=" relative overflow-hidden flex h-full w-full flex-col justify-end rounded-md bg-primary hover:bg-primary/90 p-6 no-underline outline-hidden select-none focus:shadow-md"
                      href="/reports"
                    >
                      <div className="mt-4 mb-2 text-white text-lg font-medium">
                        Reports
                      </div>
                      <p className="text-white/60 text-sm leading-tight">
                        In-depth analysis and findings from our work.
                      </p>
                      <Image
                        src={"/images/countries/tz.svg"}
                        alt={""}
                        width={400}
                        height={400}
                        className="absolute opacity-10 translate-y-20 h-96 w-96 object-cover object-left left-10"
                      />
                    </Link>
                  </NavigationMenuLink>
                </li>
                <ListItem
                  href="/insights-learnings"
                  title="Insights & Learnings"
                >
                  Key takeaways and lessons from our projects
                </ListItem>
                <ListItem href="/tips" title="Tips">
                  Practical advice for digital safety and empowerment
                </ListItem>
                <ListItem href="/success-stories" title="Success Stories">
                  Showcasing the impact of our collaborative efforts
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
};

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground/80 line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}


