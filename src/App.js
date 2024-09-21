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
  const [step, setStep] = useState(1);

  const camera = useRef(null);

  const P5Wrapper = () => {
    const sketchRef = useRef();

    useEffect(() => {
      console.log("responseData:", responseData);
      if (responseData != "No text detected") {
        const p5Instance = new p5(
          sketch(responseData, image, width),
          sketchRef.current
        );
        setStep(3);
        return () => {
          p5Instance.remove();
        };
      }
    }, []);

    return <div ref={sketchRef}></div>;
  };

  const capture = () => {
    const imagePreview = document.getElementById("imagePreview");
    const imageSrc = camera.current.takePhoto();
    setImage(imageSrc);
    setStep(2);
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

        if (data.detections == "No text detected") {
          setResponseData("No text detected");
          setText("No text detected");
        } else {
          setResponseData(data);
          setText(data.detections[0].description);
        }
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
        setStep(2);
        console.log("Here");
        event.target.value = null;
      }
    });

    button.addEventListener("click", () => {
      setStep(3);
      recognizeText();
      imagePreview.style.display = "block";
    });

    return () => {
      fileInput.removeEventListener("change", () => {});
    };
  }, []);

  useEffect(() => {
    console.log("step", step);
    if (step == 1) {
      setResponseData(null);
      setText("");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [step]);

  // const p5WrapperRef = useRef(null);
  // useEffect(() => {
  //   if (responseData) {
  //     // Scroll to the P5Wrapper component
  //     // p5WrapperRef.current.scrollIntoView({ behavior: 'smooth' });
  //     p5WrapperRef.current.scrollTo(0, 0);
  //   }
  // }, [responseData]);

  const phoneRatio = window.innerWidth / (window.innerHeight - 64);

  return (
    <div>
      <div className="fixed top-0 sm:relative navbar bg-blue-950 text-white">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">DYSLEXICLEAR</a>
        </div>
      </div>
      <div className="mt-16 w-full flex justify-center">
        <div className="container">
          <div
            id="step1"
            className={`fixed sm:relative w-full flex flex-col items-center gap-y-4 ${
              step != 1 && "hidden"
            }`}
          >
            <div className="w-full flex flex-col items-center max-w-4xl relative">
              <Camera
                ref={camera}
                facingMode="environment"
                aspectRatio={window.innerWidth > 640 ? 16 / 9 : phoneRatio}
              />
              <div className="absolute bottom-0 w-full flex justify-center">
                <button
                  onClick={capture}
                  className="btn btn-circle btn-lg border-none bg-white mb-1"
                >
                  <GiCircle className="size-full text-black" />
                </button>
              </div>
            </div>
            <div className="hidden sm:flex gap-x-4">
              <label className="label">Or Upload Image</label>
              <input
                type="file"
                className="file-input file-input-bordered w-full max-w-xs"
                id="fileInput"
                accept="image/*"
              />
            </div>
          </div>
          <div
            id="step2"
            className={`container pt-4 w-full flex flex-col items-center gap-y-4 ${
              step != 2 && "hidden"
            }`}
          >
            <img
              id="imagePreview"
              alt="Selected Image"
              className="w-3/4 max-w-2xl hidden"
            />
            <div className="flex gap-x-4">
              <button className="btn w-48" onClick={() => setStep(1)}>
                Take Another Picture
              </button>
              <button id="button" className="btn w-48">
                Recognize Text
              </button>
            </div>
            <div
              id="step3"
              className={`container pt-4 w-full flex flex-col items-center gap-y-4 ${
                step != 3 && "hidden"
              }`}
            >
              <div className="w-full flex justify-center mb-8">
                {responseData && <P5Wrapper />}
              </div>
              <div className="w-full max-w-2xl p-4 bg-white text-xs border">
                {loading && (
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                )}
                {!loading && <div>{text}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
