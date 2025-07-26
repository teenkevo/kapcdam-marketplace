import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
// import superjson from "superjson";
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        experimental_prefetchInRender: true,
      },
      dehydrate: {
          shouldDehydrateQuery: (query) =>{
            if (query.state.dataUpdatedAt === 0) {
              query.state.dataUpdatedAt = Date.now();
            }
            return (
              defaultShouldDehydrateQuery(query) ||
              query.state.status === "pending"
            );
          },
      },
      hydrate: {},
    },
  });
}

