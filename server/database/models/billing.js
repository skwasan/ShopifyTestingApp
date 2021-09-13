import mongoose from 'mongoose'
const sessionSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    shop: String,
    planName: String,
    price: String,
    type: String,
    expires: Date,
    createdOn: Date,
    validity: String,
    currencyCode: String,
    status: String,
    test: Boolean
});
const BillingModel = mongoose.model('Billing', sessionSchema);
export default BillingModel;
