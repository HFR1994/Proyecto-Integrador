import bcrypt from 'bcrypt';

interface Persona{
    user: string;
    password: string;
    aprobaciones?: Aprovaciones;
    [s: string]: any;
}

enum Estatus {
    Aprobado = 0,
    Rechazado = 1,
    Esperando = 2,
}

interface Aproval{
    client: string;
    created: Date;
    modified: Date;
}

interface Aprovaciones{
    approved: Array<Aproval>,
    waiting: Array<Aproval>,
    rejected: Array<Aproval>,
}

class Company{

    json: Persona;

    constructor(json: Persona){

        const required = ["user", "password"];

        this.json = json;

        if(json.aprobaciones == null){
            this.json["aprobaciones"] = {
                approved: [],
                waiting: [],
                rejected: []
            }
        }

        const current = Object.keys(json).map((key) => key);

        var result = required.filter(function(e) {
            let i = current.indexOf(e);
            return i == -1 ? true : (current.splice(i, 1), false)
        });

        if(result.length == 1){
            throw new Error(`Falto el siguiente parametro: ${result.toString().replace(/,/g, ', ')}`)
        }else if(result.length >= 1){
            throw new Error(`Faltaron los siguientes parametros: ${result.toString().replace(/,/g, ', ')}`)
        }

        if(!json.isHashed) {
            json.password = bcrypt.hashSync(json.password, 10)
        }
    }

    public async validateLogin(password: string){
        return bcrypt.compareSync(password, this.json.password);
    }

    public isClientPending(target: string){
        let i;
        const list = this.json.aprobaciones.waiting;
        for (i = 0; i < list.length; i++) {
            if (list[i].client === target) {
                return true;
            }
        }
        return false;
    }

    public addClient(target: string, type: number, baseDate: Date = new Date()){
        let current = baseDate;
        let today = current;

        this.json.aprobaciones.approved = this.json.aprobaciones.approved.filter(function(value){
            if(value.client != target){
                return true;
            }else{
                current = value.created;
                return false;
            }
        });
        this.json.aprobaciones.rejected = this.json.aprobaciones.rejected.filter(function(value){
            if(value.client != target){
                return true;
            }else{
                current = value.created;
                return false;
            }
        });
        this.json.aprobaciones.waiting = this.json.aprobaciones.waiting.filter(function(value){
            if(value.client != target){
                return true;
            }else{
                current = value.created;
                return false;
            }
        });

        switch (type) {
            case Estatus.Aprobado:
                this.json.aprobaciones.approved.push({
                    client: target,
                    created: current,
                    modified: today,
                });
                break;
            case Estatus.Rechazado:
                this.json.aprobaciones.rejected.push({
                    client: target,
                    created: current,
                    modified: today,
                });
                break;
            case Estatus.Esperando:
                this.json.aprobaciones.waiting.push({
                    client: target,
                    created: current,
                    modified: today,
                });
                break;
        }
    }

    public getStatusList(){
        return this.json.aprobaciones;
    }

    public toObject = () : Object => {
        return Object.assign({}, this.json, {doctype:"company", isHashed: true});
    };

    public toString = () : string => {
        return JSON.stringify(Object.assign({}, this.json, {"doctype":"company", isHashed: true}));
    }
}

module.exports.Estatus = Estatus;
export default Company;