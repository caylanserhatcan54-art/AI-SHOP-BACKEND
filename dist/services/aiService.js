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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIReply = generateAIReply;
var node_fetch_1 = __importDefault(require("node-fetch"));
// AI Yanıt Üretici Servis
function generateAIReply(shopId, message, history) {
    return __awaiter(this, void 0, void 0, function () {
        var LM_URL, MODEL, formattedHistory, body, response, errorText, data, reply, err_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 5, , 6]);
                    LM_URL = process.env.LMSTUDIO_API_URL;
                    MODEL = process.env.LM_MODEL;
                    console.log("🚀 LMStudio'ya istek gönderiliyor...");
                    console.log("📡 URL:", LM_URL);
                    console.log("🤖 MODEL:", MODEL);
                    formattedHistory = history.map(function (m) { return ({
                        role: m.sender === "user" ? "user" : "assistant",
                        content: m.text,
                    }); });
                    body = {
                        model: MODEL,
                        messages: __spreadArray(__spreadArray([
                            { role: "system", content: "You are FlowAI Assistant" }
                        ], formattedHistory, true), [
                            { role: "user", content: message }
                        ], false)
                    };
                    console.log("📤 SEND BODY:", JSON.stringify(body, null, 2));
                    return [4 /*yield*/, (0, node_fetch_1.default)(LM_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                        })];
                case 1:
                    response = _d.sent();
                    console.log("📡 LMStudio STATUS:", response.status);
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    errorText = _d.sent();
                    console.error("❌ LMStudio RESPONSE ERROR:", errorText);
                    throw new Error("LMStudio API error");
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    data = _d.sent();
                    console.log("📥 LMStudio RAW RESPONSE:", data);
                    reply = ((_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || "Bir yanıt üretilemedi.";
                    return [2 /*return*/, reply];
                case 5:
                    err_1 = _d.sent();
                    console.error("🔥 generateAIReply ERROR:", err_1);
                    throw err_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
