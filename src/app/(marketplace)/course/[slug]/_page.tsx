// import Container from "@/components/Container";
// import CourseModule from "@/components/CourseModule";
// import { Button } from "@/components/ui/button";
// import type { Metadata, ResolvingMetadata } from "next";
// import { BookAIcon, BookOpenText, Check, DownloadIcon } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import { client } from "@/sanity/lib/client";
// import { Course } from "@/types/course";
// import { urlFor } from "@/sanity/lib/image";


// export async function generateMetadata(
//   {
//     params,
//   }: {
//     params: { course: string };
//   },
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   let data = await client.fetch(
//     `*[_type == "course" && slug.current == "${params.course}"][0]`
//   );

//   return {
//     title: `${data?.title} - CPAF`,
//   };
// }

// export const generateStaticParams = async () => {
//   let data = await client.fetch(`*[_type == "course"]`);

//   const slugs = data.map(({ slug }: any) => slug.current);

//   return slugs.map((slug: string) => {
//     return {
//       slug,
//     };
//   });
// };

// export const revalidate = 7200;

// type Params = {
//   params: { course: string };
// };

// const CoursePage = async ({ params }: Params) => {
//   const data =
//     await client.fetch<Course>(`*[_type == "course" && slug.current == "${params.course}"][0]{
//   ...,
//   "teacher": {
//     "name": instructor->name,
//     "image": instructor->image.asset->url
//   },
//   "catalogueUrl": catalogue.asset->url,
//    "categories": categories[]->title
//   }`);

//   if (!data)
//     return (
//       <div className="min-h-screen grid place-items-center">
//         No Course Available
//       </div>
//     );

//   const {
//     _id,
//     title,
//     overview,
//     outline,
//     objectives,
//     prerequisites,
//     duration,
//     start_date,
//     end_date,
//     price,
//     teacher,
//     image,
//     catalogueUrl,
//     delivery,
//     targetAudience,
//     timeTable,
//     tools,
//     categories,
//   } = data;

//   return (
//     <div className="w-full min-h-screen">
//       <section className="bg-gold-10 relative pb-12">
//         <Container>
//           <div className="w-full h-full flex flex-col md:flex-row  gap-12 justify-center items-center py-12">
//             <div className="max-w-[640px]">
//               <div className="mb-12">
             
//               </div>
//               <h1 className="text-4xl text-navy-100">{title}</h1>
//               <p className="mt-4 text-navy-500/80 mb-4">{overview}</p>
        
//             </div>
//             <Image
//               src={(image && urlFor(image)) ?? ""}
//               alt={title}
//               className="w-[600px] object-cover rounded-md"
//               width={500}
//               height={400}
//             />

//             <div className="bg-white flex flex-col md:flex-row items-start gap-8 justify-between md:items-center rounded-md shadow-md py-8 md:py-4 px-8  w-fit max-w-[1000px]  md:absolute md:-bottom-20">
//               <Tile
//                 title={`${outline?.length} Course Modules`}
//                 content="Earn a career credential that demonstrates your expertise"
//               />
//               <Tile title="Price" content={`USD ${price?.toString()}`} />
//               <Tile title="Duration" content={duration} />
//               {/* 
//               <Link href={catalogueUrl??""} className="">
//                 <Button className="flex items-center gap-4">
//                   <BookOpenText />
//                   Download Courses Calender
//                 </Button>
//               </Link> */}
//             </div>
//           </div>
//         </Container>
//       </section>

//       <section className="py-14 md:py-20">
//         <Container>
//           <div className="flex flex-col md:flex-row justify-center gap-20 relative max-w-[1000px] mx-auto">
//             <div>
//               <div className="rounded-md border p-8 flex w-full gap-8 border-navy-100/40">
//                 <div>
//                   <h3 className="text-base text-navy-100 font-semibold mb-4">
//                     Course Objectives
//                   </h3>
//                   {objectives.map((audience, index) => (
//                     <p
//                       key={index}
//                       className={`text-sm text-navy-500 mb-2 flex items-center gap-4`}
//                     >
//                       <Check className="h-3 w-3" /> {audience}
//                     </p>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <h3 className="text-base text-navy-100 font-semibold mt-8">
//                   Course Outline
//                 </h3>
//                 <div className="border rounded-md border-navy-100/20 mt-4">
//                   {outline &&
//                     outline.map((module, index) => (
//                       <CourseModule
//                         key={index}
//                         index={index}
//                         title={module?.moduleTitle}
//                         content={module?.content}
//                       />
//                     ))}
//                 </div>
//               </div>
//             </div>

//             <div className=" bg-white shadow-md py-4 px-8 flex flex-col sticky top-10 w-full md:max-w-[300px] rounded-md">
//               <div className="w-full max-w-[300px] bg-white/50  group hover hover:bg-amb-blue/5 flex flex-col items-start rounded-md duration-300">
//                 <h3 className="text-base text-navy-100 font-semibold">
//                   This course is for:
//                 </h3>
//                 {targetAudience.map((audience, index) => (
//                   <p key={index} className={`text-sm text-navy-500 mb-2`}>
//                     {audience}
//                   </p>
//                 ))}
//               </div>
//               <div className="w-full max-w-[300px] bg-white/50  group hover hover:bg-amb-blue/5 flex flex-col items-start rounded-md duration-300 mt-4">
//                 <h3 className="text-base text-navy-100 font-semibold">Tools</h3>
//                 <p className={`text-sm text-navy-500 mb-2`}>{tools}</p>
//               </div>
//               <div className="w-full max-w-[300px] bg-white/50  group hover hover:bg-amb-blue/5 flex flex-col items-start rounded-md duration-300 mt-4">
//                 <h3 className="text-base text-navy-100 font-semibold">
//                   Delivery Method
//                 </h3>
//                 <p className={`text-sm text-navy-500 mb-2`}>{delivery}</p>
//               </div>
//               <div className="w-full max-w-[300px] bg-white/50  group hover hover:bg-amb-blue/5 flex flex-col items-start rounded-md duration-300">
//                 <h3 className="text-base text-navy-100 font-semibold">
//                   Prerequisites
//                 </h3>
//                 <p className={`text-sm text-navy-500 mb-2`}>{prerequisites}</p>
//               </div>
//             </div>
//           </div>
//         </Container>
//       </section>
//     </div>
//   );
// };

// export default CoursePage;

// const Tile = ({ title, content }: { title: string; content: string }) => {
//   return (
//     <div className="w-full min-w-[200px] px-4 h-full border-r border-gold-100 last:border-none">
//       <h3 className="text-base text-navy-100 font-semibold">{title}</h3>
//       <p className="text-xs text-navy-500/50">{content}</p>
//     </div>
//   );
// };
