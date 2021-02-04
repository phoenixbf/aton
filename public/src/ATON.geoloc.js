/*
    ATON GeoLoc
    Outdoor physical location tracking and POI handling
    TODO: rename

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Geolocation and outdoor tracking
@namespace GeoLoc
*/
let GeoLoc = {};

//GeoLoc.INTERVAL  = 1000;
GeoLoc.EARTH_R_KM = 6371.0;
GeoLoc.EARTH_D_KM = GeoLoc.EARTH_R_KM * 2.0;


GeoLoc.init = ()=>{
    GeoLoc._bActive = false;

    GeoLoc._wpid = undefined;
    GeoLoc._currPos = new THREE.Vector2();

    // POIs
    GeoLoc._POIs = [];
    GeoLoc._currPOI = undefined;
};

/**
Enable GPS location tracking
*/
GeoLoc.enableTracking = ()=>{
    if (GeoLoc._bActive) return;
    if (!ATON.Utils.isConnectionSecure()) return;
    if (!navigator.geolocation) return;

    GeoLoc._wpid = navigator.geolocation.watchPosition(
        GeoLoc._onPosition,
        GeoLoc._onError,
        {
            enableHighAccuracy: true,
            //maximumAge        : 30000,
            //timeout           : 27000
        }    
    );

    //window.setInterval( GeoLoc.update, GeoLoc.INTERVAL);
    
    GeoLoc._bActive = true;
};

/**
Disable GPS location tracking
*/
GeoLoc.disableTracking = ()=>{
    if (!GeoLoc._bActive) return;
    
    navigator.geolocation.clearWatch(GeoLoc._wpid);
    GeoLoc._bActive = false;
};

GeoLoc._onError = ()=>{
    console.log("GPS error");
};

GeoLoc._onPosition = (pos)=>{
    if (!GeoLoc._bActive) return;
    if (!pos.coords) return;

    GeoLoc._currPos.x = pos.coords.latitude;
    GeoLoc._currPos.y = pos.coords.longitude;

    //console.log(pos.coords.latitude+","+pos.coords.longitude);
    console.log(pos);

    GeoLoc._handlePOIs();
};

GeoLoc._handlePOIs = ()=>{
    let numPOIs = GeoLoc._POIs.length;
    if (numPOIs <= 0) return;

    for (let i=0; i<numPOIs; i++){
        let POI = GeoLoc._POIs[i];

        let d = GeoLoc.distance(GeoLoc._currPos, POI.pos);

        //console.log("Distance: "+d);

        // Inside this POI radius
        if (d <= POI.radius){
            if (GeoLoc._currPOI !== i){
                ATON.fireEvent("EnterPOI", { id: i, distance: d });
                //console.log("Entered POI "+i);
            }
            GeoLoc._currPOI = i;
        }
        // Ouside
        else {
            if (GeoLoc._currPOI !== undefined) ATON.fireEvent("LeavePOI", { id: GeoLoc._currPOI, distance: d });
            GeoLoc._currPOI = undefined;
        }
    }
};

/**
Get current location
@returns {THREE.Vector2} - latitude and longitude
*/
GeoLoc.getCurrentLocation = ()=>{
    if (!GeoLoc._bActive) return undefined;

    return GeoLoc._currPos;
};

GeoLoc.locationFromLatLon = (lat, lon)=>{
    return new THREE.Vector2( lat, lon );
};

// Distance between two locations (in meters)
GeoLoc.distance_orig = (latlonA, latlonB)=>{
    let dLat = ATON.DEG2RAD * (latlonB.x - latlonA.x);  // deg2rad
    let dLon = ATON.DEG2RAD * (latlonB.y - latlonA.y); 
    let a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(ATON.DEG2RAD * latlonA.x) * Math.cos(ATON.DEG2RAD * latlonB.x) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);

    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    let d = GeoLoc.EARTH_R_KM * c; // Distance in km
    
    return d * 1000.0;
};

// Optimized distance between two locations (in meters)
// from https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
GeoLoc.distance = (latlonA, latlonB)=>{
    let a = 0.5 - Math.cos((latlonB.x - latlonA.x) * ATON.DEG2RAD)/2.0 + 
        Math.cos(latlonA.x * ATON.DEG2RAD) * Math.cos(latlonB.x * ATON.DEG2RAD) * 
        (1.0 - Math.cos((latlonB.y - latlonA.y) * ATON.DEG2RAD))/2.0;

    let d = GeoLoc.EARTH_D_KM * Math.asin(Math.sqrt(a));

    return d * 1000.0;
};

/**
Add a POI (point-of-interest) given location (lat,lon) and radius.
You can handle enter/leave POI events using ATON.on("EnterPOI") and ATON.on("LeavePOI")
@param {THREE.Vector2} P - the (lat,lon) pair
@param {number} r - the radius (meters)
*/
GeoLoc.addPOI = (P, r)=>{
    let POI = {};
    POI.pos = P;
    POI.radius = r;

    GeoLoc._POIs.push(POI);

    if (!GeoLoc._bActive) GeoLoc.enable();

    //console.log("Added POI:");
    //console.log(POI);

    GeoLoc._handlePOIs();

    return (GeoLoc._POIs.length - 1);
};

GeoLoc.getPOIbyIndex = (i)=>{
    return GeoLoc._POIs[i];
};

// Main update routine
/*
GeoLoc.update = ()=>{
    if (!GeoLoc._bActive) return;

    //navigator.geolocation.watchPosition(GeoLoc._onPosition);

    //let P = GeoLoc.locationFromLatLon(42.06047573760282, 12.588698649224982);
    //console.log( GeoLoc.distance(GeoLoc._currPos, P) );
};
*/

export default GeoLoc;