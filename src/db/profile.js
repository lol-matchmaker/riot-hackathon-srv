"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Sequelize = require("sequelize");
var connection_1 = require("./connection");
// Sequelize model for PlayerProfile.
exports.ProfileModel = connection_1.sequelize.define('profile', {
    account_id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    summoner_id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    summoner_name: Sequelize.STRING,
    stats: Sequelize.JSON
}, {
    createdAt: false,
    updatedAt: 'updated_at'
});
// Create or update a profile in the database cache.
function writeProfile(profile) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.ProfileModel.upsert(profile)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.writeProfile = writeProfile;
// Fetch a profile from the database cache.
function readProfile(accountId) {
    return __awaiter(this, void 0, void 0, function () {
        var profile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.ProfileModel.findById(accountId)];
                case 1:
                    profile = _a.sent();
                    if (profile === null) {
                        return [2 /*return*/, null];
                    }
                    // TODO(pwnall): Probably fetch more things here.
                    return [2 /*return*/, profile];
            }
        });
    });
}
exports.readProfile = readProfile;
// Fetch a bunch of profiles from the database cache.
//
// If the cache does not contain all the requested data, returns the subset of
// the requested profiles that do exist.
function readProfiles(accountIds) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, profiles;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, exports.ProfileModel.findAll({ where: {
                            account_id: (_a = {}, _a[Sequelize.Op["in"]] = accountIds, _a)
                        } })];
                case 1:
                    profiles = _b.sent();
                    return [2 /*return*/, profiles];
            }
        });
    });
}
exports.readProfiles = readProfiles;
// Fetch a page of profiles from the database cache.
//
// This can be used to iterate over the entire database cache. pageStart should
// be the empty string for the first call. Future calls should use nextPageStart
// as the pageStart value. When nextPageStart is null, the iteration has
// completed.
//
// Each call might return fewer than pageSize results due to internal filtering.
function readProfilesPaged(pageStart, pageSize) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, profiles, resultSize, nextPageStart, data;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, exports.ProfileModel.findAll({
                        where: { account_id: (_a = {}, _a[Sequelize.Op.gt] = pageStart, _a) },
                        order: ['id'], limit: pageSize
                    })];
                case 1:
                    profiles = _b.sent();
                    resultSize = profiles.length;
                    nextPageStart = (resultSize < pageSize) ?
                        null : profiles[resultSize - 1].account_id;
                    data = profiles;
                    //      filter((record) => record.data_version === profileParserVersion).
                    //      map((record) => record.data);
                    return [2 /*return*/, { data: data, nextPageStart: nextPageStart }];
            }
        });
    });
}
exports.readProfilesPaged = readProfilesPaged;
