import request from 'request';

export class KeyProtect {
    
    private BXINST: string = "876d5e5a-bc3a-438d-8299-b2381e4b1b21";
    private BXAPI: string = "nIRDWIlkT-2Irz5Ut5h_MhQMBQRG2AZgWBnsxAwHm24C";
    private BXURL: string = "https://iam.bluemix.net/identity/token";
    //let keys = ["cryptokey"];
    

    private startTime: Date;
    private autorization: string;
    private ERR_KP_CREDS = 'The Key Protect credentials are not define.';

    constructor() {
        this.autorization = '';
        this.startTime = undefined;
    }

    public validateAutorization() {
        if (this.startTime === undefined || this.autorization === '') {
            return false;
        } else {
            const currentDate = new Date();
            const sameDay = (this.startTime.getDay === currentDate.getDay);
            const sameMonth = (this.startTime.getMonth === currentDate.getMonth);
            const spendTime = ((currentDate.getTime() - this.startTime.getTime()) / 1000) < 3540;
            if ((sameMonth && sameDay) && spendTime) {
                console.log('The authentication yet is valid.');
                return true;
            } else {
                this.startTime = undefined;
                return false;
            }
        }
    }

    private getAutorizationToken() {
        const self = this;
        return new Promise<any>(async (resolver, reject) => {

            if (!this.BXAPI || !this.BXURL) {
                console.error(this.ERR_KP_CREDS);
                reject(new Error(this.ERR_KP_CREDS));
            }

            const options = {
                method: 'POST',
                url: this.BXURL,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    accept: 'application/json'
                },
                form: {
                    apikey: this.BXAPI,
                    grant_type: 'urn:ibm:params:oauth:grant-type:apikey'
                }
            };

            await request(options, async function(error, response, body) {
                if (error) {
                    reject(error);
                }

                const result = JSON.parse(body);
                if (response.statusCode !== 200) {
                    console.error('an error occurred try to getToken for KeyProtect');
                    reject(new Error(result.errorMessage));
                }

                self.autorization = result.token_type + ' ' + result.access_token;
                self.startTime = new Date();
                resolver();
            });
        });
    }

    public async getKey(keyname: string) {

        if (!this.validateAutorization()) {
            await this.getAutorizationToken();
        }

        const idkey = await this.getIdKey(keyname);

        const options = {
            headers: {
                authorization : this.autorization,
                'bluemix-instance' : this.BXINST,
                accept: 'application/vnd.ibm.collection+json',
            },
            method: 'GET',
            url: 'https://keyprotect.us-south.bluemix.net/api/v2/keys/' + idkey
        };

        return new Promise<any>(async (resolver, reject) => {
            await request(options, async function(error, response, body) {
                if (error) {
                    reject(error);
                } else if (response.statusCode !== 200) {
                    reject(new Error(JSON.parse(body).errorMessage));
                } else {
                    resolver(JSON.parse(body).resources[0].payload);
                }
            });
        });
    }

    private getIdKey(keyname: string) {
        const options = {
            headers: {
                authorization : this.autorization,
                'bluemix-instance' : this.BXINST,
                accept: 'application/vnd.ibm.collection+json',
            },
            method: 'GET',
            url: 'https://keyprotect.us-south.bluemix.net/api/v2/keys'
        };

        return new Promise(async (resolver, reject) => {
            await request(options, (error, response, body) => {
                if (error) { reject(error); }

                if (response.statusCode !== 200) {
                    reject(new Error(JSON.parse(body).errorMessage));
                }

                let id = '';
                const jsonResponse = JSON.parse(body);
                if (!jsonResponse.resources || jsonResponse.resources.length === 0) {
                    reject(new Error('The key: ' + keyname + ' do not exist!'));
                } else {
                    jsonResponse.resources.forEach(key => {
                        if (keyname === key.name) {
                            id = key.id;
                            resolver(id);
                        }
                    });
                }
            });
        });
    }

}
