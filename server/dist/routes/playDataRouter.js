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
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
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
exports.default = router;
