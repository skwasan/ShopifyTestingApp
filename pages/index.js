import { Heading, Page, Button } from "@shopify/polaris";
import { useAxios } from "../hooks/useAxios";
import { Redirect } from '@shopify/app-bridge/actions';

const Index = (props) => {
  // https://shadow-clone-dev.myshopify.com/admin/apps/testingapp-96/

  const [axios] = useAxios();

  const handlesubmit = (e) => {
    e.persist();
    axios.get("/api/test").then(
      (res) => {
        console.log("Full response in Index of getsubsurl", res.data);
        let confirmationUrl = res.data.split('admin')[1];
        console.log("Split data is ", confirmationUrl);
        // props.redirect.dispatch(Redirect.Action.ADMIN_PATH, confirmationUrl);
      }
    ).catch(
      (error) => console.log("Error in Subscription App.js:", error));
    // console.log("Button is clicked! ", response);
  }
  return (
    <Page>
      <Heading>Shopify app with Node and React 🎉</Heading>
      <Button onClick={handlesubmit}>
        Create Subscription
      </Button>
    </Page>
  );
}

export default Index;
