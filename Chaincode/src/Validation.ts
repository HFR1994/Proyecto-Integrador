export namespace Validation {

    export interface RegexValidator{
        isAcceptable(s: string): boolean;
    }

    export interface LengthValidator{
        isMax(s: string, length: number): boolean;
        isMin(s: string, length: number): boolean;
        isBetween(s: string, min: number, max: number): boolean;
    }

    export interface DateValidator {
        isAfter(value: Date, compare: Date): boolean;
        isBefore(value: Date, compare: Date): boolean;
        isBetween(start: Date, finish: Date, middle: Date): boolean;
    }

    const curpRegexp = /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/;
    const rfcRegexp = /^([A-ZÑ&]{3,4})?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01]))?([A-Z\d]{2})([A\d])$/;
    const dateRegexp = /^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)\d{2})$/;
    const emailRegexp = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@(([0-9a-zA-Z])+([-\w]*[0-9a-zA-Z])*\.)+[a-zA-Z]{2,9})$/;

    export class EmailValidator implements RegexValidator {
        isAcceptable(s: string) {
            return emailRegexp.test(s);
        }
    }

    export class RFCValidator implements RegexValidator {
        isAcceptable(s: string) {
            return (s.length === 12 || s.length === 13)  && rfcRegexp.test(s);
        }
    }

    export class CURPValidator implements RegexValidator {
        isAcceptable(s: string) {
            return s.length === 18 && curpRegexp.test(s);
        }
    }

    export class DateValidator implements RegexValidator, DateValidator {
        isAcceptable(s: string) {
            return s.length === 10 && dateRegexp.test(s);
        }

        isAfter(value: Date, compare: Date){
            return value >= compare
        }

        isBefore(value: Date, compare: Date){
            return value < compare
        }

        isBetween(start: Date, finish: Date, middle: Date){
            return this.isAfter(middle, start) && this.isBefore(middle, finish)
        }

    }

    export class SizeValidator implements LengthValidator{
        isMax(s: string, length: number): boolean {
            return s.length <= length
        }

        isMin(s: string, length: number): boolean {
            return s.length >= length
        }

        isBetween(s: string, min: number, max: number){
            return this.isMax(s, max) && this.isMin(s, min)
        }
    }
}

