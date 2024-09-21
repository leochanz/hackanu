import OpenDyslexic3 from "./OpenDyslexic-Regular.otf";

export const sketch = (data, img, width) => (p) => {
  let buffer;
  let zoom = 1;
  let chosenCentre = [0, 0];
  let imageToAnnotate, dyslexiaFont;
  let SCALEFACTOR ;
  let minSize;
  const zoomLevel = 3

  p.preload = () => {
    imageToAnnotate = p.loadImage(img);
    dyslexiaFont = p.loadFont(OpenDyslexic3);
  };

  p.setup = () => {
	SCALEFACTOR = width/imageToAnnotate.width;
    imageToAnnotate.resize(
      imageToAnnotate.width * SCALEFACTOR,
      imageToAnnotate.height * SCALEFACTOR
    );
    minSize = Math.max(imageToAnnotate.width, imageToAnnotate.height) * 0.05
    p.createCanvas(imageToAnnotate.width, imageToAnnotate.height);
    chosenCentre = [imageToAnnotate.width / 2, imageToAnnotate.height / 2];
    console.log(chosenCentre)
    buffer = p.createGraphics(imageToAnnotate.width, imageToAnnotate.height);
    buffer.noStroke();
    buffer.image(imageToAnnotate, 0, 0);
    buffer.textFont(dyslexiaFont);
    buffer.textAlign(p.CENTER, p.CENTER);
    p.imageMode(p.CENTER);

    let parsedLines = parseLines(data);

    buffer.fill("#FFFDD0");
    for (let line of parsedLines) {
      buffer.push();
      let textPos = boxCentre(line);
      buffer.textSize(
        findBestFontSize(line["text"], line["width"], line["height"])
      );
      buffer.rect(line["bbx"], line["bby"], line["width"], line["height"]);
      buffer.pop();
    }

    //buffer.filter(p.BLUR, 10);

    buffer.fill("#00008B");
    for (let line of parsedLines) {
      buffer.push();
      let textPos = boxCentre(line);
      buffer.textSize(
        findBestFontSize(line["text"] + "A", line["width"], line["height"])
      );
      buffer.text(line["text"], textPos.x, textPos.y);
      buffer.pop();
    }
  };

  p.draw = () => {
    p.image(
      buffer,
      chosenCentre[0],
      chosenCentre[1],
      buffer.width * zoom,
      buffer.height * zoom
    );
  };

  p.mouseClicked = () => {
    if (buffer && chosenCentre){
      if (zoom === 1) {
        let boundMouseX = Math.max(buffer.width/(2*zoomLevel), Math.min(p.mouseX, buffer.width - (buffer.width/(2*zoomLevel))));
        let boundMouseY = Math.max(buffer.height/(2*zoomLevel), Math.min(p.mouseY, buffer.height - (buffer.height/(2*zoomLevel))));
        zoom = zoomLevel;
        let cx = chosenCentre[0];
        let cy = chosenCentre[1];
        chosenCentre = [
          (zoom + 1) * cx - zoom * boundMouseX,
          (zoom + 1) * cy - zoom * boundMouseY,
        ];
      } else {
        zoom = 1;
        console.log(buffer.width)
        chosenCentre = [buffer.width / 2, buffer.height / 2];
      }
    }
  };

  function parseLines(data) {
    let parsed = [];
    for (
      let elementIndex = 1;
      elementIndex < data["detections"].length;
      elementIndex++
    ) {
      let element = data["detections"][elementIndex];
      parsed.push({
        text: element["description"],
        bounds: element["boundingPoly"],
      });
    }
    return badBoxConversion(parsed);
  }

  function findBestFontSize(text, boxWidth, boxHeight) {
    let low = 1;
    let high = 1000;
    let bestSize = 1;

    while (low <= high) {
      let currentSize = Math.floor((low + high) / 2);

      buffer.textSize(currentSize);
      let textWidthValue = buffer.textWidth(text);
      let textHeightValue = buffer.textAscent() + buffer.textDescent();

      if (textWidthValue <= boxWidth && textHeightValue <= boxHeight) {
        bestSize = currentSize;
        low = currentSize + 1;
      } else {
        high = currentSize - 1;
      }
    }

    return bestSize;
  }

  function boxCentre(box) {
    return {
      x: box["bbx"] + box["width"] / 2,
      y: box["bby"] + box["height"] / 2,
    };
  }

  function badBoxConversion(boxList) {
    let processed = [];
    for (let box of boxList) {
      let boxTop = Math.min(
        box["bounds"]["vertices"][0].y,
        box["bounds"]["vertices"][1].y
      );
      let boxHeight =
        Math.max(
          box["bounds"]["vertices"][2].y,
          box["bounds"]["vertices"][3].y
        ) - boxTop;
      let boxLeft = Math.min(
        box["bounds"]["vertices"][0].x,
        box["bounds"]["vertices"][3].x
      );
      let boxWidth =
        Math.max(
          box["bounds"]["vertices"][2].x,
          box["bounds"]["vertices"][1].x
        ) - boxLeft;
      processed.push({
        bbx: boxLeft*SCALEFACTOR,
        bby: boxTop*SCALEFACTOR,
        width: Math.max(boxWidth*SCALEFACTOR, minSize),
        height: Math.max(boxHeight*SCALEFACTOR, minSize),
        text: box["text"],
      });
    }
    return processed;
  }
};
