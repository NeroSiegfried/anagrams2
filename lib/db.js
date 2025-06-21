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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetConnection = resetConnection;
exports.getFreshConnection = getFreshConnection;
exports.query = query;
exports.isDatabaseAvailable = isDatabaseAvailable;
exports.getDatabaseStatus = getDatabaseStatus;
var serverless_1 = require("@neondatabase/serverless");
var sql = null;
var connectionCount = 0;
// Initialize database connection with better error handling
function getConnection() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }
    // Create a fresh connection for each request in development
    if (process.env.NODE_ENV === 'development') {
        connectionCount++;
        console.log("Creating fresh database connection #".concat(connectionCount));
        return (0, serverless_1.neon)(process.env.DATABASE_URL);
    }
    // In production, reuse connection but with better error handling
    if (!sql) {
        sql = (0, serverless_1.neon)(process.env.DATABASE_URL);
        console.log("Database connection initialized");
    }
    return sql;
}
// Reset connection cache - useful for debugging
function resetConnection() {
    sql = null;
    connectionCount = 0;
    console.log("Database connection cache reset");
}
// Create a fresh connection for critical operations
function getFreshConnection() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }
    return (0, serverless_1.neon)(process.env.DATABASE_URL);
}
// Helper function for raw SQL queries
function query(sqlQuery_1) {
    return __awaiter(this, arguments, void 0, function (sqlQuery, params) {
        var connection, result, error_1;
        if (params === void 0) { params = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connection = getConnection();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    console.log('Executing query:', sqlQuery, 'with params:', params);
                    return [4 /*yield*/, connection(sqlQuery, params)];
                case 2:
                    result = _a.sent();
                    console.log('Raw Neon result:', result);
                    // Handle different result formats
                    if (result && result.rows) {
                        return [2 /*return*/, { rows: result.rows }];
                    }
                    else if (Array.isArray(result)) {
                        return [2 /*return*/, { rows: result }];
                    }
                    else if (result && typeof result === 'object') {
                        return [2 /*return*/, result];
                    }
                    else {
                        console.error('Unexpected result format:', result);
                        return [2 /*return*/, { rows: [] }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Database query error:", error_1);
                    // Reset connection on error to force fresh connection
                    if (process.env.NODE_ENV === 'development') {
                        resetConnection();
                    }
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Check if database is available
function isDatabaseAvailable() {
    try {
        getConnection();
        return true;
    }
    catch (_a) {
        return false;
    }
}
// Get database status
function getDatabaseStatus() {
    try {
        getConnection();
        return { available: true, error: null };
    }
    catch (error) {
        return { available: false, error: String(error) };
    }
}
