import React, { useState, useEffect, useRef } from "react";
import logo from "./logo.svg";
import "./App.css";
import { createWorker } from "tesseract.js";
import $ from "jquery";
import fx from "glfx";

import { Camera } from "react-camera-pro";
import { FaCamera } from "react-icons/fa";

function App() {
  var fxCanvas = fx.canvas();
  var texture = null;

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const camera = useRef(null);
  const [image, setImage] = useState(null);

  const capture = () => {
    const imagePreview = document.getElementById("imagePreview");
    const imageSrc = camera.current.takePhoto();
    setImage(imageSrc);
    setCameraEnabled(false);
    imagePreview.src = imageSrc;
    imagePreview.style.display = "block";
    console.log("Here");
    preprocess();
  };

  const preprocess = async () => {
    const canvas = document.getElementById("canvas");
    const imagePreview = document.getElementById("imagePreview");
    const processedImage = document.getElementById("processedImage");

    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Use fxCanvas to process the image
      texture = fxCanvas.texture(canvas);
      fxCanvas
        .draw(texture)
        .hueSaturation(-1, -1) // Grayscale
        .unsharpMask(20, 2)
        .brightnessContrast(0.2, 0.9) // Adjust brightness and contrast
        .update();

      // Draw the processed image onto the canvas
      ctx.drawImage(fxCanvas, 0, 0);

      // Convert canvas to data URL and set it as the source of processedImage
      processedImage.src = canvas.toDataURL();
      processedImage.style.display = "block";
    };

    img.src = imagePreview.src;
  };

  useEffect(() => {
    const fileInput = document.getElementById("fileInput");
    const imagePreview = document.getElementById("imagePreview");
    const processedImage = document.getElementById("processedImage");

    const button = document.getElementById("button");

    const recognizeText = async () => {
      const worker = await createWorker();
      console.time("Start");
      setLoading(true);
      const ret = await worker.recognize(processedImage.src);
      setLoading(false);
      // const ret = await worker.recognize(imagePreview.src);
      console.timeEnd("Start");
      console.log(ret.data.text);
      setText(ret.data.text);
      await worker.terminate();
    };

    fileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.style.display = "block";
        console.log("Here");
        // preprocess();
      }
    });

    button.addEventListener("click", () => {
      recognizeText();
      imagePreview.style.display = "block";
    });

    // $("#brightness, #contrast").on("change", function () {
    //   var brightness = $("#brightness").val() / 100;
    //   var contrast = $("#contrast").val() / 100;

    //   fxCanvas
    //     .draw(texture)
    //     .hueSaturation(-1, -1)
    //     .unsharpMask(20, 2)
    //     .brightnessContrast(brightness, contrast)
    //     .update();

    //   processedImage.src = fxCanvas.toDataURL();
    // });

    // Cleanup the event listener when the component unmounts
    return () => {
      fileInput.removeEventListener("change", () => {});
    };
  }, []); // The empty array ensures this effect runs only once (after initial render)

  return (
    <div className="">
      {/* <div className="navbar bg-blue-950 text-white">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">DISLEXICLEAR</a>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>
              <a>Link</a>
            </li>
            <li>
              <details>
                <summary>Parent</summary>
                <ul className="bg-base-100 rounded-t-none p-2 text-black">
                  <li>
                    <a>Link 1</a>
                  </li>
                  <li>
                    <a>Link 2</a>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
      </div> */}
      <div className="sm:mt-8 w-full flex justify-center">
        <div className="container w-full flex flex-col gap-y-4">
          {cameraEnabled && (
            <div className="w-full flex justify-center">
              <div className="w-full flex flex-col items-center gap-y-2 max-w-4xl">
                <Camera
                  ref={camera}
                  facingMode="environment"
                  aspectRatio={window.innerWidth > 640 ? 16 / 9 : 2 / 3}
                />
                <button onClick={capture} className="btn btn-circle">
                  <FaCamera />
                </button>
              </div>
            </div>
          )}
          {!cameraEnabled && (
            <div className="w-full flex justify-center">
              <button className="btn w-48" onClick={() => setCameraEnabled(true)}>
                Take Another Picture
              </button>
            </div>
          )}
          <input type="file" id="fileInput" accept="image/*" />
          <div className="flex gap-x-4">
            <img
              id="imagePreview"
              alt="Selected Image"
              style={{ maxWidth: "300px", display: "none" }}
            />
            <canvas id="canvas" style={{ display: "none" }}></canvas>
            <img
              id="processedImage"
              alt="Processed Image"
              style={{ maxWidth: "300px", display: "none" }}
            />
          </div>
          {/* <p>
            Brightness:{" "}
            <input
              type="range"
              min="0"
              max="100"
              id="brightness"
              defaultValue="20"
            />
          </p>
          <p>
            Contrast:{" "}
            <input
              type="range"
              min="0"
              max="100"
              id="contrast"
              defaultValue="90"
            />
          </p> */}
          <button id="button" className="btn w-48">
            Recognize Text
          </button>
          <div className="p-4 bg-white text-xs border">
            {loading && <div>Loading...</div>}
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
