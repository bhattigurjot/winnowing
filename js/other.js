var conditioningType = ['add_one','hellinger','none'];
var metricType = ['pca_importance','graph_centrality'];
var correlationType = ['spearman','MIC'];
var correlationProperty = ['positive','negative','both'];
var weighted = [true,false];
var centralityType = ['betweenness','closeness','degree', 'eigenvector', 'none'];
var evaluationType = ['kl_divergence','pca_inertia','anosim','rda'];

var ListLoopArray = null;

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
    "max": 25409,
    "step": 1,
    "value": 25
};
var selectPerIteration = {
    "min": 1,
    "max": 25409,
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

var selectedFileName = "bromeA_all.csv";

var commandString = "python pipeline.py -f1 input/" + selectedFileName;
// var pressingRun = false;
var commandResponse = "nothing so far...";

var CurrentVersion = 1;
var commandsJSON = {
    "versions": [
        {
            "id": 1,
            "label": "Node 1",
            "title": "python3 pipeline.py -f1 input/"+ selectedFileName +" -c add_one -min 3 -m pca_importance -p 4 -st 25 -si 10 -e kl_divergence"
        }
    ]
};

var selectTotalCorrectedValue;
var selectPerIterationCorrectedValue;

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
    var stText = $('#st-text');
    var siText = $('#si-text');
    var selectTotalAllValue = $('#selectTotalAll');
    var selectPerIterationValue = $('#selectPerIteration');
    var selectPerIterationAllValue = $('#selectPerIterationAll');
    var evaluationTypeValue = $('#evaluationType');
    var createGraphsValue = $('#createGraphs');
    var metric1 = $('#metric-1');
    var metric2 = $('#metric-2');
    var listCheck = $('#listTotalAndIterationCheck');
    var listText = $('#listTotalAndIteration');
    var prefixCheck = $('#prefix-check');
    var prefixText = $('#prefix-text');


    // Call init function - setup pipeline
    init();

    function init() {

        readInputFiles();

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

        $(document).on('input', 'input[type="number"]', function(e) {
            if (e.target.id === 'st-text'){
                selectTotalValue.val(parseInt(e.target.value));
            } else if (e.target.id === 'si-text'){
                selectPerIterationValue.val(parseInt(e.target.value));
            }
        });

        $('#treeDisplay').click(function () {
            if ($('#treeDisplay').is(':checked')) {
                $('.treeContainer').show();
            } else {
                $('.treeContainer').hide();
            }
        });

        $('.fieldChange').change(setCurrentCommand);

        $('#runButton').click(function() {
            var currentdate = new Date();
            var date_time = ""
                + (currentdate.getMonth()+1)  + "-"
                + currentdate.getDate() + "-"
                + currentdate.getFullYear() + "-"
                + currentdate.getHours() + "-"
                + currentdate.getMinutes() + "-"
                + currentdate.getSeconds();

            var tempPrefix = "";

            if (prefixCheck.is(':checked')) {
                if (prefixText.val()) {
                    tempPrefix = prefixText.val() + "_";
                }
            }

            if (listCheck.is(':checked')) {
                ListLoopArray = listText.val().split('\n');
                for(var i=0; i<ListLoopArray.length; i++) {
                    ListLoopArray[i] = ListLoopArray[i].replace(/[\s]+/g, ' ');
                }
                ListLoopArray = ListLoopArray.filter(String);
                // console.log(ListLoopArray);
                pressRun(1,ListLoopArray.length,date_time,tempPrefix,0);
            } else {
                pressRun(1,1,date_time,tempPrefix,0);
            }
        });

        prefixCheck.click(function () {
            if (prefixCheck.is(':checked')) {
                prefixText.prop( "disabled", false );
                // prefixText.parent().find('label')[0]['innerHTML'] = 'selectTotal: all';
            } else {
                prefixText.prop( "disabled", true );
            }
        });

        selectTotalAllValue.click(function () {
           if (selectTotalAllValue.is(':checked')) {
               selectTotalValue.prop( "disabled", true );
               selectTotalValue.parent().find('label')[0]['innerHTML'] = 'selectTotal: all';
               stText.prop( "disabled", true);
           } else {
               selectTotalValue.prop( "disabled", false );
               //selectTotalValue.parent().find('label')[0]['innerHTML'] = 'selectTotal: ' + selectTotalValue.val();
               selectTotalValue.parent().find('label')[0]['innerHTML'] = 'selectTotal: ';
               stText.val(parseInt(selectTotalValue.val()));
               stText.prop( "disabled", false);
           }
           setCurrentCommand();
        });

        selectPerIterationAllValue.click(function () {
            if (selectPerIterationAllValue.is(':checked')) {
                selectPerIterationValue.prop( "disabled", true );
                selectPerIterationValue.parent().find('label')[0]['innerHTML'] = 'selectPerIteration: all';
                siText.prop( "disabled", true);
            } else {
                selectPerIterationValue.prop( "disabled", false );
                //selectPerIterationValue.parent().find('label')[0]['innerHTML'] = 'selectPerIteration: ' + selectPerIterationValue.val();
                selectPerIterationValue.parent().find('label')[0]['innerHTML'] = 'selectPerIteration: ';
                siText.val(parseInt(selectPerIterationValue.val()));
                siText.prop( "disabled", false);
            }
            setCurrentCommand();
        });

        listCheck.click(function () {
            if (listCheck.is(':checked')) {

                listText.prop("disabled", false);

                selectTotalAllValue.prop("disabled", true);
                selectTotalValue.prop( "disabled", true );

                stText.prop( "disabled", true);

                selectPerIterationAllValue.prop("disabled", true);
                selectPerIterationValue.prop( "disabled", true );

                siText.prop( "disabled", true);
            } else {
                listText.prop("disabled", true);

                selectTotalAllValue.prop("disabled", false);
                selectTotalValue.prop( "disabled", false );

                stText.val(parseInt(selectTotalValue.val()));
                stText.prop( "disabled", false);

                selectPerIterationAllValue.prop("disabled", false);
                selectPerIterationValue.prop( "disabled", false );

                siText.val(parseInt(selectPerIterationValue.val()));
                siText.prop( "disabled", false);
            }
        });

        drawTree(commandsJSON);
    }


    $('#uploadFileForm').submit(function (e) {
        e.preventDefault();
        $.ajax({
            url: "upload.php",
            type: "POST",
            data: new FormData(this),
            contentType: false,
            cache: false,
            processData: false,
            success: function (data)
            {
                alert(data);
                readInputFiles();
                $('#uploadFileForm')[0].reset();
            }
        });
    });

    // Read parameters file
    $('#fileToUpload2').change( function(event) {
        var reader = new FileReader();

        reader.onload = function(event) {
            var jsonObj = JSON.parse(event.target.result);
            alert(jsonObj);
            setParameters(jsonObj);
        };

        reader.readAsText(event.target.files[0]);
    });

    function setParameters(jsonObj) {
        $('#conditioningType').val(jsonObj.conditioningType);
        $('#minimumCount').val(parseInt(jsonObj.minimumCount));
        $('#metricType').val(jsonObj.metricType).change();
        if (jsonObj.metricType == "graph_centrality") {
            $('#correlationType').val(jsonObj.correlationType);
            $('#correlationProperty').val(jsonObj.correlationProperty);
            $('#weighted').val(jsonObj.weighted);
            $('#centralityType').val(jsonObj.centralityType);
            $('#threshold').val(parseFloat(jsonObj.threshold));
        } else {
            $('#numberPCAComponents').val(parseInt(jsonObj.numberPCAComponents));
        }
        $('#selectTotal').val(parseInt(jsonObj.selectTotal));
        $('#selectPerIteration').val(parseInt(jsonObj.selectPerIteration));
        $('#evaluationType').val(jsonObj.evaluationType);

        for (var e in allSliders) {
            $.each(allSliders[e], function(key, value) {
                valueOutput($('#'+e)[0]);
            });
        }

        setCurrentCommand();
    }

    function readInputFiles() {
        $.ajax({
            url: 'readFiles.php',
            method: 'GET',
            dataType: 'json',
            success : function (data) {
                updateInputFileList(data);
            }
        });
        $.ajax({
            url: 'treeStructure.php',
            method: 'GET',
            dataType: 'json',
            data: {
              read: 'read'
            },
            async: false,
            success : function (data) {
                updateJSON(data);
            }
        });
    }

    function updateJSON(data) {
        commandsJSON = data;
        updateValues(commandsJSON.versions.length);
        setCurrentCommand();
        drawTree(commandsJSON);
    }

    $(document).keydown (function(e) {
        if(e.keyCode === 67 && e.ctrlKey && e.shiftKey && e.altKey) {
            e.preventDefault();
            console.log("reset key pressed");
            $.ajax({
                url: 'treeStructure.php',
                method: 'GET',
                dataType: 'json',
                data: {
                    reset: 'reset'
                },
                async: false,
                success : function (data) {
                    updateJSON(data);
                    console.log(data);
                }
            });
        }
    });

    function updateInputFileList(data) {
        var elem = $('#inputFile');
        elem.empty();
        for (var d in data) {
            if (data.hasOwnProperty(d)) {
                elem.append($("<option></option>")
                    .attr("value",data[d])
                    .text(data[d]));
            }
        }
        setCurrentCommand();
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

        selectedFileName = $('#inputFile').val() || "bromeA_all.csv";

        // put together parameters for sending to the external program
        commandString = "python3 pipeline.py -f1 input/" + selectedFileName;
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

        if (selectTotalAllValue.is(':checked')) {
            selectTotalCorrectedValue = 'all';
        } else {
            selectTotalCorrectedValue = selectTotalValue.val();
        }
        if (selectPerIterationAllValue.is(':checked')) {
            selectPerIterationCorrectedValue = 'all';
        } else {
            selectPerIterationCorrectedValue = selectPerIterationValue.val();
        }
        commandString = commandString + " -st " + selectTotalCorrectedValue;
        commandString = commandString + " -si " + selectPerIterationCorrectedValue;
        commandString = commandString + " -e " + evaluationTypeValue.val();

        if (createGraphsValue.val() === "true") {
            commandString = commandString + " -pp -pm";
            if (metricTypeValue.val() === "graph_centrality") {
                commandString = commandString + " -cg ";
            }
        }

        currentCommand.html(commandString);
    }

} );


