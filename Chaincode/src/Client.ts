import {Validation} from "./Validation";
import bcrypt from 'bcrypt';
import RegexValidator = Validation.RegexValidator;

interface Persona{
    rfc: string;
    curp: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombres: string;
    email?: string;
    password: string;
    terceros?: Company;
    aprobaciones?: Aprovaciones;
    [s: string]: any;
}

export enum Estatus {
    Aprobado = 0,
    Rechazado = 1,
    Esperando = 2,
}

interface Company{
    [s: string]: Properties
}

interface Aproval{
    company: string;
    created: Date;
    modified: Date;
}

interface Aprovaciones{
    approved: Array<Aproval>,
    waiting: Array<Aproval>,
    rejected: Array<Aproval>,
}

interface Properties {
    [s: string]: any
}

class Client{

    public json: Persona;

    constructor(json: Persona){

        const required = ["rfc", "curp", "apellidoPaterno", "apellidoMaterno", "nombres", "password"];

        this.json = json;

        if(json.terceros == null){
            this.json["terceros"] = {}
        }

        if(json.aprobaciones == null){
            this.json["aprobaciones"] = {
                approved: [],
                waiting: [],
                rejected: []
            }
        }

        const validators: { [s: string]: RegexValidator } = {};

        validators["RFC"] = new Validation.RFCValidator();
        validators["CURP"] = new Validation.CURPValidator();
        validators["Email"] = new Validation.EmailValidator();

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

        if (!validators["CURP"].isAcceptable(json.curp)) {
            throw new Error('No puedo validar el curp' + this.json.curp);
        }

        if (!validators["RFC"].isAcceptable(json.rfc)) {
            throw new Error('No puedo validar el rfc' + this.json.rfc);
        }

        if (json.email) {
            if (!validators["Email"].isAcceptable(json.email)) {
                throw new Error('No puedo validar el email');
            }
        }

        if(!json.isHashed) {
            json.password = bcrypt.hashSync(json.password, 10)
        }
    }

    public async validateLogin(password: string){
        return bcrypt.compareSync(password, this.json.password);
    }

    public addCompany(target: string, type: number, baseDate: Date = new Date()){
        let current = baseDate;
        let today = current;

        this.json.aprobaciones.approved = this.json.aprobaciones.approved.filter(function(value){
            if(value.company != target){
                return true;
            }else{
                current = value.created;
                return false;
            }
        });
        this.json.aprobaciones.rejected = this.json.aprobaciones.rejected.filter(function(value){
            if(value.company != target){
                return true;
            }else{
                current = value.created;
                return false;
            }
        });
        this.json.aprobaciones.waiting = this.json.aprobaciones.waiting.filter(function(value){
            if(value.company != target){
                return true;
            }else{
                current = value.created;
                return false;
            }
        });

        switch (type) {
            case Estatus.Aprobado:
                this.json.aprobaciones.approved.push({
                    company: target,
                    created: current,
                    modified: today,
                });
                break;
            case Estatus.Rechazado:
                this.json.aprobaciones.rejected.push({
                    company: target,
                    created: current,
                    modified: today,
                });
                break;
            case Estatus.Esperando:
                this.json.aprobaciones.waiting.push({
                    company: target,
                    created: current,
                    modified: today,
                });
                break;
        }
    }

    public isCompanyPending(target: string){
        let i;
        const list = this.json.aprobaciones.waiting;
        for (i = 0; i < list.length; i++) {
            if (list[i].company === target) {
                return true;
            }
        }
        return false;
    }

    public isCompanyApproved(target: string){
        let i;
        const list = this.json.aprobaciones.approved;
        for (i = 0; i < list.length; i++) {
            if (list[i].company === target) {
                return true;
            }
        }
        return false;
    }

    public getStatusList(){
        return this.json.aprobaciones;
    }

    addTercero(target: string, properties: Properties){
        this.json.terceros[target] = Object.assign({}, this.json.terceros[target], {...properties});
    }

    public toObject = () : Object => {
        return Object.assign({}, this.json, {doctype:"client", isHashed: true});
    };

    public toString = () : string => {
        return JSON.stringify(Object.assign({}, this.json, {"doctype":"client", isHashed: true}));
    }
}

export default Client;
