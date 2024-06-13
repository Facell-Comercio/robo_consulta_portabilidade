const cron = require('node-cron');
const { pupInit, pupClose } = require('./src/pup');
const { loginMartim, capturarDados } = require('./src/captura-portabilidade');
const { delay } = require('./src/helper');
require('dotenv').config();

const username = process.env.MATRICULA;
const password = process.env.SENHA;

async function init() {
    try {
        // * 1º Obter as linhas a analisar:
        const gsms = [
            '84987380950', '84996238636', '84994625306', '84988917645', '84994612072'
        ]

        // * 2º Criar o Browser e a Page:
        const { browser, page } = await pupInit(false)

        // * 3º login:
        let tentativasLogin = 1;
        let loginRealizado = false;
        while (tentativasLogin <= 3) {
            try {
                await loginMartim({ page, username, password })
                loginRealizado = true;
                break;
            } catch (error) {
                console.log('ERRO_LOGIN:', error)
                tentativasLogin++
            }
        }

        if (!loginRealizado) {
            throw new Error('Falha no login do Martim')
        }
        await page.goto('https://capgeminibr.service-now.com/tim?id=tim_consulta_portabilidade')
        await delay(2000)

        // * 4º Loop e Captura:
        for (const gsm of gsms) {
            let tentativasCaptura = 1;
            while (tentativasCaptura <= 3) {
                try {
                    const clienteAtualizado = await capturarDados({ page, cliente: { gsm, status: 'NÃO ENCONTRADO', motivo: null, acao: null } })
                    break;
                } catch (error) {
                    console.log(`Tentativa: ${tentativasCaptura} Linha: ${linha}`)
                    tentativasCaptura++
                }
            }
        }

        // * 5º Update no banco:


        // * 6º Finalização:
        await pupClose({ browser, page })

    } catch (error) {
        console.log('FATAL_ERROR:', error)
    }
}

init()