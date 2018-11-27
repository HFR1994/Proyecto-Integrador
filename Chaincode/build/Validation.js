"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Validation;
(function (Validation) {
    const curpRegexp = /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/;
    const rfcRegexp = /^([A-ZÑ&]{3,4})?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01]))?([A-Z\d]{2})([A\d])$/;
    const dateRegexp = /^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)\d{2})$/;
    const emailRegexp = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@(([0-9a-zA-Z])+([-\w]*[0-9a-zA-Z])*\.)+[a-zA-Z]{2,9})$/;
    class EmailValidator {
        isAcceptable(s) {
            return emailRegexp.test(s);
        }
    }
    Validation.EmailValidator = EmailValidator;
    class RFCValidator {
        isAcceptable(s) {
            return (s.length === 12 || s.length === 13) && rfcRegexp.test(s);
        }
    }
    Validation.RFCValidator = RFCValidator;
    class CURPValidator {
        isAcceptable(s) {
            return s.length === 18 && curpRegexp.test(s);
        }
    }
    Validation.CURPValidator = CURPValidator;
    class DateValidator {
        isAcceptable(s) {
            return s.length === 10 && dateRegexp.test(s);
        }
        isAfter(value, compare) {
            return value >= compare;
        }
        isBefore(value, compare) {
            return value < compare;
        }
        isBetween(start, finish, middle) {
            return this.isAfter(middle, start) && this.isBefore(middle, finish);
        }
    }
    Validation.DateValidator = DateValidator;
    class SizeValidator {
        isMax(s, length) {
            return s.length <= length;
        }
        isMin(s, length) {
            return s.length >= length;
        }
        isBetween(s, min, max) {
            return this.isMax(s, max) && this.isMin(s, min);
        }
    }
    Validation.SizeValidator = SizeValidator;
})(Validation = exports.Validation || (exports.Validation = {}));
