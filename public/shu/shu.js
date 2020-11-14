const DIR_COLLECTION = "../../collection/";
const DIR_SCENES     = "../../scenes/";
const PATH_FE        = "../../fe/";
const PATH_RESTAPI   = "../../api/";
const PATH_RES       = "../../res/";

let SHU = {};

SHU.getBaseFolder = ( filepath )=>{
    let index  = filepath.lastIndexOf( '/' );
    if ( index !== -1 ) return filepath.substring( 0, index + 1 );
    
    return '';
};

SHU.generateID = (prefix)=>{
    if (prefix === undefined) prefix = "id";
    //let currDate = new Date();
    //let ts = currDate.getYear()+":"+currDate.getMonth()+":"+currDate.getDay()+":"+currDate.getHours()+":"+currDate.getMinutes() +":"+ currDate.getSeconds();
    return prefix+'-' + Math.random().toString(36).substr(2,9);
};

SHU.goToScene = (sid, vrc)=>{
    if (sid === undefined) return;
    if (sid.length < 2) return;

    let feURL = PATH_FE+"?s="+sid;
    if (vrc !== undefined) feURL += "&vrc="+vrc;

    window.location.href = feURL;
};

SHU.postJSON = (endpoint, obj, onReceive, onFail)=>{
    $.ajax({
        url: endpoint,
        type:"POST",
        xhrFields: { withCredentials: true },
        data: JSON.stringify(obj),
        contentType:"application/json; charset=utf-8",
        dataType:"json",

        success: (data)=>{
            if (onReceive) onReceive(data);
        }
    }).fail((err)=>{
        console.log(err);
        if (onFail) onFail();
    });
};

// Users
SHU.checkAuth = (onReceive)=>{
    $.ajax({
        type: 'GET',
        url: PATH_RESTAPI+"user",
        xhrFields: { withCredentials: true },            
        dataType: 'json',

        success: (data)=>{
            onReceive(data);
        }
    });
};

SHU.getJSON = (endpoint, onReceive)=>{
    $.getJSON( endpoint, (data)=>{
        if (onReceive) onReceive(data);
    });  
};

SHU.getScenesSelect = (idselect)=>{
    $.getJSON( PATH_RESTAPI+"scenes/", ( data )=>{
        let list = "<option value=''>Choose scene ID...</option>";

        for (let s in data){
            let sid = data[s].sid;
            list += "<option value='"+sid+"'>"+sid+"</option>"
        }

        $("#"+idselect).html(list);
    });
};

SHU.getScenesInputList = (idlist)=>{
    let htmlcontent = "<label for='sid'>Scene ID</label><br><input id='sid' type='text' list='sidlist' style='width:50%'>";

    $.getJSON( PATH_RESTAPI+"scenes/", ( data )=>{
        htmlcontent += "<datalist id='sidlist'>";
        for (let s in data) htmlcontent += "<option>"+data[s].sid+"</option>";
        htmlcontent += "</datalist>";

        $("#"+idlist).html(htmlcontent);
    });
};

SHU.uiAddMainToolbar = (idcontainer)=>{
    let htmlcode = "";
    htmlcode += "<div id='btn-t-user' class='atonBTN'><img src='"+PATH_RES+"icons/user.png'></div>";
    htmlcode += "<div id='btn-t-scenes' class='atonBTN'><img src='"+PATH_RES+"icons/scene.png'>Scenes</div>";

    $("#"+idcontainer).append(htmlcode);

    $("#btn-t-user").click(()=>{ window.location.href = "../../shu/auth/"; });
    $("#btn-t-scenes").click(()=>{ window.location.href = "../../shu/scenes/"; });

    SHU.checkAuth((data)=>{
        if (data.username) $("#btn-t-user").html("<img src='"+PATH_RES+"icons/user.png'>"+data.username);
        else $("#btn-t-user").html("<img src='"+PATH_RES+"icons/user.png'>User");
    });
};

SHU.createBaseScene = ()=>{
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

SHU.appendModelsToSelect = (idselect)=>{
    $.getJSON( PATH_RESTAPI+"c/models/", ( data )=>{
        let list = "";
        let folders = {};

        for (let m in data){
            let mp = data[m];
            list += "<option value='"+mp+"'>[MODEL] "+mp+"</option>";

            let F = SHU.getBaseFolder(mp);
            if (folders[F] === undefined) folders[F] = mp;
            else folders[F] += ","+mp;
        }

        for (let k in folders) list += "<option value='"+folders[k]+"'>[FOLDER] "+k+"</option>";

        $("#"+idselect).append(list);
    });
};

SHU.appendPanoramasToSelect = (idselect)=>{
    $.getJSON( PATH_RESTAPI+"c/panoramas/", ( data )=>{
        let list = "";

        for (let p in data){
            let ppath = data[p];
            list += "<option value='"+ppath+"'>"+ppath+"</option>"
        }

        $("#"+idselect).append(list);
    });
};