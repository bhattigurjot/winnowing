var conditioningType = ['add_one','hellinger','none'];
var metricType = ['pca_importance','graph_centrality'];
var correlationType = ['spearman','MIC'];
var correlationProperty = ['positive','negative','both'];
var weighted = [true,false];
var centralityType = ['betweenness','closeness','degree','none'];
var evaluationType = ['kl_divergence','pca_inertia','anosim','rda'];

var outputToCSV = [true,false];
var saveToDatabase = [false,true];
var createGraphs = [false,true];

var minimumCount = {
    "min": 0,
    "max": 10,
    "step": 1,
    "value": 3
};
var numberPCAComponents = {
    "min": 0,
    "max": 10,
    "step": 1,
    "value": 4
};
var threshold = {
    "min": 0,
    "max": 1,
    "step": 0.05,
    "value": 0.5
};
var selectTotal = {
    "min": 1,
    "max": 100,
    "step": 1,
    "value": 25
};
var selectPerIteration = {
    "min": 1,
    "max": 25,
    "step": 1,
    "value": 10
};

var allSelections = {
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

var allSliders = {
    "minimumCount": minimumCount,
    "numberPCAComponents": numberPCAComponents,
    "threshold": threshold,
    "selectTotal": selectTotal,
    "selectPerIteration": selectPerIteration
};

var selectedFileName = "input/bromeA_all.csv";

var commandString = "python pipeline.py -f1 " + selectedFileName;
// var pressingRun = false;
var commandResponse = "nothing so far...";

var CurrentVersion = 1;
var commandsJSON = {
    "versions": [
        {
            "id": 1,
            "label": "Node 1",
            "title": "python3 pipeline.py -f1 "+ selectedFileName +" -c add_one -min 3 -m pca_importance -p 4 -st 25 -si 10 -e kl_divergence"
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
    var selectTotalAllValue = $('#selectTotalAll');
    var selectPerIterationValue = $('#selectPerIteration');
    var evaluationTypeValue = $('#evaluationType');
    var metric1 = $('#metric-1');
    var metric2 = $('#metric-2');


    // Call init function - setup pipeline
    init();

    function init() {

        for (var element in allSelections) {
            $.each(allSelections[element], function(key, value) {
                $('#'+element)
                    .append($("<option></option>")
                        .attr("value",value)
                        .text(value));
            });
        }
        for (var e in allSliders) {
            $.each(allSliders[e], function(key, value) {
                var temp = $('#'+e);
                temp.attr(key,value);
                valueOutput(temp[0]);
            });
        }

        setCurrentCommand();

        $(document).on('input', 'input[type="range"]', function(e) {
            valueOutput(e.target);
            setCurrentCommand();
        });

        $('#treeDisplay').click(function () {
            if ($('#treeDisplay').is(':checked')) {
                $('.treeContainer').show();
            } else {
                $('.treeContainer').hide();
            }
        });

        $('.fieldChange').change(setCurrentCommand);

        $('#runButton').click(pressRun);

        selectTotalAllValue.click(function () {
           if (selectTotalAllValue.is(':checked')) {
               selectTotalValue.prop( "disabled", true );
               selectTotalValue.parent().find('label')[0]['innerHTML'] = 'selectTotal: all';
           } else {
               selectTotalValue.prop( "disabled", false );
               selectTotalValue.parent().find('label')[0]['innerHTML'] = 'selectTotal: ' + selectTotalValue.val();
           }
           setCurrentCommand();
        });

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
        commandString = "python3 pipeline.py -f1 " + selectedFileName;
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
        var selectTotalCorrectedValue;
        if (selectTotalAllValue.is(':checked')) {
            selectTotalCorrectedValue = 'all';
        } else {
            selectTotalCorrectedValue = selectTotalValue.val();
        }
        commandString = commandString + " -st " + selectTotalCorrectedValue;
        commandString = commandString + " -si " + selectPerIterationValue.val();
        commandString = commandString + " -e " + evaluationTypeValue.val();

        currentCommand.html(commandString);
    }

} );

function valueOutput(element) {
    var value = element.value;
    var output = element.parentNode.getElementsByTagName('label')[0] || element.parentNode.parentNode.getElementsByTagName('label')[0];
    output['innerText'] = output['htmlFor'] + ": " + value;
}

function addToCommandJSON(str) {
    commandsJSON.versions.forEach(function (item) {
        if (item.id === CurrentVersion && str !== item.title) {
            console.log("yo");
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
            $('#minimumCount').val(parseInt(temp[temp.indexOf("-min") + 1]));
            $('#numberPCAComponents').val(parseInt(temp[temp.indexOf("-p") + 1]));
            $('#threshold').val(parseInt(temp[temp.indexOf("-th") + 1]));
            $('#selectTotal').val(parseInt(temp[temp.indexOf("-st") + 1]));
            $('#selectPerIteration').val(parseInt(temp[temp.indexOf("-si") + 1]));
            $('#conditioningType').val(temp[temp.indexOf("-c") + 1]);
            $('#evaluationType').val(temp[temp.indexOf("-e") + 1]);
            $('#metricType').val(temp[temp.indexOf("-m") + 1]).change();

            CurrentVersion = id;

            break;
        }
    }
    for (var e in allSliders) {
        $.each(allSliders[e], function(key, value) {
            valueOutput($('#'+e)[0]);
        });
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
    oReq.open("GET", "action.php?arg=" + cmdstr);
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

    var parts = commandResponse.split(",");
    //parts.splice(0,1);
    parts[0] = "OTU           Metric           Abundance";
    commandResponse = parts.join("<br>");
    if (commandResponse === "") {
        commandResponse = "No response from program execution."
    } else {
        // create links for output files
        var temp = "";
        if ($('#metricType').val() === "pca_importance") {
            temp = "None";
        } else {
            temp = $('#centralityType').val();
        }
        var namebase = selectedFileName + "-" + $('#metricType').val() + "-" + temp + "-select" +  $('#selectTotal').val() + "by" + $('#selectPerIteration').val();
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