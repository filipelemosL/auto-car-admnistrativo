# AutoCar - Checklist Auditado da Jornada do Cliente e Documentos

Este arquivo orienta e audita a implementacao da Jornada do Cliente e da geracao de documentos na stack atual: React/Vite no frontend, FastAPI/Python no backend e Supabase/PostgreSQL. As instrucoes originais citavam Node.js/Docxtemplater; nesta base, a implementacao foi adaptada para Python/FastAPI.

Legenda:

- FEITO: implementado e validado no codigo.
- PARCIAL: existe estrutura, tela ou API, mas ainda falta conexao, persistencia completa, teste E2E ou acabamento de producao.
- PENDENTE: ainda nao implementado.

## Decisoes Confirmadas

- FEITO - A Jornada do Cliente e uma entidade nova no backend (`service_orders`) conectando cliente, veiculo, diagnostico, orcamento, checklist, notificacao, pagamento e conclusao.
- FEITO - Os arquivos em `frontend/public/assets/files` sao referencia visual/operacional e tambem sao usados como templates de geracao DOCX.
- FEITO - A geracao `.docx` foi implementada no backend Python/FastAPI, sem servico Node.js separado.
- FEITO - NF-e esta como documento interno e preparada para futura integracao fiscal.
- FEITO - WhatsApp usa URL `https://wa.me/55NUMERO?text=...`, sem envio automatico.

## Jornada do Cliente

- FEITO - Criar entidade de Jornada/Ordem de Servico no backend, vinculada a cliente e veiculo. Arquivos: `backend/app/schemas/service_orders.py`, `backend/app/services/service_orders.py`, `backend/app/routers/service_orders.py`, `supabase/schema.sql`.
- PARCIAL - Etapa 1: selecao de cliente ao iniciar atendimento. Renderiza na tela em `CustomerJourneyWorkspace`; ainda nao grava a selecao via chamada real ao backend.
- PARCIAL - Etapa 1.1: cadastro de cliente caso ele ainda nao exista. Campos renderizam na tela; falta conectar o botao ao endpoint `POST /api/clients`.
- PARCIAL - Ao finalizar cadastro, selecionar automaticamente o cliente recem-criado. Fluxo previsto visualmente; falta implementacao da chamada e atualizacao de estado.
- PARCIAL - Etapa 2: modulo de queixa e diagnostico. Renderiza na tela e existe endpoint `POST /api/service-orders/{order_id}/diagnosis`; falta conectar formulario frontend ao backend.
- PARCIAL - Registrar queixas relatadas pelo cliente. Backend suporta; frontend renderiza; falta submit real.
- PARCIAL - Registrar diagnosticos do mecanico, ferramenta usada, DTCs e conclusao. Backend suporta; frontend renderiza; falta submit real.
- PARCIAL - Permitir exportacao de queixa/diagnostico para impressao ou WhatsApp. Botao/estrutura renderiza; falta endpoint dedicado de diagnostico ou reaproveitamento formal do relatorio.
- PARCIAL - Etapa 3: modulo de orcamento vinculado a jornada. Backend suporta `approve-budget`; frontend renderiza; falta conexao real do botao.
- PARCIAL - Criar orcamento usando cliente, veiculo, queixas e diagnosticos. Backend cria orcamento ao aprovar se necessario; falta formulario frontend completo.
- PARCIAL - Permitir anexar imagens ao orcamento. Botao renderiza; ainda nao ha persistencia/anexo conectado.
- PARCIAL - Permitir aprovar orcamento. Endpoint `POST /api/service-orders/{order_id}/approve-budget` existe; botao frontend ainda e visual.
- FEITO - Etapa 4: modulo de servicos. Existe como etapa da Jornada e em `service_orders`.
- FEITO - Ao aprovar o orcamento, transformar itens aprovados em checklist de servico. Implementado em `ServiceOrderService.approve_budget`.
- PARCIAL - Cada checklist deve ter status, descricao e anexos/fotos. Backend suporta status/notas/imagens; frontend renderiza status; falta upload/anexo real.
- PARCIAL - Permitir adicionar servico extra durante a execucao. Endpoint `POST /api/service-orders/{order_id}/extra-service` existe; frontend tem botao visual que retorna ao orcamento.
- FEITO - Ao adicionar servico extra, retornar ao orcamento para aprovar novos itens. Backend altera etapa para `budget`.
- FEITO - Ao voltar para servicos, manter status dos checklists ja executados. Backend preserva tarefas existentes ao mesclar itens.
- PARCIAL - Etapa 5: notificacao de servico pronto. Backend gera `ready-whatsapp`; frontend renderiza mensagem e link.
- FEITO - Gerar mensagem estruturada de WhatsApp com todas as etapas executadas. Backend e frontend possuem montagem por URL.
- PARCIAL - Etapa 6: financeiro. Backend cria lancamento no pagamento; frontend renderiza formulario visual.
- PARCIAL - Escolher emissao de recibo ou nota fiscal. Backend aceita `document_type`; frontend renderiza select; fiscal real fica disabled.
- PARCIAL - Registrar se foi pago, forma de pagamento e valor pago. Backend suporta; frontend ainda nao envia POST real.
- FEITO - Ao registrar pagamento, concluir a jornada. Implementado em `ServiceOrderService.complete_payment`.
- FEITO - Jornada concluida nao deve aparecer mais na lista de servicos ativos. Backend filtra por padrao e frontend filtra `completed/Concluida`.

