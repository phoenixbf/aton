/*===========================================================================

    "Shu": ATON back-end

    Author: B. Fanini

===========================================================================*/

/**
Shu back-end (official ATON back-end)
@namespace SHU
*/
let SHU = {};

SHU.urlATONwebsite = "http://osiris.itabc.cnr.it/aton/";
SHU.urlATONgit     = "https://github.com/phoenixbf/aton";

SHU.sidCompare = (a,b)=>{
    if (a.sid > b.sid) {
        return -1;
    }
    if (b.sid > a.sid) {
        return 1;
    }
    return 0;
};

SHU.getBaseFolder = ( filepath )=>{
    let index  = filepath.lastIndexOf( '/' );
    if ( index !== -1 ) return filepath.substring( 0, index + 1 );
    
    return '';
};

SHU.getUserFromSID = (sid)=>{
    let v = sid.split("/");
    return v[0];
};

SHU.generateID = (prefix)=>{
    if (prefix === undefined) prefix = "id";
    return prefix+'-' + Math.random().toString(36).substr(2,9);
};

// timestamped user SID
// TODO: merge with Core routine
SHU.generateUserSID = ()=>{
    let today = new Date();

    let dd   = String( today.getDate() );
    let mm   = String( today.getMonth()+1 );
    let yyyy = String( today.getFullYear() );
    if(dd<10) dd = '0'+dd;
    if(mm<10) mm = '0'+mm;

    console.log(dd)

    let R = yyyy+mm+dd;
    console.log(R)

    return SHU.generateID(R);
};

SHU.goToScene = (sid, vrc)=>{
    if (sid === undefined) return;
    if (sid.length < 2) return;

    let feURL = ATON.PATH_FE + sid; //"?s="+sid;
    if (vrc !== undefined) feURL += "&vrc="+vrc;

    window.location.href = feURL;
};

SHU.onCoverNotFound = (image)=>{
    image.onerror = "";
    image.src = ATON.PATH_RES+"scenecover.png";
    return true;
};

SHU.uiBuildFooter = (elid)=>{
    let htmlcontent = "SHU back-end - ";
    htmlcontent += "<a href='"+SHU.urlATONwebsite+"' target='_blank'>ATON</a> framework by <a href='https://www.ispc.cnr.it/' target='_blank'>CNR ISPC</a>";

    $("#"+elid).html(htmlcontent);
};

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

SHU.createScenesInputList = (idlist, onkeyenter, onkeyinput, onData)=>{
    let htmlcontent = "<input id='sid' type='text' list='sidlist' style='width:100%'>";

    $.getJSON( ATON.PATH_RESTAPI+"scenes/", ( data )=>{
        htmlcontent += "<datalist id='sidlist'>";
        for (let s in data) htmlcontent += "<option>"+data[s].sid+"</option>";
        htmlcontent += "</datalist>";

        $("#"+idlist).html(htmlcontent);

        if (onkeyenter) $("#sid").keypress(function(event){
            let keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13') onkeyenter();
        });

        if (onkeyinput) $("#sid").on("input change", onkeyinput );

        if (onData) onData(data);
    });
};

