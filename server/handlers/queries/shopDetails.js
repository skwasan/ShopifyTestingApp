export const shopDetails = async (
  accessToken,
  shop
) => {
  // console.log("Testing QUERY",accessToken, shop,id)
  const query = JSON.stringify({
    query: `query {
      shop {
        id
        name
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
  console.log("GraphQl Response of ShopDetail:", responseJson);
  return responseJson.data.shop.id;
};