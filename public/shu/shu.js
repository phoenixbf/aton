/*===========================================================================

    "Shu": ATON back-end

    Author: B. Fanini

===========================================================================*/

/**
Shu back-end (official ATON back-end)
@namespace SHU
*/
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

    let feURL = ATON.PATH_FE+"?s="+sid;
    if (vrc !== undefined) feURL += "&vrc="+vrc;

    window.location.href = feURL;
};

// Users
/*
SHU.checkAuth = (onReceive)=>{
    $.ajax({
        type: 'GET',
        url: ATON.PATH_RESTAPI+"user",
        xhrFields: { withCredentials: true },            
        dataType: 'json',

        success: (data)=>{
            onReceive(data);
        }
    });
};
*/
SHU.getScenesSelect = (idselect)=>{
    $.getJSON( ATON.PATH_RESTAPI+"scenes/", ( data )=>{
        let list = "<option value=''>Choose scene ID...</option>";

        for (let s in data){
            let sid = data[s].sid;
            list += "<option value='"+sid+"'>"+sid+"</option>"
        }

        $("#"+idselect).html(list);
    });
};

SHU.createScenesInputList = (idlist)=>{
    let htmlcontent = "<input id='sid' type='text' list='sidlist' style='width:100%'>";

    $.getJSON( ATON.PATH_RESTAPI+"scenes/", ( data )=>{
        htmlcontent += "<datalist id='sidlist'>";
        for (let s in data) htmlcontent += "<option>"+data[s].sid+"</option>";
        htmlcontent += "</datalist>";

        $("#"+idlist).html(htmlcontent);
    });
};

SHU.createPubScenesGallery = (idcontainer)=>{
    let htmlcontent = "";

    $.getJSON( ATON.PATH_RESTAPI+"scenes/", ( data )=>{
        for (let s in data){
            let scene = data[s];
            let sid = scene.sid;

            let urlCover = (scene.cover)? ATON.PATH_SCENES+sid+"/cover.png" : ATON.PATH_RES+"scenecover.png";
            let title = (scene.title)? scene.title : sid;

            htmlcontent += "<div id='sid-"+sid+"' class='atonGalleryItem' data-search-term='"+title+"' style='padding:4px' >";
            htmlcontent += "<a href='/s/"+sid+"'><div class='atonBlockSubTitle'>"+title+"</div></a><br>";
            
            htmlcontent += "<a class='atonCover' href='/s/"+sid+"'>";
            htmlcontent += "<img src='"+urlCover+"'>";
            htmlcontent += "</a>";
            
            htmlcontent += "</div>";
        }

        

        $("#"+idcontainer).html(htmlcontent);
    });
};

SHU.uiAddMainToolbar = (idcontainer)=>{
    let htmlcode = "";

    ATON.Utils.checkAuth((data)=>{
        if (data.username) htmlcode += "<div id='btn-t-user' class='atonBTN'><img src='"+ATON.PATH_RES+"icons/user.png'>"+data.username+"</div>";
        else htmlcode += "<div id='btn-t-user' class='atonBTN'><img src='"+ATON.PATH_RES+"icons/user.png'>User</div>";

        htmlcode += "<div id='btn-t-scenes' class='atonBTN'><img src='"+ATON.PATH_RES+"icons/scene.png'>Scenes</div>";

        if (data.username && data.admin){
            htmlcode += "<div id='btn-t-users' class='atonBTN'><img src='"+ATON.PATH_RES+"icons/users.png'>Users</div>";
            htmlcode += "<div id='btn-t-wapps' class='atonBTN'><img src='"+ATON.PATH_RES+"icons/app.png'>Apps</div>";
        }

        $("#"+idcontainer).append(htmlcode);

        $("#btn-t-user").click(()=>{ window.location.href = "../../shu/auth/"; });
        $("#btn-t-scenes").click(()=>{ window.location.href = "../../shu/scenes/"; });
        $("#btn-t-users").click(()=>{ window.location.href = "../../shu/users/"; });
        $("#btn-t-wapps").click(()=>{ window.location.href = "../../shu/wapps/"; });
    });
};

