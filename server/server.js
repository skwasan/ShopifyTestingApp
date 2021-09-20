import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import { createClient, getSubscriptionUrl, subscriptionData, shopDetails } from './handlers';
import { storeCallback, loadCallback, deleteCallback } from './database/sessionStorage';
import billingModel from './database/models/billing';
import usageRecord from './database/models/usage'
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
        server.context.shop = shop;
        server.context.accessToken = accessToken;
        server.context.shopId = await shopDetails(accessToken, shop);

        ACTIVE_SHOPIFY_SHOPS[shop] = scope;
        // WEBHOOK:1
        const uninstallWebhook = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) =>
            delete ACTIVE_SHOPIFY_SHOPS[shop],
        });

        if (!uninstallWebhook.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${uninstallWebhook.result}`
          );
        }
        //WEBHOOK:2
        const subscriptionWebhook = await Shopify.Webhooks.Registry.register({
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


            var responseOfQuery = await subscriptionData(accessToken, shop, bodyData.app_subscription.admin_graphql_api_id);
            console.log("responseOfQuery", JSON.stringify(responseOfQuery));
            // responseOfQuery = JSON.parse(responseOfQuery);
            var dataObject = {
              subscriptionId: bodyData.app_subscription.admin_graphql_api_id,
              shopId: bodyData.app_subscription.admin_graphql_api_shop_id,
              shop: shop,
              planName: responseOfQuery.data.node.name,
              price: responseOfQuery.data.node.lineItems[0].plan.pricingDetails.price.amount,
              currencyCode: responseOfQuery.data.node.lineItems[0].plan.pricingDetails.price.currencyCode,
              type: responseOfQuery.data.node.__typename,
              expires: responseOfQuery.data.node.currentPeriodEnd,
              createdOn: responseOfQuery.data.node.createdAt,
              // validity: responseOfQuery.data.node.name,
              // Need to add Trial Days for functionality
              status: responseOfQuery.data.node.status,
              test: responseOfQuery.data.node.test
            }

            console.log("dataObject :", dataObject);
            var responseToBilling = billingModel.findOneAndUpdate({ subscriptionId: dataObject.subscriptionId, shopId: dataObject.shopId }, dataObject, {
              new: true,
              upsert: true
            }, function (error, value) {
              if (error) console.log("Error in Billing Query at webhook:", error);
              // else  console.log("Value in Billing in Webhook is: ",value);
              else if (value.status === "ACTIVE") {
                // Add plan check here
                var usageQ = {
                  shopId: value.shopId,
                  subscriptionId: value.subscriptionId,
                  expired: false,
                  credit: 5000,
                  $push: {
                    record: {
                      "date": value.createdOn,
                      "credit": 5000
                    }
                  },
                }

              }
              else {
                console.log("Plan is CANCELLED on :", value.subscriptionId)
                var usageQ = {
                  shopId: value.shopId,
                  subscriptionId: value.subscriptionId,
                  expired: true,
                  credit: 0,
                }
              }

              var responseToUsageRecord = usageRecord.findOneAndUpdate({ shopId: usageQ.shopId }, usageQ, {
                new: true,
                upsert: true
              }, function (error, value) {
                if (error) console.log("Error in usageRecord Query :", error)
              });
              console.log("responseToUsageRecord:", responseToUsageRecord)

            });
          }
        });

        if (!subscriptionWebhook.success) {
          console.log(
            `Failed to register subscription webhook: ${subscriptionWebhook.result}`
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

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  // Shop
  router.get(
    "(/api/test)",
    async (ctx) => {
      var returnUrl = `https:\/\/${ctx.shop}\/admin\/apps\/${process.env.APPNAME}\/charge`
      const response = await getSubscriptionUrl(ctx.accessToken, ctx.shop, returnUrl);
      var confirmationUrl = response.data.appSubscriptionCreate.confirmationUrl;
      ctx.res.statusCode = 200;
      ctx.body = confirmationUrl;
    });

  /* 
  db.invoice.update({ "_id": ObjectId(req.params.id) },
  { "$inc": { "total": -200 } }, function (err, doc) {
    if (err) return new Error(err);
    if (doc.result.n > 0) {
      console.log(" Invoice updated with Payment info.", doc.result);
    } else {
      console.log("Something went wrong while payment info updation.")
    }
  });
  */
  // Credit Subtraction  
  router.get('/api/credit/:cost', async (ctx) => {
    var dateNow = new Date();
    // var n = d.toISOString()
    console.log("Middleware params", JSON.stringify(ctx.params)) // works with /:id
    var responseToUsageRecord = usageRecord.findOneAndUpdate({ shopId: ctx.shopId }, {
      $push: {
        record: {
          "date": dateNow.toISOString(),
          "used": ctx.params.cost
        }
      }, "$inc": { "credit": Math.abs(ctx.params.cost) * -1 }
    }, {
      new: true,
      upsert: true
    }, function (error, value) {
      if (error) console.log("Error in usageRecord in credit update Query :", error)
    });
    await handleRequest(ctx)
    ctx.body = `idme: ${ctx.params.cost}`
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
