/*
    ATON ASCII Utils

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON ASCII utilities to load and manipulate txt, csv, tsv, etc.
@namespace ASCII
*/
let ASCII = {};

ASCII.DELIM_CSV = ",";
ASCII.DELIM_TSV = "\t";

//Initializes the component
ASCII.init = ()=>{

};

ASCII.loadTextFromURL = (url, onComplete)=>{
    $.get( url, (data)=>{
        if (onComplete) onComplete(data);
    });

    return ASCII;
};

ASCII.loadValuesFromFile = (url, delim, mainkey, onComplete)=>{
    let D = {};

    if (mainkey === undefined) mainkey = -1;

    $.get( url, (data)=>{
        let rows = data.split("\n"); // "\r\n"

        let numrows = rows.length;
        
        let fields  = [];
        let bFields = false;

        for (let r=0; r<numrows; r++){
            let R = rows[r].trim();

            if (R.length>0){
                // Header
                if (!bFields){
                    fields  = R.split(delim);
                    bFields = true;
                }
                // Single line
                else {
                    let values = R.split(delim);

                    // Entry
                    let keyf = (mainkey>=0)? values[mainkey] : r;
                    
                    D[ keyf ] = {};
                    
                    for (let v=0; v<values.length; v++){
                        if (v !== mainkey){
                            D[ keyf ][ fields[v] ] = values[v];
                        }
                    }
                }
            }
        }

        //console.log(D)

        if (onComplete) onComplete(D);
    });
};

ASCII.loadCSV = (url, mainkey, onComplete)=>{
    ASCII.loadValuesFromFile(url, ASCII.DELIM_CSV, mainkey, onComplete);
};

ASCII.loadTSV = (url, mainkey, onComplete)=>{
    ASCII.loadValuesFromFile(url, ASCII.DELIM_TSV, mainkey, onComplete);
};

export default ASCII;