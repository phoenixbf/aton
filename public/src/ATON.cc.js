/*
    ATON Copyright Hub
    Manages embedded copyright

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Copyright Hub
@namespace CC
*/
let CC = {};


CC.init = ()=>{
    CC.list = [];
};

/**
Return true if any copyright information is found in loaded resources so far.
Copyright list is located in ATON.CC.list.
@returns {boolean}
*/
CC.anyCopyrightFound = ()=>{
    return (CC.list.length > 0);
};

// Copyright extraction
CC.extract = (data)=>{
    if (data === undefined) return;
    if (data.asset === undefined) return;

    let cc = {};

    if (data.asset.copyright) cc.copyright = data.asset.copyright;
    if (data.asset.extras){
        for (let e in data.asset.extras){
            if (typeof data.asset.extras[e] === "string") cc[e] = data.asset.extras[e];
        }
    }

    // Empty cc object
    if (Object.keys(cc).length === 0) return;

    if (data.asset.generator) cc.generator = data.asset.generator;

    // check for replicate entries
    for (let e in CC.list){
        let o = CC.list[e];

        if ( CC.compare(cc, o) ) return;
    }

    CC.list.push(cc); // Add to cc list
    
    console.log(cc);
};

// Shallow compare two copyright objects
CC.compare = (A,B)=>{
    if (A === undefined || B === undefined) return false;

    const keysA = Object.keys(A);
    const keysB = Object.keys(B);

    if (keysA.length !== keysB.length) return false;

    for (let k of keysA){
        if (A[k] !== B[k]) return false;
    }

    return true;
};

export default CC;