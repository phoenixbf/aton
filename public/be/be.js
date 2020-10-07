const DIR_COLLECTION = "/collection/";
const DIR_SCENES     = "/scenes/";
const PATH_FE        = window.location.origin + "/fe/";

let BE = {};

BE.getBaseFolder = ( filepath )=>{
    let index  = filepath.lastIndexOf( '/' );
    if ( index !== -1 ) return filepath.substring( 0, index + 1 );
    
    return '';
};

BE.generateID = (prefix)=>{
    if (prefix === undefined) prefix = "id";
    //let currDate = new Date();
    //let ts = currDate.getYear()+":"+currDate.getMonth()+":"+currDate.getDay()+":"+currDate.getHours()+":"+currDate.getMinutes() +":"+ currDate.getSeconds();
    return prefix+'-' + Math.random().toString(36).substr(2,9);
};

BE.goToScene = (sid, vrc)=>{
    if (sid === undefined) return;
    if (sid.length < 2) return;

    let feURL = PATH_FE+"?s="+sid;
    if (vrc !== undefined) feURL += "&vrc="+vrc;

    window.location.href = feURL;
};

BE.postJSON = (endpoint, obj, onReceive)=>{
    $.ajax({
        url: endpoint,
        type:"POST",
        data: JSON.stringify(obj),
        contentType:"application/json; charset=utf-8",
        dataType:"json",

        success: (data)=>{
            if (onReceive) onReceive(data);
        }
    });
};

BE.getJSON = (endpoint, onReceive)=>{
    $.getJSON( endpoint, (data)=>{
        if (onReceive) onReceive(data);
    });  
};

BE.getScenesSelect = (idselect)=>{
    $.getJSON( "/api/scenes/", ( data )=>{
        let list = "<option value=''>Choose scene ID...</option>";

        for (let s in data){
            let sid = data[s];
            list += "<option value='"+sid+"'>"+sid+"</option>"
        }

        $("#"+idselect).html(list);
    });
};

BE.getScenesInputList = (idlist)=>{
    let htmlcontent = "<label for='sid'>Scene ID</label><br><input id='sid' type='text' list='sidlist' style='width:50%'>";

    $.getJSON( "/api/scenes/", ( data )=>{
        htmlcontent += "<datalist id='sidlist'>";
        for (let s in data) htmlcontent += "<option>"+data[s]+"</option>";
        htmlcontent += "</datalist>";

        $("#"+idlist).html(htmlcontent);
    });
};

BE.createBaseScene = ()=>{
    let sobj = {};

    sobj.status = "complete";

    sobj.environment = {};

    sobj.scenegraph = {};
    sobj.scenegraph.nodes = {};
    sobj.scenegraph.nodes.main = {};
    sobj.scenegraph.nodes.main.urls = [];

    sobj.scenegraph.edges = {};
    sobj.scenegraph.edges["."] = ["main"];

    return sobj;
};

BE.appendModelsToSelect = (idselect)=>{
    $.getJSON( "/api/c/models/", ( data )=>{
        let list = "";
        let folders = {};

        for (let m in data){
            let mp = data[m];
            list += "<option value='"+mp+"'>[MODEL] "+mp+"</option>";

            let F = BE.getBaseFolder(mp);
            if (folders[F] === undefined) folders[F] = mp;
            else folders[F] += ","+mp;
        }

        for (let k in folders) list += "<option value='"+folders[k]+"'>[FOLDER] "+k+"</option>";

        $("#"+idselect).append(list);
    });
};

BE.appendPanoramasToSelect = (idselect)=>{
    $.getJSON( "/api/c/panoramas/", ( data )=>{
        let list = "";

        for (let p in data){
            let ppath = data[p];
            list += "<option value='"+ppath+"'>"+ppath+"</option>"
        }

        $("#"+idselect).append(list);
    });
};