import React from 'react'
import { Page, Layout } from '@shopify/polaris';
import { useRouter } from "next/router";


// for confirmation or decline of purchase 
const charge = ({ chargeId }) => {

  const { query } = useRouter();

  return (
    <Page
      fullWidth
      title="Charge"
    >
      <p>ChargeID:{query.charge_id}</p>
    </Page>
  )
}

// charge.getInitialProps = ({ query }) => {
//   return {
//     chargeId: query
//   };
// };

export default charge

// import Link from 'next/link'
// const About = ({query}) => (
//   <div>Click <Link href={{ pathname: 'about', query: { name: 'leangchhean' }}}><a>here</a></Link> to read more</div>
// )  

// About.getInitialProps = ({query}) => {
//   return {query}
// }

// export default About;