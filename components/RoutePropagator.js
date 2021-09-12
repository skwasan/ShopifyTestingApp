import { useEffect, useContext } from "react";
import Router, { useRouter } from "next/router";
import { Context as AppBridgeContext } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { RoutePropagator as ShopifyRoutePropagator } from "@shopify/app-bridge-react";

const RoutePropagator = () => {
  const router = useRouter();
  const { route } = router;
  const app = useContext(AppBridgeContext);

  useEffect(() => {
    app.subscribe(Redirect.Action.APP, ({ path }) => {
      Router.push(path);
    });
  }, [app]);

  return app && route ? <ShopifyRoutePropagator location={route} /> : null;
};
export default RoutePropagator;