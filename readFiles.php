<?php

//$files = scandir('input');

// image extensions
$extensions = array('csv');

// init result
$result = array();

// directory to scan
$directory = new DirectoryIterator('input');

// iterate
foreach ($directory as $fileinfo) {
    // must be a file
    if ($fileinfo->isFile()) {
        // file extension
        $extension = strtolower(pathinfo($fileinfo->getFilename(), PATHINFO_EXTENSION));
        // check if extension match
        if (in_array($extension, $extensions)) {
            // add to result
            $result[] = $fileinfo->getFilename();
        }
    }
}

echo json_encode($result);

?>