export default function personHandler({ query: { cost } }, res) {
  console.log("API hit on credti", cost);
  res.status(200).json({ "id": `${cost}` })
}