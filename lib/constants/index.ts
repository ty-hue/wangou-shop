/** 因为我们本项目中我的env文件不会上传到github，所以担心别人拉取代码后没有env文件会导致报错，所以每个变量就定义一个默认值 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "万购商城";
export const DESCRIPTION =
  process.env.NEXT_PUBLIC_DESCRIPTION || "万购商城是一个基于Next.js的商城项目";
export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
export const LATEST_PRODUCT_LIMIT =
  Number(process.env.NEXT_PUBLIC_LATEST_PRODUCT_LIMIT) || 4;
// 登录表单默认值
export const signInDefaultValues = {
  email: "",
  password: "",
};
export const signUpDefaultValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};
