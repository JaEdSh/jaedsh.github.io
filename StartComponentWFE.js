import { css, html, LitElement, styleMap, until } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class EmbeddedWorkflowStart extends LitElement {


    static get properties() {
        return {
            startRun: { type: Boolean },
            targetGuid: { type: String },
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
                targetGuid: {
                    type: 'string',
                    title: "The guid to set for the new record",
                },
            },
            //Triggers an event that the Nintex form can handle
            events: ["ntx-value-change"]

        };
    }
    //Only start the API request if the startRun (Execute Event on the form) has been set to true
    updated(changedProperties) {
        if (changedProperties.has('startRun')) {
            console.log(changedProperties);
            //Only runs if form control is true
            if (this.startRun != null) {
                if (this.startRun == true) {
                   // this.targetGuid = crypto.randomUUID();
                    this.load();
                }
            }
        }
    }

    onChange(inputE) {
        if (this.startRun != null) {
            const args = {
                bubbles: true,
                cancelable: false,
                composed: true,
                detail: inputE,
            };
            const event = new CustomEvent('ntx-value-change', args);
            this.dispatchEvent(event);
        }
    }

    async load() {
        //Create the body for starting the workflow

        const submitBody = {
            "startData": {
                "se_recordguid": this.targetGuid,
            }
        }

        console.log(submitBody);
        //Start the workflow
        const submit = await fetch(this.targetAPIURL + this.workflowID + '/instances?token=' + this.targetAPIKey,
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
        this.onChange(jsonSubmit.id);
    }

    constructor() {
        super();
    }



    // Render the UI as a function of component state
    render() {
        return html`<p id="startComponentControl">${this.targetGuid}</p>`
    }
}

// registering the web component.
const elementName = 'start-component-workflow';
customElements.define(elementName, EmbeddedWorkflowStart);