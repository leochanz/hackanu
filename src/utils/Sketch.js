import OpenDyslexic3 from "./OpenDyslexic-Regular.otf";

export const sketch = (datavals, imgval, width) => (p) => {
  let buffer, blurBuffer;
  let img = imgval;
  let data = datavals;
  let zoom = 1;
  let chosenCentre = [0, 0];
  let imageToAnnotate, dyslexiaFont;
  let SCALEFACTOR;
  const zoomLevel = 2
  const fontXScale = 1.2

  p.preload = () => {
    imageToAnnotate = p.loadImage(img);
    dyslexiaFont = p.loadFont(OpenDyslexic3);
  };

  p.setup = () => {
    if (data) {
	  SCALEFACTOR = width/imageToAnnotate.width;
    imageToAnnotate.resize(
      imageToAnnotate.width * SCALEFACTOR,
      imageToAnnotate.height * SCALEFACTOR
    );
    p.createCanvas(imageToAnnotate.width, imageToAnnotate.height);
    chosenCentre = [imageToAnnotate.width / 2, imageToAnnotate.height / 2];
    buffer = p.createGraphics(imageToAnnotate.width, imageToAnnotate.height);
    blurBuffer = p.createGraphics(imageToAnnotate.width, imageToAnnotate.height);
    blurBuffer.noStroke();
    buffer.noStroke()
    buffer.image(imageToAnnotate, 0, 0);
    buffer.textFont(dyslexiaFont);
    blurBuffer.textFont(dyslexiaFont);
    buffer.textAlign(p.CENTER, p.CENTER);
    blurBuffer.textAlign(p.CENTER, p.CENTER);
    p.imageMode(p.CENTER);
    blurBuffer.imageMode(p.CENTER)
    buffer.rectMode(p.CENTER);
    blurBuffer.rectMode(p.CENTER);

    let parsedLines = parseLines(data);

    blurBuffer.fill("#FFFDD0");
    for (let line of parsedLines) {
      blurBuffer.push();
      blurBuffer.textSize(
        findBestFontSize(line["text"], line["width"], line["height"])
      );
      let big = boundsFromText(line)
      blurBuffer.rect(big["cx"], big["cy"], big["width"], big["height"], big['height']/10);
      blurBuffer.pop();
    }

    //buffer.background(255, 253, 208, 180)
    blurBuffer.filter(p.BLUR, 5);

    buffer.image(blurBuffer, 0, 0)

    buffer.fill("#00008B");
    for (let line of parsedLines) {
      buffer.push();
      let textPos = boxCentre(line);
      buffer.textSize(
        findBestFontSize(line["text"], line["width"], line["height"])
      );
      buffer.text(line["text"]+" ", textPos.x, textPos.y);
      buffer.pop();
      }
    }
  };

  p.draw = () => {
    if (data) {
      p.image(
        buffer,
        chosenCentre[0],
        chosenCentre[1],
        buffer.width * zoom,
        buffer.height * zoom
    );
    }
  };

  p.mouseClicked = () => {
    if (buffer && chosenCentre && data){
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
    return combLines(badBoxConversion(parsed));
  } 

  function findBestFontSize(text, boxWidth, boxHeight) {
    let low = buffer.height/80;
    let high = 1000;
    let bestSize = buffer.height/80;

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
        width: boxWidth*SCALEFACTOR,
        height: boxHeight*SCALEFACTOR,
        text: box["text"],
      });
    }
    return processed;
  }

function combLines(lines){
  let combined = []
  for (let line of lines){
    if (combined[combined.length - 1]) {
      let previousBlock = combined[combined.length - 1]
      let currentMid = line['bby'] + line['height']/2
      let midLine = previousBlock['bby'] + previousBlock['height']/2
      if (Math.abs(currentMid - midLine) < previousBlock['height']/2 && previousBlock['bbx'] + 0.75* previousBlock['width'] < line['bbx']) {
        previousBlock['text'] += ' ' + line['text']
        previousBlock['height'] = Math.max(previousBlock['bby'] + previousBlock['height'], line['bby'] + line['height']) - Math.min(previousBlock['bby'], line['bby'])
        previousBlock['bby'] = Math.min(previousBlock['bby'], line['bby'])
        previousBlock['width'] = line['bbx'] + line['width'] - previousBlock['bbx'] 
      } else {
        combined.push(line)
      }
    } else {
      combined.push(line)
    }
  }
  for (let i of combined){
    console.log(i.text)
  }
  return combined
}

function expandRect(rect, n) {
  // Calculate the expansion factor
  let factor = 1 + n / 100;
  
  // Calculate the amount to expand width and height
  let newWidth = rect.width * factor;
  let newHeight = rect.height * factor;
  
  // Adjust bbx and bby (top-left corner) to center the expansion
  let bbxAdjustment = (newWidth - rect.width) / 2;
  let bbyAdjustment = (newHeight - rect.height) / 2;
  
  return {
    bbx: rect.bbx - bbxAdjustment,
    bby: rect.bby - bbyAdjustment,
    width: newWidth,
    height: newHeight
  };
}


function boundsFromText(box){
  let c = boxCentre(box)
  let cx = c["x"]
  let cy = c["y"]
  let w = Math.max(box["width"], blurBuffer.textWidth(box["text"])*fontXScale)
  let h = Math.max(box["height"], blurBuffer.textAscent() + blurBuffer.textDescent())

  let bx = cx - w/2
  let by = cy - h/2

  return {bbx: bx, bby: by, width: w, height: h, text: box["text"], cx: cx, cy: cy}

}


}