## Modulo Clientes

- PARCIAL - Permitir cadastro de cliente. Backend CRUD existe; frontend renderiza campos em Clientes/Jornada, mas nao conecta submit ao backend.
- PARCIAL - Permitir visualizacao de clientes em tabela. Existe visualizacao em cards/lista no admin panel; ainda nao e tabela formal.
- PARCIAL - Adicionar botao para abrir modal/lista com todos os servicos executados do cliente. Implementado como modal inline no frontend usando jornadas do snapshot; precisa completar historico com jornadas concluidas quando houver dados reais.
- PARCIAL - Vincular historico do cliente com jornadas concluidas, orcamentos, relatorios e financeiro. Endpoint `/api/clients/{client_id}/transparency` existe; frontend ainda nao consome esse endpoint no modal.

## Modulo Orcamentos

- PARCIAL - Tela inicial deve permitir escolher entre cliente cadastrado, orcamento predefinido ou visualizacao de todos os orcamentos. Backend de presets existe; frontend ainda nao tem tela inicial tripla completa.
- PARCIAL - Ao selecionar cliente, preencher contexto do orcamento. Renderiza com primeiro cliente; falta selecao controlada e persistencia.
- PARCIAL - Permitir anexar imagens. Botao renderiza; falta backend/storage para orcamento.
- FEITO - Permitir salvar cada linha como predefinicao. Backend possui `POST /api/budgets/presets`; falta conectar botao frontend.
- PARCIAL - Criar modal de predefinicoes com botao `+` para adicionar item ao orcamento. Backend e mock prontos; modal frontend ainda pendente.
- FEITO - Exportar para impressao/download `.docx`. Frontend aponta para `/api/documents/orcamento/{id}/download`; backend retorna DOCX.
- FEITO - Exportar para WhatsApp via URL com contato cadastrado. Frontend monta `wa.me`; backend tambem gera WhatsApp para jornada pronta.
- FEITO - Preparar payload seguindo placeholders de `template_orcamento.docx`. Implementado em `DocumentService.build_budget_payload`.

## Modulo Financeiro

- FEITO - Registrar entradas e saidas. CRUD de `finance_entries` existe.
- FEITO - Gerenciar reserva de emergencia. Endpoint `/api/company/emergency-reserve` existe.
- FEITO - Calcular reserva ideal como custo fixo medio x 6. Implementado em `CompanyService.get_emergency_reserve_plan`.
- FEITO - Calcular aporte mensal para construir reserva em 3, 6 e 12 meses. Implementado no mesmo endpoint.
- FEITO - Cadastrar custos fixos com vencimento, recorrencia e alerta ativavel/desativavel. Backend e schema existem; frontend ainda nao tem formulario dedicado.
- PENDENTE - Gerar alertas de custos fixos 7 dias, 3 dias e 1 dia antes do vencimento. Estrutura de custos existe; geracao automatica dos lembretes ainda nao foi implementada.
- PARCIAL - Mostrar resumo por semana, mes, trimestre, semestre e periodo personalizado. Backend tem mensal/trimestral/anual e historico; semana/semestre/personalizado ainda pendentes.
- PARCIAL - Preparar estrutura para grafico e metas. UI ainda nao possui grafico/metas reais; dados financeiros existem.
- PARCIAL - Criar aba de configuracao de nota fiscal inicialmente desabilitada. Configuracao fiscal existe em `company_settings`; UI indica provedor fiscal desabilitado na Jornada.

## Modulo Alertas

- PARCIAL - Criar alertas para clientes. CRUD de lembretes existe; falta diferenciar tipo de alerta e UI completa.
- PARCIAL - Criar notificacoes administrativas. Pode ser representado por lembretes, mas falta campo tipo e UI dedicada.
- PENDENTE - Criar notificacoes automaticas de vencimento de custos fixos.
- PENDENTE - Alertas de vencimento devem disparar 7 dias, 3 dias e 1 dia antes.

