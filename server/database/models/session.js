import mongoose from 'mongoose'
const sessionSchema = new mongoose.Schema({
    id: String,
    shop: String,
    state: String,
    scope: String,
    expires: Date,
    isOnline: Boolean,
    accessToken: String,
    onlineAccessInfo: {}
});
const SessionSch = mongoose.model('Session', sessionSchema);
export default SessionSch;
