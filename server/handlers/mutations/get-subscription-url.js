export const getSubscriptionUrl = async (
  accessToken,
  shop,
  returnUrl = process.env.HOST
) => {
  console.log(accessToken,shop,returnUrl)
  const query = JSON.stringify({
    query: `mutation {
      appSubscriptionCreate(
        name: "Super Duper Plan"
        returnUrl: "${returnUrl}"
        test: true
        lineItems: [
          {
            plan: {
              appUsagePricingDetails: {
                cappedAmount: { amount: 10, currencyCode: USD }
                terms: "$1 for 1000 emails"
              }
            }
          }
          {
            plan: {
              appRecurringPricingDetails: {
                price: { amount: 10, currencyCode: USD }
              }
            }
          }
        ]
      )
      {
        userErrors {
          field
          message
        }
        confirmationUrl
        appSubscription {
          id
        }
      }
    }`,
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
  // return responseJson.data.appSubscriptionCreate.confirmationUrl;
  return responseJson;
};