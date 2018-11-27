
interface Persona{
    user: string;
    password: string;
    [s: string]: any;
}

class Company{

    json: Persona;

    constructor(json: Persona){

        this.json = json;

    }

    public toString = () : string => {
        return JSON.stringify(this.json);
    }
}

export default Company;