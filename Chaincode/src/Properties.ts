interface Propiedad {
    [s: string]: any
}

class Properties implements Propiedad{

    json: Propiedad;

    constructor(json: Propiedad){
        this.json = json;
    }

    public toString = () : string => {
        return JSON.stringify(Object.assign({}, this.json, {"doctype":"client"}));
    }

}

export default Properties;