import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Spinner from "react-bootstrap/Spinner";
import p5 from "p5";

import { Camera } from "react-camera-pro";
import { GiCircle } from "react-icons/gi";

import { sketch } from "./utils/Sketch.js";

function App() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [image, setImage] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [width, setWidth] = useState(window.innerWidth * 0.75);

  const camera = useRef(null);

  const P5Wrapper = () => {
    const sketchRef = useRef();

    useEffect(() => {
      const p5Instance = new p5(
        sketch(responseData, image, width),
        sketchRef.current
      );

      return () => {
        p5Instance.remove();
      };
    }, []);

    return <div ref={sketchRef}></div>;
  };

  const capture = () => {
    const imagePreview = document.getElementById("imagePreview");
    const imageSrc = camera.current.takePhoto();
    setImage(imageSrc);
    setCameraEnabled(false);
    imagePreview.src = imageSrc;
    imagePreview.style.display = "block";
    console.log("Here");
    // preprocess();
  };

  // const preprocess = async () => {
  //   const canvas = document.getElementById("canvas");
  //   const imagePreview = document.getElementById("imagePreview");
  //   const processedImage = document.getElementById("processedImage");

  //   const ctx = canvas.getContext("2d");
  //   const img = new Image();

  //   img.onload = function () {
  //     canvas.width = img.width;
  //     canvas.height = img.height;
  //     ctx.drawImage(img, 0, 0);

  //     // Use fxCanvas to process the image
  //     texture = fxCanvas.texture(canvas);
  //     fxCanvas
  //       .draw(texture)
  //       .hueSaturation(-1, -1) // Grayscale
  //       .unsharpMask(20, 2)
  //       .brightnessContrast(0.2, 0.9) // Adjust brightness and contrast
  //       .update();

  //     // Draw the processed image onto the canvas
  //     ctx.drawImage(fxCanvas, 0, 0);

  //     // Convert canvas to data URL and set it as the source of processedImage
  //     processedImage.src = canvas.toDataURL();
  //     processedImage.style.display = "block";
  //   };

  //   img.src = imagePreview.src;
  // };

  useEffect(() => {
    const fileInput = document.getElementById("fileInput");
    const imagePreview = document.getElementById("imagePreview");
    // const processedImage = document.getElementById("processedImage");

    const button = document.getElementById("button");

    const getBase64FromBlobUrl = async (blobUrl) => {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result.split(",")[1]); // Extract base64 part
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const getBase64Image = async (imageSrc) => {
      if (imageSrc.startsWith("data:image")) {
        return imageSrc.replace("data:", "").replace(/^.+,/, "");
      } else if (imageSrc.startsWith("blob:")) {
        return await getBase64FromBlobUrl(imageSrc);
      }
      throw new Error("Unsupported image source format");
    };

    const recognizeText = async () => {
      const base64Image = await getBase64Image(imagePreview.src);
      // const worker = await createWorker();
      console.time("Start");
      setLoading(true);
      try {
        const response = await fetch(
          "https://australia-southeast1-oeege-436306.cloudfunctions.net/analyze-image",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: base64Image }),
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        setResponseData(data);
        setText(data.detections[0].description);
      } catch (error) {
        console.error("Failed to fetch:", error);
        setText("Failed to fetch data");
      } finally {
        setLoading(false);
        console.timeEnd("Start");
      }
    };

    fileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.style.display = "block";
        setImage(imagePreview.src);
        setCameraEnabled(false);
        console.log("Here");
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
      <div className="navbar bg-blue-950 text-white">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">DISLEXICLEAR</a>
        </div>
      </div>
      <div className="sm:mt-8 w-full flex justify-center">
        <div className="container w-full flex flex-col gap-y-4">
          <div id="step1" className="w-full flex flex-col gap-y-4">
            {cameraEnabled && (
              <div className="w-full flex justify-center">
                <div className="w-full flex flex-col items-center max-w-4xl relative">
                  <Camera
                    ref={camera}
                    facingMode="environment"
                    aspectRatio={window.innerWidth > 640 ? 16 / 9 : 2 / 3}
                  />
                  <div className="absolute bottom-0 w-full flex justify-center">
                    <button
                      onClick={capture}
                      className="btn btn-circle btn-lg border-none bg-white mb-1"
                    >
                      {/* <FaCamera /> */}
                      <GiCircle className="size-full text-black" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!cameraEnabled && (
              <div className="mt-2 w-full flex justify-center">
                <button
                  className="btn w-48"
                  onClick={() => setCameraEnabled(true)}
                >
                  Take Another Picture
                </button>
              </div>
            )}
            <div className="flex">
              <label className="label">Or Upload Image</label>
              <input
                type="file"
                className="file-input file-input-bordered w-full max-w-xs"
                id="fileInput"
                accept="image/*"
              />
            </div>
          </div>

          <div className="flex gap-x-4">
            <img
              id="imagePreview"
              alt="Selected Image"
              style={{ maxWidth: "300px", display: "none" }}
            />
          </div>
          <button id="button" className="btn w-48">
            Recognize Text
          </button>
          <div className="p-4 bg-white text-xs border">
            {loading && (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            )}
            {!loading && <div>{text}</div>}
          </div>
          {responseData && (
            <div className="w-full flex justify-center">
              <P5Wrapper />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
