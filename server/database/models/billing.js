import mongoose from 'mongoose'
const billingSchema = new mongoose.Schema({
    billingId: String,
    shopId: String,
    shop: String,
    planName: String,
    price: String,
    type: String,
    expires: Date,
    createdOn: Date,
    // validity: String,
    currencyCode: String,
    status: String,
    test: Boolean
});
const billingModel = mongoose.model('Billing', billingSchema);
export default billingModel;
