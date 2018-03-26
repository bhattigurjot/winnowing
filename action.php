<?php
	set_time_limit(0);

	if (isset($_POST['arg']) && isset($_POST['date'])) {
        $cmdstr = $_POST['arg'];
        $cmd = str_replace("^", " ", $cmdstr);
        exec($cmd, $output, $rv);
        $all = implode(',', $output);
        echo $all;

        $cmdArr = explode(" ", $cmd);
        $stIndex = (int)array_search('-st', $cmdArr);
        $siIndex = (int)array_search('-si', $cmdArr);
        $st = $cmdArr[$stIndex + 1];
        $si = $cmdArr[$siIndex + 1];

//        $folder = "output/".date('m-d-Y-H-i-s');
        $folder = "output/".$_POST['date'];
        if (!file_exists($folder)) {
            mkdir($folder, 0777, true);
        }
//        echo '<br>'.$folder;

        $glob = glob('input/*-*.csv');
        foreach ($glob as $f) {
            $file = basename($f);
            rename($f,$folder.'/'.$file);
        }

        $glob = glob('*.{png,csv,graphml}', GLOB_BRACE);
        foreach ($glob as $f) {
            $file = basename($f);

            $temp = explode('.',$file);
            $temp[0] = $temp[0] . "_" . $st . "by" . $si;

            $newFileName = implode(".",$temp);

            rename($f,$folder.'/'.$newFileName);
        }

        if ($_POST['zip'] == 1) {
            $zipname = $_POST['date'].'.zip';
            $zip = new ZipArchive;
            $zip->open('output/'.$zipname, ZipArchive::CREATE);

            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator(realpath($folder)),
                RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $name => $file)
            {
                // Skip directories (they would be added automatically)
                if (!$file->isDir())
                {
                    // Get real and relative path for current file
                    $filePath = $file->getRealPath();
                    $relativePath = substr($filePath, strlen(realpath($folder)) + 1);

                    // Add current file to archive
                    $zip->addFile($filePath, $relativePath);
                }
            }

            $zip->close();
        }



	}
	if (isset($_POST['val'])) {
        $myFile = "input/tree.json";
        $fh = fopen($myFile, 'w') or die("can't open file");
        $stringData = $_POST["val"];
        fwrite($fh, $stringData);
        fclose($fh);
    }


?>
