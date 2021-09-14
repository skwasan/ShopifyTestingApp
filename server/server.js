import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import { createClient, getSubscriptionUrl, testingQuery } from './handlers';
import { storeCallback, loadCallback, deleteCallback } from './database/sessionStorage';
import billingModel from './database/models/billing';

dotenv.config();
// Initializing MongoDB Instance
require("./database/connection");

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
  API_VERSION: ApiVersion.April21,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.CustomSessionStorage(
    storeCallback,
    loadCallback,
    deleteCallback
  ),
});

const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();
// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        const client = createClient(shop, accessToken);
        // Need to change!!!
        server.context.client = client;
        server.context.shop = shop;
        server.context.accessToken = accessToken;

        // console.log("Client Created in CTX: \n", client);

        ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) =>
            delete ACTIVE_SHOPIFY_SHOPS[shop],
        });

        if (!response.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }
        const subcriptionResponse = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_SUBSCRIPTIONS_UPDATE",
          webhookHandler: async (topic, shop, body) => {
            console.log("Topic:", topic);
            console.log("Shop:", shop);
            console.log("Body:", body,);
            var bodyData = JSON.parse(body);
            console.log("BodyData", bodyData);
        

            var responseOfQuery = await testingQuery(accessToken, shop, bodyData.app_subscription.admin_graphql_api_id);
            console.log("responseOfQuery",JSON.stringify(responseOfQuery));
            // responseOfQuery = JSON.parse(responseOfQuery);
            var dataObject = {
              billingId: bodyData.app_subscription.admin_graphql_api_id,
              shopId: bodyData.app_subscription.admin_graphql_api_shop_id,
              shop: shop,
              planName: responseOfQuery.data.node.name,
              price: responseOfQuery.data.node.lineItems[0].plan.pricingDetails.price.amount,
              currencyCode: responseOfQuery.data.node.lineItems[0].plan.pricingDetails.price.currencyCode,
              type: responseOfQuery.data.node.__typename,
              expires: responseOfQuery.data.node.currentPeriodEnd,
              createdOn: responseOfQuery.data.node.createdAt,
              // validity: responseOfQuery.data.node.name,
              status: responseOfQuery.data.node.status,
              test: responseOfQuery.data.node.test
            }
            
            console.log("dataObject :",dataObject);
              var responseToBilling = billingModel.findOneAndUpdate({ billingId: dataObject.billingId, shopId: dataObject.shopId}, dataObject, {
                new: true,
                upsert: true
            }, function(error,value) {
              if (error) console.log("Error in Billing Query at webhook:",error);
              else  console.log("Value in Billing in Webhook is: ",value);
            });
            console.log("Response to Billing ",responseToBilling);
          }
        });

        if (!subcriptionResponse.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }
        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });
  //// Session Token Injection
  // async function injectSession(ctx, next) {
  //   const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
  //   ctx.sessionFromToken = session;
  //   if (session?.shop && session?.accessToken) {
  //     const client = createClient(session.shop, session.accessToken);
  //     ctx.myClient = client;
  //     console.log("My CLient Created in ctx ", ctx);
  //   }
  //   return next();
  // }
  //
  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );


  router.get(
    "(/api/test)",
    async (ctx) => {
      console.log(ctx);
      var returnUrl = `https:\/\/${ctx.shop}\/admin\/apps\/${process.env.APPNAME}\/charge`
      console.log("Return Url in API mid", returnUrl)
      // shadow-clone-dev.myshopify.com https://shadow-clone-dev.myshopify.com/admin/apps/testingapp-96/
      const response = await getSubscriptionUrl(ctx.accessToken, ctx.shop, returnUrl);
      // const response = await testingQuery(ctx.accessToken, ctx.shop);

      ctx.res.statusCode = 200;
      ctx.body = response;
    });

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {
    const shop = ctx.query.shop;

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });


  //// Session Token injection
  // server.use(injectSession);

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
