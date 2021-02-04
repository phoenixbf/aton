/*
    ATON GPS
    Outdoor physical location tracking and handling

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Geolocation and outdoor tracking
@namespace GPS
*/
let GPS = {};

//GPS.INTERVAL  = 1000;
GPS.DEG2RAD    = 0.017453292519943295;
GPS.EARTH_R_KM = 6371.0;
GPS.EARTH_D_KM = GPS.EARTH_R_KM * 2.0;


GPS.init = ()=>{
    GPS._bActive = false;

    GPS._wpid = undefined;
    GPS._currPos = new THREE.Vector2();

    // POIs
    GPS._POIs = [];
    GPS._currPOI = undefined;
};

/**
Enable GPS location tracking
*/
GPS.enableTracking = ()=>{
    if (GPS._bActive) return;
    if (!ATON.Utils.isConnectionSecure()) return;
    if (!navigator.geolocation) return;

    GPS._wpid = navigator.geolocation.watchPosition(
        GPS._onPosition,
        GPS._onError,
        {
            enableHighAccuracy: true,
            //maximumAge        : 30000,
            //timeout           : 27000
        }    
    );

    //window.setInterval( GPS.update, GPS.INTERVAL);
    
    GPS._bActive = true;
};

/**
Disable GPS location tracking
*/
GPS.disableTracking = ()=>{
    if (!GPS._bActive) return;
    
    navigator.geolocation.clearWatch(GPS._wpid);
    GPS._bActive = false;
};

GPS._onError = ()=>{
    console.log("GPS error");
};

GPS._onPosition = (pos)=>{
    if (!GPS._bActive) return;

    GPS._currPos.x = pos.coords.latitude;
    GPS._currPos.y = pos.coords.longitude;

    //console.log(pos.coords.latitude+","+pos.coords.longitude);
    console.log(pos);

    GPS._handlePOIs();
};

GPS._handlePOIs = ()=>{
    let numPOIs = GPS._POIs.length;
    if (numPOIs <= 0) return;

    for (let i=0; i<numPOIs; i++){
        let POI = GPS._POIs[i];

        let d = GPS.distance(GPS._currPos, POI.pos);

        //console.log("Distance: "+d);

        if (d <= POI.radius && i !== GPS._currPOI){
            ATON.fireEvent("EnterPOI", i);
            GPS._currPOI = i;
            console.log("Entered POI "+i);
        }
        else {
            if (GPS._currPOI !== undefined) ATON.fireEvent("LeavePOI", GPS._currPOI);
            GPS._currPOI = undefined;
        }
    }
};

/**
Get current location
@returns {THREE.Vector2} - latitude and longitude
*/
GPS.getCurrentLocation = ()=>{
    if (!GPS._bActive) return undefined;

    return GPS._currPos;
};

GPS.locationFromLatLon = (lat, lon)=>{
    return new THREE.Vector2( lat, lon );
};

// Distance between two locations (in meters)
GPS.distance_orig = (latlonA, latlonB)=>{
    let dLat = GPS.DEG2RAD * (latlonB.x - latlonA.x);  // deg2rad
    let dLon = GPS.DEG2RAD * (latlonB.y - latlonA.y); 
    let a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(GPS.DEG2RAD * latlonA.x) * Math.cos(GPS.DEG2RAD * latlonB.x) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);

    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    let d = GPS.EARTH_R_KM * c; // Distance in km
    
    return d * 1000.0;
};

// Optimized distance between two locations (in meters)
// from https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
GPS.distance = (latlonA, latlonB)=>{
    let a = 0.5 - Math.cos((latlonB.x - latlonA.x) * GPS.DEG2RAD)/2.0 + 
        Math.cos(latlonA.x * GPS.DEG2RAD) * Math.cos(latlonB.x * GPS.DEG2RAD) * 
        (1.0 - Math.cos((latlonB.y - latlonA.y) * GPS.DEG2RAD))/2.0;

    let d = GPS.EARTH_D_KM * Math.asin(Math.sqrt(a));

    return d * 1000.0;
};

/**
Add a POI (point-of-interest) given location (lat,lon) and radius.
You can handle enter/leave POI events using ATON.on("EnterPOI") and ATON.on("LeavePOI")
@param {THREE.Vector2} P - the (lat,lon) pair
@param {number} r - the radius (meters)
*/
GPS.addPOI = (P, r)=>{
    let POI = {};
    POI.pos = P;
    POI.radius = r;

    GPS._POIs.push(POI);

    if (!GPS._bActive) GPS.enable();

    //console.log("Added POI:");
    //console.log(POI);

    GPS._handlePOIs();

    return (GPS._POIs.length - 1);
};

GPS.getPOIbyIndex = (i)=>{
    return GPS._POIs[i];
};

// Main update routine
/*
GPS.update = ()=>{
    if (!GPS._bActive) return;

    //navigator.geolocation.watchPosition(GPS._onPosition);

    //let P = GPS.locationFromLatLon(42.06047573760282, 12.588698649224982);
    //console.log( GPS.distance(GPS._currPos, P) );
};
*/

export default GPS;