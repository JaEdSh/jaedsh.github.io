import { css, html, LitElement, styleMap, until } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class EmbeddedWorkflowStart extends LitElement {


    static get properties() {
        return {
            startRun: { type: Boolean },
            value: { type: String },
        }
      };
    

    static getMetaConfig() {
        // plugin contract information
        return {
            controlName: 'Start Workflow',
            fallbackDisableSubmit: false,
            description: 'Connects to the Nintex API to start a workflow',
            iconUrl: "one-line-text",
            groupName: 'Custom Controls',
            version: '1.4',
            //This holds all the parameters that are entered into the control.
            properties: {
                workflowID: {
                    type: 'string',
                    title: 'Workflow ID',
                    description: 'A GUID for the workflow definition.'
                },
                startRun: {
                    type: 'boolean',
                    title: 'Execute Event',
                    defaultValue: false,
                },
                targetAPIURL: {
                    type: 'string',
                    title: 'Nintex API workflow Endpoint Domain',
                    description: 'https://nintex.workflowcloud.com/'
                },
                targetAPIKey: {
                    type: 'string',
                    title: 'Nintex API Key',
                },
                value: {
                    type: 'string',
                    title: "Value",
                    maxLength: 255,
                    isValueField: true
                },
            },
            //Triggers an event that the Nintex form can handle
            events: ["ntx-value-change"],
            standardProperties: {
                readOnly: true,
                description: true,
            }
        };
    }
    //Only start the API request if the startRun (Execute Event on the form) has been set to true
    updated(changedProperties) {
        console.log('changedProperties: ' + changedProperties.toString());
        if (changedProperties.has('startRun')) {
            //Only runs if form control is true
            if (this.startRun != null) {
                if (this.startRun == true) {
                    this.value = crypto.randomUUID();
                    this.load();
                }
            }
        }
    }

    onChange() {
        if (this.startRun != null) {
            const args = {
                bubbles: true,
                cancelable: false,
                composed: true,
                detail: this.value,
            };
            const event = new CustomEvent('ntx-value-change', args);
            this.dispatchEvent(event);
        }
    }

    async load() {
        //Create the body for starting the workflow

        const submitBody = {
            "startData": {
                "se_recordguid": this.value.toString(),
            }
        }

        console.log('submitBody: ' + submitBody);
        //Start the workflow
        console.log('URL: ' + this.targetAPIURL + 'api/v1/workflow/published/' + this.workflowID + '/instances?token=' + this.targetAPIKey);
        const submit = await fetch(this.targetAPIURL + 'api/v1/workflow/published/' + this.workflowID + '/instances?token=' + this.targetAPIKey,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitBody)
            });
        //Wait for api response
        console.log("Pre-submit");
        const jsonSubmit = await submit.text();
        console.log('jsonSubmit: ' + jsonSubmit.toString());
        this.waitForComplete(jsonSubmit);
    }

    async waitForComplete (instanceId, intervalMS = 1000, maxAttempts = 60) {
        let authToken;
        try {
            authToken = await this.getPluginAuth();
        }
        catch (err) {
            console.error("Error calling auth service:", err);
        }
        let attempts = 0;
        console.log(instanceId);
        console.log(authToken);
        if (authToken == null) { 
            console.log("Token empty"); 
            return ("fail");
        }
        else { console.log("Token retrieved"); }
        const checkStatus = new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
            attempts++;

            try {
                const response = await fetch('https://us.nintex.io/' + 'workflows/v2/instances/' + instanceId,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + authToken,
                            'Content-Type': 'application/json'
                    },
                });
                const data = await response.json();

                console.log(`Attempt ${attempts}:`, data);

                // Adjust path to the actual value in your response
                if (data?.status === 'Completed') {
                    clearInterval(interval);
                    return resolve(true);
                }

                else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    throw new Error("Workflow failed. Too many attempts");
                }
            } catch (err) {
                console.error("Error calling service:", err);
            }
            }, intervalMS);
        });
        checkStatus.then((result) => {
            console.log("Success");
            this.onChange();
        })
        .catch((error) => {
            console.log("Failed to complete.")
        });
    }
    
    async getPluginAuth () {
        const authBody = {
            "client_id": "14185b26-a7eb-4878-a18b-1555f73d7529",
            "client_secret": "tRsQJNIKIM2DsIPtRS2NtR2HtSsJKOPRQMtWVsMtRsPtPsRtVsJRtUsPJPFJ2StTsFMRNMFtSsItRsR2KtRVSsL2CsPtWsK2X",
            "grant_type": "client_credentials"
        }

        console.log('authBody' + authBody);
        //Start the workflow
        const authSubmit = await fetch('https://us.nintex.io/' + 'authentication/v1/token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(authBody)
            });
        //Wait for api response
        const authJson = await authSubmit.json();
        console.log('authJson' + authJson.access_token);
        return authJson.access_token;
    }
    constructor() {
        super();
    }



    // Render the UI as a function of component state
    render() {
        return html`<p id="textfield">${this.value}</p>`
    }
}

// registering the web component.
const elementName = 'start-component-workflow';
customElements.define(elementName, EmbeddedWorkflowStart);