function valueOutput(element) {
    var value = element.value;
    //var output = element.parentNode.getElementsByTagName('label')[0] || element.parentNode.parentNode.getElementsByTagName('label')[0];
    //output['innerText'] = output['htmlFor'] + ": " + value;
    var output = element.parentNode.getElementsByTagName('input')[0] || element.parentNode.parentNode.getElementsByTagName('input')[0];
    if (output.type === 'number') {
        output.value = parseInt(value);
    }
}

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
            $('#minimumCount').val(parseInt(temp[temp.indexOf("-min") + 1]));
            $('#numberPCAComponents').val(parseInt(temp[temp.indexOf("-p") + 1]));
            $('#threshold').val(parseFloat(temp[temp.indexOf("-th") + 1]));
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

function pressRun(n,t,d_t,p_f_n,shouldZip) {
    var commandStringArray = commandString.split(' ');
    if (t > 1) {
        var temp = ListLoopArray[n-1].split(' ');
        selectTotalCorrectedValue = temp[0];
        selectPerIterationCorrectedValue = temp[1];
        commandStringArray[commandStringArray.indexOf('-st') + 1] = "" + selectTotalCorrectedValue;
        commandStringArray[commandStringArray.indexOf('-si') + 1] = "" + selectPerIterationCorrectedValue;

        commandString = commandStringArray.join(" ");
    }

    var cmdstr = commandStringArray.join("^");
    console.log("sending: " + cmdstr);

    var res = $("#results");
    // var currentdate = new Date();
    // var datetime = "<p>Run date: " + currentdate.getDate() + "/"
    //     + (currentdate.getMonth()+1)  + "/"
    //     + currentdate.getFullYear() + " @ "
    //     + currentdate.getHours() + ":"
    //     + currentdate.getMinutes() + ":"
    //     + currentdate.getSeconds();
    var datetime = "<p>Run date: " + d_t + "</p>";

    res.append("<h2>#################################################################################</h2>");
    res.append("<h3>Run ("+n+"/"+t+")</h3>");
    res.append(commandString +"<br>");
    res.append("<h2>#################################################################################</h2>");
    res.append(datetime + "<br>");

    addToCommandJSON(commandString);
    //drawTree(commandsJSON);

    $.ajax({
        url: 'action.php',
        type: 'POST',
        data: {
            arg: cmdstr,
            date: d_t,
            zip: shouldZip,
            prefix: p_f_n,
            val: JSON.stringify(commandsJSON)
        },
        success: function(response) {
            requestListener(response, n, t, d_t, p_f_n);
        },

        error: function () {
            console.log('got error');
        }
    });
    $('body').css('cursor', 'progress');
}

