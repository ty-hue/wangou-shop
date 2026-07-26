import React from "react";
import Image from "next/image";
const LoadingPage = () => {
  return (
    <div className="flex-center h-screen w-screen">
      <Image
        src="/images/loader.gif"
        alt="loading..."
        width={150}
        height={150}
      />
    </div>
  );
};

export default LoadingPage;
