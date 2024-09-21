import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { createWorker } from 'tesseract.js';

//import vision from '@google-cloud/vision';

//const {ImageAnnotatorClient} = require('@google-cloud/vision').v1;

const vision = require('@google-cloud/vision');

/*
const options = { 
  credentials: require('./key/oeege_key.json'),
  projectId: 'oeege-436306'
};
const client = new ImageAnnotatorClient(options);
*/

//console.log(client);

function App() {

  useEffect(() => {
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');

    /*
    const recognizeText = async () => {
      const worker = await createWorker();
      console.time("Start");
      const ret = await worker.recognize(imagePreview.src);
      console.timeEnd("Start");
      console.log(ret.data.text);
      await worker.terminate();
    };
    */

    // Now with google cloud. Example:
    /*
const client = new vision.ImageAnnotatorClient();
const [result] = await client.textDetection(fileName);
const detections = result.textAnnotations;
console.log('Text:');
detections.forEach(text => console.log(text));
    */
   /*
    const recognizeText = async () => {
      
      const [result] = await client.textDetection("./assets/image_hackanu.webp");//imagePreview.src);
      const detections = result.textAnnotations;
      console.log('Text:');
      //detections.forEach(text => console.log(text));
    };
    */


    fileInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (file) {
        imagePreview.src = URL.createObjectURL(file);
        console.log("Here")
        //recognizeText();
        imagePreview.style.display = 'block';
      }
    });

    
    
    

    // Cleanup the event listener when the component unmounts
    return () => {
      fileInput.removeEventListener('change', () => {});
    };

  }, []);  // The empty array ensures this effect runs only once (after initial render)

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <input type="file" id="fileInput" accept="image/*" />
        <img id="imagePreview" alt="Selected Image" style={{ maxWidth: '300px', display: 'none' }} />
      </header>
    </div>
  );
}

export default App;
