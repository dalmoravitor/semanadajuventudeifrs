import React from "react";
import { ClipLoader } from "react-spinners";

const Loader = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "20vh",
        background: "linear-gradient(180deg, #0b1020 0%, #0f172a 100%)",
      }}
    >
      <ClipLoader color="var(--primary)" size={60} />
    </div>
  );
};

export default Loader;
