<?php
	$cmdstr = $_GET['arg'];
	$cmd = str_replace("^"," ",$cmdstr);
	#echo $cmd;
	exec ($cmd,$output,$rv);
	$all = implode(',',$output);
	echo $all;

	if (file_exists("metric_results.csv")) {
		rename('metric_results.csv','output/metric_results.csv');
	}

	$glob = glob('input/*-*.csv');
	foreach ($glob as $f) {
		$file = basename($f);
        rename($f,"output/$file");
	}

	#$c = $_GET['c'];
	#$min = $_GET['min'];
	#echo exec ("python3 pipeline.py -f1 bromeA_all.csv -c " + $c + " -min " + $min + "-m pca_importance -p 4 -st 25 -si 10 -e kl_divergence");
	#echo "c: " + $c + " min: " + $min;
	#echo exec ("python3 --version");
	#exec ("python3 pipeline.py -f1 ./bromeA_all.csv -c add_one -min " . $min . " -m pca_importance -p 4 -st 25 -si 10 -e kl_divergence", $output, $rv);
	#$all = implode(',', $output);
	#echo $output;
	#echo $all;
?>