/*
export const sketch = (data, img, width) => (p) => {
    let buffer;
    let zoom = 1;
    let chosenCentre = [0, 0];
    let imageToAnnotate, dyslexiaFont;
    let SCALEFACTOR;
    let minSize;
    const zoomLevel = 3;

    p.preload = () => {
        imageToAnnotate = p.loadImage(img);
        dyslexiaFont = p.loadFont(OpenDyslexic3);
    };

    p.setup = () => {
        SCALEFACTOR = width / imageToAnnotate.width;
        imageToAnnotate.resize(imageToAnnotate.width * SCALEFACTOR, imageToAnnotate.height * SCALEFACTOR);
        minSize = Math.max(imageToAnnotate.width, imageToAnnotate.height) * 0.05;
        p.createCanvas(imageToAnnotate.width, imageToAnnotate.height);
        chosenCentre = [imageToAnnotate.width / 2, imageToAnnotate.height / 2];
        console.log(chosenCentre);
        buffer = p.createGraphics(imageToAnnotate.width, imageToAnnotate.height);
        buffer.noStroke();
        buffer.image(imageToAnnotate, 0, 0);
        buffer.textFont(dyslexiaFont);
        buffer.textAlign(p.CENTER, p.CENTER);
        p.imageMode(p.CENTER);

        let parsedLines = parseLines(data);

        let polys = getPolys(data);


        buffer.fill("#FFFDD0");
        console.log(polys);
        for (let poly of polys) {
            buffer.push();
            //let textPos = boxCentre(line);
            // draw the polygon
            buffer.beginShape();
            for (let point of poly['boundingPoly']["vertices"]) {
                buffer.vertex(point.x * SCALEFACTOR, point.y * SCALEFACTOR);
            }
            buffer.endShape(p.CLOSE);

            
            //buffer.textSize(findBestFontSize(line["text"], line["width"], line["height"]));
            //buffer.rect(line["bbx"], line["bby"], line["width"], line["height"]);
            buffer.pop();
        }

        //buffer.filter(p.BLUR, 10);
        
        buffer.fill("#00008B");
        for (let poly of polys) {
            buffer.push();

            // Get the first two points of the polygon
            let point1 = poly['boundingPoly']["vertices"][0];
            let point2 = poly['boundingPoly']["vertices"][1];
            let point3 = poly['boundingPoly']["vertices"][2];
            let point4 = poly['boundingPoly']["vertices"][3];
            // Get the angle formed by this line (horizontal should be angle 0)
            let angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);

            // P5 canvas transoform to the first point
            buffer.translate((point1.x + point3.x) * SCALEFACTOR / 2, (point1.y + point3.y) * SCALEFACTOR / 2);
            // Rotate the canvas
            buffer.rotate(angle);
            // Draw the text
            buffer.textSize(20);
            buffer.text(poly["description"], 0, 0);
            buffer.pop();
        }

        
    };

    p.draw = () => {
        p.image(buffer, chosenCentre[0], chosenCentre[1], buffer.width * zoom, buffer.height * zoom);
    };

    p.mouseClicked = () => {
        if (buffer && chosenCentre) {
            if (zoom === 1) {
                let boundMouseX = Math.max(
                    buffer.width / (2 * zoomLevel),
                    Math.min(p.mouseX, buffer.width - buffer.width / (2 * zoomLevel))
                );
                let boundMouseY = Math.max(
                    buffer.height / (2 * zoomLevel),
                    Math.min(p.mouseY, buffer.height - buffer.height / (2 * zoomLevel))
                );
                zoom = zoomLevel;
                let cx = chosenCentre[0];
                let cy = chosenCentre[1];
                chosenCentre = [(zoom + 1) * cx - zoom * boundMouseX, (zoom + 1) * cy - zoom * boundMouseY];
            } else {
                zoom = 1;
                console.log(buffer.width);
                chosenCentre = [buffer.width / 2, buffer.height / 2];
            }
        }
    };

    function parseLines(data) {
        let parsed = [];
        for (let elementIndex = 1; elementIndex < data["detections"].length; elementIndex++) {
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

    function getPolys(data) {
        let polys = [];
        console.log(data["detections"]);
        for (let elementIndex = 1; elementIndex < data["detections"].length; elementIndex++) {
            
            let element = data["detections"][elementIndex];
            console.log(element)
            polys.push(element)//["boundingPoly"]);
        }
        return polys;
    }

    function badBoxConversion(boxList) {
        let processed = [];
        for (let box of boxList) {
            let boxTop = Math.min(box["bounds"]["vertices"][0].y, box["bounds"]["vertices"][1].y);
            let boxHeight = Math.max(box["bounds"]["vertices"][2].y, box["bounds"]["vertices"][3].y) - boxTop;
            let boxLeft = Math.min(box["bounds"]["vertices"][0].x, box["bounds"]["vertices"][3].x);
            let boxWidth = Math.max(box["bounds"]["vertices"][2].x, box["bounds"]["vertices"][1].x) - boxLeft;
            processed.push({
                bbx: boxLeft * SCALEFACTOR,
                bby: boxTop * SCALEFACTOR,
                width: Math.max(boxWidth * SCALEFACTOR, minSize),
                height: Math.max(boxHeight * SCALEFACTOR, minSize),
                text: box["text"],
            });
        }
        return processed;
    }
};
*/