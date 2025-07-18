import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

const token = process.env.SANITY_READ_TOKEN;

if(!token){
  throw new Error("Sanity token not found")
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based 
  // perrevalidation

  perspective: "published",
  token
})
