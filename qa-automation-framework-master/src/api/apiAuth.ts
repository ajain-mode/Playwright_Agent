import axios from "axios";

class ApiAuth {

    private authLogoChair: Record<string, string>;
    private authELOGISTEK : Record<string, string>;
    private authKPS: Record<string, string>;
    readonly authUrl: string;

    readonly user = {LogoChair: "LogoChair", ELOGISTEK: "ELOGISTEK", KPS: "KPS"};
    readonly customerName = {LogoChair: "Logo Chair", ELOGISTEK: "ELOGISTEK", KPS: "KPS Global"};

    constructor() {
         //@modified: Rohit Singh - 11-11-2025 OAuth2 Authentication Details
        this.authELOGISTEK = {
            grant_type: 'client_credentials',
            client_id: '5mvhrejijmjo0l9mhfst127j0e',
            client_secret: '15pk6qegoh9h7c9buroe067ll3a6ba8ub6eqtu3cj4nh7cqmkog9',
        }
        this.authLogoChair = {
            grant_type: 'client_credentials',
            client_id: '52925btp46hgp05rpn0qgeme71',
            client_secret: '14jcpdk4285h2g41ulkb8u9994grpsdqc8q77dgcmvm930tuauas',
        }
        this.authKPS = {
            grant_type: 'client_credentials',
            client_id: 'dpmj28v87j0upe68fc5ua2dl',
            client_secret: '5s0dapmhi1jh5gefc36ojaefgtftqn457ug4vnd4ctqrko923li',
        }
        this.authUrl = 'https://mode-api-nonprod.auth.us-east-1.amazoncognito.com/oauth2/token';
    }


    /**
     * @author : Rohit Singh
     * @created : 2025-11-11
     * Gets access token from OAuth2 server
     * @returns {Promise<string>} The access token
     * @param authUser - The authentication user details to be used for getting the access token.i.e. LogoChair or ELOGISTEK
     */
    public async getAccessToken(authUser: any): Promise<string> {
        if(authUser === 'LogoChair'){
            authUser = this.authLogoChair;
        } else if(authUser === 'ELOGISTEK'){
            authUser = this.authELOGISTEK;
        } else if(authUser === 'KPS'){
            authUser = this.authKPS;
        }
        else{
            throw new Error('Invalid auth user specified');
        }
        try {
            const response = await axios.post(this.authUrl, authUser, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            return response.data.access_token;
        } catch (error) {
            console.error('Failed to get access token:', error);
            throw error;
        }
    }


}
export const apiAuth = new ApiAuth();
export default apiAuth;