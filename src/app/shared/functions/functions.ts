import { DOCUMENT } from "@angular/common"
import { Inject, Injectable } from "@angular/core"

@Injectable({
    providedIn: 'root'
})

export class functionsUsinaWeb {

    constructor(@Inject(DOCUMENT) private readonly document: Document) {
    }


    addScript(scriptSrc: string) {
        const script = this.document.createElement('script');
        script.type = 'text/javascript';
        script.src = scriptSrc;
        script.async = true;
        this.document.body.appendChild(script);
    }

    addStyle(stylesSrc: string) {
        const style = this.document.createElement('link');
        style.rel = 'stylesheet';
        style.href = stylesSrc;
        this.document.head.appendChild(style);
    }


    addScriptInCode(scriptCode: string) {

        let script = this.document.createElement('script');
        script.type = `text/javascript`;
        script.text = scriptCode;
        /*
        script.text = `
        {
            <!--
        $(document).ready(function ($) {
        alert('a');
        $("input:text").setMask();
        //$('input:text').setMask({selectCharsOnFocus: false});
    });
    //-->
        }
    `;
        */


        this.document.body.appendChild(script);

    }


}
