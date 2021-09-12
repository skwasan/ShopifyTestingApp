import { ApolloClient, InMemoryCache } from "@apollo/client"

export const createClient = (shop, accessToken) => {
  return new ApolloClient({
    uri: `https://${shop}/admin/api/2021-07/graphql.json`,
    // POST https://{shop}.myshopify.com/admin/api/2021-07/graphql.json

    request: operation => {
      operation.setContext({
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "User-Agent": `shopify-app-node ${process.env.npm_package_version
            } | Shopify App CLI`
        }
      });
    },
    cache: new InMemoryCache()


  });
};
