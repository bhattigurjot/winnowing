// globals for GUI parameter panels
var conditioningType = ['add_one','hellinger','none'];
var minimumCount = 3;

var metricType = ['pca_importance','graph_centrality'];
var numberPCAComponents = 4;
var correlationType = ['spearman','MIC'];
var correlationProperty = ['positive','negative','both'];
var weighted = [true,false];
var centralityType = ['betweenness','closeness','degree','none'];
var threshold = 0.5;

var selectTotal = 25;
var oldSelectTotal = 25;
var selectPerIteration = 10;

var evaluationType = ['kl_divergence','pca_inertia','anosim','rda'];

var outputToCSV = [true,false];
var saveToDatabase = [false,true];
var createGraphs = [false,true];

// layout variables
var gap = 30;
var blockLeft = 0 + gap;
var blockTop = 90;
var blockWidth = 200;
var blockHeight = 100;
var vGap = 10;
var gui1, gui2, gui3, gui4, gui5, gui6, gui7, gui8;

// other
var commandString = "python pipeline.py -f1 bromeA_all.csv";
var pressingRun = false;
var commandResponse = "nothing so far...";

function setup() {
    var myCanvas = createCanvas(1200,665);
    //myCanvas.position(0,0);
    myCanvas.parent('canvasContainer');

    background(100);
    noStroke();

    textAlign(LEFT,CENTER);
    textSize(28);
    fill(255);
    text("Winnowing Pipeline Demo",gap,20);

    textAlign(CENTER,CENTER);
    textSize(18);

    strokeWeight(10);
    stroke(200);
    line(blockWidth*0.5+gap,blockTop+blockHeight/2,blockWidth*4.5+gap*5,blockTop+blockHeight/2);
    line(blockWidth*2.5+gap*3,blockTop,blockWidth*2.5+gap*3,blockTop-35);
    line(blockWidth*2.5+gap*3,blockTop-35,blockWidth*0.5+gap,blockTop-35);
    line(blockWidth*0.5+gap,blockTop-35,blockWidth*0.5+gap,blockTop-20);
    fill(200);
    strokeWeight(1);
    triangle(blockWidth*0.5+gap,blockTop,blockWidth*0.5+gap+15,blockTop-20,blockWidth*0.5+gap-15,blockTop-20);

    noStroke();
    fill(86,123,112);
    rect(blockLeft,blockTop,blockWidth,blockHeight);
    fill(255);
    text("CONDITIONING",blockLeft+blockWidth/2,blockTop+blockHeight/2);

    fill(143,171,141);
    blockLeft = blockLeft + blockWidth + gap;
    rect(blockLeft,blockTop,blockWidth,blockHeight);
    fill(255);
    text("METRICS",blockLeft+blockWidth/2,blockTop+blockHeight/2);

    fill(181,215,160);
    blockLeft = blockLeft + blockWidth + gap;
    rect(blockLeft,blockTop,blockWidth,blockHeight);
    fill(255);
    text("REDUCTION",blockLeft+blockWidth/2,blockTop+blockHeight/2);

    fill(162,180,56);
    blockLeft = blockLeft + blockWidth + gap;
    rect(blockLeft,blockTop,blockWidth,blockHeight);
    fill(255);
    text("EVALUATION",blockLeft+blockWidth/2,blockTop+blockHeight/2);

    fill(133,146,33);
    blockLeft = blockLeft + blockWidth + gap;
    rect(blockLeft,blockTop,blockWidth,blockHeight);
    fill(255);
    text("DATA STORAGE",blockLeft+blockWidth/2,blockTop+blockHeight/2);

    createGUI();

    // run button
    fill(200);
    stroke(0);
    rect(width-100,600,80,50)
    textSize(18);
    textAlign(CENTER,CENTER);
    fill(255);
    noStroke();
    text("Run",width-100+40,600+25);

    //noLoop();

    drawTree(commandsJSON);
}

function createGUI() {
    // create and layout GUI for Conditioning
    gui1 = createGui(' ',8+gap,8+blockTop+blockHeight+vGap);
    sliderRange(0, 10, 1);
    gui1.addGlobals('conditioningType', 'minimumCount');

    gui2 = createGui(' ',8+gap*2+blockWidth,8+blockTop+blockHeight+vGap);
    gui2.addGlobals('metricType');

    gui3 = createGui(' ',8+gap*2+blockWidth,8+blockTop+blockHeight+vGap+80);
    gui3.addGlobals('numberPCAComponents');

    gui4 = createGui(' ',8+gap*2+blockWidth,8+blockTop+blockHeight+vGap+80);
    sliderRange(0,1,0.05);
    gui4.addGlobals('correlationType','correlationProperty','weighted','centralityType','threshold');

    gui3.hide();
    gui4.hide();

    gui5 = createGui(' ',8+gap*3+blockWidth*2,8+blockTop+blockHeight+vGap);
    sliderRange(1, 100, 1);
    gui5.addGlobals('selectTotal');
    gui6 = createGui(' ',8+gap*3+blockWidth*2,8+blockTop+blockHeight+vGap+70);
    sliderRange(1, selectTotal, 1);
    gui6.addGlobals('selectPerIteration');

    gui7 = createGui(' ',8+gap*4+blockWidth*3,8+blockTop+blockHeight+vGap);
    gui7.addGlobals('evaluationType');

    gui8 = createGui(' ',8+gap*5+blockWidth*4,8+blockTop+blockHeight+vGap);
    gui8.addGlobals('outputToCSV','saveToDatabase','createGraphs');
}

