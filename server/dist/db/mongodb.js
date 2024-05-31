"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerformanceData = exports.checkEpisodeGUID = exports.upsertDocument = exports.insertDocument = exports.getToken = exports.saveToken = exports.connectDB = void 0;
const mongodb_1 = require("mongodb");
const client = new mongodb_1.MongoClient(process.env.MONGODB_URI);
let db;
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    yield client.connect();
    db = client.db(process.env.MONGODB_DB); // Connect to the specified database
    console.log('MongoDB connected');
});
exports.connectDB = connectDB;
const saveToken = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const collection = db.collection('podcast_performance_token');
    const result = yield collection.insertOne(data);
    return result;
});
exports.saveToken = saveToken;
const getToken = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const collection = db.collection('podcast_performance_token');
    const result = yield collection.findOne(data);
    return result;
});
exports.getToken = getToken;
const insertDocument = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const collection = db.collection('episode_performance');
    const result = yield collection.insertOne(data);
    return result;
});
exports.insertDocument = insertDocument;
const upsertDocument = (filter, data) => __awaiter(void 0, void 0, void 0, function* () {
    const collection = db.collection('episode_performance');
    const result = yield collection.updateOne(filter, { $set: data }, { upsert: true });
    return result;
});
exports.upsertDocument = upsertDocument;
const checkEpisodeGUID = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const collection = db.collection(process.env.MONGODB_EPISODE_DB);
    const result = yield collection.findOne(data);
    return result;
});
exports.checkEpisodeGUID = checkEpisodeGUID;
const getPerformanceData = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const collection = db.collection('episode_performance');
    const result = yield collection.find(data).toArray();
    return result;
});
exports.getPerformanceData = getPerformanceData;
