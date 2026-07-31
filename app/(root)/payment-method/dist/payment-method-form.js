"use client";
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
var react_1 = require("react");
var sonner_1 = require("sonner");
var validators_1 = require("@/lib/validators");
var navigation_1 = require("next/navigation");
var react_hook_form_1 = require("react-hook-form");
var zod_1 = require("@hookform/resolvers/zod");
var constants_1 = require("@/lib/constants");
var user_actions_1 = require("@/lib/actions/user-actions");
var form_1 = require("@/components/ui/form");
var lucide_react_1 = require("lucide-react");
var button_1 = require("@/components/ui/button");
var radio_group_1 = require("@/components/ui/radio-group");
var PaymentMethodForm = function (_a) {
    var preferredPaymentMethod = _a.preferredPaymentMethod;
    var router = navigation_1.useRouter();
    var form = react_hook_form_1.useForm({
        resolver: zod_1.zodResolver(validators_1.paymentMethodSchema),
        defaultValues: {
            type: preferredPaymentMethod || constants_1.DEFAULT_PAYMENT_METHOD
        }
    });
    var _b = react_1.useTransition(), isPending = _b[0], startTransition = _b[1];
    var onSubmit = function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            startTransition(function () { return __awaiter(void 0, void 0, void 0, function () {
                var res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, user_actions_1.updateUserPaymentMethod(data)];
                        case 1:
                            res = _a.sent();
                            if (res.success) {
                                sonner_1.toast.success("支付方式已更新");
                                router.push("/place-order");
                            }
                            else {
                                sonner_1.toast.error(res.message);
                            }
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    }); };
    return (react_1["default"].createElement(react_1["default"].Fragment, null,
        react_1["default"].createElement("div", { className: "max-w-md mx-auto space-y-4" },
            react_1["default"].createElement("h2", { className: "h2-bold mt-4" }, "\u652F\u4ED8\u65B9\u5F0F"),
            react_1["default"].createElement("p", { className: "text-sm text-muted-foreground" }, "\u8BF7\u9009\u62E9\u60A8\u7684\u652F\u4ED8\u65B9\u5F0F"),
            react_1["default"].createElement(form_1.Form, __assign({}, form),
                react_1["default"].createElement("form", { method: "post", className: "space-y-4", onSubmit: form.handleSubmit(onSubmit) },
                    react_1["default"].createElement("div", { className: "flex flex-col md:flex-row gap-5" },
                        react_1["default"].createElement(form_1.FormField, { control: form.control, name: "type", render: function (_a) {
                                var field = _a.field;
                                return (react_1["default"].createElement(form_1.FormItem, { className: "w-full" },
                                    react_1["default"].createElement(form_1.FormControl, null,
                                        react_1["default"].createElement(radio_group_1.RadioGroup, { value: field.value, onValueChange: field.onChange, className: "flex flex-col space-y-2" }, constants_1.PAYMENT_METHODS.map(function (paymentMethod) { return (react_1["default"].createElement(form_1.FormItem, { key: paymentMethod, className: "flex items-center space-x-3 space-y-0" },
                                            react_1["default"].createElement(form_1.FormControl, null,
                                                react_1["default"].createElement(radio_group_1.RadioGroupItem, { value: paymentMethod, checked: paymentMethod === field.value })),
                                            react_1["default"].createElement(form_1.FormLabel, { className: "font-normal" }, paymentMethod))); }))),
                                    react_1["default"].createElement(form_1.FormMessage, null)));
                            } })),
                    react_1["default"].createElement("div", { className: "flex gap-2" },
                        react_1["default"].createElement(button_1.Button, { type: "submit", disabled: isPending },
                            isPending ? (react_1["default"].createElement(lucide_react_1.Loader, { className: " w-4 h-4 animate-spin" })) : (react_1["default"].createElement(lucide_react_1.ArrowRight, { className: " w-4 h-4" })),
                            "\u7EE7\u7EED")))))));
};
exports["default"] = PaymentMethodForm;