SHU.createPubScenesGallery = (idcontainer, bSamples, onComplete, opts)=>{
    let htmlcontent = "";

    let coversizex = 250;
    let coversizey = 330;

    if (bSamples === undefined) bSamples = true;

    let viewparams = undefined;
    if (opts && opts.view){
        viewparams = "";
        for (let p in opts.view) viewparams += p +"="+ opts.view[p]+"&";
    }

    let skwords = {};

    $.getJSON( ATON.PATH_RESTAPI+"scenes/", ( data )=>{
        data.sort( SHU.sidCompare );

        for (let s in data){
            let scene = data[s];
            let sid   = scene.sid;
            let user  = SHU.getUserFromSID(sid);

            if ( bSamples || user !== "samples" ){
                let urlCover = (scene.cover)? ATON.PATH_SCENES+sid+"/cover.png" : ATON.PATH_RES+"scenecover.png";
                let title = (scene.title)? scene.title : sid;

                let terms = title.trim().toLowerCase();
                terms += " "+user.trim().toLowerCase();

                let htskw = "";
                if (scene.kwords){
                    for (let k in scene.kwords){
                        let kk = k.toLowerCase();
                        htskw += "<span class='atonKeyword'>"+kk+"</span>";
                        terms += " "+kk;

                        if (!skwords[kk]) skwords[kk] = 1;
                        else skwords[kk]++;
                    }
                }

                htmlcontent += "<div id='sid-"+s+"' class='atonGalleryItem' data-search-term='"+terms+"' style='background-color:rgba(255,255,255, 0.1)' >";

                // gallery item bg
                htmlcontent += "<div class='atonBlurBG' style='width:"+coversizex+"px; height:"+coversizey+"px; background-image: url(\""+urlCover+"\")'></div>";

                // gallery item content
                htmlcontent += "<div style='width:"+coversizex+"px; height:"+coversizey+"px; position:absolute; top:0; left:0'>";
                htmlcontent += "<div class='atonBlockSubTitle'>"+title+"</div><br>";
                
                if (viewparams) sid += "?"+viewparams;

                htmlcontent += "<a class='atonCover' href='/s/"+sid+"'>";
                htmlcontent += "<img src='"+urlCover+"' style='width:200px; height:auto'>";
                htmlcontent += "</a>";

                // user
                if (!opts || !opts.hideAuthors){
                    if (user === "samples") htmlcontent += "<br><div class='atonAuthor'><img class='atonSmallIcon' src='"+ATON.PATH_RES+"icons/samples.png'>samples</div>";
                    else htmlcontent += "<br><div class='atonAuthor'><img class='atonSmallIcon' src='"+ATON.PATH_RES+"icons/user.png'>"+user+"</div>";
                    //htmlcontent += htskw;
                }

                htmlcontent += "</div>";
                
                htmlcontent += "</div>";
            }
        }

        $("#"+idcontainer).html(htmlcontent);

        //console.log(skwords);

        let akws = Object.entries(skwords).sort((a,b)=>b[1]-a[1]).map(el=>el[0]);
        //console.log(akws);

        for (let i in akws){
            let k = akws[i];
            let w = skwords[k];
            let f = w - 1;
            f = 0.8 + (f * 0.1);
            if (f > 1.5) f = 1.5;

            if (i<20) $("#idTagCloud").append("<div class='atonKeyword atonKeywordActivable' style='margin:5px; font-size:"+f+"em;' onclick='searchByTerm(&quot;"+k+"&quot;)'>"+k+"</div>");
        }
/*
        for (let k in skwords){
            let w = skwords[k];
            let f = w - 1;
            f = 0.8 + (f * 0.1);
            if (f > 1.5) f = 1.5;

            $("#idTagCloud").append("<div class='atonKeyword atonKeywordActivable' style='margin:5px; font-size:"+f+"em;' onclick='searchByTerm(&quot;"+k+"&quot;)'>"+k+"</div>");
        }
*/
        if (onComplete) onComplete();
    });
};

SHU.uiAddMainToolbar = (idcontainer)=>{
    let htmlcode = "";

    ATON.Utils.checkAuth((data)=>{
        htmlcode += "<a id='btn-t-aton' class='atonBTN' href='"+window.location.origin+"'><img src='"+ATON.PATH_RES+"icons/aton.png'></a>";

        if (data.username) htmlcode += "<a id='btn-t-user' class='atonBTN' href='../../shu/auth/'><img src='"+ATON.PATH_RES+"icons/user.png'>"+data.username+"</a>";
        else htmlcode += "<a id='btn-t-user' class='atonBTN' href='../../shu/auth/'><img src='"+ATON.PATH_RES+"icons/user.png'>User</a>";

        //htmlcode += "<a id='btn-t-collection' class='atonBTN' href='../../shu/collection/'><img src='"+ATON.PATH_RES+"icons/collection.png'>Collection</a>";
        htmlcode += "<a id='btn-t-scenes' class='atonBTN' href='../../shu/scenes/'><img src='"+ATON.PATH_RES+"icons/scene.png'>Scenes</a>";

        if (data.username && data.admin){
            htmlcode += "<a id='btn-t-users' class='atonBTN' href='../../shu/users/'><img src='"+ATON.PATH_RES+"icons/users.png'>Users</a>";
            htmlcode += "<a id='btn-t-wapps' class='atonBTN' href='../../shu/wapps/'><img src='"+ATON.PATH_RES+"icons/app.png'>Apps</a>";
            htmlcode += "<a id='btn-t-wapps' class='atonBTN' href='../../shu/info/'><img src='"+ATON.PATH_RES+"icons/info.png'>Info</a>";
        }

        $("#"+idcontainer).append(htmlcode);
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

SHU.uiAttachPanoramasToInputList = (elid)=>{
    let htmlcontent = "";

    $.getJSON( ATON.PATH_RESTAPI+"c/panoramas/", ( data )=>{
        htmlcontent += "<datalist id='"+elid+"-list'>";

        for (let p in data){
            let purl = data[p];
            htmlcontent += "<option value='"+purl+"'>"+purl+"</option>";
        }

        htmlcontent += "</datalist>";

        $("#"+elid).html(htmlcontent);
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