function requestListener (response, n, t, d_t, p_f_n) {
    commandResponse = response;

    var filename1;
    var filename2;
    var metricTypeValue = $('#metricType').val();

    var parts = commandResponse.split(",");
    //parts.splice(0,1);
    parts[0] = "OTU           Metric           Abundance";
    commandResponse = parts.join("<br>");

    // var folderName = parts[parts.length-1].split('<br>')[1];
    var folderName = "output/" + d_t;
    // console.log(folderName);

    if (commandResponse === "") {
        commandResponse = "No response from program execution."
        alert(commandResponse);
        return;
    } else {
        // draw tree
        addToCommandJSON(commandString);
        drawTree(commandsJSON);

        // create links for output files
        var temp = "";
        if (metricTypeValue === "pca_importance") {
            temp = "None";
        } else {
            temp = $('#centralityType').val();
        }
        var namebase = p_f_n+selectedFileName.substring(0, selectedFileName.length - 4) + "-" + metricTypeValue + "-" + temp + "-select" +  selectTotalCorrectedValue + "by" + selectPerIterationCorrectedValue;
        filename1 = namebase + ".csv";
        filename2 = namebase + "-abundances.csv";
    }
    commandResponse = "<pre>" + commandResponse + "</pre>";

    var res = $("#results");
    res.append("<h4>Result files:</h4>");
    res.append("<p> <a href='" + folderName + "/" + filename1 + "' target='_blank'>" + filename1 + "</a> </p>");
    res.append("<p> <a href='" + folderName + "/" + filename2 + "' target='_blank'>" + filename2 + "</a> </p>");
    filenameValues = selectTotalCorrectedValue + "by" + selectPerIterationCorrectedValue;
    res.append("<p> <a href='" + folderName + "/" + p_f_n + "metric_results_" + filenameValues + ".csv" + "'target='_blank'>"+p_f_n+"metric_results_" + filenameValues + ".csv</a> </p>");
    if (metricTypeValue === "graph_centrality") {
        res.append("<p> <a href='" + folderName + "/" + p_f_n + "adj_matrix_"+filenameValues+".csv' target='_blank'>"+p_f_n+"adj_matrix_"+filenameValues+".csv</a> </p>");
        res.append("<p> <a href='" + folderName + "/" + p_f_n + "graph_"+filenameValues+".graphml' target='_blank'>"+p_f_n+"graph_"+filenameValues+".graphml</a> </p>");
    }
    if ($('#createGraphs').val() === "true") {
        res.append("<h4>Graphs:</h4>");
        res.append("<p> <a href='" + folderName + "/" + p_f_n + "metric_value_"+filenameValues+".png' target='_blank'>"+p_f_n+"metric_value_"+filenameValues+".png</a> </p>");
        res.append("<p> <a href='" + folderName + "/" + p_f_n + "pca_scatter_"+filenameValues+".png' target='_blank'>"+p_f_n+"pca_scatter_"+filenameValues+".png</a> </p>");
        if (metricTypeValue === "graph_centrality") {
            commandString = commandString + " -cg ";
            res.append("<p> <a href='" + folderName + "/" + p_f_n + "graph_network_"+filenameValues+".graphml' target='_blank'>"+p_f_n+"graph_network_"+filenameValues+".graphml</a> </p>");
            res.append("<p> <a href='" + folderName + "/" + p_f_n + "graph_network_"+filenameValues+".png' target='_blank'>"+p_f_n+"graph_network_"+filenameValues+".png</a> </p>");
        }
    }

    res.append(commandResponse);
    $('body').css('cursor', 'auto');

    if (t > 1) {
        n += 1;
        if (n < t) {
            pressRun(n,t,d_t,p_f_n,0);
        } else if (n === t) {
            pressRun(n,t,d_t,p_f_n,1);
        } else {
            res.append("<p> <a href='" + folderName + ".zip' target='_blank'>All_Results.zip</a> </p>");
        }
    }
}