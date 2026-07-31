"use strict";
exports.__esModule = true;
exports.DEFAULT_PAYMENT_METHOD = exports.PAYMENT_METHODS = exports.shippingAddressDefaultValues = exports.signUpDefaultValues = exports.signInDefaultValues = exports.LATEST_PRODUCT_LIMIT = exports.SERVER_URL = exports.DESCRIPTION = exports.APP_NAME = void 0;
/** 因为我们本项目中我的env文件不会上传到github，所以担心别人拉取代码后没有env文件会导致报错，所以每个变量就定义一个默认值 */
exports.APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "万购商城";
exports.DESCRIPTION = process.env.NEXT_PUBLIC_DESCRIPTION || "万购商城是一个基于Next.js的商城项目";
exports.SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
exports.LATEST_PRODUCT_LIMIT = Number(process.env.NEXT_PUBLIC_LATEST_PRODUCT_LIMIT) || 4;
// 登录表单默认值
exports.signInDefaultValues = {
    email: "",
    password: ""
};
exports.signUpDefaultValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
};
exports.shippingAddressDefaultValues = {
    fullName: "Tangyang",
    streetAddress: "泉塘街道",
    city: "长沙",
    postalCode: "21312",
    country: "中国",
    lat: undefined,
    lng: undefined
};
exports.PAYMENT_METHODS = process.env.PAYMENT_METHODS
    ? process.env.PAYMENT_METHODS.split(", ")
    : ["PayPal", "Stripe", "CashOnDelivery"];
exports.DEFAULT_PAYMENT_METHOD = process.env.DEFAULT_PAYMENT_METHOD || "PayPal";
