Projeto Angular 19 Para um sistema de inscrição em eventos é possivel inscrições cortesias por evento.

Instruções para Utilizar o Sistema

instalar as dependências
npm install

configurar a conexão com o backend no environment

Atualize o environments para a url de conexão com o backand

url para o admin
http://localhost:4200/painel/login

senha padrão setada no backend 
usuario admin
senha 102030

ao cadastrar o evento o campo url é a url do evento, o sistema funciona por url ex:
ao cadastar um evento com a url "eventoteste" o acesso seria
http://localhost:4200/evento/inscricao/eventoteste, onde essa url é única.

o campo Link Página de Obrigado é o link que será redirecionado após fazer  inscrição a url completa.


a Inscrição do participante é feita pelo link com a url ex:
http://localhost:4200/evento/inscricao/eventoteste

para efetuar inscrições "cortesia" previamente no cadastro do evento tem que estar marcado a opçaõ cortesia e definido o número de cortesias permitidas para o evento.
a cortesia é cadastrada através do painel de admin, dentro do painel só é possível fazer a inscrição de um participante que já tenha cadastrado seus dados, o mesmo é feito na página principal do evento ao preencher um novo cpf, ao avançar ele já cadastra.

Url para o Backand em Php + Laravel 12 https://github.com/rmartinsilva/EventosInscricaoPhp