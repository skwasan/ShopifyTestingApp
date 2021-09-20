// import mongoose from 'mongoose'
// const usageSchema = new mongoose.Schema({
//     shopId: String,
//     subscriptionId: String,
//     record:{type:Array , default: []},
//     credits: {
//         type: Number,
//         default: function () {
//             let response = this.record.filter(obj => Object.keys(obj).includes("credit")).map(v => v.credit).reduce(function (acc, val) { return acc + val; }, 0)
//             return response ;
//         }
//     },
//     topup: {
//         type: Number,
//         default: function () {
//             let response = this.record.filter(obj => Object.keys(obj).includes("topup")).map(v => v.credit).reduce(function (acc, val) { return acc + val; }, 0)
//             return response
//         }
//     },
//     used: {
//         type: Number,
//         default: function () {
//             let response = this.record.filter(obj => Object.keys(obj).includes("used")).map(v => v.credit).reduce(function (acc, val) { return acc + val; }, 0)
//             return response;
//         }
//     },
//     creditLeft: {
//         type: Number,
//         default: function () {
//              let response = this.credits + this.topup - this.used;
//              return response;
//         }
//     }
// });
// const usageRecord = mongoose.model('usageRecord', usageSchema);
// export default usageRecord;

import mongoose from 'mongoose'
const usageSchema = new mongoose.Schema({
    shopId: { type: String, unique: true, required: true },
    subscriptionId: { type: String, unique: true },
    expired: { type: Boolean, default: false },
    credit: { type: Number, default: 0 },
    topup: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    totalcredit: { type: Number, default: 0 },
    record: { type: Array, default: [] },

});
const usageRecord = mongoose.model('usageRecord', usageSchema);
export default usageRecord;