## Configuracoes da Empresa

- FEITO - Criar botao pequeno no canto inferior esquerdo. Implementado em `SettingsDock`.
- FEITO - Exibir status conectado ao servidor / servidor fora do ar. Implementado no frontend com `dataMode` e `error`.
- PARCIAL - Permitir cadastro de dados da empresa. Backend `GET/PUT /api/company/settings` existe; frontend renderiza campos, mas nao salva ainda.
- FEITO - Dados necessarios: nome fantasia, razao social, CNPJ, telefone, email, endereco, cidade/UF, CEP, responsavel tecnico e dados fiscais futuros. Schema/backend existem.
- PARCIAL - Usar esses dados na geracao de documentos e futuros cruzamentos com servicos. DOCX de NF/orcamento usa alguns dados; cruzamentos completos ainda pendentes.

## Geracao de Documentos DOCX

- FEITO - Criar engine Python para renderizar templates `.docx` em memoria. Arquivo: `backend/app/templates/docx_renderer.py`.
- FEITO - Suportar placeholders simples no formato `{campo}`.
- FEITO - Suportar loops no formato `{#array}...{/array}`.
- PARCIAL - `template_nfe.docx`: gerar payload com dados de destinatario, veiculo, itens, totais, pagamento e observacoes. Payload existe; destinatario/veiculo ficam parciais ate cadastro fiscal completo.
- FEITO - `template_orcamento.docx`: gerar payload com cliente, veiculo, diagnostico, servicos, pecas, totais e aprovacao.
- FEITO - `template_relatorio.docx`: gerar payload com OS, tecnico, queixa, diagnostico, servicos executados, pecas, testes, fotos e recomendacoes.
- FEITO - Retornar `.docx` com `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- FEITO - Retornar `Content-Disposition` com nomes como `autocar_orcamento_000042.docx`.
- FEITO - `GET /api/documents/nfe/{nfe_id}/download`.
- FEITO - `GET /api/documents/orcamento/{orcamento_id}/download`.
- FEITO - `GET /api/documents/relatorio/{relatorio_id}/download`.
- FEITO - Preparar os documentos para futura integracao fiscal, sem depender de provedor nesta fase.

## Banco de Dados

- FEITO - Criar tabela de jornadas/ordens de servico.
- FEITO - Criar estrutura para queixas e diagnosticos.
- FEITO - Criar estrutura para checklists de servico derivados do orcamento.
- FEITO - Criar estrutura para predefinicoes de orcamento.
- FEITO - Criar estrutura para custos fixos.
- FEITO - Criar estrutura para reserva de emergencia. A reserva e calculada por endpoint, nao tabela propria.
- FEITO - Criar estrutura para configuracoes da empresa.
- PARCIAL - Criar estrutura para documentos emitidos ou payloads de documentos. Endpoints geram DOCX sob demanda; falta tabela de auditoria de documentos emitidos.
- FEITO - Manter compatibilidade com mock mode e Supabase.

## Testes e Validacao

- PARCIAL - Testar renderizacao DOCX dos tres templates com payloads completos. Smoke test cobre geracao real; falta suite automatizada permanente.
- FEITO - Verificar que o buffer gerado comeca com assinatura ZIP `PK\x03\x04`.
- PARCIAL - Verificar loops com arrays vazios. Engine suporta; falta teste automatizado dedicado.
- FEITO - Testar endpoints de download por smoke test.
- FEITO - Testar criacao e conclusao de jornada por servico/backend em smoke test planejado; precisa virar teste automatizado permanente.
- FEITO - Testar que jornada concluida sai dos servicos ativos no backend/frontend por filtro.
- FEITO - Rodar `backend/.venv/Scripts/python.exe -m compileall app`.
- FEITO - Rodar smoke tests com `TestClient`.
- FEITO - Rodar `npm run build` no frontend.

## Preparacao Para Producao

- PENDENTE - Definir ambiente Supabase definitivo e aplicar `supabase/schema.sql`.
- PENDENTE - Criar autenticacao simples por senha numerica no frontend, sem implementar ainda.
- PENDENTE - Migrar os formularios visuais para chamadas reais ao backend.
- PENDENTE - Criar configuracao de variaveis `AUTOCAR_*` e `VITE_*` para nuvem.
- PENDENTE - Configurar CORS para dominio final.
- PENDENTE - Criar testes automatizados permanentes para documentos, jornada e financeiro.
- PENDENTE - Criar auditoria de documentos emitidos.
- PENDENTE - Criar rotina de backup do Supabase.
- PENDENTE - Criar deploy backend e frontend em ambiente cloud.
- PENDENTE - Adicionar monitoramento basico de erro e disponibilidade.
