<?php
	set_time_limit(0);

	if (isset($_GET['arg'])) {
        $cmdstr = $_GET['arg'];
        $cmd = str_replace("^", " ", $cmdstr);
        exec($cmd, $output, $rv);
        $all = implode(',', $output);
        echo $all;

        $glob = glob('input/*-*.csv');
        foreach ($glob as $f) {
            $file = basename($f);
            rename($f,"output/$file");
        }

        $glob = glob('*.{png,csv,graphml}', GLOB_BRACE);
        foreach ($glob as $f) {
            $file = basename($f);
            rename($f,"output/$file");
        }
	}
	if (isset($_GET['val'])) {
        $myFile = "input/tree.json";
        $fh = fopen($myFile, 'w') or die("can't open file");
        $stringData = $_GET["val"];
        fwrite($fh, $stringData);
        fclose($fh);
    }


?>
