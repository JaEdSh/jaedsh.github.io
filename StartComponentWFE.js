import { css, html, LitElement, styleMap, until } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class EmbeddedWorkflowStart extends LitElement {


    static get properties() {
        return {
            startRun: { type: Boolean },
            value: { type: String }
          };
    }

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
                    title: 'Workflow ID'
                },
                startRun: {
                    type: 'boolean',
                    title: 'Execute Event',
                    defaultValue: false,
                },
                targetAPIURL: {
                    type: 'string',
                    title: 'Nintex API workflow Endpoint URL',
                },
                targetAPIKey: {
                    type: 'string',
                    title: 'Nintex API Key',
                },
                value: {
                    type: 'string',
                    title: "Value",
                    maxLength: 255,
                    IsValueField: true
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
        if (changedProperties.has('startRun')) {
            console.log(changedProperties);
            //Only runs if form control is true
            if (this.startRun != null) {
                if (this.startRun == true) {
                    //this.value = crypto.randomUUID();
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
                "se_recordguid": this.value,
            }
        }

        console.log(submitBody);
        //Start the workflow
        console.log(this.targetAPIURL + 'api/v1/workflow/published/' + this.workflowID + '/instances?token=' + this.targetAPIKey);
        const submit = await fetch(this.targetAPIURL + 'api/v1/workflow/published/' + this.workflowID + '/instances?token=' + this.targetAPIKey,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitBody)
            });
        //Wait for api response
        const jsonSubmit = await submit.json();
        console.log(jsonSubmit);
        this.waitForComplete(jsonSubmit.id);
    }

    async waitForComplete (instanceId, intervalMS = 100, maxAttempts = 20) {
        var authToken = this.getPluginAuth();
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
            attempts++;

            try {
                const response = await fetch(this.targetAPIURL + 'workflows/v2/instances/' + instanceId,
                    {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(submitBody)
                });
                const data = await response.json();

                console.log(`Attempt ${attempts}:`, data);

                // Adjust path to the actual value in your response
                if (data?.status === 'Completed') {
                    clearInterval(interval);
                    return resolve(true);
                }

                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    return reject(false);
                }
            } catch (err) {
                console.error("Error calling service:", err);
            }
            }, intervalMS);
        });
    }
    
    async getPluginAuth () {
        const authBody = {
            "client_id": "14185b26-a7eb-4878-a18b-1555f73d7529",
            "client_secret": "tRsQJNIKIM2DsIPtRS2NtR2HtSsJKOPRQMtWVsMtRsPtPsRtVsJRtUsPJPFJ2StTsFMRNMFtSsItRsR2KtRVSsL2CsPtWsK2X",
            "grant_type": "client_credentials"
        }

        console.log(submitBody);
        //Start the workflow
        const authSubmit = await fetch(this.targetAPIURL + 'authentication/v1/token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(authBody)
            });
        //Wait for api response
        const authJson = await authSubmit.json();
        console.log(authJson);
        return authJson.access_token;
    }
    constructor() {
        super();
    }



    // Render the UI as a function of component state
    render() {
        return html`<mwc-textfield id="textfield">${this.value}</mwc-textfield>`
    }
}

// registering the web component.
const elementName = 'start-component-workflow';
customElements.define(elementName, EmbeddedWorkflowStart);