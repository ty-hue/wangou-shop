import { SERVER_URL } from "@/lib/constants";
import React from "react";
export const metadata = {
  title: "首页",
  description: "商城的首页，展示许多丰富的内容",
  metadataBase: new URL(SERVER_URL),
};
const HomePage = () => {
  return <div>首页</div>;
};

export default HomePage;
