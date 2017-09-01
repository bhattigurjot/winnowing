<?php

$file = "input/tree.json";

if (isset($_GET['read'])) {
    $data = file_get_contents($file);
    echo $data;
}

if (isset($_GET['reset'])) {
    $d = file_get_contents($file);
    $data = json_decode($d, true);
    $data['versions'] = array_slice($data['versions'], 0, 1);
    $fh = fopen($file, 'w') or die("can't open file");
    fwrite($fh, json_encode($data));
    fclose($fh);
    echo json_encode($data);
}

?>