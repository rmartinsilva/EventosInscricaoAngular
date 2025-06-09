import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  /**
   * Formata as mensagens de erro recebidas do backend.
   * @param errorResponse O objeto de erro da resposta HTTP.
   * @param defaultMessage Uma mensagem padrão caso nenhuma mensagem específica seja encontrada.
   * @returns Uma string formatada com as mensagens de erro.
   */
  public formatErrorMessages(errorResponse: any, defaultMessage: string = 'Ocorreu um erro inesperado.'): string {
    let completeHtml = '';

    if (errorResponse && errorResponse.error) {
      const errorData = errorResponse.error;
      let mainMessageText = '';
      let fieldErrorsList: string[] = [];

      if (errorData.message) {
        mainMessageText = this.stripHtmlTags(errorData.message); // Limpa tags do backend
      }

      if (errorData.errors && typeof errorData.errors === 'object' && Object.keys(errorData.errors).length > 0) {
        for (const field in errorData.errors) {
          if (errorData.errors.hasOwnProperty(field) && Array.isArray(errorData.errors[field])) {
            errorData.errors[field].forEach((errMsg: string) => {
              // Limpa tags do backend do erro específico do campo e escapa o conteúdo para segurança
              fieldErrorsList.push(`<li>${this.escapeHtml(field)}: ${this.escapeHtml(this.stripHtmlTags(errMsg))}</li>`);
            });
          }
        }
      }

      if (mainMessageText) {
        // Escapa a mensagem principal para segurança antes de envolvê-la em <p>
        completeHtml += `<p>${this.escapeHtml(mainMessageText)}</p>`;
      }

      if (fieldErrorsList.length > 0) {
        // Não é preciso <br> entre <p> e <ul> pois são elementos de bloco.
        completeHtml += `<ul>${fieldErrorsList.join('')}</ul>`;
      }
      
      if (completeHtml) {
        return completeHtml;
      }

    } else if (errorResponse && errorResponse.message) {
      // Limpa e escapa a mensagem de erro simples
      return `<p>${this.escapeHtml(this.stripHtmlTags(errorResponse.message))}</p>`;
    }
    
    // Escapa a mensagem padrão
    return `<p>${this.escapeHtml(defaultMessage)}</p>`;
  }

  private stripHtmlTags(htmlString: string): string {
    if (typeof htmlString !== 'string') return '';
    try {
      const doc = new DOMParser().parseFromString(htmlString, 'text/html');
      return doc.body.textContent || "";
    } catch (e) {
      return htmlString; 
    }
  }

  private escapeHtml(unsafe: string): string {
    if (typeof unsafe !== 'string') {
      return '';
    }
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }
} 