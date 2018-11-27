import axios from 'axios';
import { AxiosInstance } from 'axios';

export interface Params {
    [ key: string ]: any;
}

export interface GetOptions {
    url: string;
    params?: Params;
}

export interface ErrorResponse {
    id: string;
    code: string;
    message: string;
}

export class ApiService {

    private axiosClient: AxiosInstance;
    private user = 'org3';
    private password = '5HAaPa5fEdrF11x4vfLp7IhzzBzuo9ElroMHYqzLlAwZen_lpql8XUxtmtUktoHn';
    public NETWORK_ID = 'n7dc3e3218b8c4b289b95f923fd28553f';

    // I initialize the ApiClient.
    constructor() {
        // The ApiClient wraps calls to the underlying Axios client.
        this.axiosClient = axios.create({
            auth: {
                username: this.user,
                password: this.password
            },
        });
    }

    // I perform a GET request with the given options.
    public async get(options: GetOptions) {
        return this.axiosClient.request({
            method: 'get',
            url: options.url,
            params: options.params
        }).then((response) => {
            return response.data;
        }).catch(( err ) => {
            console.log(err);
            return (this.normalizeError(err));
        });
    }

    // I perform a POST request with the given options.
    public async post(options: GetOptions) {
        return await this.axiosClient.request({
            method: 'post',
            url: options.url,
            data: options.params
        }).then((response) => {
            return response.data;
        }).catch(( err ) => {
            return (Promise.reject(this.normalizeError(err)));
        });
    }

    // ---
    // PRIVATE METHODS.
    // ---

    // Errors can occur for a variety of reasons. I normalize the error response so that
    // the calling context can assume a standard error structure.
    private normalizeError( error: any ): ErrorResponse {
        // NOTE: Since I'm not really dealing with a production API, this doesn't really
        // normalize anything (ie, this is not the focus of this demo).
        return({
            id: '-1',
            code: 'UnknownError',
            message: 'An unexpected error occurred.'
        });

    }
}
