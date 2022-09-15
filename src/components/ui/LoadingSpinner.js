import React from "react";
import loadingImg from "../../assets/images/loading.png";
const LoadingSpinner = () => {
  return (
    <div className="flex justify-center">
      <img className="w-8 h-8 animate-spin" src={loadingImg} alt="Loading" />
    </div>
  );
};

export default LoadingSpinner;
