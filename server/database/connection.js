import mongoose from 'mongoose';

mongoose.Promise = global.Promise;
// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
// mongoose.set("useFindAndModify", false);
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('MongoDB connection successful');
}).catch((e) => {
    console.log('No DB connected ', e);
})

