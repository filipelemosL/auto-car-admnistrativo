import { expect, test } from "@playwright/test";

test.describe.serial("AutoCar Admin fluxo operacional", () => {
  let e2eClientName = "";
  let e2eVehiclePlate = "";

  test("abre os modulos principais e o dock de configuracoes", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/Orcamentos realizados/i)).toBeVisible();

    await page.getByRole("button", { name: "Abrir clientes" }).click();
    await expect(page.getByRole("button", { name: /Servicos executados/i }).first()).toBeVisible();

    await page.getByRole("button", { name: "Abrir orcamentos" }).click();
    await expect(page.getByText(/Orcamentos realizados/i)).toBeVisible();

    await page.getByRole("button", { name: "Abrir financeiro" }).click();
    await expect(page.getByLabel("Documento")).toBeVisible();

    await page.getByRole("button", { name: "Abrir alertas" }).click();
    await expect(page.getByRole("textbox", { name: "Cliente" })).toBeVisible();

    await page.getByRole("button", { name: "Configuracoes" }).click();
    await expect(page.getByText(/Conectado ao servidor|Servidor fora do ar/i)).toBeVisible();
    await page.getByRole("button", { name: /Resumo da última atualização/i }).click();
    await expect(page.getByRole("dialog", { name: /Resumo da última atualização/i })).toBeVisible();
    await page.getByRole("button", { name: /Fechar resumo da atualização/i }).click();
    await expect(page.getByRole("dialog", { name: /Resumo da última atualização/i })).toHaveCount(0);
  });

  test("cadastra cliente local, cria jornada e percorre as etapas principais", async ({ page }) => {
    const suffix = Date.now();
    const clientName = `Cliente E2E ${suffix}`;
    const uniquePlate = `T${suffix.toString(36).slice(-6).toUpperCase()}`;
    e2eClientName = clientName;
    e2eVehiclePlate = uniquePlate;

    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar atendimento" }).click();
    await expect(page.getByText(/Jornada do cliente/i)).toBeVisible();

    await expect(page.getByRole("button", { name: /Selecionar cliente/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cadastrar novo cliente/i })).toBeVisible();
    await page.getByRole("button", { name: /Cadastrar novo cliente/i }).first().click();

    await page.getByLabel("Novo cliente").fill(clientName);
    await page.getByLabel("WhatsApp").fill("(11) 95555-1212");
    await page.getByLabel("CPF / CNPJ").fill("123.456.789-10");
    await page.getByLabel("Email").fill(`cliente${suffix}@example.com`);
    await page.getByLabel("Cidade").fill("Sao Paulo");
    await expect(page.getByLabel("Marca")).toBeEnabled();
    await page.getByLabel("Marca").fill("Ford");
    await page.getByLabel("Ano").selectOption("2022-3");
    await page.getByLabel("Modelo").fill("Ranger XLS 2.2 4x2 CD Diesel Aut.");
    await page.getByLabel("Cor").fill("Preto");
    await page.getByLabel("Placa").fill(uniquePlate);
    await page.getByRole("button", { name: /Adicionar mais um veiculo/i }).click();
    await expect(page.getByText(/Veiculo 2/i)).toBeVisible();

    await page.getByRole("button", { name: /Cadastrar e avancar/i }).click();
    await expect(page.getByText(/Queixa e diagnostico/i)).toBeVisible();

    await page.getByLabel("Queixa do cliente").fill("Cliente relata barulho ao frear.");
    await page.getByRole("textbox", { name: /Diagn.stico do mec.nico/i }).fill("Pastilhas com desgaste e disco com vibracao.");
    await page.getByLabel("Ferramenta usada").fill("Teste de rua + inspecao visual");
    await page.getByLabel("DTC / codigo de falha").fill("Nenhum DTC");
    await page.getByRole("button", { name: /Criar novo servi.o/i }).click();
    await page.getByLabel(/Nome do servi.o/i).fill("Troca de pastilhas dianteiras");
    await page.getByRole("button", { name: /Adicionar servi.o/i }).click();
    await expect(page.getByLabel("Servicos do diagnostico").getByText(/Troca de pastilhas dianteiras/i)).toBeVisible();
    await page.getByRole("button", { name: /Avancar para proxima etapa/i }).click();
    await expect(page.getByText(/Orcamento da jornada/i)).toBeVisible();
    await expect(page.getByText(/Troca de pastilhas dianteiras/i)).toBeVisible();

    await page.getByRole("button", { name: /Adicionar/i }).first().click();
    await page.getByLabel("Tipo de item do orcamento").selectOption("labor");
    await page.getByLabel("Valor da mao de obra").fill("180,50");
    await page.getByRole("button", { name: /Adicionar item ao orcamento/i }).click();
    await expect(page.getByText(/180,50/i).first()).toBeVisible();

    await page.getByRole("button", { name: /Adicionar/i }).first().click();
    await page.getByLabel("Tipo de item do orcamento").selectOption("part");
    await page.getByLabel(/Nome da pe.a/i).fill("Pastilha dianteira premium");
    await page.getByLabel(/Valor da pe.a/i).fill("R$ 320,00");
    await page.getByRole("button", { name: /Adicionar item ao orcamento/i }).click();
    await expect(page.getByText(/Pastilha dianteira premium/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /WhatsApp/i })).toHaveAttribute("href", /https:\/\/wa\.me\/55.+text=/);
    await expect(page.getByRole("link", { name: /Imprimir orcamento/i })).toHaveAttribute("href", /autocar_orcamento\.docx|\/documents\/orcamento\//);

    await page.getByRole("button", { name: /Orcamento aprovado/i }).click();
    await expect(page.getByText(/Checklist de servicos/i)).toBeVisible();

    await page.getByLabel(/Status do servico/i).first().selectOption("Em andamento");
    await page.getByLabel(/Comentarios do servico/i).first().fill("Servico iniciado, aguardando conferencia final.");
    await page.getByLabel(/Foto do servico/i).first().fill("foto-pastilha-dianteira.jpg");
    await page.getByRole("button", { name: /Adicionar foto/i }).first().click();
    await expect(page.getByText(/foto-pastilha-dianteira\.jpg/i)).toBeVisible();

    await page.getByRole("button", { name: /Avancar para pagamento/i }).click();
    await expect(page.getByText(/servicos ainda nao concluidos/i)).toBeVisible();
    await page.getByRole("button", { name: /Sim, continuar/i }).click();
    await expect(page.getByText(/Pagamento da jornada/i)).toBeVisible();
    await page.getByLabel("Documento").selectOption("NF");
    await page.getByLabel(/M.todo de pagamento/i).selectOption("PIX");
    await page.getByLabel("Valor pago").fill("R$ 123,00");
    await page.getByRole("button", { name: /Concluir servico/i }).click();
    await expect(page.getByRole("button", { name: new RegExp(`Abrir servico ativo ${clientName}`) })).toHaveCount(0);
  });

  test("seleciona cliente existente pesquisando por placa e veiculo", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Iniciar atendimento" }).click();
    await page.getByRole("button", { name: /Selecionar cliente/i }).click();

    test.skip(!e2eClientName || !e2eVehiclePlate, "Cliente E2E anterior nao foi criado.");

    await page.getByLabel("Buscar cliente").fill(e2eVehiclePlate);
    const clientTable = page.getByLabel("Tabela de clientes");
    await expect(clientTable.getByText(new RegExp(e2eClientName))).toBeVisible();
    await clientTable.getByRole("button", { name: new RegExp(e2eVehiclePlate) }).click();
    await page.getByRole("button", { name: /Selecionar e avancar/i }).click();

    await expect(page.getByText(/Queixa e diagnostico/i)).toBeVisible();
  });

  test("abre um servico ativo pela lista e mostra sua etapa atual", async ({ page }) => {
    await page.goto("/");

    const activeService = page.getByRole("button", { name: /Abrir servico ativo/i }).first();
    await expect(activeService).toBeVisible();
    await activeService.click();

    await expect(page.getByText(/Jornada do cliente/i)).toBeVisible();
    await expect(page.getByText(/Checklist de servicos|Queixa e diagnostico|Orcamento da jornada|Pagamento da jornada/i)).toBeVisible();
  });
});
