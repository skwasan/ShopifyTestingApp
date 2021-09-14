import SessionSch from './models/session';
import { Session } from '@shopify/shopify-api/dist/auth/session';



async function storeCallback(session) {
    console.log("Store Session", session);
    return await SessionSch.findOneAndUpdate({ shop:`${session.shop}` }, session, {
        new: true,
        upsert: true
    });
}

async function loadCallback(id) {
    // console.log(typeof id);
    const loadedSession = await SessionSch.findOne({ id: id });
    // console.log("Load Session", loadedSession);



    if (!loadedSession) {
        return undefined;
    }

    const sess = new Session(loadedSession.id);

    const { shop, state, scope, accessToken, isOnline, expires, onlineAccessInfo } = loadedSession
    sess.shop = shop
    sess.state = state
    sess.scope = scope
    sess.expires = expires ? new Date(expires) : undefined
    sess.isOnline = isOnline
    sess.accessToken = accessToken
    sess.onlineAccessInfo = onlineAccessInfo

    return sess;
}

async function deleteCallback(id) {
    const loadedSession = await SessionSch.findOneAndDelete({ id: id });
    console.log("Delete Session", loadedSession);
    return loadedSession;
}

export { storeCallback, loadCallback, deleteCallback };