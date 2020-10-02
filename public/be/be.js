const DIR_COLLECTION = "/collection/";
const DIR_SCENES     = "/scenes/";
const PATH_FE        = window.location.origin + "/fe/";

let BE = {};

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

BE.jsonPOST = (endpoint, obj, onReceive)=>{
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

        for (let m in data){
            let mp = data[m];
            list += "<option value='"+mp+"'>"+mp+"</option>"
        }

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