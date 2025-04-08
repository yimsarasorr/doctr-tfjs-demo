// Copyright (C) 2021, Mindee.

// This program is licensed under the Apache License version 2.
// See LICENSE or go to <https://www.apache.org/licenses/LICENSE-2.0.txt> for full license details.
import "./style.css";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ThemeWrapper } from "@mindee/web-elements.ui.theme-wrapper";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-wasm";
import { SpeedInsights } from "@vercel/speed-insights/react"

async function initializeBackend() {
  await tf.ready(); // Ensure TensorFlow.js is fully initialized
  await tf.setBackend("cpu");
  console.log(`[initializeBackend] TensorFlow.js backend set to: ${tf.getBackend()}`);
}

initializeBackend().then(() => {
  ReactDOM.render(
    <React.StrictMode>
      <ThemeWrapper style={{ padding: 0, color: "#001E3C" }}>
        <App />
      </ThemeWrapper>
    </React.StrictMode>,
    document.getElementById("root")
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals.console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
