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
        const token = req.params.tokens;
        const episodeGUID = req.headers.episodeguid; // Extract the episodeGUID from the headers
        const playData = req.body;
        const processedData = (0, processing_1.processPlayData)(playData);
        // Store processedData in your database
        console.log('Processed Data:', processedData);
        const insertData = {
            headers: req.headers,
            data: processedData
        };
        if (!req.db) {
            throw new Error('Database connection not available');
        }
        if (req.dbType === 'mysql') {
            req.db.insertDocument(insertData, (error, results) => {
                if (error) {
                    return next(error);
                }
                res.json(results);
            });
        }
        else {
            const result = yield req.db.insertDocument(insertData);
            res.json(result);
        }
    }
    catch (error) {
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
