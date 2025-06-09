Projeto Front-end Angular para Inscrição em Evento ( Instancia-Angular )

Este projeto front-end, desenvolvido em Angular, tem como objetivo proporcionar uma experiência de inscrição intuitiva e eficiente para usuários interessados em participar de um evento específico. Ele consumirá uma API de backend para gerenciar os dados dos usuários, a busca por cadastros existentes e o processo de pagamento.

Funcionalidades do Sistema de Inscrição em Evento (Front-end Angular)

Acesso à Página do Evento: Ao acessar a página específica de um evento, o usuário visualiza o formulário de cadastro.

Busca de Cadastro por CPF: O campo CPF no formulário de cadastro é o único inicialmente habilitado. Ao digitar o CPF, o sistema consulta a API de backend para verificar se o usuário já possui um cadastro.

Preenchimento Automático (Usuário Existente): Se o CPF for encontrado na API, os demais campos do formulário são automaticamente preenchidos com os dados do usuário, permanecendo desabilitados para edição nesta etapa. Um botão de "Prosseguir para Inscrição" é apresentado.

Liberação de Campos para Novo Cadastro: Se o CPF não for encontrado, os demais campos do formulário são habilitados para que o usuário possa inserir suas informações de cadastro (nome, email, telefone, etc.). Um botão de "Cadastrar e Prosseguir" é apresentado.

Tela de Seleção de Pagamento: Após o cadastro (ou se o usuário já existia), o sistema navega para a tela de inscrição, onde o usuário pode escolher a forma de pagamento. As opções disponíveis são Pix, Cartão de Crédito e Cartão de Débito.

Geração de Código Pix: Ao selecionar a opção Pix, o front-end faz uma requisição para a API de backend, que retorna um código Pix (e possivelmente um QR Code) para o usuário efetuar o pagamento.

Formulário de Dados de Cartão: Ao selecionar Cartão de Crédito ou Cartão de Débito, o front-end exibe os campos necessários para o usuário inserir os dados do cartão (número, nome do titular, validade, código de segurança).

Confirmação de Inscrição Após Pagamento: Após o usuário realizar o pagamento (via Pix ou cartão), a API de backend notifica o front-end sobre a confirmação. O sistema então exibe uma tela de sucesso da inscrição para o usuário.

Você tem toda a razão! Para complementar o funcionamento do backend:

Retorno de Dados em JSON:

É fundamental ressaltar que toda a comunicação do backend com o frontend será feita através de respostas no formato JSON (JavaScript Object Notation).

Isso significa que:

Quando o frontend enviar dados para o backend (por exemplo, dados de cadastro, solicitação de inscrição, credenciais de login), ele fará isso através de requisições HTTP (POST, GET, PUT, DELETE).
O backend, ao processar essas requisições, formatará suas respostas (dados de usuários, informações de eventos, status de pagamento, tokens JWT, relatórios) como strings JSON.
O frontend, por sua vez, receberá essas strings JSON e as interpretará para exibir as informações ao usuário ou para continuar o fluxo da aplicação.
Essa padronização no formato JSON garante uma comunicação clara e eficiente entre o backend (PHP/Laravel) e qualquer aplicação frontend (como a nossa em Angular), permitindo que diferentes tecnologias interajam de forma consistente.


Essas são as funcionalidades principais que o front-end Angular irá implementar para o sistema de inscrição no evento, consumindo os serviços da API de backend para gerenciar os dados e o fluxo de pagamento.

