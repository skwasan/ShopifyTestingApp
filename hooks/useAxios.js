import Axios from "axios";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";

export function useAxios() {
  const app = useAppBridge();
  const instance = Axios.create();

  instance.interceptors.request.use((config) => {

    return getSessionToken(app)
      .then((token) => {
        // config.headers["Content-Type"] = "application/json";
        // config.headers["X-Shopify-Access-Token"] = token;
        config.headers["Authorization"] = `Bearer ${token}`;
        return config;
      })
      .catch((err) => {
        console.log(err);
      });
  });


  return [instance];
}