export const subscriptionData = async (
  accessToken,
  shop,
  id
) => {
  // console.log("Testing QUERY",accessToken, shop,id)
  const query = JSON.stringify({
    query: `query {
      node(id: "${id}") {
        __typename
        ... on AppSubscription {
          createdAt
          currentPeriodEnd
          id
          name
          status
          test
          lineItems {
            plan {
              pricingDetails {
                ... on AppRecurringPricing {
                  interval
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
    `,
  });

  const response = await fetch(
    `https://${shop}/admin/api/2021-07/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: query,
    }
  );


  const responseJson = await response.json();
  console.log("this is a response", responseJson);
  return responseJson;
};