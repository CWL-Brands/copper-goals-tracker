"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillAuthUsers = exports.syncUserOnDelete = exports.syncUserOnCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
// Initialize Admin SDK once per cold start
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
/**
 * When a Firebase Auth user is created (via console, API, or app),
 * create/merge a Firestore profile at users/{uid}.
 */
exports.syncUserOnCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;
    const docRef = db.collection('users').doc(uid);
    await docRef.set({
        id: uid,
        email: (email || '').toLowerCase(),
        name: displayName || (email ? email.split('@')[0] : 'Sales Representative'),
        photoUrl: photoURL || null,
        role: 'sales',
        passwordChanged: false,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
});
/**
 * When a Firebase Auth user is deleted, remove their Firestore profile.
 * If you prefer soft-deletes, replace with a flag like { disabled: true }.
 */
exports.syncUserOnDelete = functions.auth.user().onDelete(async (user) => {
    const { uid } = user;
    const docRef = db.collection('users').doc(uid);
    await docRef.delete().catch(() => void 0);
});
/**
 * Backfill: Iterate all Auth users and ensure users/{uid} exists in Firestore.
 * Secure with SYNC_SECRET header to prevent public access.
 * Usage: POST with header `x-sync-secret: <SYNC_SECRET>`
 */
exports.backfillAuthUsers = functions.https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method Not Allowed' });
            return;
        }
        const secret = process.env.SYNC_SECRET || '';
        const provided = (req.headers['x-sync-secret'] || req.headers['authorization'] || '').toString().replace(/^Bearer\s+/i, '');
        if (!secret || provided !== secret) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const auth = (0, auth_1.getAuth)();
        let nextPageToken = undefined;
        let processed = 0;
        let created = 0;
        let updated = 0;
        do {
            const page = await auth.listUsers(1000, nextPageToken);
            for (const u of page.users) {
                const { uid, email, displayName, photoURL } = u;
                const ref = db.collection('users').doc(uid);
                const snap = await ref.get();
                const data = {
                    id: uid,
                    email: (email || '').toLowerCase(),
                    name: displayName || (email ? email.split('@')[0] : 'Sales Representative'),
                    photoUrl: photoURL || null,
                    role: 'sales',
                    passwordChanged: false,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                    ...(snap.exists ? {} : { createdAt: firestore_1.FieldValue.serverTimestamp() }),
                };
                await ref.set(data, { merge: true });
                processed++;
                if (snap.exists)
                    updated++;
                else
                    created++;
            }
            nextPageToken = page.pageToken;
        } while (nextPageToken);
        res.json({ ok: true, processed, created, updated });
    }
    catch (e) {
        res.status(500).json({ error: e?.message || 'Backfill failed' });
    }
});
