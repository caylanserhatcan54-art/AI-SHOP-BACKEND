"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRouter = void 0;
var express_1 = require("express");
var node_fetch_1 = __importDefault(require("node-fetch"));
var firebase_admin_1 = require("../config/firebase-admin");
exports.productsRouter = (0, express_1.Router)();
/**
 * --------------------------------------------------------
 * ÜRÜN İMPORT (Chrome Extension)
 * --------------------------------------------------------
 * POST /products/import
 *
 * Body:
 * {
 *   "shopId": "serhat",          // Firestore: mağazalar/serhat
 *   "platform": "trendyol.com",
 *   "products": [
 *     { "title": "...", "price": "...", "image": "...", "url": "..." }
 *   ]
 * }
 */
exports.productsRouter.post("/import", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, shopId, platform, products, baseRef, imported, _i, products_1, p, docId, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, shopId = _a.shopId, platform = _a.platform, products = _a.products;
                if (!shopId || !platform || !Array.isArray(products)) {
                    return [2 /*return*/, res.json({ ok: false, error: "missing_params" })];
                }
                baseRef = firebase_admin_1.db
                    .collection("mağazalar")
                    .doc(String(shopId))
                    .collection("platformlar")
                    .doc(String(platform))
                    .collection("ürünler");
                imported = 0;
                _i = 0, products_1 = products;
                _b.label = 1;
            case 1:
                if (!(_i < products_1.length)) return [3 /*break*/, 4];
                p = products_1[_i];
                if (!p || !p.url)
                    return [3 /*break*/, 3];
                docId = encodeURIComponent(p.url);
                return [4 /*yield*/, baseRef.doc(docId).set({
                        başlık: p.title || "",
                        fiyat: p.price || "",
                        görüntü: p.image || "",
                        URL: p.url || "",
                        güncellendi: Date.now(),
                    }, { merge: true })];
            case 2:
                _b.sent();
                imported++;
                _b.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/, res.json({
                    ok: true,
                    shopId: shopId,
                    platform: platform,
                    imported: imported,
                })];
            case 5:
                err_1 = _b.sent();
                console.error("PRODUCT IMPORT ERROR:", err_1);
                return [2 /*return*/, res
                        .status(500)
                        .json({ ok: false, error: "product_import_failed" })];
            case 6: return [2 /*return*/];
        }
    });
}); });
/**
 * --------------------------------------------------------
 * ÜRÜN LİSTELEME
 * --------------------------------------------------------
 * GET /products/list?shopId=serhat&platform=trendyol.com
 */