function updateValues(id) {
    for(var i=0; i < commandsJSON.versions.length; i++) {
        if (commandsJSON.versions[i].id === id) {
                var temp = commandsJSON.versions[i].title.split(" ");
                minimumCount = parseInt(temp[temp.indexOf("-min") + 1]);
                numberPCAComponents = parseInt(temp[temp.indexOf("-p") + 1]);
            break;
        }
    }

    console.log(minimumCount, numberPCAComponents);
    createGUI();
}

function draw() {
    switch(metricType) {
        case 'pca_importance':
            gui3.show();
            gui4.hide();
            break;

        case 'graph_centrality':
            gui4.show();
            gui3.hide();
            break;
    }

    // put together parameters for sending to the external program
    commandString = "python3 pipeline.py -f1 bromeA_all.csv";
    commandString = commandString + " -c " + conditioningType;
    commandString = commandString + " -min " + minimumCount;
    commandString = commandString + " -m " + metricType;
    if (metricType == "pca_importance") {
        commandString = commandString + " -p " + numberPCAComponents;
    } else {
        commandString = commandString + " -cor " + correlationType;
        commandString = commandString + " -cp " + correlationProperty;
        if (weighted == true) {
            commandString = commandString + " -wt";
        }
        commandString = commandString + " -cent " + centralityType;
        commandString = commandString + " -th " + threshold;
    }
    commandString = commandString + " -st " + selectTotal;
    commandString = commandString + " -si " + selectPerIteration;
    commandString = commandString + " -e " + evaluationType;
    // commandString = commandString + " -e kl_divergence";

    // show command string live
    fill(100);
    noStroke();
    rect(0,580,1200,100);
    fill(255);
    textSize(14);
    textAlign(LEFT,CENTER);
    text(commandString,10,590);

    // temporary show text response
    //text("Response: " + commandResponse, gap, 650);

    if (pressingRun == true) {
        fill(150);
    } else {
        fill(200);
    }
    stroke(0);
    rect(width-100,600,80,50)
    textSize(18);
    textAlign(CENTER,CENTER);
    fill(255);
    noStroke();
    text("Run",width-100+40,600+25);

    //fill(random(255),random(255),random(255));
    //ellipse(mouseX,mouseY,5,5)
}
var CurrentVersion = 1;

var commandsJSON = {
    "versions": [
        {
            "id": 1,
            "label": "Node 1",
            "title": "python3 pipeline.py -f1 bromeA_all.csv -c add_one -min 3 -m pca_importance -p 4 -st 25 -si 10 -e kl_divergence"
        }
    ]
};

function addToCommandJSON(str) {
    commandsJSON.versions.forEach(function (item) {
        if (item.id === CurrentVersion && str !== item.title) {
            var t_id = commandsJSON.versions.length + 1;
            var temp = {
                "id": t_id,
                "label": "Node " + t_id,
                "parent": CurrentVersion,
                "title": str
            };
            commandsJSON.versions.push(temp);
            CurrentVersion = t_id;
        }
    });
}

function mouseReleased() {
    if (selectTotal != oldSelectTotal) {
        gui6 = createGui(' ',8+gap*3+blockWidth*2,blockTop+blockHeight+vGap+70);
        sliderRange(1, selectTotal, 1);
        gui6.addGlobals('selectPerIteration');
        oldSelectTotal = selectTotal;
    }
    if (pressingRun) {
        pressingRun = false;

        // do the command
        //tryRequest();
        addToCommandJSON(commandString);
        drawTree(commandsJSON);
    }
    commandResponse = "nothing yet..."
}

function mousePressed() {
    //console.log(mouseX + "," + mouseY);
    if (mouseX >= width-100 && mouseX <= (width-100)+80 && mouseY >= 600 && mouseY <= 650) {
        // pressing the Run button
        pressingRun = true;
    }
}

function requestListener () {
    commandResponse = this.responseText;
    console.log("Response: " + this.responseText);

    var parts = split(commandResponse,",");
    //parts.splice(0,1);
    parts[0] = "OTU           Metric           Abundance";
    commandResponse = join(parts,"<br>");
    if (commandResponse == "") {
        commandResponse = "No response from program execution."
    } else {
        // create links for output files
        if (metricType == "pca_importance") {
            centralityType = "None";
        }
        var namebase = "bromeA_all-" + metricType + "-" + centralityType + "-select" +  selectTotal + "by" + selectPerIteration;
        var filename1 = namebase + ".csv";
        var filename2 = namebase + "-abundances.csv";
    }
    commandResponse = "<pre>" + commandResponse + "</pre>";
    var res = document.getElementById("results");
    res.innerHTML = res.innerHTML + "<a href='" + filename1 + "'>" + filename1 + "</a>" + "<p>";
    res.innerHTML = res.innerHTML + "<a href='" + filename2 + "'>" + filename2 + "</a>" + "<p>";
    res.innerHTML = res.innerHTML + commandResponse + "<p>";


    //console.log("response is: " + commandResponse);
    cursor(ARROW);
}

function tryRequest() {
    cursor(WAIT);
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", requestListener);
    var cmdstr = join(split(commandString," "),"^");
    console.log("sending: " + cmdstr);
    oReq.open("GET", "http://p2irc-demo.usask.ca/winnowing/test-action.php?arg=" + cmdstr);
    //oReq.open("GET", "progtest.php?arg=hello");
    oReq.send();
    console.log("command sent: " + cmdstr);
    var res = document.getElementById("results");
    var currentdate = new Date();
    var datetime = "<p>Run date: " + currentdate.getDate() + "/"
        + (currentdate.getMonth()+1)  + "/"
        + currentdate.getFullYear() + " @ "
        + currentdate.getHours() + ":"
        + currentdate.getMinutes() + ":"
        + currentdate.getSeconds();
    res.innerHTML = res.innerHTML + datetime + "<br>";
    res.innerHTML = res.innerHTML + commandString+"<p>";
}