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
const express_1 = require("express");
const processing_1 = require("../utils/processing");
const router = (0, express_1.Router)();
router.post('/:token', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.params.token;
        const episodeGUID = req.headers.episodeguid; // Extract the episodeGUID from the headers
        const exp = parseInt(req.headers.exp, 10); // Extract the exp from the headers
        const playData = Array.isArray(req.body) ? req.body : []; // Ensure playData is an array
        if (!req.db) {
            throw new Error('Database connection not available');
        }
        let tokenData;
        if (!exp) {
            tokenData = yield req.db.getToken({ 's': token, 'exp': exp });
        }
        else {
            tokenData = yield req.db.getToken({ 's': token });
        }
        if (tokenData) {
            const checkPastListen = yield req.db.getPerformanceData({ 'session_id': tokenData._id });
            if (checkPastListen && checkPastListen.length > 0) {
                const pastData = checkPastListen[0]; // Assuming there is only one past data record
                if (pastData['useragent'] === req.headers['user-agent']) {
                    // Combine past listening data with new play data
                    const sanitizedPastData = pastData.data;
                    console.log(`Past Data - ${JSON.stringify(sanitizedPastData)}`);
                    const sanitizedPlayData = playData;
                    console.log(`currently Data - ${JSON.stringify(sanitizedPlayData)}`);
                    // Combine past listening data with new play data
                    const combinedData = sanitizedPastData.concat(sanitizedPlayData);
                    console.log(JSON.stringify(combinedData));
                    const processedData = (0, processing_1.processPlayData)(combinedData);
                    // Store combined processedData in your database
                    console.log('Processed Data:', processedData);
                    const updateData = {
                        session_id: tokenData._id,
                        episodeGUID: episodeGUID,
                        useragent: req.headers['user-agent'],
                        data: processedData
                    };
                    const result = yield req.db.upsertDocument({ session_id: tokenData._id, episodeGUID: episodeGUID }, updateData);
                    res.json(result);
                }
                else {
                    res.status(400).json({ error: 'User-agent mismatch' });
                }
            }
            else {
                const processedData = (0, processing_1.processPlayData)(playData);
                // Store processedData in your database
                console.log('Processed Data:', processedData);
                const updateData = {
                    session_id: tokenData._id,
                    episodeGUID: episodeGUID,
                    useragent: req.headers['user-agent'],
                    data: processedData
                };
                const result = yield req.db.upsertDocument({ session_id: tokenData._id, episodeGUID: episodeGUID }, updateData);
                res.json(result);
            }
        }
        else {
            console.log(`Token not found - { 's': ${token}, 'exp': ${exp} }`);
            res.status(404).json({ error: `Token not found - { 's': ${token}, 'exp': ${exp} }` });
        }
    }
    catch (error) {
        console.log(`${error} - ${JSON.stringify(error)}`);
        next(error);
    }
}));
router.get('/:episodeID', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const episodeID = req.params.episodeID; // Access the episodeID from req.params
        // Fetch the episode duration from syndication_episodes collection
        const episode = yield req.db.checkEpisodeGUID({ guid: episodeID });
        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }
        const totalDuration = episode.mediafiles.full_episode.duration; // Assuming duration is in seconds
        // Fetch the data related to the episode
        const dataRecords = yield req.db.getPerformanceData({ "headers.episodeguid": episodeID });
        if (dataRecords.length === 0) {
            return res.status(404).json({ error: 'No data found for the episode' });
        }
        // Flatten the data array
        const data = dataRecords.flatMap((record) => record.data);
        // Calculate counts
        const countMap = data.reduce((acc, item) => {
            acc[item.current] = (acc[item.current] || 0) + 1;
            return acc;
        }, {});
        // Find the highest count
        const maxCount = Math.max(...Object.values(countMap));
        // Calculate percentages based on the highest count
        const percentages = Object.entries(countMap).map(([current, count]) => ({
            current: Number(current),
            percentage: (count / maxCount) * 100
        }));
        const result = {
            guid: episodeID,
            duration: totalDuration,
            data: percentages
        };
        res.status(200).json(result);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
