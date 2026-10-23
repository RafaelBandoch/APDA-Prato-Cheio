# Análise geral dos diagramas

Análise das versões finais do [diagrama de estados](estados-doacao.md) e do [diagrama de sequência](sequencia-aceite.md),
comparadas com o código, com a `analise.md` e com os testes.

## O que está bom

- Os dois tipos se completam: o de estados mostra o que pode acontecer com uma doação, e o de sequência mostra
  em que ordem o sistema decide um aceite.
- As versões finais batem com o código: mesmos estados, mesmos erros, mesma ordem de validação.
- O diagrama de estados separa o que já existe do que ainda é plano (retirada e volta para a listagem).
- Revisar o diagrama de sequência revelou um bug real: dava para aceitar doação vencida. Isso foi corrigido no PR #13.

## O que ainda falta

1. **Aceitar não é retirar.** A HU03 diz que o *horário de retirada* precisa estar dentro da janela. O código e os
   diagramas verificam o *horário do aceite*. É preciso decidir qual dos dois vale.
2. **Doação que ninguém consegue aceitar.** Dá para publicar uma doação com a janela de coleta já encerrada. Ela
   aparece como disponível, mas todo aceite é recusado. O diagrama de estados não mostra esse caso.
3. **Falta o aviso ao doador.** A Regra 1 pede que o doador seja avisado quando a doação expira. Isso não aparece em
   nenhum diagrama e, no código, só funciona no navegador em que a doação foi publicada.
4. **A documentação se repete.** Os arquivos de crítica repetem o que já está nos diagramas e já divergem deles.
   O `critica-sequencia.md` ainda fala de um SVG que foi trocado por Markdown. O diagrama de sequência também não diz
   qual IA foi usada nem qual foi o prompt.

## Conclusão

Os diagramas descrevem bem o sistema, mas foram usados mais para concordar com o código do que para questioná-lo.
Quando questionaram, acharam problemas importantes, como o aceite de doação vencida. Os itens 1 a 3 acima seguem a
mesma linha e são os que valem levar para a próxima iteração.

## Uso de IA

IA usada para auxiliar na procura por possíveis defeitos.