SHU.uiAttachModelsInputList = (elid)=>{
    //let htmlcontent = "<input id='"+elid+"' type='text' list='"+elid+"-list' style='width:80%'>";
    let htmlcontent = "";

    $.getJSON( ATON.PATH_RESTAPI+"c/models/", ( data )=>{
        //let folders = {};
        SHU._cModelDirs = {};
        
        htmlcontent += "<datalist id='"+elid+"-list'>";

        for (let m in data){
            let mp = data[m];
            htmlcontent += "<option value='"+mp+"'>"+mp+"</option>";

            let F = SHU.getBaseFolder(mp);

            if (SHU._cModelDirs[F] === undefined) SHU._cModelDirs[F] = [];
            SHU._cModelDirs[F].push(mp)
            
            //if (folders[F] === undefined) folders[F] = mp;
            //else folders[F] += ","+mp;
        }

        console.log(SHU._cModelDirs);

        //for (let F in folders) htmlcontent += "<option value='"+folders[F]+"'>"+F+"*</option>";
        //for (let F in folders) htmlcontent += "<option value='"+F+"*'>"+F+"*</option>";
        for (let F in SHU._cModelDirs) htmlcontent += "<option value='"+F+"*'>"+F+"*</option>";

        htmlcontent += "</datalist>";

        $("#"+elid).html(htmlcontent);
    });
};

SHU.appendModelsToSelect = (idselect)=>{
    $.getJSON( ATON.PATH_RESTAPI+"c/models/", ( data )=>{
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
    $.getJSON( ATON.PATH_RESTAPI+"c/panoramas/", ( data )=>{
        let list = "";

        for (let p in data){
            let ppath = data[p];
            list += "<option value='"+ppath+"'>"+ppath+"</option>"
        }

        $("#"+idselect).append(list);
    });
};


/* Scene composer */
SHU.composer = {};

SHU.composer.createBaseScene = ()=>{
    let sobj = {};

    sobj.status = "complete";

    sobj.environment = {};

    sobj.scenegraph = {};
    sobj.scenegraph.nodes = {};
    //sobj.scenegraph.nodes.main = {};
    //sobj.scenegraph.nodes.main.urls = [];

    sobj.scenegraph.edges = {};
    sobj.scenegraph.edges["."] = [];

    return sobj;
};

SHU.composer.deleteSceneNode = (sobj, nid)=>{
    if (sobj.scenegraph.nodes[nid] !== undefined){
        sobj.scenegraph.nodes[nid] = undefined;
    }

    let rootChildren = sobj.scenegraph.edges["."];
    let i = rootChildren.indexOf(nid);
    if (i >= 0) rootChildren.splice(i,1);

    return sobj;
};

SHU.composer.addSceneNode = (sobj, nid)=>{
    if (sobj.scenegraph.nodes[nid] !== undefined) return sobj;

    sobj.scenegraph.nodes[nid] = {};

    let rootChildren = sobj.scenegraph.edges["."];
    let i = rootChildren.indexOf(nid);
    if (i < 0) rootChildren.push(nid);

    return sobj;
};

/*
SHU.composer.transformSceneNodeUsingStrings = (sobj, strT, strS, strR)=>{

    if (strT){
        let values = tformtrans.split(",");
        if (values.length !== 3) return sobj;
        if (values[0].length<1 || values[1].length<1 || values[2].length<1) return sobj;

        if (sobj.scenegraph.nodes[nid] === undefined) return sobj;
        if (sobj.scenegraph.nodes[nid].transform === undefined) sobj.scenegraph.nodes[nid].transform = {};

        sobj.scenegraph.nodes[nid].transform.position = values;
    }

    return sobj;
};
*/