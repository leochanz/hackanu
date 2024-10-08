import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import p5 from "p5";

import { Camera } from "react-camera-pro";

import { FaCamera } from "react-icons/fa";
import { GiCircle } from "react-icons/gi";

import { sketch } from "./utils/Sketch.js";

function App() {
  const skipConfirmation = true;

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [responseData, setResponseData] = useState(null);
  // let sketchWidth = window.outerWidth * 0.75;
  let sketchWidth;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
    // iOS device
    sketchWidth = window.innerWidth * 0.75;
  } else if (/android/i.test(navigator.userAgent)) {
    // Android device
    sketchWidth = window.outerWidth * 0.75;
  } else {
    // Default case for other devices
    sketchWidth = window.outerWidth * 0.75;
  }
  if (sketchWidth > 768) sketchWidth = 768;
  if (sketchWidth < 344) sketchWidth = 344;
  const [width, setWidth] = useState(sketchWidth);
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
        return () => {
          p5Instance.remove();
        };
      }
    }, []);

    return <div ref={sketchRef}></div>;
  };

  const capture = async () => {
    const imagePreview = document.getElementById("imagePreview");
    const imageSrc = camera.current.takePhoto();
    setImage(imageSrc);
    imagePreview.src = imageSrc;

    if (skipConfirmation) {
      await recognizeText();
    } else {
      setStep(2);
    }
  };

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
    const imagePreview = document.getElementById("imagePreview");

    const base64Image = await getBase64Image(imagePreview.src);
    // const worker = await createWorker();
    console.time("Start");
    setStep(3);
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
      } else {
        setResponseData(data);
        console.log(data.detections[0].description);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
      console.log("Failed to fetch data");
    } finally {
      setLoading(false);
      console.timeEnd("Start");
    }
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

    fileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.style.display = "block";
        setImage(imagePreview.src);
        if (skipConfirmation) {
          recognizeText();
        } else {
          setStep(2);
        }
        console.log("Here");
        event.target.value = null;
      }
    });

    button.addEventListener("click", () => {
      recognizeText();
      imagePreview.style.display = "block";
    });

    return () => {
      fileInput.removeEventListener("change", () => {});
    };
  }, []);

  // const p5WrapperRef = useRef(null);
  // useEffect(() => {
  //   if (responseData) {
  //     // Scroll to the P5Wrapper component
  //     // p5WrapperRef.current.scrollIntoView({ behavior: 'smooth' });
  //     p5WrapperRef.current.scrollTo(0, 0);
  //   }
  // }, [responseData]);

  let phoneRatio;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
    // iOS device
    phoneRatio = window.innerWidth / (window.innerHeight - 64);
  } else if (/android/i.test(navigator.userAgent)) {
    // Android device
    phoneRatio = window.outerWidth / (window.outerHeight - 64);
  } else {
    // Default case for other devices
    phoneRatio = window.outerWidth / (window.outerHeight - 64);
  }


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
            <div onClick={capture} className="w-full sm:w-3/4 flex flex-col items-center max-w-[768px] relative">
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
            className={`w-full flex flex-col items-center gap-y-4 ${
              step != 2 && "hidden"
            }`}
          >
            <img
              id="imagePreview"
              alt="Selected Image"
              className="w-3/4 min-w-[344px] max-w-[768px]"
            />
            <div className="w-full flex flex-col items-center px-4">
              <div className="flex gap-x-4 mb-4">
                <button
                  className="btn w-48"
                  onClick={() => {
                    setStep(1);
                    setResponseData(null);
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                >
                  Take Another Picture
                </button>
                <button id="button" className="btn w-48">
                  Recognize Text
                </button>
              </div>
              <div className="w-full max-w-[768px] p-4 bg-white text-xs border">
                {loading && (
                  <span class="loading loading-dots loading-xs"></span>
                )}
                {responseData == "No text detected" && (
                  <div>No text detected</div>
                )}
              </div>
            </div>
          </div>
          <div
            id="step3"
            className={`pt-4 sm:pt-0 container w-full flex flex-col items-center ${
              step != 3 && "hidden"
            }`}
          >
            <div className="w-full flex justify-center mb-4">
              {loading && <span class="loading loading-dots loading-xs"></span>}
              {responseData && responseData == "No text detected" && (
                <div>No text detected</div>
              )}
              {responseData && responseData != "No text detected" && (
                <P5Wrapper />
              )}
            </div>
            <div>
              <button
                className="btn w-52 mb-8"
                onClick={() => {
                  setStep(1);
                  setResponseData(null);
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              >
                Take Another Picture <FaCamera />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