exports.productsRouter.get("/list", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, shopId, platform, ref, snapshot, products_2, err_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, shopId = _a.shopId, platform = _a.platform;
                if (!shopId || !platform) {
                    return [2 /*return*/, res.json({ ok: false, error: "missing_params" })];
                }
                ref = firebase_admin_1.db
                    .collection("mağazalar")
                    .doc(String(shopId))
                    .collection("platformlar")
                    .doc(String(platform))
                    .collection("ürünler");
                return [4 /*yield*/, ref.get()];
            case 1:
                snapshot = _b.sent();
                products_2 = [];
                snapshot.forEach(function (doc) {
                    products_2.push(__assign({ id: doc.id }, doc.data()));
                });
                return [2 /*return*/, res.json({
                        ok: true,
                        shopId: shopId,
                        platform: platform,
                        count: products_2.length,
                        products: products_2,
                    })];
            case 2:
                err_2 = _b.sent();
                console.error("PRODUCT LIST ERROR:", err_2);
                return [2 /*return*/, res.status(500).json({ ok: false, error: "product_list_failed" })];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * --------------------------------------------------------
 * (Opsiyonel) AI ÜRÜN AÇIKLAMASI
 * --------------------------------------------------------
 * POST /products/ai/description
 */
exports.productsRouter.post("/ai/description", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, description, platform, LM_URL, prompt_1, response, data, output, err_3;
    var _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                _a = req.body, title = _a.title, description = _a.description, platform = _a.platform;
                if (!title) {
                    return [2 /*return*/, res.json({ ok: false, error: "missing_title" })];
                }
                LM_URL = "http://127.0.0.1:1234/v1/chat/completions";
                prompt_1 = "\nSen bir e-ticaret \u00FCr\u00FCn a\u00E7\u0131klamas\u0131 yazma uzman\u0131s\u0131n.\nG\u00F6revin: \u00DCr\u00FCn i\u00E7in SEO uyumlu, profesyonel ve y\u00FCksek d\u00F6n\u00FC\u015F\u00FCm sa\u011Flayan bir a\u00E7\u0131klama haz\u0131rlamak.\n\n\u00DCr\u00FCn Ba\u015Fl\u0131\u011F\u0131: ".concat(title, "\nMevcut A\u00E7\u0131klama: ").concat(description || "Açıklama bulunmuyor", "\nPlatform: ").concat(platform, "\n\nA\u015Fa\u011F\u0131daki formatta k\u0131sa ve net cevap ver:\n---\n\uD83C\uDFAF SEO A\u00E7\u0131klamas\u0131:\n(buraya \u00FCr\u00FCn\u00FCn detayl\u0131 a\u00E7\u0131klamas\u0131n\u0131 yaz)\n\n\uD83D\uDD25 SEO Anahtar Kelimeler:\n(virg\u00FClle ayr\u0131lm\u0131\u015F 10 adet SEO kelime \u00FCret)\n---\n");
                return [4 /*yield*/, (0, node_fetch_1.default)(LM_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            model: "qwen3-vl-2b-instruct",
                            messages: [
                                {
                                    role: "system",
                                    content: "Sen profesyonel bir e-ticaret AI asistanısın.",
                                },
                                {
                                    role: "user",
                                    content: prompt_1,
                                },
                            ],
                            temperature: 0.6,
                            max_tokens: 600,
                        }),
                    })];
            case 1:
                response = _e.sent();
                return [4 /*yield*/, response.json()];
            case 2:
                data = _e.sent();
                output = ((_d = (_c = (_b = data === null || data === void 0 ? void 0 : data.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) ||
                    "AI modelinden yanıt alınamadı.";
                return [2 /*return*/, res.json({
                        ok: true,
                        result: output,
                    })];
            case 3:
                err_3 = _e.sent();
                console.error("AI DESCRIPTION ERROR:", err_3);
                return [2 /*return*/, res.status(500).json({ ok: false, error: "ai_description_failed" })];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * --------------------------------------------------------
 * ÜRÜN SİLME
 * --------------------------------------------------------
 * DELETE /products/:shopId/:platform/:productId
 * --------------------------------------------------------
 */
exports.productsRouter.delete("/:shopId/:platform/:productId", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, shopId, platform, productId, docRef, snap, err_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.params, shopId = _a.shopId, platform = _a.platform, productId = _a.productId;
                if (!shopId || !platform || !productId) {
                    return [2 /*return*/, res.json({ ok: false, error: "missing_params" })];
                }
                docRef = firebase_admin_1.db
                    .collection("mağazalar")
                    .doc(String(shopId))
                    .collection("platformlar")
                    .doc(String(platform))
                    .collection("ürünler")
                    .doc(String(productId));
                return [4 /*yield*/, docRef.get()];
            case 1:
                snap = _b.sent();
                if (!snap.exists) {
                    return [2 /*return*/, res.json({ ok: false, error: "product_not_found" })];
                }
                return [4 /*yield*/, docRef.delete()];
            case 2:
                _b.sent();
                return [2 /*return*/, res.json({ ok: true, deleted: productId })];
            case 3:
                err_4 = _b.sent();
                console.error("PRODUCT DELETE ERROR:", err_4);
                return [2 /*return*/, res
                        .status(500)
                        .json({ ok: false, error: "product_delete_failed" })];
            case 4: return [2 /*return*/];
        }
    });
}); });
