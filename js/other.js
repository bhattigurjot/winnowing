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

var all = {
    "conditioningType":conditioningType,
    "metricType":metricType,
    "evaluationType":evaluationType,
    "correlationType":correlationType,
    "correlationProperty":correlationProperty,
    "weighted":weighted,
    "centralityType":centralityType,
    "outputToCSV": outputToCSV,
    "saveToDatabase": saveToDatabase,
    "createGraphs": createGraphs
};

var commandString = "python pipeline.py -f1 bromeA_all.csv";
var pressingRun = false;
var commandResponse = "nothing so far...";

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

$( function() {
    // Get elements via jquery
    var currentCommand = $('#currentCommand');
    var conditioningTypeValue = $('#conditioningType');
    var metricTypeValue = $('#metricType');
    var correlationTypeValue = $('#correlationType');
    var correlationPropertyValue = $('#correlationProperty');
    var weightedValue = $('#weighted');
    var minimumCountValue = $('#minimumCount');
    var numberPCAComponentsValue = $('#numberPCAComponents');
    var centralityTypeValue = $('#centralityType');
    var thresholdValue = $('#threshold');
    var selectTotalValue = $('#selectTotal');
    var selectPerIterationValue = $('#selectPerIteration');
    var evaluationTypeValue = $('#evaluationType');
    var metric1 = $('#metric-1');
    var metric2 = $('#metric-2');


    // Call init function - setup pipeline
    init();

    function init() {

        for (var element in all) {

            $.each(all[element], function(key, value) {
                $('#'+element)
                    .append($("<option></option>")
                        .attr("value",value)
                        .text(value));
            });
        }

        setCurrentCommand();

        $('input[type="range"]').rangeslider();

        minimumCountValue.change(function () {
            console.log($(this).val());
        });

        $('.fieldChange').change(setCurrentCommand);


        $('#runButton').click(pressRun);

        // console.log(commandsJSON);
        drawTree(commandsJSON);
    }

    function setCurrentCommand() {
        switch(metricTypeValue.val()) {
            case 'pca_importance':
                metric1.show();
                metric2.hide();
                break;

            case 'graph_centrality':
                metric2.show();
                metric1.hide();
                break;
        }


        // put together parameters for sending to the external program
        commandString = "python3 pipeline.py -f1 bromeA_all.csv";
        commandString = commandString + " -c " + conditioningTypeValue.val();
        commandString = commandString + " -min " + minimumCountValue.val();
        commandString = commandString + " -m " + metricTypeValue.val();
        if (metricTypeValue.val() === "pca_importance") {
            commandString = commandString + " -p " + numberPCAComponentsValue.val();
        } else {
            commandString = commandString + " -cor " + correlationTypeValue.val();
            commandString = commandString + " -cp " + correlationPropertyValue.val();
            if (weightedValue.val() === "true") {
                commandString = commandString + " -wt";
            }
            commandString = commandString + " -cent " + centralityTypeValue.val();
            commandString = commandString + " -th " + thresholdValue.val();
        }
        commandString = commandString + " -st " + selectTotalValue.val();
        commandString = commandString + " -si " + selectPerIterationValue.val();
        commandString = commandString + " -e " + evaluationTypeValue.val();

        currentCommand.html(commandString);
    }

} );

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

function updateValues(id) {
    for(var i=0; i < commandsJSON.versions.length; i++) {
        if (commandsJSON.versions[i].id === id) {
            var temp = commandsJSON.versions[i].title.split(" ");
            // minimumCount = parseInt(temp[temp.indexOf("-min") + 1]);
            // numberPCAComponents = parseInt(temp[temp.indexOf("-p") + 1]);
            $('#conditioningType').val(temp[temp.indexOf("-c") + 1]);
            $('#evaluationType').val(temp[temp.indexOf("-e") + 1]);
            $('#metricType').val(temp[temp.indexOf("-m") + 1]).change();
            break;
        }
    }
}

function pressRun() {
    tryRequest();
    addToCommandJSON(commandString);
    drawTree(commandsJSON);
}

function tryRequest() {
    // cursor(WAIT);
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", requestListener);
    var cmdstr = commandString.split(" ").join("^");
    console.log("sending: " + cmdstr);
    oReq.open("GET", "http://p2irc-demo.usask.ca/winnowing/test-action.php?arg=" + cmdstr);
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

function requestListener () {
    commandResponse = this.responseText;
    console.log("Response: " + this.responseText);

    var parts = split(commandResponse,",");
    //parts.splice(0,1);
    parts[0] = "OTU           Metric           Abundance";
    commandResponse = parts.join("<br>");
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
    // cursor(ARROW);
}