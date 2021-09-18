import mongoose from 'mongoose';

mongoose.Promise = global.Promise;
// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
// mongoose.set("useFindAndModify", false);
mongoose.connect("mongodb+srv://admin:JX3moPcdhmmCFUi4@blackcluster.y5jrx.mongodb.net/Shopify?").then(() => {
    console.log('MongoDB connection successful');
}).catch((e) => {
    console.log('No DB connected ', e);
})


// Schema

const usageSchema = new mongoose.Schema({
    shopId: String,
    subscriptionId: String,
    record: { type: Array, default: [] },
    credits: {
        type: Number,
        default: function () {
            let response = this.record.filter(obj => Object.keys(obj).includes("credit")).map(v => v.credit).reduce(function (acc, val) { return acc + val; }, 0)
            return response;
        }
    },
    topup: {
        type: Number,
        default: function () {
            let response = this.record.filter(obj => Object.keys(obj).includes("topup")).map(v => v.credit).reduce(function (acc, val) { return acc + val; }, 0)
            return response
        }
    },
    used: {
        type: Number,
        default: function () {
            let response = this.record.filter(obj => Object.keys(obj).includes("used")).map(v => v.credit).reduce(function (acc, val) { return acc + val; }, 0)
            return response;
        }
    },
    creditLeft: {
        type: Number,
        default: function () {
            let response = this.credits + this.topup - this.used;
            return response;
        }
    }
});
const UsageRecord = mongoose.model('usageRecord', usageSchema);

//
const createPost = async (next) => {
    //

    var usageData = {
        shopId: "shopID1",
        subscriptionId: "subsID 1",
        record: [
            { "credit": 5000 }, { "used": 1000 }, { "used": 1000 }, { "used": 1000 }, { "topup": 1000 }, { "credit": 1000 }, { "credit": 1000 }
        ]

    }
    var responseToUsage = await UsageRecord.findOneAndUpdate({ shopId: usageData.shopId, subscriptionId: usageData.subscriptionId }, usageData, {
        new: true,
        upsert: true
    }, function (error, value) {
        if (error) console.log("Error in Billing Query at webhook:", error);
        // else  console.log("Value in Billing in Webhook is: ",value);
    });
    // The findPost will be called after the post is created
    next();
}

const findPost = async () => {
    const post = await UsageRecord.findOne({shopId: usageData.shopId});
    console.log(post);
}

createPost(findPost);