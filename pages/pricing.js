import React from "react";
import { useAxios } from "../hooks/useAxios";
import { Redirect } from '@shopify/app-bridge/actions';
import {
  AppProvider,
  Card,
  Layout,
  Page,
  Popover,
  Button,
  ActionList,
  DisplayText
} from "@shopify/polaris";

function PlanCard(props) {
  const {
    planId,
    isSelected,
    title,
    monthlyPrice,
    annualPriceA,
    annualPriceB
  } = props;
  const [isActive, setStatus] = React.useState(false);
  const activator = (
    <Button
      onClick={() => setStatus(!isActive)}
      primary
      fullWidth={true}
      disabled={isSelected}
      size="large"
    >
      {isSelected ? "Current Plan" : "Select"}
    </Button>
  );

  return (
    <Layout.Section key={`key_${planId}`} oneThird>
      <Card title={title} sectioned>
        <div>
          <div style={{ height: 140 }}>
            <DisplayText size="large">${monthlyPrice}/Month</DisplayText>
            <p style={{ marginTop: 12, marginBottom: 12 }}>
              or ${annualPriceA}/month billed at ${annualPriceB} once per year
            </p>
            <div />
          </div>

          <div>
            <Popover
              active={isActive}
              activator={activator}
              onClose={() => setStatus(!isActive)}
              preferredAlignment="center"
            >
              <ActionList
                items={[
                  {
                    content: "Purchase Monthly",
                    onAction: () => {}
                  },
                  {
                    content: "Purchase Annual",
                    onAction: () => {}
                  }
                ]}
              />
            </Popover>
          </div>
        </div>
      </Card>
    </Layout.Section>
  );
}

export default class App extends React.Component {
  render() {
    const plans = [
      {
        id: "1",
        name: "Starter",
        monthlyPrice: 29,
        annualPrice: 299
      },
      {
        id: "2",
        name: "Plus",
        monthlyPrice: 59,
        annualPrice: 599
      },
      {
        id: "3",
        name: "Pro",
        monthlyPrice: 99,
        annualPrice: 999
      }
    ];
    return (
      <AppProvider>
        <Page fullWidth title="Billing">
          <Layout>
            {plans.map((plan) => (
              <PlanCard
                isSelected={plan.id === "2"}
                planId={plan.id}
                title={plan.name}
                monthlyPrice={plan.monthlyPrice}
                annualPriceA={(plan.annualPrice / 12).toFixed(2)}
                annualPriceB={plan.annualPrice.toString()}
              />
            ))}
          </Layout>
        </Page>
      </AppProvider>
    );
  }
}
