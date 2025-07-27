import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";
import { token } from "./token";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
  token,
});
