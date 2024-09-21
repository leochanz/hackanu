import { createWorker } from 'tesseract.js';

export const recognizeTextFromImage = async (imageUrl) => {
  const worker = await createWorker();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  console.log("Start")
  const ret = await worker.recognize(imageUrl);
  console.log("End")
  await worker.terminate();
  console.log(ret.data);
  
  return ret.data.text;
};