import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import App from "next/app";
import Head from 'next/head';
import { AppProvider } from "@shopify/polaris";
import { Provider, useAppBridge } from "@shopify/app-bridge-react";
import { authenticatedFetch } from "@shopify/app-bridge-utils";
import { Redirect } from "@shopify/app-bridge/actions";
import "@shopify/polaris/dist/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import ClientRouter from '../components/ClientRouter';
import RoutePropagator from '../components/RoutePropagator';
import React from "react";

function userLoggedInFetch(app, redirect) {
  const fetchFunction = authenticatedFetch(app);

  return async (uri, options) => {
    const response = await fetchFunction(uri, options);

    if (
      response.headers.get("X-Shopify-API-Request-Failure-Reauthorize") === "1"
    ) {
      const authUrlHeader = response.headers.get(
        "X-Shopify-API-Request-Failure-Reauthorize-Url"
      );

      redirect.dispatch(Redirect.Action.APP, authUrlHeader || `/auth`);
      return null;
    }

    return response;
  };
}

function MyProvider(props) {
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const client = new ApolloClient({
    fetch: userLoggedInFetch(app, redirect),
    fetchOptions: {
      credentials: "include",
    },
    cache: new InMemoryCache()
  });

  const Component = props.Component;

  return (
    <ApolloProvider client={client}>
      <Component {...props} redirect={redirect} />
    </ApolloProvider>
  );
}

class MyApp extends App {
  render() {
    const { Component, pageProps, host, router, shopOrigin } = this.props;
    const config = { apiKey: API_KEY, host: host, forceRedirect: true }
    return (
      <React.Fragment>
        <Head>
          <title>Penman Testing</title>
          <meta charSet="utf-8" />
        </Head>
        <AppProvider i18n={translations}>
          <Provider config={config}>
            <ClientRouter />
            <RoutePropagator />
            <MyProvider Component={Component} shopOrigin={shopOrigin} router={router} {...pageProps} />
          </Provider>
        </AppProvider>
      </React.Fragment>
    );
  }
}

MyApp.getInitialProps = async ({ ctx }) => {
  return {
    host: ctx.query.host,
    shopOrigin: ctx.query.shop,
  };
};

export default MyApp;
