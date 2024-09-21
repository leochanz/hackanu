import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import { createWorker } from "tesseract.js";
import $ from "jquery";
import fx from "glfx";

function App() {
  var fxCanvas = fx.canvas();
  var texture = null;

  const [text, setText] = useState("");

  useEffect(() => {
    const fileInput = document.getElementById("fileInput");
    const imagePreview = document.getElementById("imagePreview");
    const processedImage = document.getElementById("processedImage");
    const canvas = document.getElementById("canvas");
    const button = document.getElementById("button");

    const recognizeText = async () => {
      const worker = await createWorker();
      console.time("Start");
      const ret = await worker.recognize(processedImage.src);
      console.timeEnd("Start");
      console.log(ret.data.text);
      setText(ret.data.text);
      await worker.terminate();
    };
    
    const preprocess = () => {
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

    fileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.style.display = "block";
        console.log("Here");
        preprocess();
      }
    });

    button.addEventListener("click", () => {
      recognizeText();
      imagePreview.style.display = "block";
    });

    $('#brightness, #contrast').on('change', function () {
      var brightness = $('#brightness').val() / 100;
      var contrast = $('#contrast').val() / 100;

      fxCanvas.draw(texture)
        .hueSaturation(-1, -1)
        .unsharpMask(20, 2)
        .brightnessContrast(brightness, contrast)
        .update();

      processedImage.src = fxCanvas.toDataURL();
    });

    // Cleanup the event listener when the component unmounts
    return () => {
      fileInput.removeEventListener("change", () => {});
    };
  }, []); // The empty array ensures this effect runs only once (after initial render)

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <input type="file" id="fileInput" accept="image/*" />
        <div style={{"display" : "flex"}}>
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
        <p>Brightness: <input type="range" min="0" max="100" id="brightness" defaultValue="20" /></p>
        <p>Contrast: <input type="range" min="0" max="100" id="contrast" defaultValue="90" /></p>
        <button id="button">Recognize Text</button>
        <div style={{"padding": "4px", "background" : "white", "border": "1px", "fontSize" : "12px", "color" : "black"}}>{text}</div>
      </header>
    </div>
  );
}

export default App;
