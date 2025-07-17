/*!
    @preserve

    Built-in User class

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

class User {

constructor(uid, data){
    this.uid = uid;

    this.setData(data);
}

setData(data){
    if (!data) return this;

    if (data.username) this.username = data.username;
    else this.username = this.uid;

    if (data.password) this.password = data.password;
    if (data.admin)    this.admin    = data.admin;

    return this;
}

setCollectionFolder(path){
    this.dirCollection = path;
}

getEntry(){
    return {
        username: this.username,
        password: this.password,
        admin: this.admin
    };
}

getUID(){
    return this.uid;
}

getUsername(){
    return this.username;
}

isAdmin(){
    return this.admin;
}

setRoleAdmin(){
    this.admin = true;
    return this;
}

}


export default User;