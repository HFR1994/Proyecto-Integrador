
interface Persona{
    rfc: string;
    curp: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombres: string;
    email: string;
    [s: string]: any;
}

interface Company{
    [s: string]: Properties
}

interface Properties {
    [s: string]: any
}

class Client{

    json: Persona;

    constructor(json: Persona){
        this.json = json;
    }

    public toString = () : string => {
        return JSON.stringify(this.json);
    }
}

export default Client;