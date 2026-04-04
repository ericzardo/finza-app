# 📔 Diário de Regras: O Coração das Transações

## 1. O Caixa de Próposito (Bucket) manda em tudo
Não importa se você usou dinheiro vivo, pix ou cartão:
se o gasto aconteceu, ele tem que sair de um Propósito.

- A regra: Toda vez que você registra um gasto, o Caixa escolhido (ex: Custo de Vida) diminui na hora.
- O porquê: Pra você não se enganar achando que ainda tem dinheiro pra gastar só porque a fatura do cartão ainda não venceu.


## 2. O Inbox é a "Sala de Espera"
Se você estiver com pressa e só lançar o valor sem dizer pra qual caixa ele vai, pode dar erros contábeis.

- A regra: Sem destino? Vai direto para o Caixa de Entrada (Inbox).
- O porquê: É melhor o dinheiro estar "preso" na entrada do que sumir do radar. Depois, com calma, você dá um destino pra ele.

## 3. Cartão de Crédito vs. Conta Bancária

Aqui é onde o sistema separa os homens dos meninos.

- No Cartão: O gasto abate o limite do cartão e diminui o saldo do Caixa, mas o saldo da sua conta no banco continua igual até você pagar a fatura.
- Na Conta (Débito/Pix): O saldo do banco e o saldo do Caxa diminuem juntos, no mesmo segundo.

## 4. O "Paguei" (is_paid)

- A regra: Se o botão "Pago" não estiver marcado, a transação é só um fantasma. Ela aparece como "Pendentes" pra te lembrar que aquilo vai acontecer, mas não mexe nos seus saldos reais ainda.
- O porquê: Pra você conseguir planejar o mês sem bagunçar o que você tem no bolso hoje.
